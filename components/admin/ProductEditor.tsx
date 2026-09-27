'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition, type ReactNode } from 'react';
import { saveProductAction, type ProductForm } from '@/app/actions/admin';
import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n/client';
import { CATEGORY_IDS, MODEL_KINDS, TAGS, WOOD_IDS } from '@/lib/productOptions';
import { cn } from '@/lib/utils';

const input =
  'w-full rounded-2xl border border-line-strong bg-surface px-4 py-2.5 text-[0.95rem] text-fg outline-none transition-colors focus:border-forest aria-[invalid=true]:border-[#dc2626]';

function F({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.6rem] border border-line bg-card p-5 shadow-soft sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

export function ProductEditor({ initial }: { initial: ProductForm }) {
  const t = useT();
  const p = t.admin.products;
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [lang, setLang] = useState<'en' | 'kn' | 'hi'>('en');
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [bad, setBad] = useState<Record<string, true>>({});

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const setTr = (l: 'en' | 'kn' | 'hi', k: string, v: string) => setF((s) => ({ ...s, [l]: { ...s[l], [k]: v } }));
  const setVar = (i: number, k: string, v: string | number) => setF((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const invalid = (path: string) => (bad[path] ? true : undefined);

  const save = () =>
    start(async () => {
      const res = await saveProductAction(f);
      if (res?.ok) {
        setBad({});
        setResult({ ok: true, text: p.saved });
        if (f.isNew) router.replace(`/admin/products/${res.id}`);
        else router.refresh();
      } else {
        setBad(Object.fromEntries(Object.keys((res && !res.ok && res.fields) || {}).map((k) => [k, true])));
        setResult({ ok: false, text: res && !res.ok && res.error === 'idTaken' ? p.idTaken : p.invalid });
      }
    });

  const tr = f[lang];
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card title={`${p.english} / ${p.kannada} / ${p.hindi}`}>
          <div role="tablist" className="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-surface-2/60 p-1">
            {(['en', 'kn', 'hi'] as const).map((l) => (
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
          <div className="grid gap-4 sm:grid-cols-2">
            <F label={p.name}>
              <input className={input} value={tr.name} aria-invalid={invalid(`${lang}.name`)} onChange={(e) => setTr(lang, 'name', e.target.value)} />
            </F>
            <F label={p.localName}>
              <input className={input} value={tr.localName} onChange={(e) => setTr(lang, 'localName', e.target.value)} />
            </F>
            <F label={p.description} className="sm:col-span-2">
              <input className={input} value={tr.description} aria-invalid={invalid(`${lang}.description`)} onChange={(e) => setTr(lang, 'description', e.target.value)} />
            </F>
            <F label={p.story} className="sm:col-span-2">
              <textarea className={input} rows={4} value={tr.story} onChange={(e) => setTr(lang, 'story', e.target.value)} />
            </F>
            <F label={p.finish} className="sm:col-span-2">
              <input className={input} value={tr.finish} onChange={(e) => setTr(lang, 'finish', e.target.value)} />
            </F>
            <F label={p.includes} className="sm:col-span-2">
              <textarea className={input} rows={3} value={tr.includes} onChange={(e) => setTr(lang, 'includes', e.target.value)} />
            </F>
            {lang === 'en' && (
              <>
                <F label={p.dimensions}>
                  <input className={input} value={f.en.dimensions} onChange={(e) => setTr('en', 'dimensions', e.target.value)} />
                </F>
                <F label={p.weight}>
                  <input className={input} value={f.en.weight} onChange={(e) => setTr('en', 'weight', e.target.value)} />
                </F>
              </>
            )}
          </div>
        </Card>

        <Card title={p.variants}>
          <ul className="flex flex-col gap-4">
            {f.variants.map((v, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface-2/40 p-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <F label={p.variantId}>
                    <input className={input} value={v.id} aria-invalid={invalid(`variants.${i}.id`)} onChange={(e) => setVar(i, 'id', e.target.value.toLowerCase())} />
                  </F>
                  <F label={p.price}>
                    <input
                      className={input}
                      inputMode="numeric"
                      value={v.price || ''}
                      aria-invalid={invalid(`variants.${i}.price`)}
                      onChange={(e) => setVar(i, 'price', Number(e.target.value.replace(/\D/g, '')))}
                    />
                  </F>
                  <F label={p.dimensions}>
                    <input className={input} value={v.dimensions} onChange={(e) => setVar(i, 'dimensions', e.target.value)} />
                  </F>
                  <F label={p.weight}>
                    <input className={input} value={v.weight} onChange={(e) => setVar(i, 'weight', e.target.value)} />
                  </F>
                  <F label={`${p.variantLabel} (${p.english})`} className="sm:col-span-2">
                    <input className={input} value={v.label} aria-invalid={invalid(`variants.${i}.label`)} onChange={(e) => setVar(i, 'label', e.target.value)} />
                  </F>
                  <F label={`${p.variantLabel} (${p.kannada})`}>
                    <input className={input} value={v.labelKn} onChange={(e) => setVar(i, 'labelKn', e.target.value)} />
                  </F>
                  <F label={`${p.variantLabel} (${p.hindi})`}>
                    <input className={input} value={v.labelHi} onChange={(e) => setVar(i, 'labelHi', e.target.value)} />
                  </F>
                </div>
                {f.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => set('variants', f.variants.filter((_, j) => j !== i))}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-accent"
                  >
                    <Trash2 size={14} aria-hidden="true" /> {p.removeVariant}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => set('variants', [...f.variants, { id: `v${f.variants.length + 1}`, label: '', labelKn: '', labelHi: '', price: 0, dimensions: '', weight: '' }])}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-fg hover:border-honey"
          >
            <Plus size={15} aria-hidden="true" /> {p.addVariant}
          </button>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24">
        <Card title={p.basics}>
          <div className="flex flex-col gap-4">
            {f.image && (
              <span className="relative mx-auto block h-32 w-32 overflow-hidden rounded-2xl bg-surface-2">
                <Image src={f.image} alt="" fill sizes="128px" className="object-contain p-2" unoptimized={f.image.startsWith('http')} />
              </span>
            )}
            <F label={p.id} hint={f.isNew ? p.idHint : undefined}>
              <input className={input} value={f.id} disabled={!f.isNew} aria-invalid={invalid('id')} onChange={(e) => set('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label={p.category}>
                <select className={input} value={f.category} onChange={(e) => set('category', e.target.value as ProductForm['category'])}>
                  {CATEGORY_IDS.map((c) => (
                    <option key={c} value={c}>
                      {t.catalog.categories[c]}
                    </option>
                  ))}
                </select>
              </F>
              <F label={p.wood}>
                <select className={input} value={f.wood} onChange={(e) => set('wood', e.target.value as ProductForm['wood'])}>
                  {WOOD_IDS.map((w) => (
                    <option key={w} value={w}>
                      {t.catalog.woods[w].label}
                    </option>
                  ))}
                </select>
              </F>
              <F label={p.model}>
                <select className={input} value={f.modelKind} onChange={(e) => set('modelKind', e.target.value as ProductForm['modelKind'])}>
                  {MODEL_KINDS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </F>
              <F label={p.modelVariant}>
                <input className={input} value={f.modelVariant} onChange={(e) => set('modelVariant', e.target.value)} />
              </F>
            </div>
            <F label={p.image} hint={p.imageHint}>
              <input className={input} value={f.image} aria-invalid={invalid('image')} onChange={(e) => set('image', e.target.value.trim())} />
            </F>
            <F label={p.popularity}>
              <input className={input} inputMode="numeric" value={f.popularity} onChange={(e) => set('popularity', Math.min(100, Number(e.target.value.replace(/\D/g, '')) || 0))} />
            </F>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-fg">{p.tags}</legend>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const on = f.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('tags', on ? f.tags.filter((x) => x !== tag) : [...f.tags, tag])}
                      className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', on ? 'border-transparent bg-[linear-gradient(135deg,#f6d9a6,#e2a867)] text-[#3a1f0c]' : 'border-line-strong text-muted')}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="flex items-center gap-3 text-sm font-medium text-fg">
              <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} className="h-5 w-5 accent-[#2c5a42]" />
              {p.visible}
            </label>
          </div>
        </Card>
        {result && (
          <p
            role={result.ok ? 'status' : 'alert'}
            className={cn(
              'flex items-center gap-2 rounded-2xl border p-3 text-sm font-medium',
              result.ok ? 'border-leaf/30 bg-leaf/10 text-leaf' : 'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]',
            )}
          >
            {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {result.text}
          </p>
        )}
        <Button size="lg" onClick={save} disabled={pending} className="w-full">
          {pending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} {p.save}
        </Button>
      </div>
    </div>
  );
}
