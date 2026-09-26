'use client';

import Link from 'next/link';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'honey' | 'walnut' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'group/btn relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-[0.01em] transition-[box-shadow,background-color,background-position,border-color,color,filter] duration-300 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[0.82rem]',
  md: 'h-11 px-6 text-[0.92rem]',
  lg: 'h-14 px-8 text-base',
};

const variants: Record<ButtonVariant, string> = {
  /** oiled teak, turned and bevelled: the main call to action */
  primary: 'btn-wood btn-wood-teak',
  /** pale honey wood with dark lettering */
  honey: 'btn-wood btn-wood-honey',
  /** dark walnut; honey wood in the dark theme so it still stands out */
  walnut: 'btn-wood btn-wood-walnut dark:btn-wood-honey',
  outline:
    'border border-line-strong bg-surface/70 text-fg backdrop-blur hover:border-honey hover:bg-surface hover:shadow-[0_10px_30px_-14px_rgb(var(--shadow-rgb)/0.35)]',
  ghost: 'text-fg hover:bg-surface-2',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, sizes[size], variants[variant], className);
}

/** Pulls its content towards the cursor. Mouse only; disabled for reduced motion. */
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 240, damping: 18, mass: 0.5 });

  const onMove = useCallback(
    (e: PointerEvent<HTMLSpanElement>) => {
      if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      x.set((e.clientX - (r.left + r.width / 2)) * strength);
      y.set((e.clientY - (r.top + r.height / 2)) * strength);
    },
    [reduce, strength, x, y],
  );
  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.span
      ref={ref}
      className={cn('inline-flex', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.span>
  );
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

function useRipples() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);
  const spawn = useCallback((e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const ripple = { id: ++idRef.current, x: e.clientX - r.left - size / 2, y: e.clientY - r.top - size / 2, size };
    setRipples((rs) => [...rs, ripple]);
    window.setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== ripple.id)), 650);
  }, []);
  const layer = (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden rounded-[inherit]">
      {/* glossy sheen that sweeps across on hover */}
      <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 opacity-0 blur-md transition-all duration-700 ease-out group-hover/btn:left-[120%] group-hover/btn:opacity-100" />
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/35"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </span>
  );
  return { spawn, layer };
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', magnetic = false, className, children, onPointerDown, type = 'button', ...props },
  ref,
) {
  const { spawn, layer } = useRipples();
  const btn = (
    <button
      ref={ref}
      type={type}
      className={buttonClasses(variant, size, className)}
      onPointerDown={(e) => {
        spawn(e);
        onPointerDown?.(e);
      }}
      {...props}
    >
      {layer}
      <span className="relative z-10 inline-flex min-w-0 max-w-full items-center gap-2">{children}</span>
    </button>
  );
  return magnetic ? <Magnetic>{btn}</Magnetic> : btn;
});

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
};

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className,
  children,
  onPointerDown,
  ...props
}: ButtonLinkProps) {
  const { spawn, layer } = useRipples();
  const isExternal = /^(https?:|mailto:|tel:)/.test(href);
  const content = (
    <>
      {layer}
      <span className="relative z-10 inline-flex min-w-0 max-w-full items-center gap-2">{children}</span>
    </>
  );
  const shared = {
    className: buttonClasses(variant, size, className),
    onPointerDown: (e: PointerEvent<HTMLAnchorElement>) => {
      spawn(e);
      onPointerDown?.(e);
    },
    ...props,
  };
  const el = isExternal ? (
    <a href={href} {...shared}>
      {content}
    </a>
  ) : (
    <Link href={href} {...shared}>
      {content}
    </Link>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}
