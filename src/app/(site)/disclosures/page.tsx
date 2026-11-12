import { getSettings, regulatoryReady } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Risk & disclosures' };

const SECTIONS = [
  {
    title: 'Capital at risk',
    body: 'Digital-asset markets are volatile, fragmented and, in many jurisdictions, lightly regulated. Prices can fall rapidly and without notice. You may lose the entire amount you invest, and you should not invest money you cannot afford to lose entirely.'
  },
  {
    title: 'No promised return',
    body: 'Nothing on this website, in the portal, or in any communication from the manager promises, targets or implies a fixed return, a minimum return, or the preservation of capital. Any performance figures are historical, are net of fees where stated, and are not a forecast.'
  },
  {
    title: 'Custody and counterparty risk',
    body: 'Client assets are held with a third-party custodian and, where derivatives are used, with clearing venues approved under the custody agreement. The manager does not take custody of client assets. A custodian or venue failure could still result in loss or delay.'
  },
  {
    title: 'Liquidity',
    body: 'Redemptions are processed on notice and may be suspended where the manager reasonably determines that markets are disorderly, that positions cannot be liquidated in an orderly way, or where the offering documents permit suspension.'
  },
  {
    title: 'Eligibility and restrictions',
    body: 'The programme is offered only to professional, institutional or high-net-worth investors who meet the eligibility criteria in their own jurisdiction. It is not offered to retail investors, nor to persons in jurisdictions where such an offer would be unlawful. It is your responsibility to confirm that you may lawfully invest.'
  },
  {
    title: 'Verification',
    body: 'Before any subscription is accepted, identity, entity authority and source-of-funds checks are completed, consistent with the custodian’s onboarding requirements and applicable anti-money-laundering rules. Applications that cannot be verified are declined.'
  },
  {
    title: 'Fees reduce returns',
    body: 'Management and performance fees reduce the return to investors. Performance fees are charged only on gains above the previous high-water mark, but they increase the effective cost of participation relative to a fee-free vehicle.'
  },
  {
    title: 'Conflicts and valuation',
    body: 'The manager may hold positions in the same instruments as the fund. Valuations are produced by the administrator using venue marks and the valuation policy in the offering documents; unaudited figures may be subsequently restated.'
  },
  {
    title: 'No advice',
    body: 'Nothing on this site constitutes investment, legal, tax or accounting advice, or a personal recommendation. Consult your own advisers before applying.'
  },
  {
    title: 'Fraud warning',
    body: 'The manager will never ask you to send funds to a personal wallet, to a bank account in an individual’s name, or to any address communicated only by email or chat. Subscription payments are made solely to the custodian’s account as set out in the subscription documents. If you receive such a request, do not act on it and contact us using the details on this site.'
  }
];

export default async function DisclosuresPage() {
  const s = await getSettings();
  const ready = regulatoryReady(s);

  return (
    <div className="container-x py-16 sm:py-20">
      <p className="eyebrow">Risk &amp; disclosures</p>
      <h1 className="h1 mt-4 max-w-3xl">The risks, stated plainly.</h1>
      <p className="body mt-6 max-w-2xl">
        This page summarises the principal risks and the regulatory position. It does not replace the offering
        memorandum or the constitutional documents of the relevant vehicle, which prevail in the event of any
        inconsistency.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="card p-6">
            <h2 className="text-[15px] font-medium text-white">{section.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-mist">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card p-6 sm:p-8">
        <h2 className="h3">Regulatory information</h2>
        {ready ? (
          <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
            <div><dt className="text-mist">Legal entity</dt><dd className="text-white">{s.fundLegalName}</dd></div>
            <div><dt className="text-mist">Jurisdiction</dt><dd className="text-white">{s.jurisdiction}</dd></div>
            <div><dt className="text-mist">Licence / registration</dt><dd className="text-white">{s.licenceRef}</dd></div>
            <div><dt className="text-mist">Custodian</dt><dd className="text-white">{s.custodianName}</dd></div>
            <div><dt className="text-mist">Auditor</dt><dd className="text-white">{s.auditorName || 'Not appointed'}</dd></div>
            {s.addressLine ? <div><dt className="text-mist">Registered address</dt><dd className="text-white">{s.addressLine}</dd></div> : null}
          </dl>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
            <p className="text-[13px] font-medium text-amber-200">Regulatory details pending</p>
            <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-amber-100/80">
              The legal entity, jurisdiction, licence reference, custodian and auditor have not yet been published by
              the manager. Until they are, treat any statement about regulation or custody as unconfirmed, and ask for
              the offering memorandum and custodian agreement before committing funds.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white/[0.02] p-6">
        <p className="text-[12px] leading-relaxed text-white/40">
          This site is operated for the manager of the relevant fund vehicle and is directed only at persons who may
          lawfully receive it. It is not directed at any person in a jurisdiction where its publication or availability
          would be contrary to local law or regulation.
        </p>
      </div>
    </div>
  );
}
