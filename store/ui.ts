'use client';

import { create } from 'zustand';

export interface Flyer {
  id: number;
  src: string;
  from: { x: number; y: number; w: number; h: number };
  /** shown in the toast once the item lands */
  toast: CartToast;
}

export interface CartToast {
  id: number;
  name: string;
  variantLabel: string;
  image: string;
  qty: number;
}

interface UIState {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Incremented whenever an item lands in the cart, drives the icon bounce. */
  cartBump: number;
  bumpCart: () => void;
  flyers: Flyer[];
  launchFlyer: (src: string, fromEl: Element, toast: Omit<CartToast, 'id'>) => void;
  removeFlyer: (id: number) => void;
  toasts: CartToast[];
  pushToast: (toast: Omit<CartToast, 'id'>) => void;
  dismissToast: (id: number) => void;
  quickViewId: string | null;
  openQuickView: (id: string) => void;
  closeQuickView: () => void;
  /** The hero announces when its 3D scene is ready, so we can defer other work. */
  heroReady: boolean;
  setHeroReady: (v: boolean) => void;
  /** The phone-only cart bar is showing, so other floating buttons move up. */
  cartBarVisible: boolean;
  setCartBarVisible: (v: boolean) => void;
}

let seq = 0;

export const useUIStore = create<UIState>()((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  cartBump: 0,
  bumpCart: () => set((s) => ({ cartBump: s.cartBump + 1 })),
  flyers: [],
  launchFlyer: (src, fromEl, toast) => {
    const r = fromEl.getBoundingClientRect();
    const flyer: Flyer = { id: ++seq, src, from: { x: r.left, y: r.top, w: r.width, h: r.height }, toast: { ...toast, id: ++seq } };
    set((s) => ({ flyers: [...s.flyers, flyer] }));
  },
  removeFlyer: (id) => set((s) => ({ flyers: s.flyers.filter((f) => f.id !== id) })),
  toasts: [],
  pushToast: (toast) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id: ++seq }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  quickViewId: null,
  openQuickView: (id) => set({ quickViewId: id }),
  closeQuickView: () => set({ quickViewId: null }),
  heroReady: false,
  setHeroReady: (v) => set({ heroReady: v }),
  cartBarVisible: false,
  setCartBarVisible: (v) => set({ cartBarVisible: v }),
}));
