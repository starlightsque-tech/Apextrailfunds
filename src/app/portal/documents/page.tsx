import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { date, num } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Field';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documents' };

const LABELS: Record<string, string> = {
  FACT_SHEET: 'Fact sheet',
  FINANCIAL_STATEMENT: 'Financial statement',
  LEGAL: 'Legal',
  TAX: 'Tax',
  OTHER: 'Other'
};

export default async function PortalDocumentsPage() {
  const session = await getSession();
  if (!session) return null;

  const docs = await prisma.document.findMany({
    where: { OR: [{ visibility: 'INVESTOR' }, { ownerId: session.uid }] },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, category: true, size: true, createdAt: true, ownerId: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Documents</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Offering documents &amp; statements</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-mist">
          Documents here are released to approved investors. Statements are personal to your account — do not forward
          them. Downloads are logged.
        </p>
      </div>

      <div className="card overflow-hidden">
        {docs.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No documents released yet">
              The manager will publish the offering memorandum, subscription agreement and your monthly statements here.
            </EmptyState>
          </div>
        ) : (
          <table className="table-x">
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Released</th>
                <th className="text-right">Size</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium text-white">
                    {d.title}
                    {d.ownerId === session.uid ? <span className="ml-2 text-[11px] text-gold">personal</span> : null}
                  </td>
                  <td><Badge>{LABELS[d.category] ?? d.category}</Badge></td>
                  <td className="text-mist">{date(d.createdAt)}</td>
                  <td className="text-right font-mono text-mist">{Math.max(1, Math.round(d.size / 1024))} KB</td>
                  <td className="text-right">
                    <a href={`/api/documents/${d.id}`} className="text-[13px] text-gold hover:underline">Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11.5px] leading-relaxed text-white/35">
        {num(docs.length, 0)} document{docs.length === 1 ? '' : 's'} available. If a document is missing, ask the
        manager using the chat launcher or your registered email.
      </p>
    </div>
  );
}
