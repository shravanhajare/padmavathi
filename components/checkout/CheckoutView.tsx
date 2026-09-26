'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldError } from 'react-hook-form';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  User,
  Users,
} from 'lucide-react';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { customerSchema, type CustomerData, type CustomerInput } from '@/lib/validation/checkout';
import { computeTotals, PRICING, ZONES } from '@/lib/pricing';
import { resolveLines, useCartHydrated, useCartStore } from '@/store/cart';
import { getProduct } from '@/data/products';
import { site, fullAddress, whatsappLink } from '@/data/site';
import { payWithRazorpay, verifyPayment, type CreateOrderResponse, type PaymentOutcome } from '@/lib/payments/client';
import { LAST_ORDER_KEY, type OrderSummary } from '@/lib/orders';
import { Button, ButtonLink } from '@/components/ui/Button';
import { CloseButton, Modal } from '@/components/ui/Modal';
import { tintClasses, tintStyle } from '@/components/shop/parts';
import { EmptySpoon } from '@/components/cart/CartBits';
import { cn, formatINR } from '@/lib/utils';

const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';
const paymentMode: 'demo' | 'test' | 'live' = !publicKey || /x{6,}/i.test(publicKey) ? 'demo' : publicKey.startsWith('rzp_live_') ? 'live' : 'test';

const inputBase =
  'h-12 w-full rounded-2xl border bg-surface px-4 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-pink-strong focus:shadow-[0_0_0_4px_rgb(236_72_153/0.14)]';

function Field({
  label,
  error,
  hint,
  icon,
  children,
  optional,
}: {
  label: string;
  error?: FieldError;
  hint?: string;
  icon?: ReactNode;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; className: string }) => ReactNode;
  optional?: boolean;
}) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-fg">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted">{icon}</span>}
        {children({
          id: fieldId,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : hint ? hintId : undefined,
          className: cn(inputBase, icon ? 'pl-11' : undefined, error ? 'border-[#dc2626]' : 'border-line-strong'),
        })}
      </div>
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-[#dc2626] dark:text-[#fca5a5]">
          <AlertCircle size={13} aria-hidden="true" /> {error.message}
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
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7"
      aria-labelledby={`sec-${n}`}
    >
      <h2 id={`sec-${n}`} className="mb-5 flex items-center gap-3 text-xl font-semibold text-fg">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] font-sans text-sm font-bold text-[#3a1f0c]">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function ChoiceCard({
  active,
  onClick,
  title,
  sub,
  Icon,
  group,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  Icon: typeof Package;
  group: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors',
        active ? 'border-pink-strong bg-pink/10' : 'border-line-strong hover:border-honey',
      )}
    >
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', active ? 'bg-[#be185d] text-white' : 'bg-surface-2 text-fg')}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-semibold text-fg">{title}</span>
        <span className="block text-xs leading-snug text-muted">{sub}</span>
      </span>
      {active && <motion.span layoutId={`ring-${group}`} className="absolute inset-0 rounded-2xl ring-2 ring-pink-strong" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
    </button>
  );
}

