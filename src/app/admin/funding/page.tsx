import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { FundingForm, DeleteFundingForm } from '@/components/admin/catalog-forms';

export const dynamic = 'force-dynamic';

export default async function AdminFundingPage({ searchParams }: { searchParams: { edit?: string } }) {
  const methods = await prisma.fundingMethod.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  const editing = searchParams.edit ? methods.find((m) => m.id === searchParams.edit) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Funding accounts</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Subscription destinations</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          These appear on <span className="font-mono text-[12px]">/portal/fund</span> for approved investors only. Only
          tick “custodian verified” when the details are genuinely the custodian’s — the portal warns investors loudly
          when they are not.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">{editing ? 'Edit channel' : 'Add a funding channel'}</p>
          {editing ? (
            <Link href="/admin/funding" className="mb-3 mt-1 inline-block text-[11.5px] text-mist hover:text-white">
              ← add a new one instead
            </Link>
          ) : null}
          <div className="mt-4">
            <FundingForm method={editing ?? undefined} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[13.5px] font-medium text-white">Channels ({methods.length})</p>
          </div>
          <div className="divide-y divide-line">
            {methods.length === 0 ? (
              <p className="px-5 py-6 text-[12.5px] text-mist">No funding channels.</p>
            ) : (
              methods.map((m) => (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] text-white/90">{m.label}</p>
                      <p className="text-[11.5px] text-mist">{m.kind.replace(/_/g, ' ')} · {m.currency}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.active ? <Badge tone="green">Active</Badge> : <Badge>Hidden</Badge>}
                      {m.custodianVerified ? <Badge tone="gold">Verified</Badge> : <Badge tone="red">Unverified</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Link href={`/admin/funding?edit=${m.id}`} className="text-[11.5px] text-gold hover:underline">edit</Link>
                    <DeleteFundingForm id={m.id} />
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
