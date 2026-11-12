import ForgotForm from '@/components/forms/ForgotForm';

export const metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <div className="container-x flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-md">
        <p className="eyebrow">Account access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="body mt-3">Enter the email on your account and we will send a time-limited reset link.</p>
        <div className="card mt-7 p-6">
          <ForgotForm />
        </div>
      </div>
    </div>
  );
}