function DemoPaymentSheet({ open, amount, onResult }: { open: boolean; amount: number; onResult: (o: PaymentOutcome) => void }) {
  const [method, setMethod] = useState('upi');
  const methods = [
    { id: 'upi', label: 'UPI' },
    { id: 'card', label: 'Card' },
    { id: 'netbanking', label: 'Netbanking' },
    { id: 'wallet', label: 'Wallet' },
  ];
  return (
    <Modal open={open} onClose={() => onResult({ status: 'dismissed' })} labelledBy="demo-pay-title" className="sm:max-w-md">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-wood">Demo payment</p>
          <h2 id="demo-pay-title" className="text-2xl font-semibold">
            Pay {formatINR(amount)}
          </h2>
        </div>
        <CloseButton onClick={() => onResult({ status: 'dismissed' })} />
      </div>
      <div className="space-y-5 p-6">
        <p className="rounded-2xl border border-line bg-surface-2 p-3.5 text-sm text-muted">
          Razorpay keys aren’t configured, so this simulated window stands in for Razorpay Checkout. No money moves. Add your keys to
          <code className="mx-1 rounded bg-surface px-1">.env.local</code>to use real test payments.
        </p>
        <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-4 gap-2">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                'rounded-2xl border px-2 py-3 text-xs font-semibold transition-colors',
                method === m.id ? 'border-pink-strong bg-pink/15 text-fg' : 'border-line-strong text-muted hover:border-honey',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <Button size="lg" onClick={() => onResult({ status: 'paid', orderId: '', paymentId: `mock_pay_${Math.random().toString(36).slice(2, 12)}`, signature: 'demo' })}>
            <Lock size={16} aria-hidden="true" /> Simulate a successful payment
          </Button>
          <Button size="lg" variant="outline" onClick={() => onResult({ status: 'failed', reason: 'The demo payment was declined.' })}>
            Simulate a failed payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const rawLines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const lines = useMemo(() => resolveLines(rawLines), [rawLines]);
  const [status, setStatus] = useState<'idle' | 'creating' | 'paying' | 'verifying'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<{ amount: number; resolve: (o: PaymentOutcome) => void } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError: setFieldError,
    formState: { errors },
  } = useForm<CustomerInput, unknown, CustomerData>({
    resolver: zodResolver(customerSchema),
    mode: 'onTouched',
    defaultValues: {
      fulfilment: 'ship',
      name: '',
      phone: '',
      email: '',
      address: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      notes: '',
      bulk: false,
      businessName: '',
      gstin: '',
    },
  });

  const fulfilment = watch('fulfilment');
  const bulk = watch('bulk');
  const totals = computeTotals(lines, fulfilment);
  const pieces = lines.reduce((n, l) => n + l.qty, 0);
  const busy = status !== 'idle';

  const onSubmit = async (values: CustomerData) => {
    setError(null);
    setStatus('creating');
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: values, items: rawLines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })) }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<CreateOrderResponse> & { error?: string; fields?: Record<string, string[]> };
      if (!res.ok || !data.orderId) {
        if (data.fields) {
          for (const [k, msgs] of Object.entries(data.fields)) {
            if (msgs?.[0]) setFieldError(k as keyof CustomerInput, { message: msgs[0] });
          }
        }
        throw new Error(data.fields ? 'Please check the highlighted fields.' : (data.error ?? 'We could not start the payment.'));
      }
      const order = data as CreateOrderResponse;
      setStatus('paying');
      let outcome: PaymentOutcome;
      if (order.provider === 'razorpay') {
        outcome = await payWithRazorpay(order, site.name, `${window.location.origin}/icon.svg`);
      } else {
        outcome = await new Promise<PaymentOutcome>((resolve) => setDemo({ amount: order.amount / 100, resolve }));
        setDemo(null);
        if (outcome.status === 'paid') outcome = { ...outcome, orderId: order.orderId };
      }
      if (outcome.status === 'dismissed') {
        setStatus('idle');
        setError('Payment was cancelled. Your cart is saved, so you can try again whenever you like.');
        return;
      }
      if (outcome.status === 'failed') {
        router.push(`/order/failure?ref=${encodeURIComponent(order.receipt)}&reason=${encodeURIComponent(outcome.reason)}`);
        return;
      }
      setStatus('verifying');
      const check = await verifyPayment(order.provider === 'razorpay' ? 'razorpay' : 'mock', outcome);
      if (!check.verified) {
        router.push(`/order/failure?ref=${encodeURIComponent(order.receipt)}&reason=${encodeURIComponent(check.error ?? 'Payment could not be verified.')}`);
        return;
      }
      const summary: OrderSummary = {
        ref: order.receipt,
        paymentId: outcome.paymentId,
        mode: order.mode,
        placedAt: new Date().toISOString(),
        customer: { name: values.name, phone: values.phone, email: values.email },
        fulfilment: values.fulfilment,
        address:
          values.fulfilment === 'ship'
            ? [values.address, values.landmark, `${values.city} ${values.pincode}`, values.state].filter(Boolean).join(', ')
            : undefined,
        business: values.bulk ? { name: values.businessName, gstin: values.gstin } : undefined,
        lines: order.lines,
        totals: order.totals,
      };
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(summary));
      } catch {
        /* private mode: the success page falls back to a generic thank-you */
      }
      clearCart();
      router.push(`/order/success?ref=${encodeURIComponent(order.receipt)}`);
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  if (!hydrated) {
    return (
      <div className="container-page grid gap-8 pb-24 pt-32 lg:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-[36rem] rounded-[1.75rem]" />
        <div className="skeleton h-[28rem] rounded-[1.75rem]" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page flex min-h-[72vh] flex-col items-center justify-center gap-4 pb-24 pt-32 text-center">
        <EmptySpoon className="h-44 w-52" />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-wood">Checkout</p>
        <h1 className="text-4xl font-semibold text-fg sm:text-5xl">Your cart is empty</h1>
        <p className="max-w-md text-muted">Add a few pieces and come back here to pay securely.</p>
        <ButtonLink href="/#shop" size="lg" magnetic>
          Browse the collection
        </ButtonLink>
      </div>
    );
  }

  const shipping = fulfilment === 'ship';
  let n = 0;

  return (
    <div className="container-page pb-24 pt-28 sm:pt-32">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> Back to cart
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold text-fg sm:text-5xl">Checkout</h1>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-semibold text-muted">
          <ShieldCheck size={15} className="text-leaf" aria-hidden="true" />
          {paymentMode === 'demo' ? 'Demo checkout: no money moves' : paymentMode === 'test' ? 'Razorpay test mode' : 'Secure payment by Razorpay'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid items-start gap-6 lg:grid-cols-[1.45fr_1fr] lg:gap-8">
        <div className="flex flex-col gap-6">
          <Section n={++n} title="How should we get it to you?">
            <div role="radiogroup" aria-label="Delivery method" className="grid gap-3 md:grid-cols-2">
              <ChoiceCard
                group="fulfil"
                active={fulfilment === 'ship'}
                onClick={() => setValue('fulfilment', 'ship')}
                title="Deliver across India"
                sub={`${formatINR(ZONES.ship.fee)}, free above ${formatINR(ZONES.ship.freeAbove)} · 3 to 6 days`}
                Icon={Package}
              />
              <ChoiceCard
                group="fulfil"
                active={fulfilment === 'pickup'}
                onClick={() => setValue('fulfilment', 'pickup')}
                title="Pick up from the workshop"
                sub="Free · we’ll call when it’s ready"
                Icon={Store}
              />
            </div>
            <AnimatePresence initial={false}>
              {!shipping && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 flex gap-2 overflow-hidden text-sm text-muted"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> Collect from {fullAddress}
                </motion.p>
              )}
            </AnimatePresence>
          </Section>

          <Section n={++n} title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full name" error={errors.name} icon={<User size={17} />}>
                  {(p) => <input {...p} {...register('name')} autoComplete="name" placeholder="Priya Sharma" />}
                </Field>
              </div>
              <Field label="Mobile number" error={errors.phone} icon={<Phone size={17} />} hint="We’ll send dispatch updates on WhatsApp.">
                {(p) => <input {...p} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" />}
              </Field>
              <Field label="Email" error={errors.email} icon={<Mail size={17} />}>
                {(p) => <input {...p} {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" />}
              </Field>
            </div>
          </Section>

          <AnimatePresence initial={false}>
            {shipping && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <Section n={++n} title="Delivery address">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="House / flat, street and area" error={errors.address} icon={<MapPin size={17} />}>
                        {(p) => <input {...p} {...register('address')} autoComplete="street-address" placeholder="12, 4th Cross, Jayanagar" />}
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Landmark" optional error={errors.landmark}>
                        {(p) => <input {...p} {...register('landmark')} placeholder="Near the temple" />}
                      </Field>
                    </div>
                    <Field label="City" error={errors.city}>
                      {(p) => <input {...p} {...register('city')} autoComplete="address-level2" placeholder="Bengaluru" />}
                    </Field>
                    <Field label="Pincode" error={errors.pincode}>
                      {(p) => <input {...p} {...register('pincode')} inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="560011" />}
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="State" error={errors.state}>
                        {(p) => <input {...p} {...register('state')} autoComplete="address-level1" placeholder="Karnataka" />}
                      </Field>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          <Section n={++n} title="Order type & notes">
            <div role="radiogroup" aria-label="Order type" className="grid gap-3 md:grid-cols-2">
              <ChoiceCard group="type" active={!bulk} onClick={() => setValue('bulk', false)} title="Retail" sub="For my own kitchen or a gift" Icon={User} />
              <ChoiceCard
                group="type"
                active={!!bulk}
                onClick={() => setValue('bulk', true)}
                title="Bulk / wholesale"
                sub="Return gifts, resellers, restaurants · GST invoice"
                Icon={Users}
              />
            </div>
            <AnimatePresence initial={false}>
              {bulk && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-4 pt-5 sm:grid-cols-2">
                    <Field label="Business / organisation name" error={errors.businessName} icon={<Building2 size={17} />}>
                      {(p) => <input {...p} {...register('businessName')} autoComplete="organization" placeholder="Sri Lakshmi Stores" />}
                    </Field>
                    <Field label="GSTIN" optional error={errors.gstin} icon={<FileText size={17} />} hint="For a GST invoice with input tax credit.">
                      {(p) => <input {...p} {...register('gstin')} maxLength={15} placeholder="29ABCDE1234F1Z5" className={cn(p.className, 'uppercase')} />}
                    </Field>
                  </div>
                  <p className="mt-4 rounded-2xl border border-line bg-surface-2/70 p-3.5 text-sm text-muted">
                    Ordering {PRICING.bulkPieces}+ pieces or need custom branding?{' '}
                    <a href={whatsappLink(`Hello ${site.shortName}! I'd like a wholesale quote.`)} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline-offset-4 hover:underline">
                      Ask for a wholesale quote
                    </a>{' '}
                    and we’ll price it for you.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-5">
              <Field label="Order notes" optional error={errors.notes}>
                {(p) => <textarea {...p} {...register('notes')} rows={3} placeholder="A gift message, a preferred delivery time, anything else…" className={cn(p.className, 'h-auto py-3')} />}
              </Field>
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24" aria-labelledby="summary-title">
          <div className="rounded-[1.75rem] border border-line bg-card p-5 shadow-soft sm:p-7">
            <h2 id="summary-title" className="text-xl font-semibold text-fg">
              Order summary
            </h2>
            <ul className="mt-4 max-h-[22rem] divide-y divide-line overflow-y-auto pr-1" data-lenis-prevent>
              {lines.map((l) => {
                const product = getProduct(l.productId)!;
                return (
                  <li key={l.key} className="flex items-center gap-3 py-3">
                    <div style={tintStyle(product)} className={cn('relative h-14 w-14 shrink-0 overflow-hidden rounded-xl', tintClasses)}>
                      <Image src={l.image} alt="" fill sizes="56px" className="object-contain p-1" />
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#be185d] px-1 text-[0.65rem] font-bold text-white">
                        {l.qty}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{l.name}</p>
                      <p className="text-xs text-muted">{l.variantLabel}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-fg">{formatINR(l.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-fg">{formatINR(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{ZONES[fulfilment].short}</dt>
                <dd className="tabular-nums text-fg">{totals.delivery === 0 ? 'Free' : formatINR(totals.delivery)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>GST ({Math.round(PRICING.gstRate * 100)}%)</dt>
                <dd className="tabular-nums text-fg">{formatINR(totals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold text-fg">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(totals.total)}</dd>
              </div>
            </dl>
            {shipping && totals.freeDeliveryGap > 0 && (
              <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">Add {formatINR(totals.freeDeliveryGap)} more for free delivery.</p>
            )}
            {pieces >= PRICING.bulkPieces && !bulk && (
              <p className="mt-3 rounded-xl border border-[#facc15]/60 bg-[#facc15]/10 px-3 py-2 text-xs text-fg">
                That’s {pieces} pieces. Switch to <b>Bulk / wholesale</b> for a GST invoice, or ask us for a wholesale quote.
              </p>
            )}
            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex gap-2 rounded-2xl border border-[#fca5a5] bg-[#fef2f2] p-3 text-sm text-[#991b1b] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
                </motion.p>
              )}
            </AnimatePresence>
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  {status === 'creating' ? 'Preparing your order…' : status === 'verifying' ? 'Confirming payment…' : 'Waiting for payment…'}
                </>
              ) : (
                <>
                  <Lock size={17} aria-hidden="true" /> Pay {formatINR(totals.total)}
                </>
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted">
              <CreditCard size={14} aria-hidden="true" /> UPI · Cards · Netbanking · Wallets, via Razorpay
            </p>
          </div>
        </aside>
      </form>

      <DemoPaymentSheet open={!!demo} amount={demo?.amount ?? 0} onResult={(o) => demo?.resolve(o)} />
    </div>
  );
}
