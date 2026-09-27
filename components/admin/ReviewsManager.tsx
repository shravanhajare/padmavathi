'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { deleteReviewAction, saveReviewAction, type ReviewForm } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n/client';
import type { Review } from '@/lib/reviews';
import { cn } from '@/lib/utils';

const input =
  'w-full rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-[0.95rem] text-fg outline-none transition-colors focus:border-forest';
const LANGS = ['en', 'kn', 'hi'] as const;
const blank = { city: '', product: '', quote: '' };

const toForm = (r: Review): ReviewForm => ({
  id: r.id,
  name: r.name,
  rating: r.rating,
  active: r.active,
  i18n: { en: { ...r.i18n.en }, kn: { ...blank, ...r.i18n.kn }, hi: { ...blank, ...r.i18n.hi } },
});

function ReviewCard({ initial, onDone }: { initial: ReviewForm; onDone?: () => void }) {
  const t = useT();
  const s = t.admin.reviews;
  const p = t.admin.products;
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [lang, setLang] = useState<(typeof LANGS)[number]>('en');
  const [result, setResult] = useState<'saved' | 'error' | null>(null);
  const [pending, start] = useTransition();
  const tr = f.i18n[lang];
  const setTr = (k: keyof typeof blank, v: string) => setF((x) => ({ ...x, i18n: { ...x.i18n, [lang]: { ...x.i18n[lang], [k]: v } } }));

  const save = () =>
    start(async () => {
      const res = await saveReviewAction(f);
      setResult(res?.ok ? 'saved' : 'error');
      if (res?.ok) {
        if (!f.id) onDone?.();
        router.refresh();
      }
    });
  const remove = () => {
    if (!f.id || !window.confirm(s.confirmDelete)) return;
    start(async () => {
      await deleteReviewAction(f.id!);
      router.refresh();
    });
  };

  return (
    <li className={cn('flex flex-col gap-4 rounded-[1.4rem] border bg-card p-4 shadow-soft sm:p-5', f.active ? 'border-line' : 'border-dashed border-line-strong opacity-75')}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{s.name}</span>
          <input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-fg">{s.rating}</legend>
          <div className="flex h-[2.9rem] items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={t.sections.reviews.rated(n)} aria-pressed={f.rating === n} onClick={() => setF({ ...f, rating: n })} className="grid h-10 w-9 place-items-center">
                <Star size={22} className={n <= f.rating ? 'fill-[#facc15] text-[#e0a800]' : 'text-line-strong'} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface-2/60 p-1">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={lang === l}
            onClick={() => setLang(l)}
            className={cn('rounded-xl py-2 text-sm font-semibold', lang === l ? 'bg-surface text-fg shadow-soft' : 'text-muted')}
          >
            {l === 'en' ? p.english : l === 'kn' ? p.kannada : p.hindi}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{s.city}</span>
          <input className={input} value={tr.city} placeholder={lang === 'en' ? '' : f.i18n.en.city} onChange={(e) => setTr('city', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">{s.product}</span>
          <input className={input} value={tr.product} placeholder={lang === 'en' ? '' : f.i18n.en.product} onChange={(e) => setTr('product', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-fg">{s.quote}</span>
          <textarea className={input} rows={3} value={tr.quote} placeholder={lang === 'en' ? '' : f.i18n.en.quote} onChange={(e) => setTr('quote', e.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="mr-auto flex items-center gap-2.5 text-sm font-medium text-fg">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-5 w-5 accent-[#2c5a42]" />
          {s.visible}
        </label>
        {result === 'saved' && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf">
            <CheckCircle2 size={16} aria-hidden="true" /> {s.saved}
          </span>
        )}
        {result === 'error' && (
          <span role="alert" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#dc2626] dark:text-[#fca5a5]">
            <AlertCircle size={16} aria-hidden="true" /> {s.invalid}
          </span>
        )}
        {f.id && (
          <button type="button" onClick={remove} disabled={pending} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-[#dc2626]">
            <Trash2 size={15} aria-hidden="true" /> {s.delete}
          </button>
        )}
        <Button size="sm" onClick={save} disabled={pending}>
          {pending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} {s.save}
        </Button>
      </div>
    </li>
  );
}

export function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const t = useT();
  const s = t.admin.reviews;
  const [adding, setAdding] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      {reviews.length === 0 && adding === 0 && <p className="rounded-[1.5rem] border border-dashed border-line-strong p-8 text-center text-muted">{s.empty}</p>}
      <ul className="grid items-start gap-4 lg:grid-cols-2">
        {Array.from({ length: adding }, (_, i) => (
          <ReviewCard
            key={`new-${i}`}
            initial={{ id: null, name: '', rating: 5, active: true, i18n: { en: { ...blank }, kn: { ...blank }, hi: { ...blank } } }}
            onDone={() => setAdding((n) => n - 1)}
          />
        ))}
        {reviews.map((r) => (
          <ReviewCard key={r.id} initial={toForm(r)} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setAdding((n) => n + 1)}
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold text-fg hover:border-honey"
      >
        <Plus size={15} aria-hidden="true" /> {s.add}
      </button>
    </div>
  );
}
