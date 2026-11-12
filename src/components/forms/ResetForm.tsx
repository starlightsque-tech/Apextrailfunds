'use client';

import { useFormState } from 'react-dom';
import { resetPasswordAction, FormState } from '@/actions/auth';
import SubmitButton from './SubmitButton';

const initial: FormState = {};

export default function ResetForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPasswordAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" minLength={10} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" minLength={10} required className="input" />
      </div>
      {state.error ? <p className="text-[13px] text-rose-300">{state.error}</p> : null}
      <SubmitButton>Set new password</SubmitButton>
    </form>
  );
}
