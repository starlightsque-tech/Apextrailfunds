'use client';

import { useFormState } from 'react-dom';
import SubmitButton from '@/components/forms/SubmitButton';
import {
  savePlan,
  setPlanStatus,
  deletePlan,
  saveFundingMethod,
  deleteFundingMethod,
  savePosition,
  closePosition,
  maturePosition as maturePositionAction,
  type CatalogState
} from '@/actions/catalog';

const empty = {} as CatalogState;

function Notice({ state }: { state: CatalogState }) {
  if (state.error) return <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[12.5px] text-rose-300">{state.error}</p>;
  if (state.ok) return <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[12.5px] text-emerald-300">{state.ok}</p>;
  return null;
}

type PlanValues = {
  id?: string;
  name?: string;
  tagline?: string | null;
  strategy?: string;
  riskBand?: string;
  minAmount?: number;
  maxAmount?: number | null;
  targetSize?: number | null;
  termMonths?: number | null;
  liquidityDays?: number;
  managementFee?: number;
  performanceFee?: number;
  status?: string;
  sortOrder?: number;
};

export function PlanForm({ plan }: { plan?: PlanValues }) {
  const [state, action] = useFormState(savePlan, empty);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {plan?.id ? <input type="hidden" name="id" value={plan.id} /> : null}
      <div className="sm:col-span-2">
        <label className="label">Programme name</label>
        <input name="name" defaultValue={plan?.name ?? ''} className="input" required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Tagline</label>
        <input name="tagline" defaultValue={plan?.tagline ?? ''} className="input" placeholder="One line shown on the card" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Strategy</label>
        <textarea name="strategy" rows={4} defaultValue={plan?.strategy ?? ''} className="input" required />
        <p className="hint">Describe approach and risk. Do not state a fixed or guaranteed return.</p>
      </div>
      <div>
        <label className="label">Risk band</label>
        <select name="riskBand" defaultValue={plan?.riskBand ?? 'Medium'} className="input">
          <option>Low</option>
          <option>Medium</option>
          <option>Medium-High</option>
          <option>High</option>
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" defaultValue={plan?.status ?? 'DRAFT'} className="input">
          <option value="DRAFT">Draft</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
      <div>
        <label className="label">Minimum (USD)</label>
        <input name="minAmount" type="number" min={1} defaultValue={plan?.minAmount ?? 25000} className="input" required />
      </div>
      <div>
        <label className="label">Maximum per investor (USD, optional)</label>
        <input name="maxAmount" type="number" min={0} defaultValue={plan?.maxAmount ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Target size (USD, optional)</label>
        <input name="targetSize" type="number" min={0} defaultValue={plan?.targetSize ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Term months (blank = open-ended)</label>
        <input name="termMonths" type="number" min={0} defaultValue={plan?.termMonths ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Notice period (days)</label>
        <input name="liquidityDays" type="number" min={0} defaultValue={plan?.liquidityDays ?? 30} className="input" required />
      </div>
      <div>
        <label className="label">Management fee %</label>
        <input name="managementFee" type="number" step="0.01" min={0} defaultValue={plan?.managementFee ?? 1.5} className="input" required />
      </div>
      <div>
        <label className="label">Performance fee %</label>
        <input name="performanceFee" type="number" step="0.01" min={0} defaultValue={plan?.performanceFee ?? 15} className="input" required />
      </div>
      <div>
        <label className="label">Sort order</label>
        <input name="sortOrder" type="number" min={0} defaultValue={plan?.sortOrder ?? 0} className="input" />
      </div>
      <div className="sm:col-span-2"><Notice state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton className="btn-primary">{plan?.id ? 'Save changes' : 'Create programme'}</SubmitButton></div>
    </form>
  );
}

export function PlanStatusForm({ id, status }: { id: string; status: string }) {
  const [state, action] = useFormState(setPlanStatus, empty);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="input max-w-[120px] py-1.5 text-[12px]">
        <option value="DRAFT">Draft</option>
        <option value="OPEN">Open</option>
        <option value="CLOSED">Closed</option>
      </select>
      <SubmitButton className="btn-ghost btn-sm">Set</SubmitButton>
      {state.error ? <span className="text-[11px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function DeletePlanForm({ id }: { id: string }) {
  const [state, action] = useFormState(deletePlan, empty);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-[11.5px] text-rose-300/80 hover:text-rose-300">delete</button>
      {state.error ? <span className="ml-1 text-[10.5px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

type FundingValues = {
  id?: string;
  label?: string;
  kind?: string;
  currency?: string;
  accountName?: string;
  bankName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  swift?: string | null;
  walletAddress?: string | null;
  network?: string | null;
  referenceHint?: string | null;
  instructions?: string | null;
  custodianVerified?: boolean;
  active?: boolean;
  sortOrder?: number;
};

export function FundingForm({ method }: { method?: FundingValues }) {
  const [state, action] = useFormState(saveFundingMethod, empty);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {method?.id ? <input type="hidden" name="id" value={method.id} /> : null}
      <div>
        <label className="label">Label</label>
        <input name="label" defaultValue={method?.label ?? ''} className="input" placeholder="Custodian USD account" required />
      </div>
      <div>
        <label className="label">Type</label>
        <select name="kind" defaultValue={method?.kind ?? 'BANK_TRANSFER'} className="input">
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="CUSTODIAN_PORTAL">Custodian portal</option>
          <option value="STABLECOIN">Stablecoin</option>
        </select>
      </div>
      <div>
        <label className="label">Currency</label>
        <input name="currency" defaultValue={method?.currency ?? 'USD'} className="input" required />
      </div>
      <div>
        <label className="label">Account name</label>
        <input name="accountName" defaultValue={method?.accountName ?? ''} className="input" required />
      </div>
      <div>
        <label className="label">Bank name</label>
        <input name="bankName" defaultValue={method?.bankName ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Account number</label>
        <input name="accountNumber" defaultValue={method?.accountNumber ?? ''} className="input" />
      </div>
      <div>
        <label className="label">IBAN</label>
        <input name="iban" defaultValue={method?.iban ?? ''} className="input" />
      </div>
      <div>
        <label className="label">SWIFT / BIC</label>
        <input name="swift" defaultValue={method?.swift ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Wallet address (stablecoin)</label>
        <input name="walletAddress" defaultValue={method?.walletAddress ?? ''} className="input font-mono text-[12px]" />
      </div>
      <div>
        <label className="label">Network</label>
        <input name="network" defaultValue={method?.network ?? ''} className="input" placeholder="TRC20 / ERC20" />
      </div>
      <div>
        <label className="label">Reference hint</label>
        <input name="referenceHint" defaultValue={method?.referenceHint ?? ''} className="input" placeholder="ATF" />
      </div>
      <div>
        <label className="label">Sort order</label>
        <input name="sortOrder" type="number" min={0} defaultValue={method?.sortOrder ?? 0} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Instructions</label>
        <textarea name="instructions" rows={3} defaultValue={method?.instructions ?? ''} className="input" />
      </div>
      <label className="flex items-center gap-2 text-[12.5px] text-mist">
        <input type="checkbox" name="custodianVerified" defaultChecked={method?.custodianVerified ?? false} className="h-4 w-4 accent-[#d8b25a]" />
        I confirm these are the custodian’s own details
      </label>
      <label className="flex items-center gap-2 text-[12.5px] text-mist">
        <input type="checkbox" name="active" defaultChecked={method?.active ?? true} className="h-4 w-4 accent-[#d8b25a]" />
        Active / visible to approved investors
      </label>
      <div className="sm:col-span-2"><Notice state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton className="btn-primary">{method?.id ? 'Save channel' : 'Add channel'}</SubmitButton></div>
    </form>
  );
}

export function DeleteFundingForm({ id }: { id: string }) {
  const [state, action] = useFormState(deleteFundingMethod, empty);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-[11.5px] text-rose-300/80 hover:text-rose-300">delete</button>
      {state.error ? <span className="ml-1 text-[10.5px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function PositionForm({
  userId,
  plans,
  today
}: {
  userId: string;
  plans: { id: string; name: string; minAmount: number }[];
  today: string;
}) {
  const [state, action] = useFormState(savePosition, empty);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="sm:col-span-2">
        <label className="label">Programme</label>
        <select name="planId" className="input" required>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Committed (USD)</label>
        <input name="committed" type="number" min={1} step="0.01" className="input" required />
      </div>
      <div>
        <label className="label">Start date</label>
        <input name="startedAt" type="date" defaultValue={today} className="input" required />
      </div>
      <div>
        <label className="label">Units (optional)</label>
        <input name="units" type="number" step="0.000001" min={0} className="input" />
      </div>
      <div>
        <label className="label">NAV / unit (optional)</label>
        <input name="navPerUnit" type="number" step="0.000001" min={0} className="input" />
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" className="input" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
      <div className="sm:col-span-2"><Notice state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton className="btn-primary">Record position</SubmitButton></div>
    </form>
  );
}

export function ClosePositionForm({ id }: { id: string }) {
  const [state, action] = useFormState(closePosition, empty);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-[11.5px] text-white/60 hover:text-white">close</button>
      {state.error ? <span className="ml-1 text-[10.5px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

export function MatureForm({ id, today }: { id: string; today: string }) {
  const [state, action] = useFormState(maturePositionAction, empty);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="label">Settlement date</label>
        <input name="date" type="date" defaultValue={today} className="input" required />
      </div>
      <div>
        <label className="label">Realised gain (USD)</label>
        <input name="realizedGain" type="number" min={0} step="0.01" defaultValue={0} className="input" required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Custodian settlement reference</label>
        <input name="reference" className="input" placeholder="STL-2026-0001" required />
      </div>
      <div className="sm:col-span-2"><Notice state={state} /></div>
      <div className="sm:col-span-2"><SubmitButton className="btn-ghost">Mature &amp; release capital</SubmitButton></div>
    </form>
  );
}
