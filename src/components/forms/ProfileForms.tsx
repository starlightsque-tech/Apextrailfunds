'use client';

import { useFormState } from 'react-dom';
import { updateProfileAction, changePasswordAction, resendVerificationAction, FormState } from '@/actions/auth';
import SubmitButton from './SubmitButton';

const initial: FormState = {};

export function ProfileForm({ name, phone, country }: { name: string; phone: string; country: string }) {
  const [state, action] = useFormState(updateProfileAction, initial);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" defaultValue={name} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" name="phone" defaultValue={phone} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="country">Country</label>
        <input id="country" name="country" defaultValue={country} className="input" />
      </div>
      {state.error ? <p className="text-[13px] text-rose-300 sm:col-span-2">{state.error}</p> : null}
      {state.ok ? <p className="text-[13px] text-emerald-300 sm:col-span-2">{state.ok}</p> : null}
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary">Save changes</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changePasswordAction, initial);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="next">New password</label>
        <input id="next" name="next" type="password" minLength={10} className="input" required />
      </div>
      {state.error ? <p className="text-[13px] text-rose-300 sm:col-span-2">{state.error}</p> : null}
      {state.ok ? <p className="text-[13px] text-emerald-300 sm:col-span-2">{state.ok}</p> : null}
      <div className="sm:col-span-2">
        <SubmitButton className="btn-ghost">Change password</SubmitButton>
      </div>
    </form>
  );
}

export function ResendVerification() {
  const [state, action] = useFormState(resendVerificationAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button className="btn-ghost btn-sm" type="submit">Resend confirmation email</button>
      {state.ok ? <span className="text-[12px] text-emerald-300">{state.ok}</span> : null}
      {state.error ? <span className="text-[12px] text-rose-300">{state.error}</span> : null}
    </form>
  );
}
