import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/checkout', '/order/', '/api/', '/studio', '/admin', '/account', '/login', '/register', '/cart'] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
