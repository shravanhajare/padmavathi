'use client';

import Link from 'next/link';
import { AlertCircle, Building2, Check, Eye, EyeOff, Loader2, Lock, Mail, MapPin, Phone, User } from 'lucide-react';
import { useActionState, useId, useState, type ReactNode } from 'react';
import { loginAction, registerAction } from '@/app/actions/auth';
import type { ActionState } from '@/app/actions/types';
import { Button } from '@/components/ui/Button';
import { Kolam, WoodShaving } from '@/components/ui/Kolam';
import { LogoMark } from '@/components/ui/Logo';
import { WhatsAppIcon } from '@/components/ui/icons';
import { useBusiness, useMinQty } from '@/components/layout/AppData';
import { useT } from '@/i18n/client';
import type { Messages } from '@/i18n/messages';
import { cn } from '@/lib/utils';

type T = Messages;

export const inputCls =
  'h-12 w-full rounded-2xl border bg-surface pl-11 pr-4 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-forest focus:shadow-[0_0_0_4px_rgb(63_122_90/0.14)]';

/** Resolves an action error code to text in the visitor's language. */
export function actionErrorText(t: T, error: string | undefined) {
  if (!error) return null;
  const a = t.orders.auth;
  const map: Record<string, string> = {
    invalid: a.invalid,
    phoneTaken: a.phoneTaken,
    emailTaken: a.emailTaken,
    wrongPassword: t.orders.account.wrongPassword,
    loginFirst: t.orders.checkout.loginFirst,
  };
  return map[error] ?? (t.common.errors as Record<string, string>)[error] ?? t.common.errors.generic;
}

export function TextField({
  name,
  label,
  icon,
  error,
  optional,
  type = 'text',
  defaultValue,
  autoComplete,
  inputMode,
  trailing,
}: {
  name: string;
  label: string;
  icon: ReactNode;
  error?: string;
  optional?: boolean;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: 'tel' | 'email' | 'text' | 'numeric';
  trailing?: ReactNode;
}) {
  const t = useT();
  const id = useId();
  const msg = error ? ((t.common.errors as Record<string, string>)[error] ?? error) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label} {optional && <span className="font-normal text-muted">({t.common.optional})</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!msg}
          aria-describedby={msg ? `${id}-e` : undefined}
          className={cn(inputCls, trailing ? 'pr-12' : undefined, msg ? 'border-[#dc2626]' : 'border-line-strong')}
        />
        {trailing}
      </div>
      {msg && (
        <p id={`${id}-e`} className="flex items-center gap-1.5 text-xs font-medium text-[#dc2626] dark:text-[#fca5a5]">
          <AlertCircle size={13} aria-hidden="true" /> {msg}
        </p>
      )}
    </div>
  );
}

function PasswordField({ name, label, error, autoComplete }: { name: string; label: string; error?: string; autoComplete: string }) {
  const t = useT();
  const [show, setShow] = useState(false);
  return (
    <TextField
      name={name}
      label={label}
      icon={<Lock size={17} />}
      type={show ? 'text' : 'password'}
      error={error}
      autoComplete={autoComplete}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t.orders.auth.hidePassword : t.orders.auth.showPassword}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
    />
  );
}

export function FormAlert({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl border border-[#fca5a5] bg-[#fef2f2] p-3 text-sm text-[#991b1b] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {text}
    </p>
  );
}

function Shell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const t = useT();
  const min = useMinQty();
  return (
    <div className="relative overflow-hidden">
      <Kolam className="absolute -right-48 -top-20 h-[34rem] w-[34rem] text-honey/15" spin />
      <WoodShaving className="absolute left-[6%] top-32 hidden h-12 w-14 animate-sway opacity-70 sm:block" />
      <div className="container-page relative grid min-h-[86svh] items-center gap-10 pb-20 pt-28 lg:grid-cols-[1fr_1.05fr] lg:pt-32">
        <div className="hidden lg:block">
          <LogoMark className="h-16 w-16" />
          <h1 className="mt-6 text-5xl font-semibold leading-tight text-fg">{title}</h1>
          <p className="mt-3 max-w-md text-lg text-muted">{sub}</p>
          <ul className="mt-8 space-y-3">
            {t.orders.auth.perks(min).map((p) => (
              <li key={p} className="flex items-center gap-3 text-fg">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage/30 text-forest-deep dark:text-[#b9d3b1]">
                  <Check size={15} aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-line bg-card p-6 shadow-lift sm:p-8">
          <div className="mb-6 lg:hidden">
            <h1 className="text-3xl font-semibold text-fg">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{sub}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const biz = useBusiness();
  const a = t.orders.auth;
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, null);
  const fields = state && !state.ok ? state.fields : undefined;
  return (
    <Shell title={a.loginTitle} sub={a.loginSub}>
      <form action={action} noValidate className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <TextField name="email" label={a.email} icon={<Mail size={17} />} type="email" inputMode="email" autoComplete="email" error={fields?.email} />
        <PasswordField name="password" label={a.password} autoComplete="current-password" error={fields?.password} />
        <FormAlert text={state && !state.ok ? actionErrorText(t, state.error) : null} />
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
          {pending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {pending ? a.loggingIn : a.login}
        </Button>
        <a href={biz.waLink(a.forgot)} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-xs text-muted hover:text-fg">
          <WhatsAppIcon size={14} className="mt-px shrink-0 text-leaf" /> {a.forgot}
        </a>
        <p className="border-t border-line pt-4 text-center text-sm text-muted">
          {a.noAccount}{' '}
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="font-semibold text-accent underline-offset-4 hover:underline">
            {a.createOne}
          </Link>
        </p>
      </form>
    </Shell>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const t = useT();
  const a = t.orders.auth;
  const [state, action, pending] = useActionState<ActionState, FormData>(registerAction, null);
  const fields = state && !state.ok ? state.fields : undefined;
  return (
    <Shell title={a.registerTitle} sub={a.registerSub}>
      <form action={action} noValidate className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <TextField name="name" label={a.name} icon={<User size={17} />} autoComplete="name" error={fields?.name} />
        <TextField name="phone" label={a.phone} icon={<Phone size={17} />} type="tel" inputMode="tel" autoComplete="tel" error={fields?.phone} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="business" label={a.business} icon={<Building2 size={17} />} autoComplete="organization" optional error={fields?.business} />
          <TextField name="city" label={a.city} icon={<MapPin size={17} />} autoComplete="address-level2" optional error={fields?.city} />
        </div>
        <TextField name="email" label={a.email} icon={<Mail size={17} />} type="email" inputMode="email" autoComplete="email" error={fields?.email} />
        <PasswordField name="password" label={a.password} autoComplete="new-password" error={fields?.password} />
        <PasswordField name="confirm" label={a.confirmPassword} autoComplete="new-password" error={fields?.confirm} />
        <FormAlert text={state && !state.ok ? actionErrorText(t, state.error) : null} />
        <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
          {pending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {pending ? a.registering : a.register}
        </Button>
        <p className="border-t border-line pt-4 text-center text-sm text-muted">
          {a.haveAccount}{' '}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-semibold text-accent underline-offset-4 hover:underline">
            {a.loginInstead}
          </Link>
        </p>
      </form>
    </Shell>
  );
}
