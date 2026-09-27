import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ProductForm } from '@/app/actions/admin';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { getT } from '@/i18n/server';
import { requireAdmin } from '@/lib/server/auth';
import { getCatalogEntry } from '@/lib/server/catalog';

const blankTr = { name: '', localName: '', description: '', story: '', finish: '', includes: '' };

export default async function AdminProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const [{ id }, t] = await Promise.all([params, getT()]);
  let initial: ProductForm;
  if (id === 'new') {
    initial = {
      isNew: true,
      id: '',
      category: 'rolling',
      wood: 'teak',
      modelKind: 'belan',
      modelVariant: '',
      image: '/images/products/',
      tags: ['handmade', 'food-safe'],
      popularity: 50,
      active: true,
      en: { ...blankTr, dimensions: '', weight: '' },
      kn: { ...blankTr },
      hi: { ...blankTr },
      variants: [{ id: 'std', label: 'Standard', labelKn: '', labelHi: '', price: 0, dimensions: '', weight: '' }],
    };
  } else {
    const entry = await getCatalogEntry(id);
    if (!entry) notFound();
    const { product: p, i18n } = entry;
    const tr = (l: 'kn' | 'hi') => ({
      name: i18n[l]?.name ?? '',
      localName: i18n[l]?.localName ?? '',
      description: i18n[l]?.description ?? '',
      story: i18n[l]?.story ?? '',
      finish: i18n[l]?.finish ?? '',
      includes: (i18n[l]?.includes ?? []).join('\n'),
    });
    initial = {
      isNew: false,
      id: p.id,
      category: p.category === 'spice' ? 'rolling' : p.category,
      wood: p.wood,
      modelKind: p.model.kind,
      modelVariant: p.model.variant ?? '',
      image: p.image,
      tags: p.tags,
      popularity: p.popularity,
      active: entry.active,
      en: {
        name: p.name,
        localName: p.localName ?? '',
        description: p.description,
        story: p.story,
        finish: p.finish,
        includes: (p.includes ?? []).join('\n'),
        dimensions: p.dimensions,
        weight: p.weight,
      },
      kn: tr('kn'),
      hi: tr('hi'),
      variants: p.variants.map((v) => ({
        id: v.id,
        label: v.label,
        labelKn: i18n.kn?.variants?.[v.id] ?? '',
        labelHi: i18n.hi?.variants?.[v.id] ?? '',
        price: v.price,
        dimensions: v.dimensions ?? '',
        weight: v.weight ?? '',
      })),
    };
  }
  const p = t.admin.products;
  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" /> {p.title}
      </Link>
      <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{initial.isNew ? p.newTitle : p.editTitle(initial.en.name)}</h1>
      <ProductEditor initial={initial} />
    </div>
  );
}
