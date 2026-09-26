'use client';

import Image from 'next/image';
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { ShoppingCart, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useUIStore, type CartToast, type Flyer } from '@/store/ui';

interface Path {
  size: number;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Point on a quadratic Bézier curve. */
function bez(p: Path, t: number) {
  const u = 1 - t;
  return {
    x: u * u * p.p0.x + 2 * u * t * p.p1.x + t * t * p.p2.x,
    y: u * u * p.p0.y + 2 * u * t * p.p1.y + t * t * p.p2.y,
  };
}

function cartCenter() {
  const r = document.getElementById('cart-button')?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth - 40, y: 32 };
}

/** A glowing honey spark that trails the item along the same curve, a little behind. */
function Trail({ progress, path, lag, size }: { progress: MotionValue<number>; path: Path; lag: number; size: number }) {
  const x = useTransform(progress, (t) => bez(path, clamp01(t - lag)).x - size / 2);
  const y = useTransform(progress, (t) => bez(path, clamp01(t - lag)).y - size / 2);
  const opacity = useTransform(progress, [lag, lag + 0.08, 0.85, 1], [0, 0.9, 0.6, 0]);
  const scale = useTransform(progress, [lag, 1], [1, 0.3]);
  return (
    <motion.span
      className="fixed left-0 top-0 rounded-full bg-[radial-gradient(circle,#fff6d8_0%,#e9b877_45%,rgb(233_184_119/0)_72%)]"
      style={{ x, y, opacity, scale, width: size, height: size }}
      aria-hidden="true"
    />
  );
}

function FlyingItem({ flyer, onLand }: { flyer: Flyer; onLand: () => void }) {
  const progress = useMotionValue(0);
  const path = useMemo<Path>(() => {
    const size = Math.min(170, Math.max(100, Math.min(flyer.from.w, flyer.from.h) * 0.8));
    const p0 = { x: flyer.from.x + flyer.from.w / 2, y: flyer.from.y + flyer.from.h / 2 };
    const p2 = cartCenter();
    // lift up and slightly back before swooping into the cart; keep the peak on screen
    const peak = Math.min(p0.y, p2.y) - Math.max(140, Math.abs(p2.y - p0.y) * 0.35);
    const p1 = { x: p0.x + (p2.x - p0.x) * 0.2, y: Math.max(size * 0.6, peak) };
    return { size, p0, p1, p2 };
  }, [flyer]);

  const x = useTransform(progress, (t) => bez(path, t).x - path.size / 2);
  const y = useTransform(progress, (t) => bez(path, t).y - path.size / 2);
  const scale = useTransform(progress, [0, 0.12, 0.55, 1], [0.7, 1.08, 0.8, 0.14]);
  const rotate = useTransform(progress, [0, 1], [0, 300]);
  const opacity = useTransform(progress, [0, 0.06, 0.94, 1], [0, 1, 1, 0.4]);
  const glow = useTransform(progress, [0, 0.5, 1], [0.2, 0.7, 0.9]);

  useEffect(() => {
    const controls = animate(progress, 1, { duration: 1.05, ease: [0.62, 0.02, 0.24, 1], onComplete: onLand });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {[0.05, 0.1, 0.15, 0.2, 0.26].map((lag, i) => (
        <Trail key={lag} progress={progress} path={path} lag={lag} size={18 - i * 2} />
      ))}
      <motion.div className="fixed left-0 top-0 will-change-transform" style={{ x, y, scale, rotate, opacity, width: path.size, height: path.size }}>
        <motion.span className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(233_184_119/0.9),transparent_70%)] blur-xl" style={{ opacity: glow }} />
        <Image src={flyer.src} alt="" fill sizes="170px" className="object-contain drop-shadow-[0_16px_20px_rgb(92_58_33/0.35)]" />
      </motion.div>
    </>
  );
}

const CONFETTI = ['#ec4899', '#facc15', '#f9a8d4', '#c68642', '#e9b877'];

