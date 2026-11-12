'use client';

import { useFormState } from 'react-dom';
import { loginAction, FormState } from '@/actions/auth';
import SubmitButton from './SubmitButton';

const initial: FormState = {};

export default function LoginForm() {
  const [state, action] = useFormState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="you@company.com" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="password">Password</label>
          <a href="/forgot-password" className="mb-1.5 text-[12px] text-mist hover:text-white">Forgot?</a>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" placeholder="••••••••••" />
      </div>

      {state.error ? (
        <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-[13px] text-rose-300">{state.error}</p>
      ) : null}

      <SubmitButton>Sign in</SubmitButton>

      <p className="pt-1 text-center text-[13px] text-mist">
        No account yet? <a href="/apply" className="text-white hover:text-gold">Apply for access</a>
      </p>
    </form>
  );
}
