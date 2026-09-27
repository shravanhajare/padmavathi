/** Languages the site speaks. The choice lives in a cookie so server and client render the same text. */
export const LOCALES = ['en', 'kn', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'pe_lang';

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string; intl: string }> = {
  en: { label: 'English', short: 'EN', htmlLang: 'en-IN', intl: 'en-IN' },
  kn: { label: 'ಕನ್ನಡ', short: 'ಕ', htmlLang: 'kn-IN', intl: 'kn-IN' },
  hi: { label: 'हिन्दी', short: 'हि', htmlLang: 'hi-IN', intl: 'hi-IN' },
};

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** Kannada / Hindi copy for one product. Anything left out falls back to English. */
export interface ProductText {
  name?: string;
  localName?: string;
  description?: string;
  story?: string;
  finish?: string;
  /** variant id → label */
  variants?: Record<string, string>;
  includes?: string[];
}
export type ProductI18n = Partial<Record<Exclude<Locale, 'en'>, ProductText>>;
