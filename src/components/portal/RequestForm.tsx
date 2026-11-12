'use client';

import { useFormState } from 'react-dom';
import SubmitButton from '@/components/forms/SubmitButton';
import type { PortalState } from '@/actions/portal';

export default function RequestForm({
  action,
  amountLabel,
  cta,
  hint
}: {
  action: (prev: PortalState, formData: FormData) => Promise<PortalState>;
  amountLabel: string;
  cta: string;
  hint?: string;
}) {
  const [state, formAction] = useFormState(action, {} as PortalState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="amount">{amountLabel}</label>
        <input id="amount" name="amount" type="number" min={1} step={1000} required className="input" placeholder="50000" />
        {hint ? <p className="hint">{hint}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="note">Note to the manager (optional)</label>
        <textarea id="note" name="note" rows={3} className="input" placeholder="Any timing or documentation requirements" />
      </div>
      {state.error ? (
        <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[13px] text-rose-300">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[13px] text-emerald-300">{state.ok}</p>
      ) : null}
      <SubmitButton>{cta}</SubmitButton>
    </form>
  );
}
