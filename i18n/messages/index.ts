import type { Locale } from '../config';
import admin from './admin';
import catalog from './catalog';
import common from './common';
import home from './home';
import orders from './orders';
import sections from './sections';

const all = { common, catalog, home, sections, orders, admin };

export type Messages = { [K in keyof typeof all]: (typeof all)[K]['en'] };

const cache = new Map<Locale, Messages>();

export function messagesFor(locale: Locale): Messages {
  let m = cache.get(locale);
  if (!m) {
    m = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v[locale]])) as Messages;
    cache.set(locale, m);
  }
  return m;
}
