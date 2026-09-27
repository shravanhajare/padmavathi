import type { CategoryId, WoodId } from './types';

export interface Category {
  id: CategoryId | 'all';
  label: string;
  short: string;
  /** Warm tint used behind product renders in this category. */
  tint: { light: [string, string]; dark: [string, string] };
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', short: 'All', tint: { light: ['#fff7e6', '#f6dcc0'], dark: ['#3a2618', '#1f140d'] } },
  {
    id: 'rolling',
    label: 'Rolling Pins & Chakla',
    short: 'Rolling',
    tint: { light: ['#fff6e2', '#f8d9b4'], dark: ['#3d2818', '#20150e'] },
  },
  {
    id: 'scrapers',
    label: 'Coconut Scrapers',
    short: 'Scrapers',
    tint: { light: ['#fffaf0', '#efe0c6'], dark: ['#35291d', '#1c1510'] },
  },
  {
    id: 'churners',
    label: 'Churners (Mathani)',
    short: 'Churners',
    tint: { light: ['#fff8e8', '#f5e0bd'], dark: ['#3a2a1a', '#1f160f'] },
  },
  {
    id: 'spatulas',
    label: 'Spatulas & Ladles',
    short: 'Spatulas',
    tint: { light: ['#fff6e8', '#f3d8b6'], dark: ['#3f2a1c', '#21160f'] },
  },
  {
    id: 'spoons',
    label: 'Spoons',
    short: 'Spoons',
    tint: { light: ['#f8f9ee', '#dde7cb'], dark: ['#26311f', '#141a11'] },
  },
  {
    id: 'boards',
    label: 'Chopping Boards',
    short: 'Boards',
    tint: { light: ['#fbf6ea', '#e6d9bd'], dark: ['#322a1d', '#1a1610'] },
  },
  {
    id: 'mortar',
    label: 'Mortar & Pestle',
    short: 'Mortar',
    tint: { light: ['#fbf5ea', '#e8d6bd'], dark: ['#35281c', '#1c1510'] },
  },
  {
    id: 'gifts',
    label: 'Gift Sets',
    short: 'Gifts',
    tint: { light: ['#f3f8ec', '#dde9cf'], dark: ['#1f3326', '#121c16'] },
  },
];

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<Category['id'], Category>;

export interface WoodInfo {
  id: WoodId;
  label: string;
  /** Short line used in filters and cards. */
  note: string;
  /** Swatch colours (early / late wood) for UI chips. */
  swatch: [string, string];
}

export const WOODS: WoodInfo[] = [
  { id: 'teak', label: 'Teak', note: 'Golden, naturally oily, water resistant', swatch: ['#c98f4f', '#8a5528'] },
  { id: 'sheesham', label: 'Sheesham', note: 'Indian rosewood, dense with a rich figure', swatch: ['#a4603a', '#4f2616'] },
  { id: 'neem', label: 'Neem', note: 'Pale, light and naturally antibacterial', swatch: ['#dcc093', '#b08a5c'] },
  { id: 'acacia', label: 'Acacia', note: 'Hard, bold contrasting bands', swatch: ['#c8914f', '#6b3d1c'] },
];

export const woodById = Object.fromEntries(WOODS.map((w) => [w.id, w])) as Record<WoodId, WoodInfo>;
