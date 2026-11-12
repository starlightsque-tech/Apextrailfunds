'use client';

import { useFormState } from 'react-dom';
import { signupAction, FormState } from '@/actions/auth';
import SubmitButton from './SubmitButton';

const initial: FormState = {};

export default function SignupForm() {
  const [state, action] = useFormState(signupAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" name="name" required className="input" placeholder="As shown on your ID" autoComplete="name" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={10} required className="input" autoComplete="new-password" placeholder="At least 10 characters" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" minLength={10} required className="input" autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <input id="country" name="country" required className="input" placeholder="United Kingdom" autoComplete="country-name" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" required className="input" placeholder="+44 7700 000000" autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="referralCode">Referral code <span className="font-normal text-white/40">(optional)</span></label>
          <input id="referralCode" name="referralCode" className="input font-mono uppercase" placeholder="e.g. ATF7K2M" />
          <p className="hint">If someone introduced you, their code is recorded on your account for attribution only.</p>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[13px] text-rose-300">{state.error}</p>
      ) : null}

      <SubmitButton>Create account</SubmitButton>

      <p className="text-center text-[12px] leading-relaxed text-white/35">
        Creating an account does not make you an investor. Eligibility is reviewed separately, and no funds are accepted
        until verification and the custodian’s subscription documents are complete.
      </p>
      <p className="text-center text-[13px] text-mist">
        Already registered? <a href="/login" className="text-white hover:text-gold">Sign in</a>
      </p>
    </form>
  );
}
