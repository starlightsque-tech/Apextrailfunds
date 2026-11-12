import { getSession } from '@/lib/session';
import { getCapitalAccount } from '@/lib/account';
import { money, date, num } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Capital account' };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) return null;
  const account = await getCapitalAccount(session.uid);

  const rows = [
    { k: 'Contributions', v: account.contributions },
    { k: 'Distributions', v: account.distributions },
    { k: 'Adjustments', v: account.adjustments },
    { k: 'Fees charged', v: -account.fees },
    { k: 'Withdrawals', v: -account.withdrawals }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Capital account</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your position</h1>
        <p className="mt-2 text-[13.5px] text-mist">
          Figures are derived from custodian-confirmed entries recorded by the manager. This page is a record, not a
          live trading balance, and it cannot be used to move funds.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="card p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-mist">Net asset value</p>
          <p className="mt-2 font-mono text-[30px] text-white">{money(account.nav, 'USD', 0)}</p>
          <p className="mt-1 text-[11.5px] text-white/35">{num(account.units, 2)} units</p>
          <div className="mt-5 space-y-2">
            {rows.map((r) => (
              <div key={r.k} className="flex items-baseline justify-between border-b border-line pb-2">
                <span className="text-[12.5px] text-mist">{r.k}</span>
                <span className="font-mono text-[12.5px] text-white/85">{money(r.v, 'USD', 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[13.5px] font-medium text-white">Ledger</p>
            <p className="mt-0.5 text-[11.5px] text-mist">Newest first. Entries are locked once posted.</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="table-x">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th>Memo</th>
                </tr>
              </thead>
              <tbody>
                {account.entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[12.5px] text-mist">
                      No entries posted yet.
                    </td>
                  </tr>
                ) : (
                  account.entries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap text-mist">{date(e.date)}</td>
                      <td className="text-white/85">{e.type}</td>
                      <td className={`text-right font-mono ${e.type === 'WITHDRAWAL' || e.type === 'FEE' ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {money(e.amount, 'USD', 0)}
                      </td>
                      <td className="max-w-[200px] truncate text-mist">{e.memo || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-white/35">
        Unaudited. Per-unit values are estimates based on venue marks and may be restated by the administrator.
        Statements issued by the administrator prevail over this page if they differ.
      </p>
    </div>
  );
}
