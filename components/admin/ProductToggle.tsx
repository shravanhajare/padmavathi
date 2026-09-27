'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { setProductActiveAction } from '@/app/actions/admin';
import { useT } from '@/i18n/client';
import { cn } from '@/lib/utils';

export function ProductToggle({ id, active }: { id: string; active: boolean }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => void (await setProductActiveAction(id, !active)))}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-leaf/30 bg-leaf/10 text-leaf hover:bg-leaf/20' : 'border-line-strong text-muted hover:text-fg',
      )}
      title={active ? t.admin.products.hide : t.admin.products.show}
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : active ? <Eye size={13} /> : <EyeOff size={13} />}
      {active ? t.admin.products.active : t.admin.products.hidden}
    </button>
  );
}
