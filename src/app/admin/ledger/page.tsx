import { prisma } from '@/lib/prisma';
import { date, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function LedgerPage() {
  const entries = await prisma.ledgerEntry.findMany({
    orderBy: { date: 'desc' },
    take: 200,
    include: { user: { select: { name: true, email: true } } }
  });

  const nav = entries.reduce((acc, e) => {
    const amt = Number(e.amount);
    return e.type === 'WITHDRAWAL' || e.type === 'FEE' ? acc - amt : acc + amt;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Capital entries</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ledger</h1>
        <p className="mt-2 text-[13.5px] text-mist">
          Every capital-account movement across all investors. Post new entries from an investor’s page.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-[13.5px] font-medium text-white">Last {entries.length} entries</p>
          <p className="font-mono text-[12.5px] text-mist">Aggregate: {money(nav, 'USD', 0)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table-x">
            <thead>
              <tr><th>Date</th><th>Investor</th><th>Type</th><th className="text-right">Amount</th><th>Memo</th><th>Posted by</th></tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[12.5px] text-mist">No entries posted.</td></tr>
              ) : entries.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-mist">{date(e.date)}</td>
                  <td>
                    <p className="text-white/85">{e.user.name}</p>
                    <p className="text-[11px] text-mist">{e.user.email}</p>
                  </td>
                  <td className="text-white/80">{e.type}</td>
                  <td className={`text-right font-mono ${e.type === 'WITHDRAWAL' || e.type === 'FEE' ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {money(e.amount, 'USD', 0)}
                  </td>
                  <td className="max-w-[240px] truncate text-mist">{e.memo || '—'}</td>
                  <td className="max-w-[160px] truncate text-[11.5px] text-mist">{e.createdBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
