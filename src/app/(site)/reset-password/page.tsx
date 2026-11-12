import Link from 'next/link';
import ResetForm from '@/components/forms/ResetForm';
import { readPurposeToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? '';
  const claim = token ? await readPurposeToken(token, 'reset-password') : null;

  return (
    <div className="container-x flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-md">
        <p className="eyebrow">Account access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password</h1>
        <div className="card mt-7 p-6">
          {claim ? (
            <ResetForm token={token} />
          ) : (
            <div className="space-y-4">
              <p className="text-[14px] text-white/80">This reset link is invalid or has expired.</p>
              <Link href="/forgot-password" className="btn-primary w-full">Request a new link</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
