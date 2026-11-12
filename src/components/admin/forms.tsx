'use client';

import { useFormState } from 'react-dom';
import SubmitButton from '@/components/forms/SubmitButton';
import type { AdminState } from '@/actions/admin';
import {
  reviewApplication,
  setUserStatus,
  addLedgerEntry,
  deleteLedgerEntry,
  upsertPerformance,
  togglePerformance,
  saveSettings,
  uploadDocument,
  removeDocument,
  broadcastEmail,
  sendTestEmail,
  updateRequestStatus,
  sendUserEmail
} from '@/actions/admin';

const empty = {} as AdminState;

function Notice({ state }: { state: AdminState }) {
  if (state.error) return <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[12.5px] text-rose-300">{state.error}</p>;
  if (state.ok) return <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[12.5px] text-emerald-300">{state.ok}</p>;
  return null;
}

export function ReviewForm({ id, pending }: { id: string; pending: boolean }) {
  const [state, action] = useFormState(reviewApplication, empty);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <textarea name="note" rows={2} className="input" placeholder="Decision note (included in the email)" />
      <Notice state={state} />
      <div className="flex gap-2">
        <button name="decision" value="APPROVED" className="btn-primary btn-sm" disabled={!pending}>Approve</button>
        <button name="decision" value="REJECTED" className="btn-ghost btn-sm" disabled={!pending}>Decline</button>
      </div>
    </form>
  );
}

export function StatusForm({ userId, status }: { userId: string; status: string }) {
  const [state, action] = useFormState(setUserStatus, empty);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select name="status" defaultValue={status} className="input max-w-[160px] py-2 text-[13px]">
        <option value="ACTIVE">Active</option>
        <option value="APPLICANT">Applicant</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
      <SubmitButton className="btn-ghost btn-sm">Update</SubmitButton>
      {state.ok ? <span className="text-[11.5px] text-emerald-300">{state.ok}</span> : null}
      {state.error ? <span className="text-[11.5px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function LedgerForm({ userId, today }: { userId: string; today: string }) {
  const [state, action] = useFormState(addLedgerEntry, empty);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label className="label">Date</label>
        <input type="date" name="date" defaultValue={today} className="input" required />
      </div>
      <div>
        <label className="label">Type</label>
        <select name="type" className="input" defaultValue="SUBSCRIPTION">
          <option value="SUBSCRIPTION">Subscription</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="DISTRIBUTION">Distribution</option>
          <option value="FEE">Fee</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
      </div>
      <div>
        <label className="label">Amount (USD)</label>
        <input name="amount" type="number" step="0.01" min="0" className="input" required />
      </div>
      <div>
        <label className="label">Units (optional)</label>
        <input name="units" type="number" step="0.000001" min="0" className="input" />
      </div>
      <div>
        <label className="label">NAV / unit (optional)</label>
        <input name="navPerUnit" type="number" step="0.000001" min="0" className="input" />
      </div>
      <div>
        <label className="label">Custodian reference / memo</label>
        <input name="memo" className="input" placeholder="Settlement ref" />
      </div>
      <div className="sm:col-span-2"><Notice state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton className="btn-primary">Post entry</SubmitButton></div>
    </form>
  );
}

export function DeleteEntryForm({ id }: { id: string }) {
  const [state, action] = useFormState(deleteLedgerEntry, empty);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="text-[11.5px] text-rose-300/80 hover:text-rose-300" type="submit">remove</button>
      {state.error ? <span className="ml-1 text-[11px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function PerformanceForm() {
  const [state, action] = useFormState(upsertPerformance, empty);
  const month = new Date().toISOString().slice(0, 7);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Month (YYYY-MM)</label>
        <input name="month" defaultValue={month} pattern="\d{4}-\d{2}" className="input" required />
      </div>
      <div>
        <label className="label">Net return %</label>
        <input name="netReturn" type="number" step="0.01" className="input" required />
      </div>
      <div>
        <label className="label">Gross return % (optional)</label>
        <input name="grossReturn" type="number" step="0.01" className="input" />
      </div>
      <div>
        <label className="label">NAV / unit (optional)</label>
        <input name="navPerUnit" type="number" step="0.0001" className="input" />
      </div>
      <div>
        <label className="label">AUM USD (optional)</label>
        <input name="aum" type="number" step="1" className="input" />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-[12.5px] text-mist">
        <input type="checkbox" name="published" className="h-4 w-4 accent-[#d8b25a]" /> Publish publicly
      </label>
      <div className="sm:col-span-2"><Notice state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton className="btn-primary">Save month</SubmitButton></div>
    </form>
  );
}

