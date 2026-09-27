# Padmavathi Enterprises: Handcrafted Wooden Kitchenware

A premium, scroll-animated 3D storefront for a maker of hand-turned wooden kitchen utensils: belans, chakla,
coconut scrapers, mathani churners, spatulas, ladles, spoons, chopping boards and mortar & pestles.

**Bulk & wholesale only:** every item is ordered in quantities of 20 or more (editable in the admin). Orders are
saved to Postgres and sent to WhatsApp; there is no online payment. The whole site speaks **English, Kannada and Hindi**.

- **Scroll-driven 3D hero, "From raw wood to your kitchen".** A rough log floats in, then goes onto a lathe.
  The bark peels away at the moving tool front while the profile is carved into a belan, and real-time shavings
  fly off and pile up. The fresh wood is oiled to teak, then a chakla rises. A dough ball is pressed and rolled into
  a roti under the belan in a puff of flour. A branded crate opens and utensils spiral out of it. A seat-style
  coconut scraper grates a coconut held on its blade, and grated coconut falls into a growing heap. Finally
  everything settles onto a wooden counter.
- **Procedural models and solid wood.** Every utensil is generated in code with three.js. The wood is a *solid*
  shader: growth rings around a pith, pores and colour streaks computed from 3D position. Turned pieces therefore
  show cathedral figure and end grain, in teak, sheesham, neem and acacia. The same models render the product
  photos and the live 3D quick view.
- **Shop.** Category tabs, search, a wood filter and sorting. Cards have 3D tilt with glare, a wooden display
  plinth, variant chips, and an Add button that adds the bulk minimum and becomes a ±5 stepper.
- **Cart.** Items fly into the cart and land with a burst of wood-shaving curls, followed by a toast. There's a
  slide-in drawer, a full `/cart` page and a mobile cart bar, and the cart persists across reloads. Quantities
  can be typed and never drop below the minimum.
- **Ordering.** Customers register / log in (mobile number + password), then place the order: delivery or pickup,
  business name, GSTIN, address, needed-by date and notes. The server re-prices from the catalogue, enforces the
  minimum, saves the order and shows a *Send order on WhatsApp* button with the full order prefilled for the shop's
  number. Customers see their order history and statuses under `/account`.
- **Admin (`/admin`).** Dashboard, orders (search, status filter, status updates, internal notes, one-tap WhatsApp /
  call), products (edit names and copy in all three languages, sizes and prices, show/hide, add new), customers
  (make admin, disable, reset password), enquiries, and settings (minimum quantity, WhatsApp number).
- **Languages.** English / ಕನ್ನಡ / हिन्दी switcher in the header (cookie `pe_lang`). UI text lives in
  `i18n/messages/*.ts` with all three languages side by side, typed so a missing translation fails the build.
  Product translations are stored per product and edited in the admin.
- **Rest of the site.** Gift sets, Our Craft (a pinned horizontal-scroll making timeline), Why Wood, a care guide,
  testimonials, contact with an enquiry form and map, and a floating WhatsApp button.
- **Themes and accessibility.** Light is the default, with a dark walnut theme (sun/moon toggle). Reduced motion,
  low-end devices and missing WebGL are all handled.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Set `DATABASE_URL` in `.env.local` (see below), then create the tables and seed the catalogue once:

```bash
npm run db:setup     # safe to re-run; --reset-products overwrites admin edits from data/products.ts
```

Register an account, then open the Supabase Table Editor (`public.users`) and set that row's `role` to `admin`. Every admin after that can be made from `/admin/customers`.

| Command | What it does |
| --- | --- |
| `npm run build && npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run db:setup` | Create/upgrade the database schema and seed products, reviews and contact details |
| `npm run render:products` | Re-render product photos from the 3D models (see below) |

Requires Node 20+.

