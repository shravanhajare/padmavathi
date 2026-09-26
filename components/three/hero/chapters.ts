/**
 * Overlay chapters of the hero story ("From raw wood to your kitchen").
 * Kept free of three.js imports so the HTML layer can use it without pulling
 * the 3D bundle into the main chunk. `in` / `out` are scroll-progress points
 * for the text fades, `anchor` is where the chapter rail scrolls to.
 */
export const CHAPTERS = [
  { id: 'intro', label: 'Raw wood', in: 0, out: 0.07, anchor: 0 },
  { id: 'carve', label: 'Carving', in: 0.115, out: 0.315, anchor: 0.22 },
  { id: 'set', label: 'Chakla-belan', in: 0.37, out: 0.49, anchor: 0.45 },
  { id: 'crate', label: 'The crate', in: 0.535, out: 0.655, anchor: 0.6 },
  { id: 'scraper', label: 'Coconut scraper', in: 0.7, out: 0.815, anchor: 0.77 },
  { id: 'finale', label: 'Your kitchen', in: 0.885, out: 2, anchor: 1 },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export function chapterIndexAt(p: number) {
  let idx = 0;
  CHAPTERS.forEach((c, i) => {
    if (p >= c.in - 0.02) idx = i;
  });
  return idx;
}
