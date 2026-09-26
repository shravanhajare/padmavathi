/**
 * Shop-wide configuration. Everything the storefront says about the business
 * lives here, so going live is a matter of editing this one file.
 *
 * TODO(shop owner): replace every value marked PLACEHOLDER below with the real
 * contact name, phone, WhatsApp number, email, address, map location and hours.
 */

// Vercel exposes the production domain, so canonical links and the sitemap
// are right even before NEXT_PUBLIC_SITE_URL is set for a custom domain.
const vercelHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const site = {
  name: 'Padmavathi Enterprises',
  shortName: 'Padmavathi',
  tagline: 'Handcrafted Wooden Kitchenware',
  description:
    'Padmavathi Enterprises hand-turns rolling pins, chakla, coconut scrapers, mathani churners, spatulas, spoons, spice boxes and mortar & pestles from solid teak, sheesham, neem and acacia. Chemical-free, food safe and shipped across India.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000'),
  locale: 'en_IN',

  contact: {
    /** PLACEHOLDER: contact person shown on the contact card. */
    name: 'Padmavathi Enterprises',
    role: 'Orders, bulk & custom enquiries',
    /** PLACEHOLDER: display format. */
    phone: '+91 90000 00000',
    /** PLACEHOLDER: E.164 without spaces, used for tel: links. */
    phoneHref: '+919000000000',
    /** PLACEHOLDER: digits only incl. country code, used for wa.me click-to-chat links. */
    whatsapp: '919000000000',
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

export const fullAddress = [site.address.line1, site.address.line2, site.address.city, site.address.state, site.address.pincode]
  .filter(Boolean)
  .join(', ');

export function whatsappLink(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${site.contact.whatsapp}${text}`;
}

export const navLinks = [
  { id: 'top', label: 'Home' },
  { id: 'shop', label: 'Shop' },
  { id: 'gift-sets', label: 'Gift Sets' },
  { id: 'craft', label: 'Our Craft' },
  { id: 'contact', label: 'Contact' },
] as const;
