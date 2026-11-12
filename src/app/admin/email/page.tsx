import { prisma } from '@/lib/prisma';
import { date } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { BroadcastForm, TestEmailForm } from '@/components/admin/forms';
import { getSettings } from '@/lib/settings';
import { emailProviderStatus } from '@/lib/email';

export const dynamic = 'force-dynamic';

export default async function AdminEmailPage() {
  const [settings, recipients, outbox] = await Promise.all([
    getSettings(),
    prisma.user.count({ where: { status: 'ACTIVE', emailOptOut: false, role: 'INVESTOR' } }),
    prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 40 })
  ]);

  const provider = emailProviderStatus();
  const providerReady = provider.ready;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Email</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Investor communications</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Transactional email (verification, decisions, statements) and broadcasts to opted-in investors.
        </p>
      </div>

      {!providerReady ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
          <p className="text-[12.5px] leading-relaxed text-amber-100/90">
            <strong>No email provider configured.</strong> Set <code className="font-mono">BREVO_API_KEY</code> (or
            <code className="font-mono"> RESEND_API_KEY</code>) and a verified <code className="font-mono">EMAIL_FROM</code>
            sender in your Render environment. Until then every message is stored in the outbox below and nothing is
            delivered.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3">
          <p className="text-[12.5px] text-emerald-200">
            {provider.detail}. Sender: {settings.fromEmail}. Provider errors appear in the outbox.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Compose broadcast</p>
          <div className="mt-4"><BroadcastForm recipients={recipients} /></div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">Deliverability check</p>
            <div className="mt-4"><TestEmailForm defaultTo={settings.adminEmail} /></div>
          </div>
          <div className="card p-5">
            <p className="text-[13.5px] font-medium text-white">Sending domain</p>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-mist">
              <li>• Verify the domain with your provider (SPF, DKIM, DMARC) before a broadcast.</li>
              <li>• Use a real <code className="font-mono">From</code> address on that domain, not a free mailbox.</li>
              <li>• Keep broadcasts infrequent; statements and notices are transactional.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><p className="text-[13.5px] font-medium text-white">Outbox</p></div>
        <div className="overflow-x-auto">
          <table className="table-x">
            <thead><tr><th>When</th><th>To</th><th>Subject</th><th>Template</th><th>Status</th></tr></thead>
            <tbody>
              {outbox.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[12.5px] text-mist">No email sent yet.</td></tr>
              ) : outbox.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-mist">{date(m.createdAt)}</td>
                  <td className="max-w-[200px] truncate text-white/85">{m.to}</td>
                  <td className="max-w-[260px] truncate text-mist">{m.subject}</td>
                  <td className="text-[11.5px] text-mist">{m.template}</td>
                  <td>
                    <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                    {m.error ? <p className="mt-1 max-w-[220px] truncate text-[10.5px] text-rose-300/80">{m.error}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
