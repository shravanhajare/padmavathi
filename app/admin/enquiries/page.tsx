import { EnquiryToggle } from '@/components/admin/EnquiryToggle';
import { WhatsAppIcon } from '@/components/ui/icons';
import { LOCALE_META } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import { listEnquiries } from '@/lib/server/admin';
import { requireAdmin } from '@/lib/server/auth';
import { waLink } from '@/lib/server/whatsapp';
import { formatPhone } from '@/lib/phone';

export default async function AdminEnquiries() {
  await requireAdmin();
  const [t, locale, rows] = await Promise.all([getT(), getLocale(), listEnquiries()]);
  const e = t.admin.enquiries;
  const types = t.sections.contact.types as Record<string, string>;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{e.title}</h1>
      {rows.length === 0 ? (
        <p className="rounded-[1.5rem] border border-dashed border-line-strong p-8 text-center text-muted">{e.empty}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className={`flex flex-col gap-3 rounded-[1.4rem] border bg-card p-4 shadow-soft sm:p-5 ${r.status === 'new' ? 'border-honey/60' : 'border-line opacity-70'}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-honey/20 px-2.5 py-1 font-bold text-wood">{types[r.type] ?? r.type}</span>
                <span className={`rounded-full px-2.5 py-1 font-bold ${r.status === 'new' ? 'bg-[#facc15]/25 text-[#8a5a00]' : 'bg-leaf/15 text-leaf'}`}>{r.status === 'new' ? e.new : e.handled}</span>
                <span className="text-muted">{new Date(r.created_at).toLocaleString(LOCALE_META[locale].intl, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <p className="font-semibold text-fg">
                {r.name} <span className="font-normal text-muted">· {/^\d{10}$/.test(r.phone) ? formatPhone(r.phone) : r.phone}</span>
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg">{r.message}</p>
              <div className="flex flex-wrap gap-2">
                <a href={waLink(`91${r.phone.replace(/\D/g, '').slice(-10)}`, `Namaste ${r.name}! This is Padmavathi Enterprises about your enquiry.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white">
                  <WhatsAppIcon size={13} /> WhatsApp
                </a>
                <EnquiryToggle id={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
