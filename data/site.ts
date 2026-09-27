/**
 * Shop-wide configuration. The contact block (phone, email, address, map, socials)
 * only seeds the database: the live values are edited in /admin/settings and read
 * from the `settings` table, see lib/business.ts.
 */

/**
 * Canonical origin for SEO links. NEXT_PUBLIC_SITE_URL wins; otherwise Vercel's
 * production domain, so canonical links and the sitemap are right even before a
 * custom domain is set. Blank or malformed values (an empty variable in the
 * Vercel dashboard, a domain typed without https://) never break the build.
 */
function originFrom(value: string | undefined) {
  const v = value?.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return URL.canParse(withScheme) ? new URL(withScheme).origin : null;
}

const siteUrl =
  originFrom(process.env.NEXT_PUBLIC_SITE_URL) ??
  originFrom(process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) ??
  originFrom(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  'http://localhost:3000';

export const site = {
  name: 'Padmavathi Enterprises',
  shortName: 'Padmavathi',
  tagline: 'Handcrafted Wooden Kitchenware',
  description:
    'Padmavathi Enterprises hand-turns rolling pins, chakla, coconut scrapers, mathani churners, spatulas, spoons, chopping boards and mortar & pestles from solid teak, sheesham, neem and acacia. Chemical-free, food safe and shipped across India.',
  url: siteUrl,
  locale: 'en_IN',

  contact: {
    /** PLACEHOLDER: contact person shown on the contact card. */
    name: 'Padmavathi Enterprises',
    role: 'Orders, bulk & custom enquiries',
    phone: '+91 95900 77817',
    /** E.164 without spaces, used for tel: links. */
    phoneHref: '+919590077817',
    /** Digits only incl. country code, used for wa.me click-to-chat links. Orders go here too. */
    whatsapp: '919590077817',
    /** PLACEHOLDER */
    email: 'hello@padmavathi.example',
  },

  /** PLACEHOLDER address. */
  address: {
    line1: 'Workshop address, street name',
    line2: 'Near landmark',
    city: 'Your city',
    state: 'Your state',
    pincode: '000000',
    country: 'IN',
  },

  /** PLACEHOLDER: text used for the embedded Google Map (no API key needed). */
  mapQuery: 'India',

  /** PLACEHOLDER working hours. */
  hours: [
    { days: 'Monday – Saturday', time: '9:30 AM – 7:30 PM' },
    { days: 'Sunday', time: 'Closed (WhatsApp open)' },
  ],
  /** schema.org openingHours format for structured data. */
  openingHoursSpec: ['Mo-Sa 09:30-19:30'],

  socials: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    youtube: 'https://www.youtube.com/',
  },

  /** Highlights shown in the Our Craft section. Edit to match your story. */
  stats: [
    { value: 'Solid', label: 'wood, never MDF or ply' },
    { value: 'Zero', label: 'chemicals, lacquers or glue in food parts' },
    { value: 'Pan-India', label: 'shipping in 3 to 6 days' },
  ],
} as const;

/** Section anchors on the home page; labels come from i18n (`t.common.nav[key]`). */
export const navLinks = [
  { id: 'shop', key: 'shop' },
  { id: 'gift-sets', key: 'gifts' },
  { id: 'craft', key: 'craft' },
  { id: 'contact', key: 'contact' },
] as const;
