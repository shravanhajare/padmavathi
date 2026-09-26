'use client';

import type { Category } from '@/data/categories';

/** Lets any link (footer, hero, gift section) switch the catalogue's active category. */
export const CATEGORY_EVENT = 'pe:category';

export function selectShopCategory(id: Category['id']) {
  window.dispatchEvent(new CustomEvent<Category['id']>(CATEGORY_EVENT, { detail: id }));
}

/** Lets a CTA (gift sets, footer) preselect the contact form's enquiry type. */
export const ENQUIRY_EVENT = 'pe:enquiry';

export type EnquiryKind = 'retail' | 'bulk' | 'wholesale' | 'custom';

export function selectEnquiryType(kind: EnquiryKind) {
  window.dispatchEvent(new CustomEvent<EnquiryKind>(ENQUIRY_EVENT, { detail: kind }));
}
