import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FailureView } from '@/components/checkout/FailureView';

export const metadata: Metadata = { title: 'Payment failed', robots: { index: false, follow: false } };

export default function OrderFailurePage() {
  return (
    <Suspense>
      <FailureView />
    </Suspense>
  );
}
