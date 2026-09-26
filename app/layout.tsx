import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { site } from '@/data/site';
import { themeInitScript } from '@/store/theme';
import { Providers } from '@/components/layout/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { FlyToCartLayer } from '@/components/cart/FlyToCartLayer';
import { QuickView } from '@/components/shop/QuickView';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';

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
    'masala dabba',
    'wooden spice box',
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" data-theme="light" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <SkipLink />
          <Navbar />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <QuickView />
          <CartDrawer />
          <MobileCartBar />
          <FlyToCartLayer />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
