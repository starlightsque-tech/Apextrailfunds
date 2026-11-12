import { getSettings, regulatoryReady } from '@/lib/settings';
import { SettingsForm } from '@/components/admin/forms';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const ready = regulatoryReady(settings);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Fund identity &amp; terms</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          These values drive the public site, the disclosures page, minimums and fee descriptions. Nothing here creates
          a licence or a legal relationship — it only changes what is displayed.
        </p>
      </div>

      <div className={`rounded-xl border px-4 py-3 ${ready ? 'border-emerald-400/25 bg-emerald-400/[0.07]' : 'border-amber-400/25 bg-amber-400/[0.07]'}`}>
        <p className={`text-[12.5px] ${ready ? 'text-emerald-200' : 'text-amber-100/90'}`}>
          {ready
            ? 'Regulatory identity is complete and published on the site.'
            : 'Regulatory identity is incomplete. The site shows “details pending” instead of stating a licence or custodian.'}
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <SettingsForm settings={settings as unknown as Record<string, string>} />
      </div>
    </div>
  );
}
