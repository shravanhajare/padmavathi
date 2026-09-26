import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SuccessView } from '@/components/checkout/SuccessView';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false, follow: false } };

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <SuccessView />
    </Suspense>
  );
}
