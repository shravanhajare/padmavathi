import { CustomerActions } from '@/components/admin/CustomerActions';
import { LOCALE_META } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import { listCustomers } from '@/lib/server/admin';
import { requireAdmin } from '@/lib/server/auth';
import { waLink } from '@/lib/server/whatsapp';
import { formatPhone } from '@/lib/phone';
import { WhatsAppIcon } from '@/components/ui/icons';

export default async function AdminCustomers() {
  const me = await requireAdmin();
  const [t, locale, rows] = await Promise.all([getT(), getLocale(), listCustomers()]);
  const c = t.admin.customers;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{c.title}</h1>
      {rows.length === 0 ? (
        <p className="rounded-[1.5rem] border border-dashed border-line-strong p-8 text-center text-muted">{c.empty}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((u) => (
            <li key={u.id} className={`rounded-[1.4rem] border border-line bg-card p-4 shadow-soft sm:p-5 ${u.is_active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                    {u.name}
                    <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${u.role === 'admin' ? 'bg-[#2c5a42] text-white' : 'bg-surface-2 text-muted'}`}>
                      {u.role === 'admin' ? c.admin : c.customer}
                    </span>
                    {!u.is_active && <span className="rounded-full bg-[#dc2626]/10 px-2 py-0.5 text-[0.68rem] font-bold text-[#b91c1c]">{c.disabled}</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatPhone(u.phone)}
                    {u.business_name && ` · ${u.business_name}`}
                    {u.city && ` · ${u.city}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {c.cols.orders}: {u.orders} · {c.cols.joined}: {new Date(u.created_at).toLocaleDateString(LOCALE_META[locale].intl, { dateStyle: 'medium' })}
                  </p>
                </div>
                <a href={waLink(`91${u.phone}`, `Namaste ${u.name}!`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25d366] text-white">
                  <WhatsAppIcon size={16} />
                </a>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <CustomerActions id={u.id} role={u.role} active={u.is_active} self={u.id === me.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
