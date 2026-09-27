'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { updateOrderAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n/client';
import type { OrderStatus } from '@/lib/server/orders';
import { cn } from '@/lib/utils';

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'in_production', 'dispatched', 'delivered', 'cancelled'];

export function OrderEditor({ number, status: initialStatus, notes: initialNotes }: { number: number; status: OrderStatus; notes: string }) {
  const t = useT();
  const o = t.admin.orders;
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">{o.status}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === status}
              onClick={() => {
                setStatus(s);
                setSaved(false);
              }}
              className={cn(
                'rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                s === status ? 'border-transparent bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] text-[#3a1f0c]' : 'border-line-strong text-muted hover:border-honey hover:text-fg',
              )}
            >
              {t.orders.status[s]}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg">{o.adminNotes}</span>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          rows={4}
          placeholder={o.adminNotesPlaceholder}
          className="w-full rounded-2xl border border-line-strong bg-surface px-4 py-3 text-[0.95rem] text-fg outline-none focus:border-forest"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="md"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updateOrderAction(number, status, notes);
              setSaved(!!res?.ok);
            })
          }
        >
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} {o.save}
        </Button>
        {saved && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf">
            <CheckCircle2 size={16} aria-hidden="true" /> {o.saved}
          </span>
        )}
      </div>
    </div>
  );
}
