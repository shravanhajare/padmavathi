'use client';

import { KeyRound, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { setUserActiveAction, setUserPasswordAction, setUserRoleAction } from '@/app/actions/admin';
import { useT } from '@/i18n/client';

const btn = 'inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-honey disabled:opacity-50';

export function CustomerActions({ id, role, active, self }: { id: string; role: 'customer' | 'admin'; active: boolean; self: boolean }) {
  const t = useT();
  const c = t.admin.customers;
  const [pending, start] = useTransition();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  if (self) return <span className="text-xs font-semibold text-muted">{c.self}</span>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} disabled={pending} onClick={() => start(async () => void (await setUserRoleAction(id, role === 'admin' ? 'customer' : 'admin')))}>
          {role === 'admin' ? c.removeAdmin : c.makeAdmin}
        </button>
        <button type="button" className={btn} disabled={pending} onClick={() => start(async () => void (await setUserActiveAction(id, !active)))}>
          {active ? c.disable : c.enable}
        </button>
        <button type="button" className={btn} onClick={() => setPwOpen((o) => !o)}>
          <KeyRound size={12} aria-hidden="true" /> {c.resetPassword}
        </button>
        {pending && <Loader2 size={14} className="animate-spin text-muted" aria-hidden="true" />}
      </div>
      {pwOpen && (
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await setUserPasswordAction(id, pw);
              setMsg(res?.ok ? c.passwordSet : t.common.errors.password);
              if (res?.ok) setPw('');
            });
          }}
        >
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={c.newPassword}
            minLength={8}
            className="h-9 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-3 text-sm outline-none focus:border-forest"
          />
          <button type="submit" className={btn} disabled={pending}>
            {t.common.save}
          </button>
        </form>
      )}
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
