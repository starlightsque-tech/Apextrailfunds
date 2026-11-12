import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = { title: 'Application received' };

export default function ApplySubmittedPage() {
  return (
    <div className="container-x flex justify-center py-20 sm:py-28">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/35 bg-gold/10 text-gold">
          ✓
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Application received</h1>
        <p className="body mt-4">
          Your application is with the manager. We review each one manually, usually within two business days, and we
          will email you when there is a decision. You can follow progress in your portal.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/portal" className="btn-primary">
            Open portal <ArrowRight size={16} />
          </Link>
          <Link href="/disclosures" className="btn-ghost">Read the risk disclosure</Link>
        </div>
        <p className="mt-8 text-[12px] leading-relaxed text-white/35">
          We will never ask you to fund an investment by sending crypto to an address provided in an email or chat.
          Verify any payment instruction with the custodian directly.
        </p>
      </div>
    </div>
  );
}
