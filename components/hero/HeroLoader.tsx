'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/*
 * A belan rolling out a roti on a chakla, seen from the front and a little above.
 *
 * A rolling pin rolls across its own axis, never along it: the belan lies left–right,
 * so it travels toward and away from the viewer (up/down on screen, a touch larger when
 * near). It rolls without slipping, so the grain on its front face runs the same way the
 * pin travels, faster by 1 / sin(view angle): the pin's screen travel is foreshortened,
 * the surface speed facing us is not.
 *
 * Everything moves with CSS transforms on HTML layers so the compositor keeps it running
 * while the main thread is busy building the 3D scene (the whole reason a loader shows).
 * Keyframes and timing live in globals.css (.pe-ld-*); the numbers here must match them.
 */

const W = 224; // px, the drawing is 200 × 124 units
const K = W / 200;
const BOARD_Y = 78; // centre of the chakla top, in units
const BOARD_RY = 22; // the chakla seen from ~15° above
const R = 8; // belan radius, units
const HALF_LEN = 62; // half the barrel, units

function doughScale(p: number) {
  // the roti starts wider than a stroke (±9 units, see .pe-ld-belan) and spreads as the scene loads
  return 0.62 + p * 0.38;
}

export function HeroLoader({ progress, visible, label }: { progress: number; visible: boolean; label: string }) {
  const pct = Math.round(progress * 100);
  const u = (n: number) => `${(n * K).toFixed(2)}px`;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-[5] flex items-center justify-center transition-opacity duration-700 lg:justify-end lg:pr-[22vw]',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-5 max-lg:translate-y-[12vh]">
        <div className="relative" style={{ width: W, height: u(124) }} aria-hidden="true">
          {/* chakla */}
          <svg viewBox="0 0 200 124" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="ld-board" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e2a867" />
                <stop offset="1" stopColor="#c68642" />
              </linearGradient>
            </defs>
            <ellipse cx="100" cy={BOARD_Y + 30} rx="90" ry="9" fill="rgb(92 58 33 / 0.14)" />
            <ellipse cx="100" cy={BOARD_Y + 7} rx="84" ry={BOARD_RY} fill="#8f4a24" />
            <ellipse cx="100" cy={BOARD_Y} rx="84" ry={BOARD_RY} fill="url(#ld-board)" />
            <ellipse cx="100" cy={BOARD_Y} rx="70" ry={BOARD_RY * 0.83} fill="none" stroke="#b4733a" strokeOpacity="0.35" strokeWidth="0.6" />
            <ellipse cx="100" cy={BOARD_Y} rx="48" ry={BOARD_RY * 0.57} fill="none" stroke="#b4733a" strokeOpacity="0.25" strokeWidth="0.6" />
          </svg>

          {/* roti: grows with load progress, and is pushed out along the stroke */}
          <div
            className="absolute transition-transform duration-700 ease-out"
            style={{ left: u(100 - 62), top: u(BOARD_Y - 17), width: u(124), height: u(34), transform: `scale(${doughScale(progress)})` }}
          >
            <div className="pe-ld-dough h-full w-full">
              <svg viewBox="0 0 124 34" className="h-full w-full">
                <defs>
                  <radialGradient id="ld-roti" cx="0.45" cy="0.38" r="0.7">
                    <stop offset="0" stopColor="#fdf1da" />
                    <stop offset="1" stopColor="#ead3a6" />
                  </radialGradient>
                </defs>
                <ellipse cx="62" cy="17" rx="61" ry="16" fill="url(#ld-roti)" stroke="#d9b986" strokeWidth="0.6" />
              </svg>
            </div>
          </div>

          {/* belan: rests on the roti, contact line at BOARD_Y */}
          <div className="pe-ld-belan absolute inset-x-0" style={{ top: u(BOARD_Y - 2 * R), height: u(2 * R + 3) }}>
            {/* contact shadow on the dough */}
            <span
              className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-[rgb(80_45_20/0.28)] blur-[1px]"
              style={{ top: u(2 * R - 2), width: u(HALF_LEN * 1.9), height: u(4) }}
            />
            {/* handles */}
            {[-1, 1].map((side) => (
              <span
                key={side}
                className="absolute rounded-full bg-[linear-gradient(180deg,#c07a42,#9a5528_55%,#7a3f1c)]"
                style={{ top: u(R - 4), height: u(8), width: u(24), left: side < 0 ? u(100 - HALF_LEN - 22) : u(100 + HALF_LEN - 2) }}
              />
            ))}
            {/* barrel */}
            <span
              className="absolute overflow-hidden rounded-full bg-[linear-gradient(180deg,#f0c58c,#dca062_35%,#a8622f_80%,#7e4320)]"
              style={{ left: u(100 - HALF_LEN), width: u(HALF_LEN * 2), top: 0, height: u(2 * R) }}
            >
              {/* grain, turning with the roll */}
              <span className="pe-ld-grain absolute inset-x-0" style={{ top: '-42px', height: 'calc(100% + 84px)' } as CSSProperties} />
              {/* cylinder shading over the grain: the lines fade as they turn away from us */}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(240_197_140/0.55),transparent_35%,transparent_60%,rgb(110_55_22/0.55))]" />
              {/* specular band, fixed to the light, so it does not turn with the wood */}
              <span className="absolute inset-x-[4%] rounded-full bg-[#fff6e4]/55" style={{ top: u(2), height: u(2.4) }} />
            </span>
          </div>
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-line">
          <div
            className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#3f7a5a,#c68642,#facc15)] transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${Math.max(0.06, progress)})` }}
          />
        </div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-muted">{label} · {pct}%</p>
      </div>
    </div>
  );
}
