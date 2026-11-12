import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { date, money } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function InvestorsPage() {
  const investors = await prisma.user.findMany({
    where: { role: 'INVESTOR' },
    orderBy: { createdAt: 'desc' },
    include: { entries: { select: { type: true, amount: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Investors</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">All accounts</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-x">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Status</th>
                <th>Email</th>
                <th className="text-right">Capital account</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {investors.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[12.5px] text-mist">No investors yet.</td></tr>
              ) : (
                investors.map((u) => {
                  const nav = u.entries.reduce((acc, e) => {
                    const amt = Number(e.amount);
                    return e.type === 'WITHDRAWAL' || e.type === 'FEE' ? acc - amt : acc + amt;
                  }, 0);
                  return (
                    <tr key={u.id}>
                      <td>
                        <p className="text-white/90">{u.name}</p>
                        <p className="text-[11.5px] text-mist">{u.country ?? '—'}</p>
                      </td>
                      <td><Badge tone={statusTone(u.status)}>{u.status}</Badge></td>
                      <td className="text-mist">
                        {u.email}
                        {!u.emailVerified ? <span className="ml-2 text-[10.5px] text-amber-300">unconfirmed</span> : null}
                      </td>
                      <td className="text-right font-mono text-white/85">{money(nav, 'USD', 0)}</td>
                      <td className="whitespace-nowrap text-mist">{date(u.createdAt)}</td>
                      <td className="text-right">
                        <Link href={`/admin/investors/${u.id}`} className="text-[12px] text-gold hover:underline">Open</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
