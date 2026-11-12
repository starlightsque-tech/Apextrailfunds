import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { money, date } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { PlanForm, PlanStatusForm, DeletePlanForm } from '@/components/admin/catalog-forms';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage({ searchParams }: { searchParams: { edit?: string } }) {
  const plans = await prisma.plan.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  const editing = searchParams.edit ? plans.find((p) => p.id === searchParams.edit) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Programmes</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Investment programmes</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Programmes publish to <Link href="/plans" className="text-gold hover:underline">/plans</Link> when set to Open.
          Terms are commercial terms only — there is no return field, by design.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">{editing ? `Edit: ${editing.name}` : 'Create a programme'}</p>
          {editing ? (
            <Link href="/admin/plans" className="mb-3 mt-1 inline-block text-[11.5px] text-mist hover:text-white">
              ← create a new one instead
            </Link>
          ) : null}
          <div className="mt-4">
            <PlanForm plan={editing ?? undefined} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[13.5px] font-medium text-white">Programmes ({plans.length})</p>
          </div>
          <div className="divide-y divide-line">
            {plans.length === 0 ? (
              <p className="px-5 py-6 text-[12.5px] text-mist">No programmes yet.</p>
            ) : (
              plans.map((p) => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[13.5px] text-white/90">{p.name}</p>
                      <p className="text-[11.5px] text-mist">
                        {money(p.minAmount, 'USD', 0)} min · {p.maxAmount ? `${money(p.maxAmount, 'USD', 0)} max` : 'no cap'} ·{' '}
                        {p.termMonths ? `${p.termMonths}mo` : 'open-ended'} · {p.liquidityDays}d notice · {date(p.createdAt)}
                      </p>
                    </div>
                    <Badge tone={p.status === 'OPEN' ? 'green' : p.status === 'DRAFT' ? 'amber' : 'neutral'}>{p.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <PlanStatusForm id={p.id} status={p.status} />
                    <Link href={`/admin/plans?edit=${p.id}`} className="text-[11.5px] text-gold hover:underline">edit</Link>
                    <DeletePlanForm id={p.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
