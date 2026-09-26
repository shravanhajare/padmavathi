'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Droplets, Hand, Minus, Package, Plus, Ruler, ShoppingCart, Sparkles, Weight, Wind } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getProduct } from '@/data/products';
import { categoryById, woodById } from '@/data/categories';
import { useUIStore } from '@/store/ui';
import { useThemeStore } from '@/store/theme';
import { MAX_QTY } from '@/store/cart';
import { CloseButton, Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AnimatedPrice, ProductBadges, TrustLine, VariantPicker, WoodChip, tintClasses, tintStyle, useAddToCart } from './parts';
import { cn, formatINR } from '@/lib/utils';
import type { Product } from '@/data/types';

const ProductViewer = dynamic(() => import('@/components/three/ProductViewer'), { ssr: false });

const CARE = [
  { Icon: Droplets, text: 'Hand-wash with mild soap and warm water. Never soak it or put it in the dishwasher.' },
  { Icon: Wind, text: 'Wipe dry and stand it upright to air, away from the stove’s direct heat.' },
  { Icon: Sparkles, text: 'Rub in a few drops of coconut oil every few weeks to keep the grain glowing.' },
];

function QuickViewBody({ product, onClose }: { product: Product; onClose: () => void }) {
  const theme = useThemeStore((s) => s.resolved);
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [qty, setQty] = useState(1);
  const [viewerReady, setViewerReady] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const { addToCart, added } = useAddToCart(product);
  const artRef = useRef<HTMLDivElement>(null);
  const wood = woodById[product.wood];

  useEffect(() => {
    // give the modal its entrance before spinning up WebGL
    const t = window.setTimeout(() => setViewerReady(true), 350);
    return () => window.clearTimeout(t);
  }, []);

  const specs = [
    { Icon: Ruler, label: 'Dimensions', value: variant.dimensions ?? product.dimensions },
    { Icon: Weight, label: 'Weight', value: variant.weight ?? product.weight },
    { Icon: Sparkles, label: 'Finish', value: product.finish },
    { Icon: Hand, label: 'Made', value: 'By hand, one piece at a time' },
  ];

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-y-auto overflow-x-hidden md:grid-cols-[1.05fr_1fr] md:overflow-hidden" data-lenis-prevent>
      <div
        ref={artRef}
        style={tintStyle(product)}
        className={cn('relative aspect-[6/5] w-full sm:aspect-square md:aspect-auto md:h-full md:min-h-[36rem]', tintClasses)}
      >
        <div className="wood-grain absolute inset-x-0 bottom-0 h-[9%] bg-[linear-gradient(180deg,#d9a066,#b06a36)] opacity-90 dark:bg-[linear-gradient(180deg,#8a552d,#5c3a21)]" aria-hidden="true" />
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 768px) 520px, 100vw"
          className={cn('object-contain p-10 transition-opacity duration-700', viewerReady ? 'opacity-0' : 'opacity-100')}
          priority
        />
        {viewerReady && (
          <div className="absolute inset-0">
            <ProductViewer spec={product.model} theme={theme} label={`Interactive 3D view of ${product.name}. Drag to turn it.`} />
          </div>
        )}
        <p className="pointer-events-none absolute bottom-[11%] left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#2e1d12] shadow-sm">
          <Hand size={14} aria-hidden="true" /> Drag to turn it around
        </p>
        <ProductBadges product={product} max={3} className="absolute left-4 top-4" />
        <CloseButton onClick={onClose} className="absolute right-3 top-3 z-10 md:hidden" />
      </div>

      <div className="flex min-w-0 flex-col gap-5 px-5 pt-5 sm:p-8 md:overflow-y-auto" data-lenis-prevent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-wood">
              {categoryById[product.category].label}
              {product.localName && <span className="text-muted"> · {product.localName}</span>}
            </p>
            <h2 id="quick-view-title" className="mt-2 text-[1.8rem] font-semibold leading-tight text-fg sm:text-4xl">
              {product.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <WoodChip wood={product.wood} className="text-xs" />
              <span className="text-xs text-muted">{wood.note}</span>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <CloseButton onClick={onClose} />
          </div>
        </div>
        <p className="leading-relaxed text-muted">{product.story}</p>
        <TrustLine />

        <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-line bg-surface-2/60 p-4 text-sm sm:grid-cols-2">
          {specs.map(({ Icon, label, value }) => (
            <div key={label} className="flex gap-2.5">
              <Icon size={17} className="mt-0.5 shrink-0 text-honey" aria-hidden="true" />
              <div>
                <dt className="font-semibold text-fg">{label}</dt>
                <dd className="text-muted">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {product.includes && (
          <div>
            <h3 className="flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-fg">
              <Package size={14} className="text-honey" aria-hidden="true" /> In the box
            </h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {product.includes.map((i) => (
                <li key={i} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-fg">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-fg">Caring for it</h3>
          <ul className="mt-2.5 space-y-2 text-sm text-muted">
            {CARE.map(({ Icon, text }) => (
              <li key={text} className="flex gap-2.5">
                <Icon size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-fg">Size</h3>
          <VariantPicker product={product} value={variantId} onChange={setVariantId} size="md" />
        </div>

        {/* on phones the quantity and Add button stay pinned to the bottom of the sheet */}
        <div className="sticky bottom-0 -mx-5 mt-auto flex items-center gap-3 border-t border-line bg-surface/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:flex-wrap sm:gap-4 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 sm:backdrop-blur-none">
          <div className="flex shrink-0 items-center rounded-full border border-line-strong bg-surface">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-fg hover:bg-surface-2 disabled:opacity-40 sm:h-11 sm:w-11"
              disabled={qty <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite" aria-label={`Quantity ${qty}`}>
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-fg hover:bg-surface-2 sm:h-11 sm:w-11"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="hidden sm:block">
            <AnimatedPrice value={variant.price * qty} className="font-display text-3xl font-semibold text-fg" />
            <span className="block text-xs text-muted">+ GST</span>
          </span>
          <Button
            size="lg"
            magnetic
            className="min-w-0 flex-1 max-sm:h-12 max-sm:px-4 max-sm:text-[0.92rem] sm:ml-auto sm:flex-none"
            onClick={() => addToCart(variantId, qty, artRef.current)}
          >
            <ShoppingCart size={18} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{added ? 'Added to cart' : 'Add to cart'}</span>
            <span className="shrink-0 tabular-nums sm:hidden">· {formatINR(variant.price * qty)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QuickView() {
  const id = useUIStore((s) => s.quickViewId);
  const close = useUIStore((s) => s.closeQuickView);
  const product = id ? getProduct(id) : undefined;
  // keep rendering the last product while the modal animates out
  const [shown, setShown] = useState<Product | undefined>(product);
  useEffect(() => {
    if (product) setShown(product);
  }, [product]);
  return (
    <Modal open={!!product} onClose={close} labelledBy="quick-view-title">
      {shown && <QuickViewBody key={shown.id} product={shown} onClose={close} />}
    </Modal>
  );
}
