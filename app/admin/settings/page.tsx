import { SettingsForm } from '@/components/admin/SettingsForm';
import { getT } from '@/i18n/server';
import { requireAdmin } from '@/lib/server/auth';
import { getSettings } from '@/lib/server/settings';
import { autoNotifyConfigured } from '@/lib/server/whatsapp';

export default async function AdminSettings() {
  await requireAdmin();
  const [t, settings] = await Promise.all([getT(), getSettings()]);
  const s = t.admin.settings;
  const auto = autoNotifyConfigured();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-semibold text-fg sm:text-4xl">{s.title}</h1>
      <SettingsForm minQty={settings.minOrderQty} whatsapp={settings.whatsappOrderNumber} business={settings.business} />
      <section className={`rounded-[1.6rem] border p-5 sm:p-6 ${auto ? 'border-leaf/30 bg-leaf/10' : 'border-honey/40 bg-honey/10'}`}>
        <h2 className="font-semibold text-fg">{s.autoTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg">{auto ? s.autoOn : s.autoOff}</p>
      </section>
    </div>
  );
}
