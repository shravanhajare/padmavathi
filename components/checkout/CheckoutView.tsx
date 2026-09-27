'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldError } from 'react-hook-form';
import { AlertCircle, ArrowLeft, Building2, CalendarDays, FileText, Loader2, Mail, MapPin, Package, Phone, Store, Truck, User } from 'lucide-react';
import { useId, useState, useTransition, type ReactNode } from 'react';
import { orderDetailsSchema, type OrderDetails, type OrderDetailsInput } from '@/lib/validation/forms';
import { useCartHydrated, useCartStore } from '@/store/cart';
import { placeOrderAction } from '@/app/actions/orders';
import { logoutAction } from '@/app/actions/auth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { tintClasses, tintStyle } from '@/components/shop/parts';
import { EmptySpoon, MinOrderNote, TotalsList } from '@/components/cart/CartBits';
import { useCart } from '@/components/cart/useCart';
import { useAddresses, useCatalog, useSessionUser } from '@/components/layout/AppData';
import { useT } from '@/i18n/client';
import type { Messages } from '@/i18n/messages';
import { formatPhone } from '@/lib/phone';
import { cn, formatINR } from '@/lib/utils';

const inputBase =
  'h-12 w-full rounded-2xl border bg-surface px-4 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-forest focus:shadow-[0_0_0_4px_rgb(63_122_90/0.14)]';

type ErrorKey = keyof Messages['common']['errors'];

