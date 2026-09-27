'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Box, Minus, Plus, Ruler, ShoppingCart } from 'lucide-react';
import { forwardRef, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { Product } from '@/data/types';
import { QTY_STEP, useCartStore } from '@/store/cart';
import { useMinQty } from '@/components/layout/AppData';
import { useT } from '@/i18n/client';
import { useUIStore } from '@/store/ui';
import { Kolam } from '@/components/ui/Kolam';
import { AnimatedPrice, ProductBadges, VariantPicker, WoodChip, tintClasses, tintStyle, useAddToCart } from './parts';
import { cn } from '@/lib/utils';

/** "Add to cart" that becomes a − qty + stepper once the item is in the cart. */
function CartControl({
  product,
  variantId,
  sourceRef,
  onAdd,
}: {
  product: Product;
  variantId: string;
  sourceRef: RefObject<HTMLElement | null>;
  onAdd: (variantId: string, qty: number, el?: Element | null) => void;
}) {
  const t = useT();
  const min = useMinQty();
  const key = `${product.id}:${variantId}`;
  const qty = useCartStore((s) => s.lines.find((l) => l.key === key)?.qty ?? 0);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  // stepping below the bulk minimum takes the line out of the cart
  const less = () => (qty - QTY_STEP < min ? remove(key) : setQty(key, qty - QTY_STEP));
  const variant = product.variants.find((v) => v.id === variantId)!;
  return (
    <div className="relative flex h-10 w-full justify-end @min-[15rem]:h-11 @min-[15rem]:w-auto @min-[15rem]:min-w-[7.4rem]">
      <AnimatePresence mode="popLayout" initial={false}>
        {qty === 0 ? (
          <motion.button
            key="add"
            type="button"
            onClick={() => onAdd(variantId, min, sourceRef.current)}
            aria-label={t.catalog.card.addAria(product.name, variant.label, min)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 460, damping: 26 }}
            className="group/add relative inline-flex h-10 w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap btn-wood btn-wood-teak rounded-full pl-1.5 pr-4 text-sm font-semibold @min-[15rem]:h-11 @min-[15rem]:w-auto @min-[15rem]:justify-start"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1d6]/15 ring-1 ring-inset ring-[#fff1d6]/25 transition-transform duration-300 group-hover/add:-rotate-12 group-hover/add:scale-110 @min-[15rem]:h-8 @min-[15rem]:w-8">
              <ShoppingCart size={15} aria-hidden="true" />
            </span>
            <span className="@min-[19rem]:hidden">
              {t.catalog.card.add} · {min}
            </span>
            <span className="hidden @min-[19rem]:inline">
              {t.catalog.card.addToCart} · {min}
            </span>
            <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 blur-md transition-all duration-700 group-hover/add:left-[130%]" aria-hidden="true" />
          </motion.button>
        ) : (
          <motion.div
            key="stepper"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 460, damping: 26 }}
            className="inline-flex h-10 w-full items-center justify-between btn-wood btn-wood-honey rounded-full p-1 @min-[15rem]:h-11 @min-[15rem]:w-auto @min-[15rem]:min-w-[8.2rem]"
            role="group"
            aria-label={t.catalog.card.inCartAria(product.name, variant.label, qty)}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={less}
              aria-label={qty - QTY_STEP < min ? t.catalog.card.removeAria(product.name) : t.catalog.card.less(product.name, QTY_STEP)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[#fff8ea]/55 [text-shadow:none] hover:bg-[#fff8ea] @min-[15rem]:h-9 @min-[15rem]:w-9"
            >
              <Minus size={15} />
            </motion.button>
            <span className="relative w-11 overflow-hidden text-center font-display text-lg font-semibold tabular-nums" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={qty}
                  className="block"
                  initial={{ y: -18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 18, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                >
                  {qty}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => onAdd(variantId, QTY_STEP, sourceRef.current)}
              aria-label={t.catalog.card.more(product.name, QTY_STEP)}
              className="grid h-8 w-8 place-items-center btn-wood btn-wood-teak rounded-full @min-[15rem]:h-9 @min-[15rem]:w-9"
            >
              <Plus size={15} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = forwardRef<HTMLElement, ProductCardProps>(function ProductCard({ product, index }, ref) {
  const t = useT();
  const min = useMinQty();
  const reduce = useReducedMotion();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const openQuickView = useUIStore((s) => s.openQuickView);
  const { addToCart, pulse, lastQty } = useAddToCart(product);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  // cursor tilt + a glare highlight that follows the pointer
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20, mass: 0.6 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(30);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0) 50%)`;
  // the piece drifts against the tilt, which reads as depth
  const ix = useSpring(0, { stiffness: 160, damping: 18 });
  const iy = useSpring(0, { stiffness: 160, damping: 18 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse' || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 14);
    rx.set(-(py - 0.5) * 10);
    gx.set(px * 100);
    gy.set(py * 100);
    ix.set((px - 0.5) * 18);
    iy.set((py - 0.5) * 12);
    glareOpacity.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    ix.set(0);
    iy.set(0);
    glareOpacity.set(0);
  };

  const headingId = `p-${product.id}`;

  return (
    <motion.article
      ref={ref}
      layout={!reduce}
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.75, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group/card @container"
    >
      <motion.div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: srx, rotateY: sry, transformPerspective: 1100 }}
        className="pe-card relative h-full rounded-[1.4rem] p-[1.5px] shadow-soft transition-[box-shadow,translate] duration-500 ease-out group-hover/card:-translate-y-2 group-hover/card:shadow-lift @min-[15rem]:rounded-[1.9rem]"
      >
        <div className="relative flex h-full flex-col rounded-[calc(1.4rem-1.5px)] bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface)_60%,var(--surface-2)_100%)] @min-[15rem]:rounded-[calc(1.9rem-1.5px)]">
          {/* display plinth: tinted panel, kolam watermark, a wooden shelf lip, the piece floating above it */}
          <div className="relative mx-1.5 mt-1.5 aspect-[5/4] @min-[15rem]:mx-2.5 @min-[15rem]:mt-2.5">
            <div style={tintStyle(product)} className={cn('absolute inset-0 overflow-hidden rounded-[1.1rem] @min-[15rem]:rounded-[1.5rem]', tintClasses)}>
              <Kolam
                draw={false}
                className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 text-white/55 transition-transform duration-[2200ms] ease-out group-hover/card:rotate-[40deg] dark:text-white/[0.07]"
                petals={10}
              />
              <div className="absolute inset-x-[16%] bottom-[16%] h-[9%] rounded-[50%] bg-[#5c3a21]/20 blur-md transition-all duration-700 group-hover/card:inset-x-[22%] group-hover/card:opacity-60" aria-hidden="true" />
              <div className="wood-grain absolute inset-x-0 bottom-0 h-[11%] bg-[linear-gradient(180deg,#d9a066,#b06a36)] shadow-[inset_0_2px_0_rgb(255_240_210/0.55)] dark:bg-[linear-gradient(180deg,#8a552d,#5c3a21)]" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={() => openQuickView(product.id)}
              className="absolute inset-0 z-20 rounded-[1.1rem] @min-[15rem]:rounded-[1.5rem]"
              aria-label={t.catalog.card.quickView(product.name)}
            />
            <motion.div ref={imgRef} className="pointer-events-none absolute inset-x-[4%] bottom-[6%] top-[3%] z-10" style={{ x: ix, y: iy }}>
              <div className="relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/card:-translate-y-3 group-hover/card:-rotate-2 group-hover/card:scale-[1.06]">
                <Image
                  src={product.image}
                  alt={`${product.name}, ${product.description}`}
                  fill
                  sizes="(min-width: 1280px) 290px, (min-width: 1024px) 30vw, 48vw"
                  className="object-contain drop-shadow-[0_18px_22px_rgb(92_58_33/0.28)]"
                />
              </div>
            </motion.div>
            {/* a ring and "+1" each time this item is added */}
            <AnimatePresence>
              {pulse > 0 && (
                <motion.span
                  key={pulse}
                  className="pointer-events-none absolute inset-0 z-30 rounded-[1.1rem] border-2 border-[#3f7a5a] @min-[15rem]:rounded-[1.5rem]"
                  initial={{ opacity: 0.9, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.06 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {pulse > 0 && (
                <motion.span
                  key={`plus-${pulse}`}
                  className="pointer-events-none absolute left-1/2 top-1/3 z-30 -translate-x-1/2 font-display text-3xl font-bold text-[#2c5a42] drop-shadow"
                  initial={{ opacity: 0, y: 10, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], y: -50, scale: 1.1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  aria-hidden="true"
                >
                  +{lastQty}
                </motion.span>
              )}
            </AnimatePresence>
            <ProductBadges product={product} fluid className="absolute left-2 top-2 z-30 @min-[15rem]:left-3 @min-[15rem]:top-3" />
            <span className="pointer-events-none absolute right-2 top-2 z-30 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[#5c3a21] shadow-sm backdrop-blur transition-all duration-300 @min-[15rem]:right-3 @min-[15rem]:top-3 @min-[15rem]:h-9 @min-[15rem]:w-9 [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100">
              <Box size={16} aria-hidden="true" />
            </span>
            <span className="pointer-events-none absolute bottom-[16%] left-1/2 z-30 hidden -translate-x-1/2 scale-90 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#2e1d12] opacity-0 shadow-lift backdrop-blur transition-all duration-300 group-hover/card:scale-100 group-hover/card:opacity-100 @min-[15rem]:inline-flex">
              <Box size={14} aria-hidden="true" /> {t.catalog.card.view3d}
            </span>
          </div>

          <div className="flex flex-1 flex-col px-3 pb-3 pt-3 @min-[15rem]:px-5 @min-[15rem]:pb-5 @min-[15rem]:pt-4">
            {product.localName && (
              <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-wood @min-[15rem]:text-[0.68rem]">{product.localName}</p>
            )}
            <h3 id={headingId} className="mt-1 line-clamp-2 text-[1.02rem] font-semibold leading-snug text-fg @min-[15rem]:text-[1.3rem] @min-[15rem]:leading-tight">
              {product.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <WoodChip wood={product.wood} />
              <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-muted">
                <Ruler size={12} aria-hidden="true" /> {variant.dimensions ?? product.dimensions}
              </span>
            </div>
            <p className="mt-2 hidden text-sm leading-relaxed text-muted @min-[15rem]:line-clamp-2">{product.description}</p>
            <div className="mt-3">
              <VariantPicker product={product} value={variantId} onChange={setVariantId} fluid />
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-3 @min-[15rem]:flex-row @min-[15rem]:items-end @min-[15rem]:justify-between @min-[15rem]:pt-4">
              <div className="leading-none">
                <AnimatedPrice value={variant.price} className="font-display text-[1.3rem] font-semibold text-fg @min-[15rem]:text-[1.6rem]" />
                <span className="mt-1 block text-[0.68rem] text-muted">
                  {t.common.plusGst} · {t.common.minOrder(min)}
                </span>
              </div>
              <CartControl product={product} variantId={variantId} sourceRef={imgRef} onAdd={addToCart} />
            </div>
          </div>
        </div>

        {/* glare sweep */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 rounded-[1.4rem] mix-blend-soft-light @min-[15rem]:rounded-[1.9rem]"
          style={{ background: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </motion.article>
  );
});