---

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO, sitemap and Open Graph |
| `DATABASE_URL` | Server only. Supabase **transaction pooler** URL (port 6543); carries the DB password |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project reference (publishable key is safe in the browser) |
| `SESSION_SECRET` | Signs the session JWT. Required in production; generate with `openssl rand -base64 32` |
| `WHATSAPP_ORDER_NUMBER` | Default WhatsApp number for orders (the admin setting overrides it) |
| `CALLMEBOT_APIKEY` *or* `WHATSAPP_CLOUD_TOKEN` + `WHATSAPP_CLOUD_PHONE_ID` | Optional: also push every order to WhatsApp automatically |
| `ENABLE_STUDIO` | Optional: `true` allows `/studio` in production |

### Database and security

Everything lives in Supabase's `public` schema, so it shows in the Supabase Table Editor: users, sessions,
products, orders, enquiries, reviews and settings (minimum order, WhatsApp number, business contact details).
Row-level security is on with no policies and the `anon`/`authenticated` roles have no grants, so the publishable
key cannot read any of it through the REST API. Only the Next.js server touches the tables, through `DATABASE_URL`.
Passwords are hashed with scrypt. A session is a signed JWT (HS256, `SESSION_SECRET`, see `lib/jwt.ts`) in an httpOnly,
`secure` cookie; its signature rejects a tampered or expired cookie instantly, but the JWT is never trusted alone —
`lib/server/auth.ts` re-checks a hash of it against `public.sessions` (and the user's role and `is_active`) on every
request, so logging out, changing a password or disabling a user revokes it immediately everywhere. 6 wrong passwords
in a row lock an account for 15 minutes, on top of the existing per-IP rate limit. Server actions check the admin role
on every call — never only the page that led to them. `middleware.ts` adds a second, cheaper gate in front of
`/admin` and `/account` at the edge, and sets a per-request CSP with a nonce for the two inline scripts the app ships
(the theme-flash guard and the JSON-LD block), so `unsafe-inline` isn't needed. `SESSION_SECRET` must be set in
production (see `.env.example`) or the app refuses to start a session.

### Orders on WhatsApp

Every order is saved and appears in `/admin`. The customer's confirmation page opens WhatsApp with the whole order
addressed to the shop's number. For fully automatic delivery, set either `CALLMEBOT_APIKEY` (free: message
"I allow callmebot to send me messages" to +34 644 51 95 23 from the order number) or the WhatsApp Cloud API
variables; the admin's Settings page shows whether automatic alerts are on.

---

## Make it yours: placeholders to replace

| What | Where |
| --- | --- |
| **Phone, email, address, map location, socials** | `/admin/settings` (stored in the database); working hours in `i18n/messages/sections.ts` |
| Prices, sizes, product copy (all languages), visibility | `/admin/products` (seeded from `data/products.ts` + `i18n/products.ts`) |
| Reviews (currently **sample text**, replace with real ones) | `/admin/reviews`, in English, Kannada and Hindi |
| Any site text, in all three languages | `i18n/messages/*.ts` |
| GST rate (5% by default; confirm with your accountant) | `lib/pricing.ts` |

---

## Adding a product

The quickest way is **Admin → Products → Add product**. To add one in code (with its own 3D model):

1. Append an entry to `data/products.ts` with an `id`, `category`, `wood`, `variants` (label + price, optional
   dimensions/weight per size), `dimensions`, `weight`, `finish`, `tags` and a `model`, for example
   `{ kind: 'belan', variant: 'tapered', wood: 'sheesham' }`.
2. Generate its photo: with `npm run dev` running, run `npm run render:products <product-id>`. It uses your
   installed Google Chrome; set `CHROME_PATH=/path/to/chrome` if Chrome is elsewhere, and
   `STUDIO_URL=http://localhost:3001` if the dev server is on another port. To use a real photo instead, set
   `image` to a file in `/public`.
3. Run `npm run db:setup` to add it to the database.
4. Visit **`/studio`** in development to see every product rendered side by side (`?single=1` shows bare pieces).

