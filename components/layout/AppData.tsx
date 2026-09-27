'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Product } from '@/data/types';
import { fullAddress, telHref, whatsappLink, type BusinessInfo } from '@/lib/business';
import type { Address } from '@/lib/server/addresses';
import { localizeProduct, type CatalogEntry } from '@/lib/catalog';
import { useI18n } from '@/i18n/client';

/** What every page needs from the server: the live catalogue, the bulk minimum, contact details and who is signed in. */
export interface PublicUser {
  name: string;
  phone: string;
  email: string | null;
  business_name: string | null;
  gstin: string | null;
  city: string | null;
  role: 'customer' | 'admin';
}

interface AppData {
  entries: CatalogEntry[];
  minQty: number;
  /** Country code + digits; orders and the chat buttons go here. */
  whatsapp: string;
  business: BusinessInfo;
  addresses: Address[];
  user: PublicUser | null;
}

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children, ...value }: AppData & { children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData must be used inside <AppDataProvider>');
  return v;
}

/** The active catalogue in the visitor's language. */
export function useCatalog() {
  const { entries } = useAppData();
  const { locale } = useI18n();
  return useMemo(() => {
    const products: Product[] = entries.map((e) => localizeProduct(e.product, e.i18n, locale));
    const byId = new Map(products.map((p) => [p.id, p]));
    return { products, getProduct: (id: string) => byId.get(id) };
  }, [entries, locale]);
}

export const useMinQty = () => useAppData().minQty;
export const useSessionUser = () => useAppData().user;

/** The signed-in customer's saved addresses, default first. Empty for guests. */
export const useAddresses = () => useAppData().addresses;

/** Contact details from the admin settings, with ready-made links. */
export function useBusiness() {
  const { business, whatsapp } = useAppData();
  return useMemo(
    () => ({
      ...business,
      whatsapp,
      tel: telHref(business.phone),
      fullAddress: fullAddress(business),
      waLink: (message?: string) => whatsappLink(whatsapp, message),
    }),
    [business, whatsapp],
  );
}
