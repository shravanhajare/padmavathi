'use client';

import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction, type AddressForm } from '@/app/actions/addresses';
import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n/client';
import type { Address } from '@/lib/server/addresses';
import { cn } from '@/lib/utils';

const blankForm = (): AddressForm => ({ id: null, label: 'Home', name: '', phone: '', line1: '', landmark: '', city: '', state: '', pincode: '', isDefault: false });

function toForm(a: Address): AddressForm {
  return { id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, landmark: a.landmark ?? '', city: a.city, state: a.state, pincode: a.pincode, isDefault: a.is_default };
}

function AddressEditor({ initial, onDone }: { initial: AddressForm; onDone: () => void }) {
  const t = useT();
  const p = t.orders.account.address;
  const c = t.orders.checkout;
  const [f, setF] = useState(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof AddressForm>(k: K, v: AddressForm[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = () =>
    start(async () => {
      await saveAddressAction(f);
      onDone();
    });

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line-strong bg-surface-2/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{p.label}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" value={f.label} onChange={(e) => set('label', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{c.name}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" value={f.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{c.phone}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-fg">{c.address}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" value={f.line1} onChange={(e) => set('line1', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-fg">{c.landmark}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" value={f.landmark} onChange={(e) => set('landmark', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{c.city}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" value={f.city} onChange={(e) => set('city', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{c.state}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" value={f.state} onChange={(e) => set('state', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{c.pincode}</span>
          <input className="h-12 rounded-2xl border border-line-strong bg-surface px-4 text-[0.95rem] text-fg outline-none focus:border-forest" inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <label className="flex items-center gap-2.5 text-sm font-medium text-fg">
        <input type="checkbox" checked={f.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="h-5 w-5 accent-[#2c5a42]" />
        {p.makeDefault}
      </label>
      <div className="flex gap-3">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} {p.save}
        </Button>
        <button type="button" onClick={onDone} className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-fg">
          {p.cancel}
        </button>
      </div>
    </li>
  );
}

function AddressCard({ a }: { a: Address }) {
  const t = useT();
  const p = t.orders.account.address;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) return <AddressEditor initial={toForm(a)} onDone={() => (setEditing(false), router.refresh())} />;

  return (
    <li className={cn('flex flex-col gap-2 rounded-2xl border p-4', a.is_default ? 'border-forest bg-sage/10' : 'border-line')}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold text-fg">
          <MapPin size={15} className="text-honey" aria-hidden="true" /> {a.label}
        </span>
        {a.is_default && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2c5a42] px-2 py-0.5 text-[0.68rem] font-bold text-white">
            <Star size={11} fill="currentColor" aria-hidden="true" /> {p.default}
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        {a.name} · {a.phone}
        <br />
        {a.line1}
        {a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} {a.pincode}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <button type="button" onClick={() => setEditing(true)} className="text-accent underline-offset-4 hover:underline">
          {p.edit}
        </button>
        {!a.is_default && (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => (await setDefaultAddressAction(a.id), router.refresh()))}
            className="text-accent underline-offset-4 hover:underline"
          >
            {p.makeDefault}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => window.confirm(p.confirmDelete) && start(async () => (await deleteAddressAction(a.id), router.refresh()))}
          className="inline-flex items-center gap-1 text-muted hover:text-[#dc2626]"
        >
          <Trash2 size={14} aria-hidden="true" /> {p.delete}
        </button>
      </div>
    </li>
  );
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const t = useT();
  const p = t.orders.account.address;
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {addresses.length === 0 && !adding && <p className="text-muted">{p.empty}</p>}
      <ul className="flex flex-col gap-3">
        {adding && <AddressEditor initial={blankForm()} onDone={() => (setAdding(false), router.refresh())} />}
        {addresses.map((a) => (
          <AddressCard key={a.id} a={a} />
        ))}
      </ul>
      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold text-fg hover:border-honey"
        >
          <Plus size={15} aria-hidden="true" /> {p.add}
        </button>
      )}
    </div>
  );
}
