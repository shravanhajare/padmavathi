import 'server-only';
import { DEFAULT_BUSINESS, type BusinessInfo } from '@/lib/business';
import { hasDatabase, sql } from './db';

export interface ShopSettings {
  /** Every line in an order must be at least this many pieces or sets. */
  minOrderQty: number;
  /** Receives every order, and is the public WhatsApp chat number. Country code + number, digits only. */
  whatsappOrderNumber: string;
  business: BusinessInfo;
}

export const DEFAULT_SETTINGS: ShopSettings = {
  minOrderQty: 20,
  whatsappOrderNumber: (process.env.WHATSAPP_ORDER_NUMBER ?? '919590077817').replace(/\D/g, ''),
  business: DEFAULT_BUSINESS,
};

const KEYS: Record<keyof ShopSettings, string> = { minOrderQty: 'min_order_qty', whatsappOrderNumber: 'whatsapp_order_number', business: 'business' };

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

/** Stored JSON merged over the defaults, so a missing or partial value never breaks a page. */
function toBusiness(v: unknown): BusinessInfo {
  const d = DEFAULT_BUSINESS;
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, Record<string, unknown> | unknown>;
  const a = (o.address && typeof o.address === 'object' ? o.address : {}) as Record<string, unknown>;
  const s = (o.socials && typeof o.socials === 'object' ? o.socials : {}) as Record<string, unknown>;
  return {
    phone: str(o.phone, d.phone),
    email: str(o.email, d.email),
    address: {
      line1: str(a.line1, d.address.line1),
      line2: str(a.line2, d.address.line2),
      city: str(a.city, d.address.city),
      state: str(a.state, d.address.state),
      pincode: str(a.pincode, d.address.pincode),
    },
    mapQuery: str(o.mapQuery, d.mapQuery),
    socials: { instagram: str(s.instagram, d.socials.instagram), facebook: str(s.facebook, d.socials.facebook), youtube: str(s.youtube, d.socials.youtube) },
  };
}

export async function getSettings(): Promise<ShopSettings> {
  if (!hasDatabase()) return DEFAULT_SETTINGS;
  try {
    const rows = await sql<{ key: string; value: unknown }>('select key, value from public.settings');
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const min = Number(map.get(KEYS.minOrderQty));
    const wa = String(map.get(KEYS.whatsappOrderNumber) ?? '').replace(/\D/g, '');
    return {
      minOrderQty: Number.isInteger(min) && min > 0 ? min : DEFAULT_SETTINGS.minOrderQty,
      whatsappOrderNumber: wa.length >= 10 ? wa : DEFAULT_SETTINGS.whatsappOrderNumber,
      business: toBusiness(map.get(KEYS.business)),
    };
  } catch (err) {
    console.error('[settings] falling back to defaults', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: ShopSettings) {
  for (const [k, col] of Object.entries(KEYS) as Array<[keyof ShopSettings, string]>) {
    await sql(
      `insert into public.settings (key, value, updated_at) values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [col, JSON.stringify(next[k])],
    );
  }
}
