import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { date } from '@/lib/format';
import { EmptyState } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documents' };

const LABELS: Record<string, string> = {
  FACT_SHEET: 'Fact sheet',
  FINANCIAL_STATEMENT: 'Financial statement',
  LEGAL: 'Legal',
  TAX: 'Tax',
  OTHER: 'Other'
};

export default async function DocumentsPage() {
  const session = await getSession();
  const docs = await prisma.document
    .findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, category: true, size: true, createdAt: true, filename: true }
    })
    .catch(() => []);

  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Document library</p>
      <h1 className="h1 mt-4 max-w-3xl">Read before you apply.</h1>
      <p className="body mt-6 max-w-2xl">
        Public documents are available below. The offering memorandum, subscription agreement and monthly statements
        are released in your portal after eligibility is confirmed — they are not published on the open site.
      </p>

      <div className="mt-10 card overflow-hidden">
        {docs.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No public documents have been published yet">
              The manager has not uploaded any public documents. Request the current offering memorandum and fact sheet
              by <a className="text-gold hover:underline" href="/contact">contacting the team</a>.
            </EmptyState>
          </div>
        ) : (
          <table className="table-x">
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Published</th>
                <th className="text-right">File</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium text-white">{d.title}</td>
                  <td><Badge>{LABELS[d.category] ?? d.category}</Badge></td>
                  <td className="text-mist">{date(d.createdAt)}</td>
                  <td className="text-right">
                    <a href={`/api/documents/${d.id}`} className="text-[13px] text-gold hover:underline">
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!session ? (
        <p className="mt-6 text-[13px] text-mist">
          Already approved? <a href="/login" className="text-white hover:text-gold">Sign in</a> to reach the full
          document set and your capital-account statements.
        </p>
      ) : null}
    </div>
  );
}
