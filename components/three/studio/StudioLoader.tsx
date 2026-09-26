'use client';

import dynamic from 'next/dynamic';

const StudioClient = dynamic(() => import('./StudioClient'), { ssr: false });

export function StudioLoader() {
  return <StudioClient />;
}
