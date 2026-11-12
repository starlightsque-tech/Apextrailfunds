import Link from 'next/link';
import { FundSettings, regulatorLine } from '@/lib/settings';

export default function SiteFooter({ settings }: { settings: FundSettings }) {
  return (
    <footer className="mt-24 border-t border-line bg-[#080a0d]">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md border border-gold/40 bg-gold/10 text-[11px] font-semibold text-gold">
                AT
              </span>
              <span className="text-[15px] font-medium">
                apextrail<span className="text-gold">funds</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-mist">
              A systematic digital-asset investment programme for professional and institutional investors.
              Custody and execution are held with a licensed third-party custodian; the portal does not hold client money.
            </p>
            <p className="mt-4 text-[12px] leading-relaxed text-white/45">{regulatorLine(settings)}</p>
            {settings.addressLine ? <p className="mt-1 text-[12px] text-white/45">{settings.addressLine}</p> : null}
          </div>

          <div>
            <p className="eyebrow">Fund</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-white/65">
              <li><Link href="/strategy" className="hover:text-white">Strategy</Link></li>
              <li><Link href="/performance" className="hover:text-white">Performance</Link></li>
              <li><Link href="/fees" className="hover:text-white">Fees</Link></li>
              <li><Link href="/documents" className="hover:text-white">Documents</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">Investors</p>
            <ul className="mt-4 space-y-2.5 text-[13px] text-white/65">
              <li><Link href="/login" className="hover:text-white">Investor login</Link></li>
              <li><Link href="/apply" className="hover:text-white">Apply for access</Link></li>
              <li><Link href="/disclosures" className="hover:text-white">Risk &amp; disclosures</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-[11.5px] leading-relaxed text-white/40">
            <strong className="font-medium text-white/60">Risk warning.</strong> Investments in digital assets are
            speculative and involve a high degree of risk, including the possible loss of the entire amount invested.
            Past performance is not a reliable indicator of future results. No return, distribution or capital
            protection is promised or implied. Nothing on this site is an offer or solicitation in any jurisdiction
            where such an offer would be unlawful, and information here is not investment, legal or tax advice.
            Eligibility is subject to the offering documents of the relevant vehicle and to manager approval.
          </p>
          <p className="mt-4 text-[11.5px] text-white/35">
            © {new Date().getFullYear()} {settings.fundLegalName || settings.fundDisplayName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
