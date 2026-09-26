import * as THREE from 'three';
import { mulberry32 } from './noise';

/** Canvas-drawn textures: the branded crate stamp, gift tag and soft sprites. No image downloads. */

type Ctx = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Reads the next/font generated family name so canvas text matches the site. */
export function displayFontFamily(): string {
  if (typeof document === 'undefined') return 'Georgia, serif';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-playfair').trim();
  return [v, '"Playfair Display"', 'Georgia', 'serif'].filter(Boolean).join(', ');
}

export function sansFontFamily(): string {
  if (typeof document === 'undefined') return 'system-ui, sans-serif';
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-poppins').trim();
  return [v, 'Poppins', 'system-ui', 'sans-serif'].filter(Boolean).join(', ');
}

function toTexture(canvas: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** The lotus-of-spoons mark (same geometry as components/ui/Logo.tsx), in one ink. */
export function drawLotusMark(ctx: Ctx, cx: number, cy: number, size: number, ink: string, accent = ink) {
  const k = size / 48;
  ctx.save();
  ctx.translate(cx - 24 * k, cy - 24 * k);
  ctx.scale(k, k);
  const spoon = (angle: number, big: boolean) => {
    ctx.save();
    ctx.translate(24, 38);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-24, -38);
    ctx.fillStyle = ink;
    const hw = big ? 1.6 : 1.4;
    ctx.beginPath();
    ctx.roundRect(24 - hw, big ? 15 : 17, hw * 2, big ? 24 : 21, hw);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, big ? 10.6 : 13.2, big ? 6 : 5.2, big ? 8.6 : 7.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  spoon(-40, false);
  spoon(40, false);
  spoon(0, true);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, 38.5);
  ctx.bezierCurveTo(14.6, 42.7, 19.3, 44.1, 24, 44.1);
  ctx.bezierCurveTo(28.7, 44.1, 33.4, 42.7, 38, 38.5);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(24, 38.2, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Speckles the alpha so ink looks burned or stamped into the grain rather than printed. */
function distress(ctx: Ctx, w: number, h: number, amount: number, seed: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const rng = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const n = rng();
    img.data[i + 3] = Math.max(0, img.data[i + 3] * (1 - amount * n * n));
  }
  ctx.putImageData(img, 0, 0);
}

let brandCache: THREE.CanvasTexture | null = null;

/** Burned-in "Padmavathi Enterprises" stamp with the lotus mark, transparent background. */
export function createBrandStamp() {
  if (brandCache) return brandCache;
  const w = 1024;
  const h = 640;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  const ink = 'rgb(58, 28, 12)';
  ctx.shadowColor = 'rgba(58, 28, 12, 0.55)';
  ctx.shadowBlur = 10;
  // oval frame
  ctx.strokeStyle = ink;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2 - 24, h / 2 - 24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2 - 44, h / 2 - 44, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawLotusMark(ctx, w / 2, 190, 190, ink);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 118px ${displayFontFamily()}`;
  ctx.fillText('Padmavathi', w / 2, 360);
  ctx.font = `600 40px ${sansFontFamily()}`;
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '14px';
  ctx.fillText('ENTERPRISES', w / 2 + 7, 440);
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '6px';
  ctx.font = `500 26px ${sansFontFamily()}`;
  ctx.fillText('HANDCRAFTED WOODEN KITCHENWARE', w / 2 + 3, 500);
  distress(ctx, w, h, 0.55, 5);
  brandCache = toTexture(c);
  return brandCache;
}

let tagCache: THREE.CanvasTexture | null = null;

/** A small kraft gift tag with the mark. */
export function createTagTexture() {
  if (tagCache) return tagCache;
  const w = 256;
  const h = 384;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d9b98b';
  ctx.fillRect(0, 0, w, h);
  const rng = mulberry32(3);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(${rng() > 0.5 ? '120,80,40' : '255,240,210'},${0.06 + rng() * 0.08})`;
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
  }
  ctx.strokeStyle = 'rgba(92,58,33,0.5)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, w - 32, h - 32);
  ctx.setLineDash([]);
  drawLotusMark(ctx, w / 2, 150, 120, '#5c3a21', '#ec4899');
  ctx.fillStyle = '#5c3a21';
  ctx.textAlign = 'center';
  ctx.font = `700 34px ${displayFontFamily()}`;
  ctx.fillText('Padmavathi', w / 2, 262);
  ctx.font = `500 16px ${sansFontFamily()}`;
  ctx.fillText('with love', w / 2, 300);
  tagCache = toTexture(c);
  return tagCache;
}

export function createRadialTexture(stops: Array<[number, string]>, size = 256) {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

let puffCache: THREE.CanvasTexture | null = null;

/** Soft cloudy sprite for flour puffs and sawdust. */
export function createPuffTexture() {
  if (puffCache) return puffCache;
  const size = 128;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(11);
  for (let i = 0; i < 14; i++) {
    const x = size / 2 + (rng() - 0.5) * size * 0.35;
    const y = size / 2 + (rng() - 0.5) * size * 0.35;
    const r = size * (0.15 + rng() * 0.2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  puffCache = toTexture(c, false);
  return puffCache;
}