Model kinds and variants are listed in `data/types.ts → ModelKind`. The builders live in
`components/three/models/` (`utensils.ts`, `scrapers.ts`, `crate.ts`) and product staging in `composition.ts`.
Wood species (colours, ring spacing, figure, finish) are tuned in `components/three/models/wood.ts → SPECIES`.

### Swapping procedural models for real 3D models (GLB)

1. Put the file in `public/models/`, e.g. `public/models/seat-scraper.glb`. Model it with the procedural axis
   convention: long tools along +Y with the working end at the bottom.
2. Map it in `components/three/models/registry.ts`:
   ```ts
   export const GLB_MODELS: Record<string, string> = {
     'belan:classic': '/models/classic-belan.glb', // one variant
     scraperSeat: '/models/seat-scraper.glb',       // every variant of a kind
   };
   ```
3. That's it. GLBs are fitted to the size and placement of the procedural model they replace. The quick view
   loads them with drei's `useGLTF`, `loadPiece()` gives you the fitted piece for custom scenes, and
   `npm run render:products` re-renders their photos.

---

## Project structure

```
app/                         routes (App Router), SEO files
  actions/                   server actions: auth, orders & enquiries, admin
  login/  register/  account/  customer accounts and order history
  admin/                     dashboard, orders, products, customers, enquiries, settings
  cart/  checkout/  order/   full cart, checkout, order confirmation
  studio/                    dev-only product render studio / model test scene
components/
  hero/Hero.tsx              scroll story overlay (GSAP ScrollTrigger + Lenis), loader, fallbacks
  three/hero/                HeroCanvas, world.ts (actors), choreography.ts (timeline), lathe.ts (carving),
                             dough.ts, effects.ts (shavings, flakes, flour, motes, backdrop)
  three/models/              wood.ts (solid wood shader), utensils, scrapers, crate, composition, registry
  three/ProductViewer.tsx    live 3D quick view (PresentationControls)
  shop/  cart/  checkout/    catalogue, cards, quick view, drawer, fly-to-cart, checkout
  sections/                  gift sets, our craft, why wood, care guide, testimonials, contact
  layout/  ui/               navbar, footer, theme toggle, WhatsApp, buttons, modal, kolam motifs, marquee
data/                        site config, seed products, categories & woods, testimonials
db/schema.sql                database schema (npm run db:setup)
i18n/                        locales, typed message files (en/kn/hi), product translations
lib/server/                  db pool, auth & sessions, catalogue, orders, settings, WhatsApp, admin queries
lib/                         pricing, validation, scroll (Lenis), device tiers, GSAP
store/                       Zustand: cart (persisted), theme (persisted), UI
scripts/render-products.mjs  bakes product photos from the 3D models
```

## Performance and accessibility

- The 3D bundle is lazy-loaded behind a branded loader (a belan rolling out a roti, with progress), shaders are
  precompiled, and the canvas stops rendering when the hero is off-screen.
- Device tiers (`lib/device.ts`) scale particle counts, model detail, pixel ratio (1.25 to 1.75) and
  post-processing (depth of field + bloom on high, bloom on medium, none on low). `PerformanceMonitor` steps
  quality down if the frame rate drops. Shavings, coconut flakes, nails and wood wool are instanced.
- `prefers-reduced-motion`: Lenis is off, the hero becomes a static 3D still of the finished counter, card tilt,
  the pinned timeline and carousel auto-advance are off, and add-to-cart shows a toast instead of the flight.
- No WebGL: the hero falls back to product photos.
- Semantic landmarks, a skip link, focus-trapped dialogs, keyboard-navigable tabs and carousel, visible focus
  rings, alt text, and contrast checked in both themes.
- SEO: metadata, a generated Open Graph image, `sitemap.xml`, `robots.txt`, and schema.org `Store` data with a
  product catalogue.

## Deploying

The site deploys to Vercel (or any Node host) as is. Add the environment variables from `.env.local` to the host
(Vercel → Settings → Environment Variables), then deploy. Use the Supabase **pooler** URL: the direct database
host is IPv6-only, which Vercel can't reach. `vercel.json` pins the framework to Next.js.
