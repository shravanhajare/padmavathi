'use client';

import Link from 'next/link';
import { Building2, CheckCircle2, ChevronRight, FileText, LayoutDashboard, Loader2, Lock, LogOut, Mail, MapPin, Package, User } from 'lucide-react';
import { useActionState } from 'react';
import { changePasswordAction, logoutAction, updateProfileAction } from '@/app/actions/auth';
import { AddressManager } from '@/components/account/AddressManager';
import type { ActionState } from '@/app/actions/types';
import { actionErrorText, FormAlert, TextField } from '@/components/auth/AuthForms';
import { StatusPill } from '@/components/checkout/SuccessView';
import { LanguageSegments } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button, ButtonLink } from '@/components/ui/Button';
import { KolamBorder } from '@/components/ui/Kolam';
import { useAddresses } from '@/components/layout/AppData';
import type { PublicUser } from '@/components/layout/AppData';
import { useI18n } from '@/i18n/client';
import { LOCALE_META } from '@/i18n/config';
import type { OrderView } from '@/lib/server/orders';
import { formatPhone } from '@/lib/phone';
import { formatINR } from '@/lib/utils';

function Saved({ text }: { text: string }) {
  return (
    <p role="status" className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 p-3 text-sm font-medium text-leaf">
      <CheckCircle2 size={16} aria-hidden="true" /> {text}
    </p>
  );
}

function ProfileForm({ user }: { user: PublicUser }) {
  const { t } = useI18n();
  const a = t.orders.account;
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfileAction, null);
  const fields = state && !state.ok ? state.fields : undefined;
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <TextField name="name" label={a.name} icon={<User size={17} />} defaultValue={user.name} autoComplete="name" error={fields?.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="business" label={a.business} icon={<Building2 size={17} />} defaultValue={user.business_name ?? ''} optional error={fields?.business} />
        <TextField name="city" label={a.city} icon={<MapPin size={17} />} defaultValue={user.city ?? ''} optional error={fields?.city} />
        <TextField name="email" label={a.email} icon={<Mail size={17} />} type="email" defaultValue={user.email ?? ''} optional error={fields?.email} />
        <TextField name="gstin" label={a.gstin} icon={<FileText size={17} />} defaultValue={user.gstin ?? ''} optional error={fields?.gstin} />
      </div>
      {state?.ok && <Saved text={a.profileSaved} />}
      <FormAlert text={state && !state.ok ? actionErrorText(t, state.error) : null} />
      <Button type="submit" size="md" className="self-start" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {a.saveProfile}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const { t } = useI18n();
  const a = t.orders.account;
  const [state, action, pending] = useActionState<ActionState, FormData>(changePasswordAction, null);
  const fields = state && !state.ok ? state.fields : undefined;
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <TextField name="current" label={a.currentPassword} icon={<Lock size={17} />} type="password" autoComplete="current-password" error={fields?.current} />
      <TextField name="password" label={a.newPassword} icon={<Lock size={17} />} type="password" autoComplete="new-password" error={fields?.password} />
      <TextField name="confirm" label={a.confirmPassword} icon={<Lock size={17} />} type="password" autoComplete="new-password" error={fields?.confirm} />
      {state?.ok && <Saved text={a.passwordSaved} />}
      <FormAlert text={state && !state.ok ? actionErrorText(t, state.error) : null} />
      <Button type="submit" size="md" variant="outline" className="self-start" disabled={pending}>
        {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {a.savePassword}
      </Button>
    </form>
  );
}

export function AccountView({ user, orders }: { user: PublicUser; orders: OrderView[] }) {
  const { t, locale } = useI18n();
  const a = t.orders.account;
  const addresses = useAddresses();
  return (
    <div className="container-page pb-24 pt-28 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-wood">{t.common.account.hello(user.name)}</p>
          <h1 className="mt-1 text-4xl font-semibold text-fg sm:text-5xl">
            {a.title} <span className="text-gradient-wood italic">{a.accent}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">{formatPhone(user.phone)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === 'admin' && (
            <ButtonLink href="/admin" size="md">
              <LayoutDashboard size={16} aria-hidden="true" /> {a.admin}
            </ButtonLink>
          )}
          <Button size="md" variant="outline" onClick={() => logoutAction()}>
            <LogOut size={16} aria-hidden="true" /> {t.common.account.logout}
          </Button>
        </div>
      </div>
      <KolamBorder className="mt-5 h-4 w-full max-w-md text-honey/70" loops={16} />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section aria-labelledby="orders-title" className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
          <h2 id="orders-title" className="flex items-center gap-2 text-xl font-semibold text-fg">
            <Package size={19} className="text-honey" aria-hidden="true" /> {a.orders}
          </h2>
          {orders.length === 0 ? (
            <div className="mt-6 flex flex-col items-start gap-3">
              <p className="text-muted">{a.noOrders}</p>
              <ButtonLink href="/#shop" size="md">
                {a.startOrder}
              </ButtonLink>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((o) => (
                <li key={o.number}>
                  <Link href={`/account/orders/${o.number}`} className="group flex items-center gap-3 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-fg">{a.order(o.number)}</span>
                        <StatusPill status={o.status} />
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {new Date(o.createdAt).toLocaleDateString(LOCALE_META[locale].intl, { dateStyle: 'medium' })} · {a.itemsCount(o.items.length)} ·{' '}
                        {t.common.pieces(o.items.reduce((n, l) => n + l.qty, 0))}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-fg">{formatINR(o.total)}</span>
                    <ChevronRight size={18} className="text-muted transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section id="profile" aria-labelledby="profile-title" className="scroll-mt-24 rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
            <h2 id="profile-title" className="mb-5 text-xl font-semibold text-fg">
              {a.profile}
            </h2>
            <ProfileForm user={user} />
          </section>
          <section id="settings" aria-labelledby="settings-title" className="scroll-mt-24 rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
            <h2 id="settings-title" className="text-xl font-semibold text-fg">
              {a.settingsTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">{a.settingsHint}</p>
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-fg">{a.language}</p>
                <LanguageSegments className="max-w-sm" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-fg">{a.appearance}</p>
                <ThemeToggle />
              </div>
            </div>
          </section>
          <section id="addresses" aria-labelledby="addr-title" className="scroll-mt-24 rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
            <h2 id="addr-title" className="mb-5 text-xl font-semibold text-fg">
              {a.address.title}
            </h2>
            <AddressManager addresses={addresses} />
          </section>
          <section aria-labelledby="pw-title" className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
            <h2 id="pw-title" className="mb-5 text-xl font-semibold text-fg">
              {a.passwordTitle}
            </h2>
            <PasswordForm />
          </section>
        </div>
      </div>
    </div>
  );
}
