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
import { lowestPrice, products } from '@/data/products';

function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.contact.phoneHref,
    email: site.contact.email,
    image: `${site.url}/opengraph-image`,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: [site.address.line1, site.address.line2].filter(Boolean).join(', '),
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.pincode,
      addressCountry: site.address.country,
    },
    areaServed: { '@type': 'Country', name: 'India' },
    openingHours: site.openingHoursSpec,
    sameAs: Object.values(site.socials),
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
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <Hero />
      <Marquee
        className="border-y border-line bg-surface-2/60 py-5 text-wood"
        items={['Teak', 'Sheesham', 'Neem', 'Acacia', 'Hand-turned', 'Food-safe', 'No lacquer', 'Coconut-oil finish', 'Made in India']}
      />
      <Shop />
      <GiftSets />
      <OurCraft />
      <WhyWood />
      <CareGuide />
      <Testimonials />
      <Contact />
    </>
  );
}
