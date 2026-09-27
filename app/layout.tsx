import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Noto_Sans_Kannada, Noto_Serif_Kannada, Playfair_Display, Poppins, Tiro_Devanagari_Hindi } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { site } from '@/data/site';
import { themeInitScript } from '@/store/theme';
import { Providers } from '@/components/layout/Providers';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { AppDataProvider } from '@/components/layout/AppData';
import { I18nProvider } from '@/i18n/client';
import { LOCALE_META } from '@/i18n/config';
import { getLocale } from '@/i18n/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getCatalog } from '@/lib/server/catalog';
import { listAddresses } from '@/lib/server/addresses';
import { getSettings } from '@/lib/server/settings';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
});

const sans = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

// Kannada and Devanagari: Poppins already covers Devanagari for body text; these fill in
// headings and Kannada. Not preloaded: browsers fetch them only when the glyphs appear.
const knSans = Noto_Sans_Kannada({ subsets: ['kannada'], variable: '--font-kn-sans', display: 'swap', weight: ['400', '500', '600', '700'], preload: false });
const knSerif = Noto_Serif_Kannada({ subsets: ['kannada'], variable: '--font-kn-serif', display: 'swap', weight: ['500', '600', '700'], preload: false });
const hiSerif = Tiro_Devanagari_Hindi({ subsets: ['devanagari'], variable: '--font-hi-serif', display: 'swap', weight: '400', style: ['normal', 'italic'], preload: false });

const title = `${site.name} · ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'wooden kitchenware',
    'wooden belan',
    'chakla belan set',
    'wooden rolling pin',
    'coconut scraper',
    'thuruvani',
    'wooden mathani',
    'buttermilk churner',
    'wooden spatula',
    'wooden ladle',
    'wooden mortar and pestle',
    'teak kitchenware',
    'sheesham kitchenware',
    'neem wood spoon',
    'handmade kitchen utensils India',
    site.name,
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: '/',
    siteName: site.name,
    title,
    description: site.description,
  },
  twitter: { card: 'summary_large_image', title, description: site.description },
  robots: { index: true, follow: true },
  category: 'shopping',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fff8ea' },
    { media: '(prefers-color-scheme: dark)', color: '#15100c' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [locale, user, entries, settings, nonce] = await Promise.all([getLocale(), getCurrentUser(), getCatalog(), getSettings(), headers().then((h) => h.get('x-nonce') ?? undefined)]);
  const addresses = user ? await listAddresses(user.id) : [];
  const fonts = [display.variable, sans.variable, knSans.variable, knSerif.variable, hiSerif.variable].join(' ');
  return (
    <html lang={LOCALE_META[locale].htmlLang} data-theme="light" suppressHydrationWarning className={fonts}>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <AppDataProvider
            entries={entries}
            minQty={settings.minOrderQty}
            whatsapp={settings.whatsappOrderNumber}
            business={settings.business}
            addresses={addresses}
            user={user && { name: user.name, phone: user.phone, email: user.email, business_name: user.business_name, gstin: user.gstin, city: user.city, role: user.role }}
          >
            <Providers>
              <SiteChrome>{children}</SiteChrome>
            </Providers>
          </AppDataProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
