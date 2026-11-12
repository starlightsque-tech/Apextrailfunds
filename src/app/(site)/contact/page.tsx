import { getSettings } from '@/lib/settings';
import { MessageSquare, Mail, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact' };

export default async function ContactPage() {
  const s = await getSettings();
  const email = s.adminEmail || 'investors@apextrailfunds.com';

  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Contact</p>
      <h1 className="h1 mt-4 max-w-2xl">Talk to a person.</h1>
      <p className="body mt-6 max-w-xl">
        Existing investors can reach the team from the portal. Prospective investors should apply first so we can
        confirm eligibility before discussing the strategy in detail.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <MessageSquare size={18} className="text-gold" strokeWidth={1.7} />
          <p className="mt-4 text-[15px] font-medium">Live chat</p>
          <p className="mt-2 text-[13px] leading-relaxed text-mist">
            Use the chat launcher in the corner of this page during business hours. For account-specific matters,
            message from inside the portal instead.
          </p>
        </div>
        <div className="card p-6">
          <Mail size={18} className="text-gold" strokeWidth={1.7} />
          <p className="mt-4 text-[15px] font-medium">Email</p>
          <p className="mt-2 text-[13px] leading-relaxed text-mist">Operational and investor enquiries:</p>
          <a href={`mailto:${email}`} className="mt-2 inline-block text-[13px] text-gold hover:underline">{email}</a>
        </div>
        <div className="card p-6">
          <MapPin size={18} className="text-gold" strokeWidth={1.7} />
          <p className="mt-4 text-[15px] font-medium">Registered office</p>
          <p className="mt-2 text-[13px] leading-relaxed text-mist">
            {s.addressLine || 'Address published with the regulatory details in the disclosures.'}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white/[0.02] p-6">
        <p className="text-[13px] font-medium text-white/85">Before you write</p>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-mist">
          <li>• We cannot accept subscription instructions by email — they go through the portal and the custodian.</li>
          <li>• We will never send you a wallet address or ask for a transfer to an individual’s account.</li>
          <li>• We do not provide personal investment, tax or legal advice.</li>
        </ul>
      </div>
    </div>
  );
}
