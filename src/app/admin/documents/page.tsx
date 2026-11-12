import { prisma } from '@/lib/prisma';
import { date } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { UploadForm, RemoveDocumentForm } from '@/components/admin/forms';

export const dynamic = 'force-dynamic';

const VIS_LABEL: Record<string, string> = {
  PUBLIC: 'Public',
  INVESTOR: 'Approved investors',
  PRIVATE: 'Single investor'
};

export default async function AdminDocumentsPage() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      category: true,
      visibility: true,
      size: true,
      createdAt: true,
      owner: { select: { email: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Documents</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Document library</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] text-mist">
          Upload offering documents, statements or notices. Public files are listed on the marketing site; investor
          files require an approved login; private files are visible only to the named investor.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="card p-5">
          <p className="text-[13.5px] font-medium text-white">Upload</p>
          <div className="mt-4"><UploadForm /></div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4"><p className="text-[13.5px] font-medium text-white">Files ({docs.length})</p></div>
          <div className="max-h-[520px] overflow-auto">
            <table className="table-x">
              <thead><tr><th>Title</th><th>Visibility</th><th>Added</th><th></th></tr></thead>
              <tbody>
                {docs.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[12.5px] text-mist">No documents uploaded.</td></tr>
                ) : docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p className="text-white/90">{d.title}</p>
                      <p className="text-[11px] text-mist">{d.category} · {Math.max(1, Math.round(d.size / 1024))} KB</p>
                    </td>
                    <td>
                      <Badge tone={d.visibility === 'PUBLIC' ? 'neutral' : 'gold'}>{VIS_LABEL[d.visibility]}</Badge>
                      {d.owner ? <p className="mt-1 text-[10.5px] text-mist">{d.owner.email}</p> : null}
                    </td>
                    <td className="whitespace-nowrap text-mist">{date(d.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a className="text-[11.5px] text-gold hover:underline" href={`/api/documents/${d.id}`}>open</a>
                        <RemoveDocumentForm id={d.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
