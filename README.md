# Padmavathi Enterprises: Handcrafted Wooden Kitchenware

A premium, scroll-animated 3D storefront for a maker of hand-turned wooden kitchen utensils: belans, chakla,
coconut scrapers, mathani churners, spatulas, ladles, spoons, chopping boards, masala dabbas and mortar & pestles.

- **Scroll-driven 3D hero, "From raw wood to your kitchen".** A rough log floats in, then goes onto a lathe.
  The bark peels away at the moving tool front while the profile is carved into a belan, and real-time shavings
  fly off and pile up. The fresh wood is oiled to teak, then a chakla rises. A dough ball is pressed and rolled into
  a roti under the belan in a puff of flour. A branded crate opens and utensils spiral out of it. A seat-style
  coconut scraper grates a coconut held on its blade, and grated coconut falls into a growing heap. Finally
  everything settles onto a wooden counter.
- **Procedural models and solid wood.** Every utensil is generated in code with three.js. The wood is a *solid*
  shader: growth rings around a pith, pores and colour streaks computed from 3D position. Turned pieces therefore
  show cathedral figure and end grain, in teak, sheesham, neem and acacia. The same models render the product
  photos and the live 3D quick view.
- **Shop.** Nine category tabs, search, a wood filter and sorting. Cards have 3D tilt with glare, a wooden display
  plinth, variant chips, and an Add button that becomes a quantity stepper.
- **Cart.** Items fly into the cart and land with a burst of wood-shaving curls, followed by a toast. There's a
  slide-in drawer, a full `/cart` page and a mobile cart bar, and the cart persists across reloads.
- **Checkout.** Delivery or pickup, and retail or bulk/wholesale (business name + GSTIN). Validation uses Zod.
  Payment runs through Razorpay with server-side re-pricing and signature verification. There are success
  (shaving confetti) and failure (retry) pages.
- **Rest of the site.** Gift sets, Our Craft (a pinned horizontal-scroll making timeline), Why Wood, a care guide,
  testimonials, contact with an enquiry form and map, and a floating WhatsApp button.
- **Themes and accessibility.** Light is the default, with a dark walnut theme (sun/moon toggle). Reduced motion,
  low-end devices and missing WebGL are all handled.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

It works with no configuration. Without Razorpay keys, checkout runs in **demo mode**: a simulated payment
window lets you try both success and failure.

| Command | What it does |
| --- | --- |
| `npm run build && npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run render:products` | Re-render product photos from the 3D models (see below) |

Requires Node 20+.

---

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO, sitemap and Open Graph |
| `RAZORPAY_KEY_ID` | Server: creating orders |
| `RAZORPAY_KEY_SECRET` | Server only: creating orders and verifying signatures. **Never expose this.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser: opens Razorpay Checkout (same value as `RAZORPAY_KEY_ID`) |
| `PAYMENT_PROVIDER` | Optional: `razorpay`, `mock` or `stripe` |
| `ENABLE_STUDIO` | Optional: `true` allows `/studio` in production |

### Razorpay: test to live

