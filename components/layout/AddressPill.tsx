'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, MapPin, Plus } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { setDefaultAddressAction } from '@/app/actions/addresses';
import { useT } from '@/i18n/client';
import { useAddresses, useSessionUser } from './AppData';
import { cn } from '@/lib/utils';

/**
 * A delivery-location bar in the header, like Flipkart or Amazon: always visible,
 * shows where an order will ship, and opens a picker over the saved addresses.
 * Picking one makes it the default, which checkout then pre-fills.
 */
export function AddressPill({ className }: { className?: string }) {
  const t = useT();
  const d = t.common.deliver;
  const user = useSessionUser();
  const addresses = useAddresses();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Delivery addresses are a signed-in feature: a guest has none to show or pick.
  if (!user) return null;

  const selected = addresses.find((a) => a.is_default) ?? addresses[0];

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 max-w-[11rem] items-center gap-1.5 rounded-full border border-line-strong bg-surface/70 px-3 text-[0.82rem] font-semibold text-fg transition-colors hover:border-honey sm:max-w-[14rem]"
      >
        <MapPin size={16} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{selected ? d.to(`${selected.city} ${selected.pincode}`) : d.add}</span>
        <ChevronDown size={14} className="shrink-0" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-12 z-50 w-72 origin-top-left overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{d.choose}</p>
            {addresses.length === 0 ? (
              <p className="px-3 pb-2 text-sm text-muted">{d.signIn}</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={a.id === selected?.id}
                      disabled={pending}
                      onClick={() => {
                        setOpen(false);
                        if (a.id !== selected?.id) start(async () => (await setDefaultAddressAction(a.id), router.refresh()));
                      }}
                      className={cn(
                        'flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                        a.id === selected?.id ? 'bg-surface-2 font-semibold text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold text-fg">{a.label}</span>
                        <span className="block truncate text-xs">
                          {a.line1}, {a.city} {a.pincode}
                        </span>
                      </span>
                      {a.id === selected?.id && <Check size={16} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/account#addresses"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent hover:bg-surface-2"
            >
              <Plus size={15} aria-hidden="true" /> {addresses.length === 0 ? d.add : d.manage}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
