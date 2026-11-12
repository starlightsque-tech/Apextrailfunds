import { redirect } from 'next/navigation';
import SignupForm from '@/components/forms/SignupForm';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create an account' };

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect(session.role === 'ADMIN' ? '/admin' : '/portal');

  return (
    <div className="container-x py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow">Create an account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Start with an account, not a deposit.</h1>
          <p className="body mt-5">
            Registration opens your investor profile: portfolio, documents and funding instructions once approved.
            Nothing is invested when you sign up, and funds are never sent to an address we email you.
          </p>

          <div className="mt-8 space-y-4">
            {[
              ['Account', 'Name, email, phone, country, password'],
              ['Then', "Eligibility review by the manager"],
              ['Then', 'Custodian verification and subscription documents'],
              ['Finally', 'Funding from the custodian’s verified account']
            ].map(([k, v]) => (
              <div key={k + v} className="flex items-start gap-4 border-b border-line pb-3">
                <span className="mt-0.5 w-16 shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/35">{k}</span>
                <span className="text-[13px] text-white/80">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-line bg-white/[0.02] p-5">
            <p className="text-[13px] font-medium text-white/85">Fraud warning</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
              apextrailfunds will never ask for your password, a one-time code, or a transfer to a personal wallet.
              Subscription money goes only to the custodian’s account, as set out in your documents.
            </p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
