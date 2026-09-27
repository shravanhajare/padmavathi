'use client';

import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { useT } from '@/i18n/client';

export function LogoutButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => logoutAction()}
      aria-label={t.common.account.logout}
      title={t.common.account.logout}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface/70 px-3.5 text-sm font-semibold text-fg transition-colors hover:border-honey"
    >
      <LogOut size={16} aria-hidden="true" />
      <span className="hidden sm:inline">{t.common.account.logout}</span>
    </button>
  );
}
