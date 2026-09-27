'use client';

import { useT } from '@/i18n/client';

export function SkipLink() {
  const t = useT();
  return (
    <a
      href="#main"
      className="fixed left-4 top-3 z-[90] -translate-y-24 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg shadow-lift transition-transform focus:translate-y-0"
    >
      {t.common.skip}
    </a>
  );
}
