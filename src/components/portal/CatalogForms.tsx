'use client';

import { useFormState } from 'react-dom';
import SubmitButton from '@/components/forms/SubmitButton';
import { expressInterest, type CatalogState } from '@/actions/catalog';
import { addPayoutMethod, type PortalState } from '@/actions/portal';

const empty = {} as CatalogState;

export function InterestForm({
  planId,
  min,
  max,
  currency = 'USD'
}: {
  planId: string;
  min: number;
  max?: number;
  currency?: string;
}) {
  const [state, action] = useFormState(expressInterest, empty);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="planId" value={planId} />
      <div>
        <label className="label">Intended amount ({currency})</label>
        <input name="amount" type="number" min={min} max={max} step={1000} defaultValue={min} className="input" required />
        <p className="hint">
          Minimum {min.toLocaleString('en-US')}
          {max ? ` · maximum ${max.toLocaleString('en-US')} per investor` : ''}. This records interest only — no money moves here.
        </p>
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <textarea name="note" rows={2} className="input" />
      </div>
      {state.error ? <p className="text-[12.5px] text-rose-300">{state.error}</p> : null}
      {state.ok ? <p className="text-[12.5px] text-emerald-300">{state.ok}</p> : null}
      <SubmitButton className="btn-primary">Record interest</SubmitButton>
    </form>
  );
}

export function PayoutForm() {
  const [state, action] = useFormState(addPayoutMethod, {} as PortalState);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Destination type</label>
          <select name="kind" className="input" defaultValue="BANK_ACCOUNT">
            <option value="BANK_ACCOUNT">Bank account</option>
            <option value="STABLECOIN_WALLET">Stablecoin wallet</option>
          </select>
        </div>
        <div>
          <label className="label">Label</label>
          <input name="label" className="input" placeholder="Main account" required />
        </div>
        <div>
          <label className="label">Currency</label>
          <input name="currency" className="input" defaultValue="USD" required />
        </div>
        <div>
          <label className="label">Account holder</label>
          <input name="accountName" className="input" required />
        </div>
        <div>
          <label className="label">Bank name</label>
          <input name="bankName" className="input" />
        </div>
        <div>
          <label className="label">Account number / IBAN</label>
          <input name="accountNumber" className="input" />
        </div>
        <div>
          <label className="label">SWIFT / BIC</label>
          <input name="swift" className="input" />
        </div>
        <div>
          <label className="label">Wallet address (stablecoin only)</label>
          <input name="walletAddress" className="input font-mono text-[12.5px]" />
        </div>
        <div>
          <label className="label">Withdrawal network (stablecoin only)</label>
          <select name="network" className="input" defaultValue="">
            <option value="">— none (bank account) —</option>
            <option value="TRC20">USDT · TRC20 (Tron)</option>
            <option value="ERC20">USDT · ERC20 (Ethereum)</option>
            <option value="BEP20">USDT · BEP20 (BNB Chain)</option>
            <option value="SOL">USDT · Solana</option>
            <option value="POLYGON">USDT · Polygon</option>
          </select>
          <p className="hint">Networks are listed only where the custodian supports payouts. Sending on the wrong network loses funds.</p>
        </div>
      </div>
      {state.error ? <p className="text-[12.5px] text-rose-300">{state.error}</p> : null}
      {state.ok ? <p className="text-[12.5px] text-emerald-300">{state.ok}</p> : null}
      <SubmitButton className="btn-primary">Save destination</SubmitButton>
    </form>
  );
}
