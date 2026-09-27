import type { Product } from './types';

/**
 * The catalogue. Plain data, so it can move to a CMS or database later with
 * the same shape (see data/types.ts).
 *
 * Images are rendered from each product's 3D `model` with
 * `npm run render:products`. To use a photo instead, point `image` at a file in /public.
 */

const OIL = 'Food-grade cold-pressed coconut oil, hand-buffed';
const OIL_WAX = 'Food-grade coconut oil & beeswax, hand-buffed';
const img = (id: string) => `/images/products/${id}.webp`;

export const products: Product[] = [
  // ─────────────────────────── Rolling pins & chakla ───────────────────────────
  {
    id: 'classic-teak-belan',
    name: 'Classic Teak Belan',
    localName: 'Belan · Latni',
    category: 'rolling',
    wood: 'teak',
    description: 'Thick centre barrel with slim turned handles and ring grooves.',
    story:
      'Our everyday rolling pin, turned from one billet of seasoned teak. The weighted barrel does the work for you, and the slim handles let your palms steer thin phulkas and chapatis. Teak is naturally oily, so dough does not stick and the belan does not soak up water.',
    variants: [
      { id: 'std', label: 'Standard · 40 cm', price: 349, dimensions: '40 × 4.5 cm', weight: '280 g' },
      { id: 'lg', label: 'Large · 45 cm', price: 429, dimensions: '45 × 5 cm', weight: '350 g' },
    ],
    dimensions: '40 × 4.5 cm',
    weight: '280 g',
    finish: OIL,
    image: img('classic-teak-belan'),
    model: { kind: 'belan', variant: 'classic', wood: 'teak' },
    tags: ['handmade', 'food-safe', 'bestseller'],
    popularity: 96,
    addedAt: '2025-01-10',
  },
  {
    id: 'grooved-neem-belan',
    name: 'Grooved Neem Belan',
    localName: 'Belan',
    category: 'rolling',
    wood: 'neem',
    description: 'Lightweight neem with decorative turned grooves along the barrel.',
    story:
      'Neem is light, pale and naturally antibacterial. We turn shallow decorative rings along the barrel, which also give flour somewhere to sit so the dough rolls without tearing. A lovely first belan for a young cook.',
    variants: [{ id: 'std', label: '38 cm', price: 299 }],
    dimensions: '38 × 4 cm',
    weight: '210 g',
    finish: OIL,
    image: img('grooved-neem-belan'),
    model: { kind: 'belan', variant: 'grooved', wood: 'neem' },
    tags: ['handmade', 'food-safe'],
    popularity: 64,
    addedAt: '2025-08-19',
  },
  {
    id: 'teak-chakla-belan-set',
    name: 'Teak Chakla-Belan Set',
    localName: 'Chakla · Polpat',
    category: 'rolling',
    wood: 'teak',
    description: 'Round footed rolling board with our classic belan. The kitchen essential.',
    story:
      'A thick, round chakla turned with a gently bevelled edge and three small feet that keep it steady on the counter, paired with our classic teak belan. The top is sanded to 400 grit, so rotis lift off cleanly. Every set shows its own grain: no two are alike.',
    variants: [
      { id: '9in', label: '9 inch board', price: 899, dimensions: 'Board Ø 23 cm · Belan 40 cm', weight: '1.1 kg' },
      { id: '10in', label: '10 inch board', price: 1099, dimensions: 'Board Ø 25.5 cm · Belan 40 cm', weight: '1.35 kg' },
    ],
    dimensions: 'Board Ø 23 cm · Belan 40 cm',
    weight: '1.1 kg',
    finish: OIL,
    image: img('teak-chakla-belan-set'),
    model: { kind: 'chaklaBelan', variant: 'classic', wood: 'teak' },
    tags: ['handmade', 'food-safe', 'bestseller', 'bulk-friendly'],
    popularity: 99,
    addedAt: '2025-01-05',
    includes: ['Footed teak chakla', 'Classic teak belan'],
  },
  {
    id: 'footed-sheesham-chakla',
    name: 'Footed Sheesham Chakla',
    localName: 'Chakla',
    category: 'rolling',
    wood: 'sheesham',
    description: 'Heavy, rich-grained rolling board raised on three turned feet.',
    story:
      'Sheesham is dense enough that this chakla never slides while you roll. The three feet lift it off wet counters so it dries evenly and stays flat for years. Pair it with any of our belans.',
    variants: [{ id: '10in', label: '10 inch', price: 749 }],
    dimensions: 'Ø 25.5 × 3.2 cm',
    weight: '1.05 kg',
    finish: OIL_WAX,
    image: img('footed-sheesham-chakla'),
    model: { kind: 'chakla', variant: 'footed', wood: 'sheesham' },
    tags: ['handmade', 'food-safe'],
    popularity: 71,
    addedAt: '2025-03-14',
  },

  // ─────────────────────────── Coconut scrapers ───────────────────────────
  {
    id: 'bench-coconut-scraper',
    name: 'Bench Coconut Scraper',
    localName: 'Thuruvani · Kavali',
    category: 'scrapers',
    wood: 'teak',
    description: 'Low teak bench with a bolted steel plate and serrated oval scraper.',
    story:
      'The traditional seated scraper: sit on the bench, hold the half coconut against the serrated steel head and grate straight into a plate. Solid teak seat on two leg panels, a stainless steel plate bolted through the tapered front, and teeth hand-filed so they grate fine, fluffy coconut.',
    variants: [
      { id: 'std', label: 'Standard', price: 1299, dimensions: '44 × 13 × 17 cm', weight: '1.9 kg' },
      { id: 'lg', label: 'Large seat', price: 1549, dimensions: '52 × 15 × 18 cm', weight: '2.4 kg' },
    ],
    dimensions: '44 × 13 × 17 cm',
    weight: '1.9 kg',
    finish: `${OIL} · stainless steel blade`,
    image: img('bench-coconut-scraper'),
    model: { kind: 'scraperBench', wood: 'teak' },
    tags: ['handmade', 'food-safe', 'bestseller', 'bulk-friendly'],
    popularity: 94,
    addedAt: '2025-02-01',
  },
  {
    id: 'seat-style-coconut-scraper',
    name: 'Seat-style Coconut Scraper',
    localName: 'Curved-arm scraper',
    category: 'scrapers',
    wood: 'acacia',
    description: 'Raised angled seat, black steel arm and a round serrated blade.',
    story:
      'A long base board you sit on, with a raised angled block that holds a black steel arm at the perfect height. The arm is bent with an offset and fixed with two hex bolts, and ends in a round serrated blade that shreds a whole coconut in minutes.',
    variants: [{ id: 'std', label: 'Standard', price: 1499 }],
    dimensions: '46 × 18 × 22 cm',
    weight: '2.2 kg',
    finish: `${OIL_WAX} · powder-coated steel arm`,
    image: img('seat-style-coconut-scraper'),
    model: { kind: 'scraperSeat', wood: 'acacia' },
    tags: ['handmade', 'food-safe', 'new'],
    popularity: 88,
    addedAt: '2026-05-20',
  },

  // ─────────────────────────── Churners ───────────────────────────
  {
    id: 'neem-mathani',
    name: 'Neem Mathani',
    localName: 'Mathani · Ravai · Kadeegolu',
    category: 'churners',
    wood: 'neem',
    description: 'Fluted churner head with deep slots. Buttermilk in a minute.',
    story:
      'Roll the long handle between your palms and the fluted head, radiating curved blades with deep slots between them, whips curd into frothy buttermilk and churns out fresh white butter. Neem keeps it light and naturally hygienic.',
    variants: [
      { id: 'std', label: '30 cm', price: 249 },
      { id: 'lg', label: '38 cm', price: 299, dimensions: '38 × 6 cm', weight: '140 g' },
    ],
    dimensions: '30 × 5.5 cm',
    weight: '110 g',
    finish: OIL,
    image: img('neem-mathani'),
    model: { kind: 'mathani', variant: 'classic', wood: 'neem' },
    tags: ['handmade', 'food-safe', 'bestseller'],
    popularity: 91,
    addedAt: '2025-01-20',
  },
  {
    id: 'grand-teak-mathani',
    name: 'Grand Teak Mathani',
    localName: 'Mathani',
    category: 'churners',
    wood: 'teak',
    description: 'A long, heavy churner with an eight-blade head for big pots.',
    story:
      'For large handis and festive batches of butter. The eight-blade head is turned and slotted from one piece of teak, and the long handle carries a turned grip ring so the churning cord never slips.',
    variants: [{ id: 'std', label: '45 cm', price: 449 }],
    dimensions: '45 × 7 cm',
    weight: '220 g',
    finish: OIL,
    image: img('grand-teak-mathani'),
    model: { kind: 'mathani', variant: 'grand', wood: 'teak' },
    tags: ['handmade', 'food-safe'],
    popularity: 67,
    addedAt: '2025-07-02',
  },

  // ─────────────────────────── Spatulas & ladles ───────────────────────────
  {
    id: 'neem-flat-spatula',
    name: 'Neem Flat Spatula',
    localName: 'Palta · Khurpi',
    category: 'spatulas',
    wood: 'neem',
    description: 'Thin bevelled edge for dosas, parathas and non-stick pans.',
    story:
      'A thin, bevelled blade that slides under dosas and parathas without tearing them and never scratches non-stick or cast iron. Carved from a single piece of neem, so there are no joints for food to hide in.',
    variants: [{ id: 'std', label: '30 cm', price: 179 }],
    dimensions: '30 × 6.5 cm',
    weight: '60 g',
    finish: OIL,
    image: img('neem-flat-spatula'),
    model: { kind: 'spatula', variant: 'flat', wood: 'neem' },
    tags: ['handmade', 'food-safe', 'bestseller'],
    popularity: 85,
    addedAt: '2025-01-12',
  },
  {
    id: 'sheesham-utensil-set',
    name: 'Sheesham Cooking Set of 4',
    localName: 'Spatula & ladle set',
    category: 'spatulas',
    wood: 'sheesham',
    description: 'Flat spatula, slotted spatula, ladle and spoon in a turned holder.',
    story:
      'Everything you stir, flip and serve with, carved from rich sheesham and stood in a turned holder that lives beside the stove. A favourite housewarming gift.',
    variants: [{ id: 'std', label: 'Set of 4 + holder', price: 899 }],
    dimensions: 'Tools 30 cm · Holder 11 × 9 cm',
    weight: '520 g',
    finish: OIL_WAX,
    image: img('sheesham-utensil-set'),
    model: { kind: 'utensilSet', variant: 'set4', wood: 'sheesham' },
    tags: ['handmade', 'food-safe', 'bestseller', 'gift'],
    popularity: 90,
    addedAt: '2025-03-01',
    includes: ['Flat spatula', 'Slotted spatula', 'Deep ladle', 'Serving spoon', 'Turned utensil holder'],
  },

  // ─────────────────────────── Spoons ───────────────────────────
  {
    id: 'teak-serving-spoons',
    name: 'Teak Serving Spoons',
    localName: 'Set of 3',
    category: 'spoons',
    wood: 'teak',
    description: 'Three generous serving spoons for rice, curries and salads.',
    story:
      'Three serving spoons carved with deep, oval bowls and gently curved handles that rest comfortably on the side of a pot. Teak takes on a deeper glow every time you oil it.',
    variants: [{ id: 'set3', label: 'Set of 3', price: 449 }],
    dimensions: '28 × 5.5 cm each',
    weight: '150 g (set)',
    finish: OIL,
    image: img('teak-serving-spoons'),
    model: { kind: 'spoon', variant: 'serving3', wood: 'teak' },
    tags: ['handmade', 'food-safe', 'bestseller'],
    popularity: 84,
    addedAt: '2025-01-28',
  },
  {
    id: 'neem-tea-spoons',
    name: 'Neem Tea Spoons',
    localName: 'Set of 6',
    category: 'spoons',
    wood: 'neem',
    description: 'Small spoons for chai, sugar, ghee and pickles.',
    story:
      'Six little spoons for the sugar jar, the ghee pot and the pickle bharni. Wood never reacts with salt or acid, so they are the right spoon for achaar.',
    variants: [
      { id: 'set6', label: 'Set of 6', price: 349 },
      { id: 'set12', label: 'Set of 12', price: 649 },
    ],
    dimensions: '15 × 3 cm each',
    weight: '90 g (set of 6)',
    finish: OIL,
    image: img('neem-tea-spoons'),
    model: { kind: 'spoon', variant: 'tea6', wood: 'neem' },
    tags: ['handmade', 'food-safe', 'bulk-friendly'],
    popularity: 66,
    addedAt: '2025-06-18',
  },

  // ─────────────────────────── Chopping boards ───────────────────────────
  {
    id: 'acacia-paddle-board',
    name: 'Acacia Paddle Board',
    localName: 'Chopping board',
    category: 'boards',
    wood: 'acacia',
    description: 'Rounded-corner chopping board with a handle and hanging hole.',
    story:
      'Cut from a single wide plank of acacia, with softened edges, a comfortable handle and a hole to hang it on the wall. Gentle on knife edges and handsome enough to serve on.',
    variants: [
      { id: 'md', label: 'Medium · 38 cm', price: 699, dimensions: '38 × 20 × 1.8 cm', weight: '850 g' },
      { id: 'lg', label: 'Large · 45 cm', price: 899, dimensions: '45 × 24 × 2 cm', weight: '1.2 kg' },
    ],
    dimensions: '38 × 20 × 1.8 cm',
    weight: '850 g',
    finish: OIL_WAX,
    image: img('acacia-paddle-board'),
    model: { kind: 'board', variant: 'paddle', wood: 'acacia' },
    tags: ['handmade', 'food-safe', 'bestseller'],
    popularity: 87,
    addedAt: '2025-02-10',
  },
  {
    id: 'neem-everyday-board',
    name: 'Neem Everyday Board',
    localName: 'Chopping board',
    category: 'boards',
    wood: 'neem',
    description: 'A light, rectangular board for daily vegetables.',
    story:
      'Light enough to lift with one hand and big enough for a day of vegetable prep. Neem is naturally antibacterial, which makes it a clean choice for a board you use every single day.',
    variants: [
      { id: 'md', label: '34 × 24 cm', price: 499 },
      { id: 'lg', label: '40 × 28 cm', price: 649, dimensions: '40 × 28 × 1.8 cm', weight: '900 g' },
    ],
    dimensions: '34 × 24 × 1.6 cm',
    weight: '650 g',
    finish: OIL,
    image: img('neem-everyday-board'),
    model: { kind: 'board', variant: 'rect', wood: 'neem' },
    tags: ['handmade', 'food-safe', 'bulk-friendly'],
    popularity: 58,
    addedAt: '2025-09-09',
  },


  // ─────────────────────────── Mortar & pestle ───────────────────────────

  // ─────────────────────────── Gift sets ───────────────────────────
  {
    id: 'kitchen-essentials-crate',
    name: 'Kitchen Essentials Crate',
    localName: 'Gift set',
    category: 'gifts',
    wood: 'teak',
    description: 'Chakla-belan, spatula, ladle and mathani in a branded crate.',
    story:
      'Our five most-loved pieces packed in a plank-built wooden crate branded with the Padmavathi mark: a teak chakla and belan, a flat spatula, a deep ladle and a mathani. The crate itself becomes a lovely shelf box.',
    variants: [{ id: 'std', label: 'Crate of 5', price: 2199 }],
    dimensions: 'Crate 36 × 28 × 14 cm',
    weight: '2.6 kg',
    finish: OIL,
    image: img('kitchen-essentials-crate'),
    model: { kind: 'giftSet', variant: 'essentials', wood: 'teak' },
    tags: ['handmade', 'food-safe', 'gift', 'bestseller', 'bulk-friendly'],
    popularity: 89,
    addedAt: '2025-03-20',
    includes: ['Teak chakla', 'Classic teak belan', 'Neem flat spatula', 'Neem deep ladle', 'Neem mathani', 'Branded wooden crate'],
  },
  {
    id: 'spoon-spatula-gift-set',
    name: 'Spoon & Spatula Gift Set',
    localName: 'Gift set',
    category: 'gifts',
    wood: 'neem',
    description: 'Serving spoons and spatulas tied in jute, ready to gift.',
    story:
      'Two serving spoons, a flat spatula and a slotted spatula, tied together with jute twine and a Padmavathi tag. A thoughtful, useful return gift for weddings, poojas and festivals, and we pack them in bulk.',
    variants: [
      { id: 'one', label: '1 set', price: 699 },
      { id: 'ten', label: '10 sets · return gifts', price: 6499 },
    ],
    dimensions: '30 cm tools',
    weight: '260 g',
    finish: OIL,
    image: img('spoon-spatula-gift-set'),
    model: { kind: 'giftSet', variant: 'spoons', wood: 'neem' },
    tags: ['handmade', 'food-safe', 'gift', 'bulk-friendly'],
    popularity: 73,
    addedAt: '2026-08-10',
    includes: ['2 serving spoons', 'Flat spatula', 'Slotted spatula', 'Jute tie & gift tag'],
  },
];

const byId = new Map(products.map((p) => [p.id, p]));

export function getProduct(id: string) {
  return byId.get(id);
}

export function lowestPrice(p: Product) {
  return Math.min(...p.variants.map((v) => v.price));
}

export function variantOf(p: Product, variantId: string) {
  return p.variants.find((v) => v.id === variantId) ?? p.variants[0];
}
