'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Box, Check, Gift, Heart, Home, PartyPopper, ShoppingCart, Users } from 'lucide-react';
import { useRef } from 'react';
import { products } from '@/data/products';
import type { Product } from '@/data/types';
import { useUIStore } from '@/store/ui';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Kolam, KolamBorder } from '@/components/ui/Kolam';
import { useAddToCart, WoodChip } from '@/components/shop/parts';
import { scrollToTarget } from '@/lib/scroll';
import { selectEnquiryType, selectShopCategory } from '@/lib/events';
import { cn, formatINR } from '@/lib/utils';

const OCCASIONS = [
  { Icon: Home, label: 'Gruhapravesha' },
  { Icon: Heart, label: 'Weddings & return gifts' },
  { Icon: PartyPopper, label: 'Diwali, Onam & Sankranti' },
  { Icon: Users, label: 'Corporate gifting' },
];

function GiftCard({ product, index }: { product: Product; index: number }) {
  const { addToCart, added } = useAddToCart(product);
  const openQuickView = useUIStore((s) => s.openQuickView);
  const imgRef = useRef<HTMLDivElement>(null);
  const variant = product.variants[0];
  const featured = index === 1;
  return (
    <motion.article
      initial={{ opacity: 0, y: 60, rotate: index === 0 ? -2 : index === 2 ? 2 : 0 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group relative flex flex-col', featured && 'lg:-mt-10')}
      aria-labelledby={`gift-${product.id}`}
    >
      <svg viewBox="0 0 80 40" className="absolute -top-5 left-1/2 z-30 h-10 w-20 -translate-x-1/2 drop-shadow transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3" aria-hidden="true">
        <path d="M40 20 C 26 2, 6 6, 12 20 C 16 30, 30 26, 40 20 Z" fill="#ec4899" />
        <path d="M40 20 C 54 2, 74 6, 68 20 C 64 30, 50 26, 40 20 Z" fill="#ec4899" />
        <path d="M40 20 C 30 12, 18 12, 20 20" fill="none" stroke="#fbcfe8" strokeWidth="2" />
        <path d="M40 20 C 50 12, 62 12, 60 20" fill="none" stroke="#fbcfe8" strokeWidth="2" />
        <circle cx="40" cy="20" r="6" fill="#be185d" />
      </svg>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-card shadow-soft transition-[transform,box-shadow] duration-500 group-hover:-translate-y-2 group-hover:shadow-lift">
        {/* the ribbon the bow is tied on */}
        <span className="absolute inset-x-0 top-0 z-40 h-2.5 bg-[linear-gradient(180deg,#f9a8d4,#ec4899)]" aria-hidden="true" />
        <div ref={imgRef} className="relative aspect-[5/4] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#fff1f5,#fbcfdc)] dark:bg-[radial-gradient(circle_at_50%_40%,#43202f,#24111a)]">
          <Kolam draw={false} className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 text-white/60 transition-transform duration-[2400ms] group-hover:rotate-45 dark:text-white/[0.06]" />
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 380px, 90vw"
            className="object-contain p-6 drop-shadow-[0_22px_24px_rgb(92_58_33/0.3)] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-2 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={() => openQuickView(product.id)}
            className="absolute right-3 top-3 z-40 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#2e1d12] shadow-sm backdrop-blur transition-transform hover:scale-105"
            aria-label={`View ${product.name} in 3D`}
          >
            <Box size={14} aria-hidden="true" /> 3D
          </button>
        </div>
        <div className="relative z-30 flex flex-1 flex-col bg-card p-6">
          <div className="flex items-center justify-between gap-2">
            <WoodChip wood={product.wood} />
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#facc15] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-[#5c3a21]">
                <Gift size={11} aria-hidden="true" /> Most gifted
              </span>
            )}
          </div>
          <h3 id={`gift-${product.id}`} className="mt-3 text-2xl font-semibold leading-tight text-fg">
            {product.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{product.description}</p>
          {product.includes && (
            <ul className="mt-4 space-y-1.5">
              {product.includes.slice(0, 5).map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-fg">
                  <Check size={15} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" /> {i}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <div>
              <p className="font-display text-3xl font-semibold text-fg">{formatINR(variant.price)}</p>
              <p className="text-xs text-muted">{variant.label} · + GST</p>
            </div>
            <Button size="md" onClick={() => addToCart(variant.id, 1, imgRef.current)} aria-label={`Add ${product.name} to cart`}>
              <ShoppingCart size={16} aria-hidden="true" /> {added ? 'Added' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function GiftSets() {
  const gifts = products.filter((p) => p.category === 'gifts');
  return (
    <section id="gift-sets" aria-labelledby="gifts-title" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(249_168_212/0.14)_30%,rgb(250_204_21/0.08)_70%,transparent)]" aria-hidden="true" />
      <Kolam className="absolute -right-44 top-16 h-[32rem] w-[32rem] text-pink-strong/[0.09]" spin />
      <div className="container-page relative">
        <SectionHeading
          id="gifts-title"
          eyebrow="Gift sets"
          title="Crated with"
          accent="care"
          subtitle="Our most-loved pieces, packed in a branded wooden crate or tied with jute and a hand-written tag. The gift that stays in the family kitchen for decades."
        />
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {OCCASIONS.map(({ Icon, label }, i) => (
            <motion.li
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2 text-sm font-medium text-fg shadow-soft backdrop-blur"
            >
              <Icon size={15} className="text-accent" aria-hidden="true" /> {label}
            </motion.li>
          ))}
        </ul>

        <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {gifts.map((p, i) => (
            <GiftCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <KolamBorder className="mx-auto mt-16 h-5 w-full max-w-lg text-honey/70" loops={18} />
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-muted">
            Ordering return gifts for a wedding or a hundred crates for Diwali? We pack in bulk, add your name to the tag, and send a GST
            invoice.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant="walnut"
              magnetic
              onClick={() => {
                selectEnquiryType('bulk');
                scrollToTarget('#contact');
              }}
            >
              Bulk & return-gift enquiry <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                selectShopCategory('gifts');
                scrollToTarget('#shop');
              }}
            >
              See all gift sets
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
