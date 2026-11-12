'use client';

import { useFormState } from 'react-dom';
import { submitApplicationAction, FormState } from '@/actions/auth';
import SubmitButton from './SubmitButton';

const initial: FormState = {};

export default function ApplicationForm({ minSubscription, country }: { minSubscription: string; country: string }) {
  const [state, action] = useFormState(submitApplicationAction, initial);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="country">Country of residence</label>
          <input id="country" name="country" defaultValue={country} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="entityType">Investing as</label>
          <select id="entityType" name="entityType" className="input" defaultValue="Individual">
            <option>Individual</option>
            <option>Company</option>
            <option>Trust</option>
            <option>Fund of funds</option>
            <option>Family office</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="experience">Experience</label>
          <select id="experience" name="experience" className="input" defaultValue="1–3 years">
            <option>Less than 1 year</option>
            <option>1–3 years</option>
            <option>3–7 years</option>
            <option>7+ years</option>
            <option>Professional / institutional</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="intendedAmount">Intended commitment (USD)</label>
          <input id="intendedAmount" name="intendedAmount" type="number" min={1} step={1000} defaultValue={minSubscription} required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="referrer">How did you hear about us? (optional)</label>
          <input id="referrer" name="referrer" className="input" placeholder="Referral, event, publication…" />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-white/[0.02] p-4">
        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-mist">
          <input type="checkbox" name="accredited" className="mt-0.5 h-4 w-4 accent-[#d8b25a]" />
          <span>
            I confirm I am a professional, institutional or high-net-worth investor able to bear the loss of my entire
            commitment, and that I meet the eligibility criteria in my jurisdiction.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-mist">
          <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 accent-[#d8b25a]" />
          <span>
            I have read the <a href="/disclosures" className="text-white hover:text-gold">risk disclosure</a> and understand
            that digital-asset investing can result in total loss and that no return is promised.
          </span>
        </label>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[13px] text-rose-300">{state.error}</p>
      ) : null}

      <SubmitButton>Submit for review</SubmitButton>
    </form>
  );
}
