'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useTransition, type ReactNode } from 'react';
import { saveSettingsAction, type SettingsForm as Form } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n/client';
import type { BusinessInfo } from '@/lib/business';
import { cn } from '@/lib/utils';

const input = 'h-12 w-full rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest aria-[invalid=true]:border-[#dc2626]';

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-fg">{label}</span>
      {children}
      {(error || hint) && <span className={cn('text-xs', error ? 'font-medium text-[#dc2626] dark:text-[#fca5a5]' : 'text-muted')}>{error || hint}</span>}
    </label>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.6rem] border border-line bg-card p-5 shadow-soft sm:p-6">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ minQty, whatsapp, business }: { minQty: number; whatsapp: string; business: BusinessInfo }) {
  const t = useT();
  const s = t.admin.settings;
  const [f, setF] = useState<Form>({ minOrderQty: minQty, whatsappOrderNumber: whatsapp, business });
  const [bad, setBad] = useState<Record<string, true>>({});
  const [result, setResult] = useState<'saved' | 'error' | null>(null);
  const [pending, start] = useTransition();

  const b = f.business;
  const setB = (patch: Partial<BusinessInfo>) => setF((x) => ({ ...x, business: { ...x.business, ...patch } }));
  const setAddr = (k: keyof BusinessInfo['address'], v: string) => setB({ address: { ...b.address, [k]: v } });
  const setSocial = (k: keyof BusinessInfo['socials'], v: string) => setB({ socials: { ...b.socials, [k]: v.trim() } });
  const inv = (path: string) => (bad[path] ? true : undefined);
  const err = (path: string, msg: string) => (bad[path] ? msg : undefined);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSettingsAction(f);
          setBad(res && !res.ok && res.fields ? Object.fromEntries(Object.keys(res.fields).map((k) => [k, true])) : {});
          setResult(res?.ok ? 'saved' : 'error');
        });
      }}
    >
      <Card title={t.admin.settings.title}>
        <Field label={s.minQty} hint={s.minQtyHint} error={err('minOrderQty', s.invalidMin)}>
          <input
            className={input}
            inputMode="numeric"
            value={f.minOrderQty || ''}
            aria-invalid={inv('minOrderQty')}
            onChange={(e) => setF((x) => ({ ...x, minOrderQty: Number(e.target.value.replace(/\D/g, '')) }))}
          />
        </Field>
        <Field label={s.whatsapp} hint={s.whatsappHint} error={err('whatsappOrderNumber', s.invalidWa)}>
          <input className={input} inputMode="tel" value={f.whatsappOrderNumber} aria-invalid={inv('whatsappOrderNumber')} onChange={(e) => setF((x) => ({ ...x, whatsappOrderNumber: e.target.value }))} />
        </Field>
      </Card>

      <Card title={s.businessTitle} hint={s.businessHint}>
        <Field label={s.phone} error={err('business.phone', s.invalidPhone)}>
          <input className={input} inputMode="tel" autoComplete="off" value={b.phone} aria-invalid={inv('business.phone')} onChange={(e) => setB({ phone: e.target.value })} />
        </Field>
        <Field label={s.email} error={err('business.email', s.invalidEmail)}>
          <input className={input} type="email" autoComplete="off" value={b.email} aria-invalid={inv('business.email')} onChange={(e) => setB({ email: e.target.value.trim() })} />
        </Field>
        <Field label={s.line1} className="sm:col-span-2">
          <input className={input} value={b.address.line1} onChange={(e) => setAddr('line1', e.target.value)} />
        </Field>
        <Field label={s.line2} className="sm:col-span-2">
          <input className={input} value={b.address.line2} onChange={(e) => setAddr('line2', e.target.value)} />
        </Field>
        <Field label={s.city}>
          <input className={input} value={b.address.city} onChange={(e) => setAddr('city', e.target.value)} />
        </Field>
        <Field label={s.state}>
          <input className={input} value={b.address.state} onChange={(e) => setAddr('state', e.target.value)} />
        </Field>
        <Field label={s.pincode}>
          <input className={input} inputMode="numeric" value={b.address.pincode} onChange={(e) => setAddr('pincode', e.target.value)} />
        </Field>
        <Field label={s.mapQuery} hint={s.mapQueryHint}>
          <input className={input} value={b.mapQuery} onChange={(e) => setB({ mapQuery: e.target.value })} />
        </Field>
      </Card>

      <Card title={s.socialsTitle}>
        {(['instagram', 'facebook', 'youtube'] as const).map((k) => (
          <Field key={k} label={k[0].toUpperCase() + k.slice(1)} error={err(`business.socials.${k}`, s.invalidUrl)} className={k === 'youtube' ? 'sm:col-span-2' : undefined}>
            <input className={input} type="url" inputMode="url" placeholder="https://" value={b.socials[k]} aria-invalid={inv(`business.socials.${k}`)} onChange={(e) => setSocial(k, e.target.value)} />
          </Field>
        ))}
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-full border border-line bg-surface/90 p-2 pl-2 shadow-lift backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <Button type="submit" size="md" disabled={pending}>
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {s.save}
        </Button>
        {result === 'saved' && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf">
            <CheckCircle2 size={16} aria-hidden="true" /> {s.saved}
          </span>
        )}
        {result === 'error' && (
          <span role="alert" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#dc2626] dark:text-[#fca5a5]">
            <AlertCircle size={16} aria-hidden="true" /> {t.admin.products.invalid}
          </span>
        )}
      </div>
    </form>
  );
}
