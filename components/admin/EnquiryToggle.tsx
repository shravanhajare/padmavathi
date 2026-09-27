'use client';

import { Check, Loader2, RotateCcw } from 'lucide-react';
import { useTransition } from 'react';
import { setEnquiryStatusAction } from '@/app/actions/admin';
import { useT } from '@/i18n/client';

export function EnquiryToggle({ id, status }: { id: string; status: 'new' | 'handled' }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => void (await setEnquiryStatusAction(id, status === 'new' ? 'handled' : 'new')))}
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold text-fg hover:border-honey disabled:opacity-50"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : status === 'new' ? <Check size={13} /> : <RotateCcw size={13} />}
      {status === 'new' ? t.admin.enquiries.markHandled : t.admin.enquiries.reopen}
    </button>
  );
}