export function TogglePublishForm({ id, published }: { id: string; published: boolean }) {
  const [state, action] = useFormState(togglePerformance, empty);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="text-[11.5px] text-gold/90 hover:text-gold" type="submit">
        {published ? 'unpublish' : 'publish'}
      </button>
      {state.error ? <span className="ml-1 text-[11px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, action] = useFormState(saveSettings, empty);
  const text = (key: string, label: string, hint?: string, type = 'text') => (
    <div>
      <label className="label">{label}</label>
      <input name={key} defaultValue={settings[key] ?? ''} type={type} className="input" />
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );

  return (
    <form action={action} className="space-y-6">
      <div>
        <p className="mb-3 text-[12px] uppercase tracking-[0.14em] text-white/40">Identity</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('fundDisplayName', 'Display name')}
          {text('fundLegalName', 'Legal entity name', 'Exactly as registered.')}
          {text('jurisdiction', 'Jurisdiction')}
          {text('licenceRef', 'Licence / registration number')}
          {text('custodianName', 'Custodian', 'Where client assets are actually held.')}
          {text('auditorName', 'Auditor (optional)')}
          <div className="sm:col-span-2">{text('addressLine', 'Registered address')}</div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[12px] uppercase tracking-[0.14em] text-white/40">Commerce</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('minSubscription', 'Minimum subscription (USD)')}
          {text('liquidityNoticeDays', 'Notice period (days)')}
          {text('managementFee', 'Management fee (% p.a.)')}
          {text('performanceFee', 'Performance fee (%)')}
          {text('fromEmail', 'From address', 'Must be verified with your email provider.')}
          {text('adminEmail', 'Reply-to / admin notifications')}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white/[0.02] p-4">
        <label className="flex items-start gap-3 text-[12.5px] leading-relaxed text-mist">
          <input type="checkbox" name="complianceApproved" defaultChecked={settings.complianceApproved === 'true'} className="mt-0.5 h-4 w-4 accent-[#d8b25a]" />
          <span>
            I confirm the entity, jurisdiction, licence and custodian above are accurate and may be published on the
            public site. This does not create a licence — it only controls what the site displays.
          </span>
        </label>
      </div>

      <Notice state={state} />
      <SubmitButton className="btn-primary">Save settings</SubmitButton>
    </form>
  );
}

export function UploadForm() {
  const [state, action] = useFormState(uploadDocument, empty);
  return (
    <form action={action} className="grid gap-3">
      <div>
        <label className="label">Title</label>
        <input name="title" className="input" placeholder="October 2026 statement" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Category</label>
          <select name="category" className="input" defaultValue="OTHER">
            <option value="FACT_SHEET">Fact sheet</option>
            <option value="FINANCIAL_STATEMENT">Financial statement</option>
            <option value="LEGAL">Legal</option>
            <option value="TAX">Tax</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Visibility</label>
          <select name="visibility" className="input" defaultValue="PUBLIC">
            <option value="PUBLIC">Public</option>
            <option value="INVESTOR">All approved investors</option>
            <option value="PRIVATE">Single investor</option>
          </select>
        </div>
        <div>
          <label className="label">Owner email (private only)</label>
          <input name="ownerEmail" className="input" placeholder="investor@example.com" />
        </div>
      </div>
      <div>
        <label className="label">File (PDF, max 9 MB)</label>
        <input name="file" type="file" accept="application/pdf,image/*" className="input py-2" required />
      </div>
      <Notice state={state} />
      <div><SubmitButton className="btn-primary">Upload document</SubmitButton></div>
    </form>
  );
}

export function RemoveDocumentForm({ id }: { id: string }) {
  const [state, action] = useFormState(removeDocument, empty);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-[11.5px] text-rose-300/80 hover:text-rose-300">delete</button>
      {state.error ? <span className="ml-1 text-[11px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function BroadcastForm({ recipients }: { recipients: number }) {
  const [state, action] = useFormState(broadcastEmail, empty);
  return (
    <form action={action} className="grid gap-3">
      <div>
        <label className="label">Subject</label>
        <input name="subject" className="input" required />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea name="body" rows={8} className="input" placeholder="Plain text. Blank lines become paragraphs." required />
      </div>
      <p className="hint">
        Sends to {recipients} active investor{recipients === 1 ? '' : 's'} who have not opted out. An unsubscribe link is
        added automatically; security and statement notices are unaffected.
      </p>
      <Notice state={state} />
      <div><SubmitButton className="btn-primary" >Send broadcast</SubmitButton></div>
    </form>
  );
}

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action] = useFormState(sendTestEmail, empty);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[240px] flex-1">
        <label className="label">Send a test to</label>
        <input name="to" defaultValue={defaultTo} className="input" required />
      </div>
      <SubmitButton className="btn-ghost">Send test</SubmitButton>
      <div className="w-full"><Notice state={state} /></div>
    </form>
  );
}

export function RequestStatusForm({ id, kind, status }: { id: string; kind: string; status: string }) {
  const [state, action] = useFormState(updateRequestStatus, empty);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <select name="status" defaultValue={status} className="input max-w-[150px] py-2 text-[12.5px]">
        <option value="REQUESTED">Requested</option>
        <option value="INSTRUCTED">Instructed</option>
        <option value="SETTLED">Settled</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <input name="adminNote" placeholder="Note to investor" className="input max-w-[220px] py-2 text-[12.5px]" />
      <SubmitButton className="btn-ghost btn-sm">Save</SubmitButton>
      {state.error ? <span className="text-[11px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function UserEmailForm({ userId }: { userId: string }) {
  const [state, action] = useFormState(sendUserEmail, empty);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label className="label">Subject</label>
        <input name="subject" className="input" required />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea name="body" rows={4} className="input" required />
      </div>
      <Notice state={state} />
      <div><SubmitButton className="btn-ghost">Send to investor</SubmitButton></div>
    </form>
  );
}
