import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { ProductToggle } from '@/components/admin/ProductToggle';
import { getT } from '@/i18n/server';
import { requireAdmin } from '@/lib/server/auth';
import { getCatalog } from '@/lib/server/catalog';
import { lowestPrice } from '@/lib/catalog';
import { formatINR } from '@/lib/utils';

export default async function AdminProducts() {
  await requireAdmin();
  const [t, entries] = await Promise.all([getT(), getCatalog({ includeInactive: true })]);
  const p = t.admin.products;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{p.title}</h1>
        <Link href="/admin/products/new" className="inline-flex h-11 items-center gap-2 rounded-full btn-wood btn-wood-teak px-5 text-sm font-semibold">
          <Plus size={16} aria-hidden="true" /> {p.add}
        </Link>
      </div>
      <p className="text-sm text-muted">{p.hideNote}</p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ product, active }) => (
          <li key={product.id} className={`flex items-center gap-3 rounded-[1.4rem] border border-line bg-card p-3 shadow-soft ${active ? '' : 'opacity-60'}`}>
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              <Image src={product.image} alt="" fill sizes="64px" className="object-contain p-1" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-fg">{product.name}</span>
              <span className="block truncate text-xs text-muted">
                {t.catalog.categories[product.category]} · {t.catalog.woods[product.wood].label} · {formatINR(lowestPrice(product))}
              </span>
              <span className="mt-1.5 flex items-center gap-2">
                <ProductToggle id={product.id} active={active} />
                <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-1 rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold text-fg hover:border-honey">
                  <Pencil size={12} aria-hidden="true" /> {t.common.edit}
                </Link>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
