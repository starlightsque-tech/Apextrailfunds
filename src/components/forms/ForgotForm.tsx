'use client';

import { useFormState } from 'react-dom';
import { forgotPasswordAction, FormState } from '@/actions/auth';
import SubmitButton from './SubmitButton';

const initial: FormState = {};

export default function ForgotForm() {
  const [state, action] = useFormState(forgotPasswordAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" />
      </div>
      {state.error ? <p className="text-[13px] text-rose-300">{state.error}</p> : null}
      {state.ok ? <p className="text-[13px] text-emerald-300">{state.ok}</p> : null}
      <SubmitButton>Send reset link</SubmitButton>
      <p className="pt-1 text-center text-[13px] text-mist">
        <a href="/login" className="text-white hover:text-gold">Back to sign in</a>
      </p>
    </form>
  );
}
