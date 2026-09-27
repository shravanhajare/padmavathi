import { site } from '@/data/site';

/** Contact details shown across the site. Stored in the `settings` table, edited in /admin/settings. */
export interface BusinessInfo {
  /** As displayed, e.g. "+91 95900 77817". */
  phone: string;
  email: string;
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
  /** Searched on Google Maps for the embedded map and directions link. */
  mapQuery: string;
  socials: { instagram: string; facebook: string; youtube: string };
}

/** First-run values, before anything is saved in the admin. */
export const DEFAULT_BUSINESS: BusinessInfo = {
  phone: site.contact.phone,
  email: site.contact.email,
  address: {
    line1: site.address.line1,
    line2: site.address.line2,
    city: site.address.city,
    state: site.address.state,
    pincode: site.address.pincode,
  },
  mapQuery: site.mapQuery,
  socials: { ...site.socials },
};

export const fullAddress = (b: BusinessInfo) =>
  [b.address.line1, b.address.line2, b.address.city, b.address.state, b.address.pincode].filter(Boolean).join(', ');

/** "+91 95900 77817" → "+919590077817" for tel: links. */
export const telHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return phone.trim().startsWith('+') ? `+${digits}` : digits.length === 10 ? `+91${digits}` : digits;
};

/** wa.me click-to-chat; `number` is country code + digits. */
export function whatsappLink(number: string, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number.replace(/\D/g, '')}${text}`;
}
