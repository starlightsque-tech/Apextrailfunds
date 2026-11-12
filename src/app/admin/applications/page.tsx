import { prisma } from '@/lib/prisma';
import { date, money } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { ReviewForm } from '@/components/admin/forms';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const apps = await prisma.application.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { user: true }
  });

  const pending = apps.filter((a) => a.status === 'PENDING');
  const decided = apps.filter((a) => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Applications</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Eligibility review</h1>
        <p className="mt-2 text-[13.5px] text-mist">
          Approving an application activates the portal and emails the investor. It does not accept a subscription and
          does not perform identity verification — record verification separately in your compliance file.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[13.5px] font-medium text-white">Pending ({pending.length})</p>
        </div>
        {pending.length === 0 ? (
          <div className="p-5"><EmptyState title="Nothing waiting">New applications appear here for review.</EmptyState></div>
        ) : (
          <div className="divide-y divide-line">
            {pending.map((a) => (
              <div key={a.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium text-white">{a.user.name}</p>
                    <p className="text-[12px] text-mist">{a.user.email} · {a.country} · {a.entityType}</p>
                  </div>
                  <Badge tone="amber">Pending</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-[12px] sm:grid-cols-4">
                  <div><dt className="text-mist">Intended</dt><dd className="font-mono text-white/85">{money(a.intendedAmount, 'USD', 0)}</dd></div>
                  <div><dt className="text-mist">Experience</dt><dd className="text-white/85">{a.experience}</dd></div>
                  <div><dt className="text-mist">Accredited</dt><dd className="text-white/85">{a.accredited ? 'Yes' : 'No'}</dd></div>
                  <div><dt className="text-mist">Applied</dt><dd className="text-white/85">{date(a.createdAt)}</dd></div>
                </dl>
                <div className="mt-4 max-w-xl"><ReviewForm id={a.id} pending /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[13.5px] font-medium text-white">Decided</p>
        </div>
        <table className="table-x">
          <thead>
            <tr>
              <th>Investor</th>
              <th>Decision</th>
              <th>Reviewed by</th>
              <th>When</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {decided.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-[12.5px] text-mist">No decisions yet.</td></tr>
            ) : (
              decided.map((a) => (
                <tr key={a.id}>
                  <td>
                    <p className="text-white/90">{a.user.name}</p>
                    <p className="text-[11.5px] text-mist">{a.user.email}</p>
                  </td>
                  <td><Badge tone={statusTone(a.status)}>{a.status}</Badge></td>
                  <td className="text-mist">{a.reviewedBy ?? '—'}</td>
                  <td className="whitespace-nowrap text-mist">{date(a.reviewedAt)}</td>
                  <td className="max-w-[260px] truncate text-mist">{a.decisionNote ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
