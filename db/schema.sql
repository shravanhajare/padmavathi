-- Padmavathi Enterprises: database schema (Supabase Postgres, `public` schema, so
-- every table shows up in the Supabase Table Editor).
--
-- Only the Next.js server talks to these tables, connecting with the database
-- password. The publishable/anon key is locked out twice: row level security is on
-- with no policies, and the anon/authenticated roles have no grants at all.
-- Safe to run repeatedly (`npm run db:setup`).

-- Earlier versions kept the tables in a private `app` schema; move them (with their data).
do $$
declare t text;
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'app') then
    foreach t in array array['users', 'sessions', 'products', 'orders', 'enquiries', 'settings'] loop
      if exists (select 1 from information_schema.tables where table_schema = 'app' and table_name = t)
         and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
        execute format('alter table app.%I set schema public', t);
      end if;
    end loop;
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app' and c.relname = 'order_number_seq') then
      alter sequence app.order_number_seq set schema public;
    end if;
    if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app') then
      drop schema app;
    end if;
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text unique,
  business_name text,
  gstin text,
  city text,
  password_hash text not null,
  -- Admin status lives only here: set a row's role to 'admin' in the Supabase Table
  -- Editor to make the first admin, then promote further ones from /admin/customers.
  role text not null default 'customer' check (role in ('customer', 'admin')),
  is_active boolean not null default true,
  -- Account lockout on 2026-09-27: 6 wrong passwords in a row locks the account for
  -- 15 minutes (see recordFailedLogin in lib/server/auth.ts), on top of the per-IP
  -- rate limit, so guessing one account's password from many IPs is also slowed down.
  failed_logins int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
alter table public.users add column if not exists failed_logins int not null default 0;
alter table public.users add column if not exists locked_until timestamptz;

-- Email became mandatory at registration on 2026-09-27 (login is by email + password).
-- Only enforced once no existing row has a null email, so an older database with
-- accounts made before this change doesn't break; ask those few users to add an email.
do $$ begin
  if not exists (select 1 from public.users where email is null) then
    alter table public.users alter column email set not null;
  end if;
end $$;

create table if not exists public.sessions (
  token_hash text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id);

-- The catalogue. `data` holds the Product shape from data/types.ts; `i18n` the
-- Kannada/Hindi overrides: { "kn": { "name", "description", "story", "variants": { id: label } }, "hi": {...} }.
create table if not exists public.products (
  id text primary key,
  data jsonb not null,
  i18n jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('order_number_seq'),
  user_id uuid references public.users (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'in_production', 'dispatched', 'delivered', 'cancelled')),
  customer jsonb not null,
  fulfilment text not null check (fulfilment in ('ship', 'pickup')),
  address jsonb,
  notes text,
  items jsonb not null,
  subtotal int not null,
  delivery int not null,
  tax int not null,
  total int not null,
  lang text not null default 'en',
  whatsapp_notified boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  name text not null,
  phone text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Saved delivery addresses, picked from the header's address bar and pre-filled
-- at checkout. One row per address; `is_default` marks the one used unless the
-- shopper picks another for that order.
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  label text not null default 'Home',
  name text not null,
  phone text not null,
  line1 text not null,
  landmark text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id, created_at desc);

-- Customer reviews shown on the home page. `i18n` holds { en|kn|hi: { city, product, quote } }.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int not null default 5 check (rating between 1 and 5),
  i18n jsonb not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.enquiries enable row level security;
alter table public.settings enable row level security;
alter table public.reviews enable row level security;
alter table public.addresses enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

insert into public.settings (key, value) values
  ('min_order_qty', '20'::jsonb),
  ('whatsapp_order_number', '"919590077817"'::jsonb)
on conflict (key) do nothing;
