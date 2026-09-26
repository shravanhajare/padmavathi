import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudioLoader } from '@/components/three/studio/StudioLoader';

export const metadata: Metadata = {
  title: 'Render studio',
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_STUDIO !== 'true') notFound();
  return <StudioLoader />;
}
