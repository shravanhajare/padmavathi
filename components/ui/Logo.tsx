import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The Padmavathi mark: a lotus (padma) whose three petals are wooden spoons.
 * Pure SVG so it stays crisp at any size and needs no image request.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9b877" />
          <stop offset="0.55" stopColor="#c68642" />
          <stop offset="1" stopColor="#8f4a24" />
        </linearGradient>
        <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a0522d" />
          <stop offset="1" stopColor="#5c3a21" />
        </linearGradient>
        <radialGradient id={`${id}-p`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fcd1e6" />
          <stop offset="1" stopColor="#ec4899" />
        </radialGradient>
      </defs>
      {/* side petals: spoons fanned out from the base */}
      {[-40, 40].map((a) => (
        <g key={a} transform={`rotate(${a} 24 38)`}>
          <rect x="22.6" y="17" width="2.8" height="21" rx="1.4" fill={`url(#${id}-d)`} />
          <ellipse cx="24" cy="13.2" rx="5.2" ry="7.6" fill={`url(#${id}-w)`} />
          <ellipse cx="24" cy="12.4" rx="3" ry="5" fill="#fff3dc" opacity="0.28" />
        </g>
      ))}
      {/* centre petal */}
      <rect x="22.4" y="15" width="3.2" height="24" rx="1.6" fill={`url(#${id}-d)`} />
      <ellipse cx="24" cy="10.6" rx="6" ry="8.6" fill={`url(#${id}-w)`} />
      <ellipse cx="24" cy="9.6" rx="3.4" ry="5.6" fill="#fff3dc" opacity="0.3" />
      {/* lotus base */}
      <path d="M10 38.5c4.6 4.2 9.3 5.6 14 5.6s9.4-1.4 14-5.6" fill="none" stroke="#ec4899" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="38.2" r="3.4" fill={`url(#${id}-p)`} />
    </svg>
  );
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={cn('shrink-0 transition-all duration-500', compact ? 'h-9 w-9' : 'h-10 w-10 sm:h-11 sm:w-11')} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.15rem] font-bold tracking-[-0.01em] text-fg sm:text-[1.3rem]">
          Padmavathi <span className="hidden text-wood sm:inline">Enterprises</span>
        </span>
        {/* phones: a short second line instead of the long tagline */}
        <span className="mt-1 text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-wood sm:hidden">Enterprises</span>
        <span
          className={cn(
            'mt-1 hidden overflow-hidden whitespace-nowrap text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted transition-all duration-500 sm:block',
            compact ? 'max-h-0 opacity-0' : 'max-h-4 opacity-100',
          )}
        >
          – Handcrafted Wooden Kitchenware –
        </span>
      </span>
    </span>
  );
}
