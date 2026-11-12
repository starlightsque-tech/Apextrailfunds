import LoginForm from '@/components/forms/LoginForm';

export const metadata = { title: 'Investor login' };

export default function LoginPage({ searchParams }: { searchParams: { reset?: string } }) {
  return (
    <div className="container-x flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-md">
        <p className="eyebrow">Investor portal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="body mt-3">Access your capital account, statements and documents.</p>

        {searchParams.reset ? (
          <p className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[13px] text-emerald-300">
            Password updated. Sign in with your new password.
          </p>
        ) : null}

        <div className="card mt-7 p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-white/35">
          Authorised access only. Sessions expire after seven days, and administrative actions are logged.
        </p>
      </div>
    </div>
  );
}