function Field({
  label,
  error,
  hint,
  icon,
  optional,
  className,
  children,
}: {
  label: string;
  error?: FieldError;
  hint?: string;
  icon?: ReactNode;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; className: string }) => ReactNode;
}) {
  const t = useT();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const message = error?.message ? (t.common.errors[error.message as ErrorKey] ?? error.message) : null;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-fg">
        {label} {optional && <span className="font-normal text-muted">({t.orders.checkout.optional})</span>}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted">{icon}</span>}
        {children({
          id: fieldId,
          'aria-invalid': !!error,
          'aria-describedby': message ? errorId : hint ? hintId : undefined,
          className: cn(inputBase, icon ? 'pl-11' : undefined, error ? 'border-[#dc2626]' : 'border-line-strong'),
        })}
      </div>
      {message ? (
        <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-[#dc2626] dark:text-[#fca5a5]">
          <AlertCircle size={13} aria-hidden="true" /> {message}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: n * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7"
      aria-labelledby={`sec-${n}`}
    >
      <h2 id={`sec-${n}`} className="mb-5 flex items-center gap-3 text-xl font-semibold text-fg">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] font-sans text-sm font-bold text-[#3a1f0c]">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function ChoiceCard({ active, onClick, title, sub, Icon }: { active: boolean; onClick: () => void; title: string; sub: string; Icon: typeof Package }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors',
        active ? 'border-forest bg-sage/10' : 'border-line-strong hover:border-honey',
      )}
    >
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', active ? 'bg-[#2c5a42] text-white' : 'bg-surface-2 text-fg')}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-semibold text-fg">{title}</span>
        <span className="block text-xs leading-snug text-muted">{sub}</span>
      </span>
      {active && <motion.span layoutId="ring-fulfilment" className="absolute inset-0 rounded-2xl ring-2 ring-forest" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
    </button>
  );
}

export function CheckoutView() {
  const t = useT();
  const c = t.orders.checkout;
  const router = useRouter();
  const user = useSessionUser();
  const addresses = useAddresses();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id ?? null);
  const hydrated = useCartHydrated();
  const { lines, totals, count } = useCart();
  const { getProduct } = useCatalog();
  const clear = useCartStore((s) => s.clear);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<OrderDetailsInput, unknown, OrderDetails>({
    resolver: zodResolver(orderDetailsSchema),
    mode: 'onTouched',
    defaultValues: {
      fulfilment: 'ship',
      name: defaultAddress?.name ?? user?.name ?? '',
      phone: defaultAddress?.phone ?? user?.phone ?? '',
      email: user?.email ?? '',
      business: user?.business_name ?? '',
      gstin: user?.gstin ?? '',
      address: defaultAddress?.line1 ?? '',
      landmark: defaultAddress?.landmark ?? '',
      city: defaultAddress?.city ?? user?.city ?? '',
      state: defaultAddress?.state ?? '',
      pincode: defaultAddress?.pincode ?? '',
      neededBy: '',
      notes: '',
    },
  });
  const fulfilment = watch('fulfilment');

  const onSubmit = (values: OrderDetails) => {
    setFormError(null);
    startTransition(async () => {
      const res = await placeOrderAction(
        values,
        lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
      );
      if (!res) return;
      if (res.ok) {
        clear();
        router.push(`/order/success?n=${res.number}`);
        return;
      }
      if (res.fields) for (const [k, v] of Object.entries(res.fields)) setError(k as keyof OrderDetailsInput, { message: v });
      if (res.error === 'min' && res.detail?.productId) setFormError(c.minQty(getProduct(res.detail.productId)?.name ?? '', res.detail.min ?? 0));
      else if (res.error === 'unavailable') setFormError(c.unavailable);
      else if (res.error === 'empty') setFormError(c.empty);
      else if (res.error === 'loginFirst') router.push('/login?next=/checkout');
      else if (res.error) setFormError(t.common.errors[res.error as ErrorKey] ?? t.common.errors.generic);
    });
  };

  if (!hydrated) {
    return (
      <div className="container-page grid gap-6 pb-24 pt-32 lg:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-[40rem] rounded-[1.75rem]" />
        <div className="skeleton h-[28rem] rounded-[1.75rem]" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[72vh] flex-col items-center justify-center gap-4 pb-24 pt-32 text-center">
        <EmptySpoon className="h-48 w-56" />
        <h1 className="text-4xl font-semibold text-fg">{t.orders.cart.emptyTitle}</h1>
        <p className="max-w-md text-muted">{t.orders.cart.emptyBody}</p>
        <ButtonLink href="/#shop" size="lg" className="mt-2">
          {t.orders.cart.browse}
        </ButtonLink>
      </div>
    );
  }

  const placeButton = (
    <Button type="submit" form="order-form" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <WhatsAppIcon size={18} />}
      {pending ? c.placing : c.place}
    </Button>
  );

  return (
    <div className="container-page pb-40 pt-28 sm:pt-32 lg:pb-24">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> {c.back}
      </Link>
      <h1 className="mt-4 text-4xl font-semibold text-fg sm:text-5xl">
        {c.title} <span className="text-gradient-wood italic">{c.accent}</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">{c.sub}</p>
      {user && (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-medium text-fg">
            <User size={14} aria-hidden="true" /> {c.signedInAs(user.name, formatPhone(user.phone))}
          </span>
          <button type="button" onClick={() => logoutAction()} className="font-semibold text-accent underline-offset-4 hover:underline">
            {c.notYou}
          </button>
        </p>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
        <form id="order-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <Section n={1} title={c.howTitle}>
            <div role="radiogroup" aria-label={c.howTitle} className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard active={fulfilment === 'ship'} onClick={() => setValue('fulfilment', 'ship')} title={c.ship} sub={c.shipNote} Icon={Truck} />
              <ChoiceCard active={fulfilment === 'pickup'} onClick={() => setValue('fulfilment', 'pickup')} title={c.pickup} sub={c.pickupNote} Icon={Store} />
            </div>
          </Section>

          <Section n={2} title={c.detailsTitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.name} error={errors.name} icon={<User size={17} />}>
                {(p) => <input {...p} {...register('name')} autoComplete="name" />}
              </Field>
              <Field label={c.phone} error={errors.phone} icon={<Phone size={17} />}>
                {(p) => <input {...p} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" />}
              </Field>
              <Field label={c.business} error={errors.business} icon={<Building2 size={17} />} optional>
                {(p) => <input {...p} {...register('business')} autoComplete="organization" placeholder={c.businessPlaceholder} />}
              </Field>
              <Field label={c.email} error={errors.email} icon={<Mail size={17} />} optional>
                {(p) => <input {...p} {...register('email')} type="email" inputMode="email" autoComplete="email" />}
              </Field>
              <Field label={c.gstin} error={errors.gstin} icon={<FileText size={17} />} hint={c.gstinHint} optional className="sm:col-span-2">
                {(p) => <input {...p} {...register('gstin')} autoCapitalize="characters" maxLength={15} className={cn(p.className, 'uppercase')} />}
              </Field>
            </div>
          </Section>

          <AnimatePresence initial={false}>
            {fulfilment === 'ship' && (
              <motion.div key="address" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Section n={3} title={c.addressTitle}>
                  {addresses.length > 0 && (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          aria-pressed={selectedAddressId === a.id}
                          onClick={() => {
                            setSelectedAddressId(a.id);
                            setValue('name', a.name);
                            setValue('phone', a.phone);
                            setValue('address', a.line1);
                            setValue('landmark', a.landmark ?? '');
                            setValue('city', a.city);
                            setValue('state', a.state);
                            setValue('pincode', a.pincode);
                          }}
                          className={cn(
                            'max-w-[14rem] rounded-2xl border px-3.5 py-2.5 text-left text-xs transition-colors',
                            selectedAddressId === a.id ? 'border-forest bg-sage/10' : 'border-line-strong hover:border-honey',
                          )}
                        >
                          <span className="block font-semibold text-fg">{a.label}</span>
                          <span className="block truncate text-muted">
                            {a.line1}, {a.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={c.address} error={errors.address} icon={<MapPin size={17} />} className="sm:col-span-2">
                      {(p) => <input {...p} {...register('address')} autoComplete="street-address" />}
                    </Field>
                    <Field label={c.landmark} error={errors.landmark} optional className="sm:col-span-2">
                      {(p) => <input {...p} {...register('landmark')} />}
                    </Field>
                    <Field label={c.city} error={errors.city}>
                      {(p) => <input {...p} {...register('city')} autoComplete="address-level2" />}
                    </Field>
                    <Field label={c.state} error={errors.state}>
                      {(p) => <input {...p} {...register('state')} autoComplete="address-level1" />}
                    </Field>
                    <Field label={c.pincode} error={errors.pincode}>
                      {(p) => <input {...p} {...register('pincode')} inputMode="numeric" autoComplete="postal-code" maxLength={6} />}
                    </Field>
                  </div>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          <Section n={fulfilment === 'ship' ? 4 : 3} title={c.moreTitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.neededBy} error={errors.neededBy} icon={<CalendarDays size={17} />} optional>
                {(p) => <input {...p} {...register('neededBy')} type="date" min={new Date().toISOString().slice(0, 10)} />}
              </Field>
              <Field label={c.notes} error={errors.notes} optional className="sm:col-span-2">
                {(p) => <textarea {...p} {...register('notes')} rows={3} placeholder={c.notesPlaceholder} className={cn(p.className, 'h-auto py-3')} />}
              </Field>
            </div>
          </Section>
        </form>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-labelledby="summary-title">
          <div className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="summary-title" className="text-xl font-semibold text-fg">
                {c.yourOrder}
              </h2>
              <Link href="/cart" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
                {c.editCart}
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted">{t.common.pieces(count)}</p>
            <ul className="mt-4 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 py-3">
                  <span style={tintStyle(l.product)} className={cn('relative h-14 w-14 shrink-0 overflow-hidden rounded-xl', tintClasses)}>
                    <Image src={l.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{l.name}</span>
                    <span className="block text-xs text-muted">
                      {l.variantLabel} · {l.qty} × {formatINR(l.price)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-fg">{formatINR(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <MinOrderNote className="mt-3" />
            <TotalsList totals={totals} fulfilment={fulfilment} className="mt-5" />
            <AnimatePresence>
              {formError && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-[#fca5a5] bg-[#fef2f2] p-3 text-sm text-[#991b1b] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {formError}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="mt-5 hidden lg:block">{placeButton}</div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{c.terms}</p>
          </div>
        </aside>
      </div>

      {/* phones: the total and the button stay in reach */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="shrink-0 leading-tight">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">{t.orders.cart.total}</p>
            <p className="font-display text-lg font-semibold tabular-nums text-fg">{formatINR(totals.total)}</p>
          </div>
          <div className="min-w-0 flex-1">{placeButton}</div>
        </div>
      </div>
    </div>
  );
}
