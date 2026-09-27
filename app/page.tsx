import { Hero } from '@/components/hero/Hero';
import { Shop } from '@/components/shop/Shop';
import { GiftSets } from '@/components/sections/GiftSets';
import { OurCraft } from '@/components/sections/OurCraft';
import { WhyWood } from '@/components/sections/WhyWood';
import { CareGuide } from '@/components/sections/CareGuide';
import { Testimonials } from '@/components/sections/Testimonials';
import { Contact } from '@/components/sections/Contact';
import { Marquee } from '@/components/ui/Marquee';
import { site } from '@/data/site';
import { lowestPrice } from '@/lib/catalog';
import type { Product } from '@/data/types';
import { getCatalog } from '@/lib/server/catalog';
import { getReviews } from '@/lib/server/reviews';
import { getSettings } from '@/lib/server/settings';
import { telHref, type BusinessInfo } from '@/lib/business';
import { getT } from '@/i18n/server';
import { headers } from 'next/headers';

function StructuredData({ products, business: b, nonce }: { products: Product[]; business: BusinessInfo; nonce?: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: telHref(b.phone),
    email: b.email,
    image: `${site.url}/opengraph-image`,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: [b.address.line1, b.address.line2].filter(Boolean).join(', '),
      addressLocality: b.address.city,
      addressRegion: b.address.state,
      postalCode: b.address.pincode,
      addressCountry: 'IN',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    openingHours: site.openingHoursSpec,
    sameAs: Object.values(b.socials).filter(Boolean),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Handcrafted wooden kitchenware',
      itemListElement: products.map((p) => ({
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: lowestPrice(p),
        availability: 'https://schema.org/InStock',
        itemOffered: { '@type': 'Product', name: p.name, description: p.description, image: `${site.url}${p.image}`, material: p.wood },
      })),
    },
  };
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function HomePage() {
  const [t, entries, reviews, settings, nonce] = await Promise.all([getT(), getCatalog(), getReviews(), getSettings(), headers().then((h) => h.get('x-nonce') ?? undefined)]);
  return (
    <>
      <StructuredData products={entries.map((e) => e.product)} business={settings.business} nonce={nonce} />
      <Hero />
      <Marquee
        className="border-y border-line bg-surface-2/60 py-5 text-wood"
        items={[...t.home.marquee]}
      />
      <Shop />
      <GiftSets />
      <OurCraft />
      <WhyWood />
      <CareGuide />
      <Testimonials reviews={reviews} />
      <Contact />
    </>
  );
}
