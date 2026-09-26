/**
 * Product domain types. Kept free of UI/3D imports so the catalogue can later
 * be served from a CMS or database with the same shape.
 */

export type CategoryId =
  | 'rolling'
  | 'scrapers'
  | 'churners'
  | 'spatulas'
  | 'spoons'
  | 'boards'
  | 'spice'
  | 'mortar'
  | 'gifts';

/** Wood species. Each one has its own procedural grain (components/three/models/wood.ts). */
export type WoodId = 'teak' | 'sheesham' | 'neem' | 'acacia';

/** Procedural 3D model families (see components/three/models/registry.ts). */
export type ModelKind =
  | 'belan'
  | 'chakla'
  | 'chaklaBelan'
  | 'mathani'
  | 'ghotni'
  | 'scraperBench'
  | 'scraperSeat'
  | 'spatula'
  | 'ladle'
  | 'spoon'
  | 'utensilSet'
  | 'board'
  | 'dabba'
  | 'mortar'
  | 'giftSet';

export interface ModelSpec {
  kind: ModelKind;
  /** Look variant understood by the model builder, e.g. "tapered". */
  variant?: string;
  wood: WoodId;
}

export interface ProductVariant {
  id: string;
  /** e.g. "Standard 40 cm", "Set of 3" */
  label: string;
  /** Price in INR (whole rupees, GST exclusive). */
  price: number;
  /** Overrides the product's dimensions for this size. */
  dimensions?: string;
  weight?: string;
}

export type ProductTag = 'handmade' | 'food-safe' | 'bestseller' | 'new' | 'gift' | 'bulk-friendly';

export interface Product {
  id: string;
  name: string;
  /** Regional name shown as an accent, e.g. "Belan", "Mathani". */
  localName?: string;
  category: CategoryId;
  wood: WoodId;
  /** One-liner for cards. */
  description: string;
  /** Longer copy for the quick-view modal. */
  story: string;
  variants: ProductVariant[];
  dimensions: string;
  weight: string;
  finish: string;
  /** Card image. Rendered from `model` by `npm run render:products`. */
  image: string;
  model: ModelSpec;
  tags: ProductTag[];
  /** 0–100, used for "Popularity" sort. */
  popularity: number;
  /** ISO date the product was added, used for "Newest" sort. */
  addedAt: string;
  /** What comes in the box (sets and gift crates). */
  includes?: string[];
}