1. Create an account at [dashboard.razorpay.com](https://dashboard.razorpay.com). In **Test mode**, open
   *Account & Settings → API Keys* and generate keys (`rzp_test_…`).
2. Put them in `.env.local` and restart `npm run dev`. The checkout badge now reads "Razorpay test mode". Pay with
   Razorpay's [test cards or UPI IDs](https://razorpay.com/docs/payments/payments/test-card-upi-details/).
3. To go live, complete KYC, switch the dashboard to **Live mode**, generate `rzp_live_…` keys, and set them as
   environment variables on your host. Nothing else changes: the site detects live keys automatically.
4. Recommended: add a `payment.captured` webhook in Razorpay and persist orders. See the TODO in
   `app/api/payment/verify/route.ts`.

How a payment works:
- `POST /api/payment/create-order` re-prices the cart from the catalogue on the server (browser prices are never
  trusted), then creates the Razorpay order with the secret key. Bulk orders carry the business name and GSTIN
  in the order notes.
- The browser opens Razorpay Checkout (UPI, cards, netbanking, wallets).
- `POST /api/payment/verify` checks `HMAC_SHA256(order_id|payment_id)` in constant time before the order counts
  as paid.

The provider layer lives in `lib/payments/`. `providers/stripe.ts` describes how to swap in Stripe.

---

## Make it yours: placeholders to replace

| What | Where |
| --- | --- |
| **Contact name, phone, WhatsApp number, email, address, map location, working hours, socials** | `data/site.ts` (every value marked `PLACEHOLDER`) |
| Prices, sizes, dimensions, weights, product copy | `data/products.ts` |
| Reviews (currently **sample text**; remove the "sample reviews" line after replacing) | `data/testimonials.ts`, `components/sections/Testimonials.tsx` |
| Our Craft story, making steps and stats | `components/sections/OurCraft.tsx`, `data/site.ts → stats` |
| Delivery fee, free-delivery threshold, GST rate (5% by default; confirm with your accountant) | `lib/pricing.ts` |
| Enquiry form delivery (currently only logged on the server) | `app/api/contact/route.ts` |

---

## Adding a product

1. Append an entry to `data/products.ts` with an `id`, `category`, `wood`, `variants` (label + price, optional
   dimensions/weight per size), `dimensions`, `weight`, `finish`, `tags` and a `model`, for example
   `{ kind: 'belan', variant: 'tapered', wood: 'sheesham' }`.
2. Generate its photo: with `npm run dev` running, run `npm run render:products <product-id>`. It uses your
   installed Google Chrome; set `CHROME_PATH=/path/to/chrome` if Chrome is elsewhere, and
   `STUDIO_URL=http://localhost:3001` if the dev server is on another port. To use a real photo instead, set
   `image` to a file in `/public`.
3. Visit **`/studio`** in development to see every product rendered side by side (`?single=1` shows bare pieces).

Model kinds and variants are listed in `data/types.ts → ModelKind`. The builders live in
`components/three/models/` (`utensils.ts`, `scrapers.ts`, `crate.ts`) and product staging in `composition.ts`.
Wood species (colours, ring spacing, figure, finish) are tuned in `components/three/models/wood.ts → SPECIES`.

### Swapping procedural models for real 3D models (GLB)

1. Put the file in `public/models/`, e.g. `public/models/seat-scraper.glb`. Model it with the procedural axis
   convention: long tools along +Y with the working end at the bottom.
2. Map it in `components/three/models/registry.ts`:
   ```ts
   export const GLB_MODELS: Record<string, string> = {
     'belan:classic': '/models/classic-belan.glb', // one variant
     scraperSeat: '/models/seat-scraper.glb',       // every variant of a kind
   };
   ```
3. That's it. GLBs are fitted to the size and placement of the procedural model they replace. The quick view
   loads them with drei's `useGLTF`, `loadPiece()` gives you the fitted piece for custom scenes, and
   `npm run render:products` re-renders their photos.

---

## Project structure

```
app/                         routes (App Router), API routes, SEO files
  api/payment/               create-order, verify
  api/contact/               enquiry form
  cart/  checkout/  order/   full cart, checkout, success & failure pages
  studio/                    dev-only product render studio / model test scene
components/
  hero/Hero.tsx              scroll story overlay (GSAP ScrollTrigger + Lenis), loader, fallbacks
  three/hero/                HeroCanvas, world.ts (actors), choreography.ts (timeline), lathe.ts (carving),
                             dough.ts, effects.ts (shavings, flakes, flour, motes, backdrop)
  three/models/              wood.ts (solid wood shader), utensils, scrapers, crate, composition, registry
  three/ProductViewer.tsx    live 3D quick view (PresentationControls)
  shop/  cart/  checkout/    catalogue, cards, quick view, drawer, fly-to-cart, checkout
  sections/                  gift sets, our craft, why wood, care guide, testimonials, contact
  layout/  ui/               navbar, footer, theme toggle, WhatsApp, buttons, modal, kolam motifs, marquee
data/                        site config, products, categories & woods, testimonials
lib/                         payments, pricing, orders, validation, scroll (Lenis), device tiers, GSAP
store/                       Zustand: cart (persisted), theme (persisted), UI
scripts/render-products.mjs  bakes product photos from the 3D models
```

## Performance and accessibility

- The 3D bundle is lazy-loaded behind a branded loader (a belan rolling out a roti, with progress), shaders are
  precompiled, and the canvas stops rendering when the hero is off-screen.
- Device tiers (`lib/device.ts`) scale particle counts, model detail, pixel ratio (1.25 to 1.75) and
  post-processing (depth of field + bloom on high, bloom on medium, none on low). `PerformanceMonitor` steps
  quality down if the frame rate drops. Shavings, coconut flakes, nails and wood wool are instanced.
- `prefers-reduced-motion`: Lenis is off, the hero becomes a static 3D still of the finished counter, card tilt,
  the pinned timeline and carousel auto-advance are off, and add-to-cart shows a toast instead of the flight.
- No WebGL: the hero falls back to product photos.
- Semantic landmarks, a skip link, focus-trapped dialogs, keyboard-navigable tabs and carousel, visible focus
  rings, alt text, and contrast checked in both themes.
- SEO: metadata, a generated Open Graph image, `sitemap.xml`, `robots.txt`, and schema.org `Store` data with a
  product catalogue.

## Deploying

The site deploys to Vercel (or any Node host) as is. Set the environment variables, then `npm run build`.
`vercel.json` pins the framework to Next.js. Without Razorpay keys, production turns online payment off and
points buyers to WhatsApp (set `PAYMENT_PROVIDER=mock` only to demo the flow).
