'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from 'react';
import { LOCALE_COOKIE, LOCALE_META, type Locale } from './config';
import { messagesFor, type Messages } from './messages';

interface I18nValue {
  locale: Locale;
  t: Messages;
  setLocale: (l: Locale) => void;
  switching: boolean;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale: initial, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initial);
  const [switching, startTransition] = useTransition();

  const setLocale = useCallback(
    (l: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = LOCALE_META[l].htmlLang;
      setLocaleState(l);
      // server-rendered text (page metadata, admin, account) follows on refresh
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = useMemo(() => ({ locale, t: messagesFor(locale), setLocale, switching }), [locale, setLocale, switching]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}

export const useT = () => useI18n().t;