/** Ring + a burst of wood-shaving curls and confetti + "+1" from the cart when an item lands. */
function LandingBurst({ at, onDone }: { at: { x: number; y: number }; onDone: () => void }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
        const d = 34 + Math.random() * 34;
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, rot: Math.random() * 360, color: CONFETTI[i % CONFETTI.length], curl: i % 3 === 0 };
      }),
    [],
  );
  useEffect(() => {
    const t = window.setTimeout(onDone, 950);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed left-0 top-0" style={{ transform: `translate(${at.x}px, ${at.y}px)` }} aria-hidden="true">
      <motion.span
        className="absolute -left-6 -top-6 h-12 w-12 rounded-full border-2 border-[#ec4899]"
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 2.3, opacity: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      />
      {bits.map((b, i) =>
        b.curl ? (
          <motion.svg
            key={i}
            viewBox="0 0 20 20"
            className="absolute -left-2 -top-2 h-4 w-4"
            initial={{ x: 0, y: 0, opacity: 1, rotate: b.rot, scale: 0.6 }}
            animate={{ x: b.dx, y: b.dy + 16, opacity: 0, rotate: b.rot + 220, scale: 1.1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <path d="M3 12 C 3 5, 13 3, 16 8 C 19 14, 10 18, 8 12 C 7 9, 11 8, 12 10" fill="none" stroke="#d9a060" strokeWidth="2.6" strokeLinecap="round" />
          </motion.svg>
        ) : (
          <motion.span
            key={i}
            className="absolute -left-1 -top-2 block h-4 w-2 rounded-full"
            style={{ background: b.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: b.rot, scale: 0.6 }}
            animate={{ x: b.dx, y: b.dy + 14, opacity: 0, rotate: b.rot + 180, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        ),
      )}
      <motion.span
        className="absolute -left-4 top-5 font-display text-xl font-bold text-[#be185d] dark:text-[#f9a8d4]"
        initial={{ y: 0, opacity: 0, scale: 0.6 }}
        animate={{ y: 18, opacity: [0, 1, 0], scale: 1.1 }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
      >
        +1
      </motion.span>
    </div>
  );
}

function ToastCard({ toast }: { toast: CartToast }) {
  const dismiss = useUIStore((s) => s.dismissToast);
  const openCart = useUIStore((s) => s.openCart);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => dismiss(toast.id), 3400);
    return () => window.clearTimeout(timer);
  }, [paused, dismiss, toast.id]);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="pointer-events-auto relative overflow-hidden rounded-2xl border border-line bg-surface/95 p-3 pr-10 shadow-lift backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(circle,#fff6e2,#f6d6b8)] dark:bg-[radial-gradient(circle,#3a2618,#1f140d)]">
          <Image src={toast.image} alt="" fill sizes="56px" className="object-contain p-1" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-wood">Added to your cart</p>
          <p className="truncate font-display text-[1.02rem] font-semibold text-fg">{toast.name}</p>
          <p className="text-xs text-muted">
            {toast.qty} × {toast.variantLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismiss(toast.id);
            openCart();
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#fcc2e0,#f78fc6_55%,#ee6aad)] px-3 py-2 text-xs font-semibold text-[#3b1a0e] shadow-[inset_0_0_0_1.5px_#d9a44e]"
        >
          <ShoppingCart size={13} aria-hidden="true" /> View cart
        </button>
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
      >
        <X size={13} />
      </button>
      <motion.span
        className="absolute bottom-0 left-0 h-[3px] bg-[linear-gradient(90deg,#ec4899,#c68642,#facc15)]"
        initial={{ width: '100%' }}
        animate={{ width: paused ? '100%' : '0%' }}
        transition={{ duration: paused ? 0.25 : 3.4, ease: paused ? 'easeOut' : 'linear' }}
      />
    </motion.li>
  );
}

/** Flying items, landing bursts and the "added to your cart" toasts. */
export function FlyToCartLayer() {
  const flyers = useUIStore((s) => s.flyers);
  const toasts = useUIStore((s) => s.toasts);
  const removeFlyer = useUIStore((s) => s.removeFlyer);
  const bumpCart = useUIStore((s) => s.bumpCart);
  const pushToast = useUIStore((s) => s.pushToast);
  const [bursts, setBursts] = useState<Array<{ id: number; at: { x: number; y: number } }>>([]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[95]" aria-hidden="true">
        {flyers.map((f) => (
          <FlyingItem
            key={f.id}
            flyer={f}
            onLand={() => {
              removeFlyer(f.id);
              bumpCart();
              pushToast(f.toast);
              setBursts((b) => [...b, { id: f.id, at: cartCenter() }]);
            }}
          />
        ))}
        {bursts.map((b) => (
          <LandingBurst key={b.id} at={b.at} onDone={() => setBursts((bs) => bs.filter((x) => x.id !== b.id))} />
        ))}
      </div>
      <ol aria-live="polite" className="pointer-events-none fixed left-3 right-3 top-[4.6rem] z-[94] flex flex-col gap-2 sm:left-auto sm:right-5 sm:w-[23rem]">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </ol>
    </>
  );
}
