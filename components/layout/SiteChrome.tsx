'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { FlyToCartLayer } from '@/components/cart/FlyToCartLayer';
import { MobileCartBar } from '@/components/cart/MobileCartBar';
import { QuickView } from '@/components/shop/QuickView';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { SkipLink } from './SkipLink';
import { WhatsAppButton } from './WhatsAppButton';

/**
 * The shop's chrome (navbar, footer, cart, WhatsApp button) wraps every page
 * except /admin, which has its own header and nothing shop-related — a shopper
 * browsing bulk kitchenware and an admin managing orders never share a navbar.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return (
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
    );
  }
  return (
    <>
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
    </>
  );
}
