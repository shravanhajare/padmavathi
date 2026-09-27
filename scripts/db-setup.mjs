#!/usr/bin/env node
/**
 * Creates the database schema (db/schema.sql) and seeds it: the catalogue from
 * data/products.ts, reviews from data/testimonials.ts and the business contact
 * details from data/site.ts. Safe to re-run: anything already in the database is
 * left alone, so edits made in the admin survive. Pass --reset-products to
 * overwrite the products from code.
 *
 *   npm run db:setup [-- --reset-products]
 *
 * Reads DATABASE_URL from the environment or .env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  const file = path.resolve('.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnv();
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (see .env.example).');
  process.exit(1);
}

const reset = process.argv.includes('--reset-products');
const { products } = await import('../data/products.ts');
const { productTranslations } = await import('../i18n/products.ts');
const { reviewSeeds } = await import('../data/testimonials.ts');
const { site } = await import('../data/site.ts');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(fs.readFileSync(path.resolve('db/schema.sql'), 'utf8'));
  console.log('✓ schema ready');
  let added = 0;
  for (const [i, p] of products.entries()) {
    const i18n = productTranslations[p.id] ?? {};
    const res = await client.query(
      `insert into public.products (id, data, i18n, sort_order) values ($1, $2, $3, $4)
       on conflict (id) do ${reset ? 'update set data = excluded.data, i18n = excluded.i18n, sort_order = excluded.sort_order, updated_at = now()' : 'nothing'}`,
      [p.id, JSON.stringify(p), JSON.stringify(i18n), i],
    );
    added += res.rowCount ?? 0;
  }
  console.log(`✓ products: ${added} ${reset ? 'written' : 'added'} (${products.length} in code)`);

  const [{ n: reviewCount }] = (await client.query('select count(*)::int as n from public.reviews')).rows;
  if (reviewCount === 0) {
    for (const [i, r] of reviewSeeds.entries()) {
      await client.query('insert into public.reviews (name, rating, i18n, sort_order) values ($1, $2, $3, $4)', [r.name, r.rating, JSON.stringify(r.i18n), i]);
    }
    console.log(`✓ reviews: ${reviewSeeds.length} added`);
  } else console.log(`✓ reviews: ${reviewCount} already in the database`);

  const { line1, line2, city, state, pincode } = site.address;
  const business = { phone: site.contact.phone, email: site.contact.email, address: { line1, line2, city, state, pincode }, mapQuery: site.mapQuery, socials: site.socials };
  const biz = await client.query(`insert into public.settings (key, value) values ('business', $1) on conflict (key) do nothing`, [JSON.stringify(business)]);
  console.log(`✓ business details: ${biz.rowCount ? 'added' : 'already in the database'}`);
} finally {
  await client.end();
}
