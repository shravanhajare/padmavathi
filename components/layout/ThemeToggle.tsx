'use client';

import { useId } from 'react';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/lib/utils';

/**
 * Sun ↔ moon pill. The sun's rays spin away and a shadow slides across the
 * disc to carve a crescent. Driven by the `dark:` variant (the DOM attribute
 * set before paint), so it never mismatches during hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = useThemeStore((s) => s.toggle);
  const resolved = useThemeStore((s) => s.resolved);
  const id = useId().replace(/:/g, '');
  const label = resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'group relative flex h-10 w-[4.6rem] items-center rounded-full border border-line-strong bg-[linear-gradient(180deg,#fff4d9,#f8e2bd)] p-1 shadow-[inset_0_1px_3px_rgb(92_58_33/0.18)] transition-colors hover:border-honey dark:bg-[linear-gradient(180deg,#2a1d14,#1a120c)]',
        className,
      )}
    >
      {/* stars that appear at night */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        {[
          ['left-[18%] top-[28%]', 'h-[3px] w-[3px]', 'delay-100'],
          ['left-[32%] top-[62%]', 'h-[2px] w-[2px]', 'delay-200'],
          ['left-[12%] top-[58%]', 'h-[2px] w-[2px]', 'delay-300'],
        ].map(([pos, size, delay]) => (
          <span
            key={pos}
            className={cn(
              'absolute rounded-full bg-[#fde68a] opacity-0 transition-all duration-500 dark:opacity-90',
              pos,
              size,
              delay,
            )}
          />
        ))}
      </span>
      {/* sliding knob */}
      <span
        aria-hidden="true"
        className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,#fffaf0,#fde7b0)] shadow-[0_2px_10px_rgb(245_158_11/0.45)] transition-[transform,background,box-shadow] duration-[650ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:translate-x-[2.1rem] dark:bg-[linear-gradient(135deg,#3b2a1f,#221710)] dark:shadow-[0_0_16px_rgb(249_168_212/0.45)]"
      >
        <svg viewBox="0 0 24 24" className="h-[1.2rem] w-[1.2rem] overflow-visible">
          <defs>
            <mask id={`${id}-m`}>
              <rect x="-6" y="-6" width="36" height="36" fill="white" />
              <circle
                cx="17"
                cy="7"
                r="6.2"
                fill="black"
                className="translate-x-[12px] -translate-y-[6px] transition-transform duration-[650ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:translate-x-0 dark:translate-y-0"
              />
            </mask>
          </defs>
          <g className="origin-center text-[#e08a0b] transition-[transform,opacity] duration-[650ms] ease-out group-hover:rotate-45 dark:rotate-90 dark:scale-0 dark:opacity-0">
            {Array.from({ length: 8 }, (_, i) => (
              <line
                key={i}
                x1="12"
                y1="1.6"
                x2="12"
                y2="4.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${i * 45} 12 12)`}
              />
            ))}
          </g>
          <circle
            cx="12"
            cy="12"
            r="5.4"
            mask={`url(#${id}-m)`}
            className="fill-[#f59e0b] transition-[r,fill] duration-[650ms] dark:fill-[#f9a8d4] dark:[r:7.4px]"
          />
        </svg>
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute right-2.5 grid h-8 w-6 place-items-center text-muted/70 transition-opacity duration-300 dark:opacity-0">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute left-2.5 grid h-8 w-6 place-items-center text-[#f59e0b]/70 opacity-0 transition-opacity duration-300 dark:opacity-100">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
        </svg>
      </span>
    </button>
  );
}
