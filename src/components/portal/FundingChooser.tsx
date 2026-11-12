'use client';

import { useMemo, useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export type FundingChannel = {
  id: string;
  label: string;
  kind: string;
  currency: string;
  accountName: string;
  bankName: string | null;
  accountNumber: string | null;
  iban: string | null;
  swift: string | null;
  walletAddress: string | null;
  network: string | null;
  referenceHint: string | null;
  instructions: string | null;
  custodianVerified: boolean;
};

export default function FundingChooser({ channels, email }: { channels: FundingChannel[]; email: string }) {
  const [selectedId, setSelectedId] = useState(channels[0]?.id ?? '');
  const [copied, setCopied] = useState<string | null>(null);

  const selected = useMemo(() => channels.find((c) => c.id === selectedId), [channels, selectedId]);
  const reference = selected
    ? `${selected.referenceHint || 'ATF'}-${email.split('@')[0]}`
    : email;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  const rows = selected
    ? ([
        ['Account name', selected.accountName],
        ['Bank', selected.bankName],
        ['Account number', selected.accountNumber],
        ['IBAN', selected.iban],
        ['SWIFT / BIC', selected.swift],
        ['Wallet', selected.walletAddress],
        ['Network', selected.network]
      ].filter(([, v]) => Boolean(v)) as [string, string][])
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Choose a funding channel</p>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Funding channel">
          {channels.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                  active ? 'border-gold/50 bg-gold/[0.07]' : 'border-line bg-surface hover:border-white/20'
                }`}
              >
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    active ? 'border-gold' : 'border-white/25'
                  }`}
                >
                  {active ? <span className="h-2 w-2 rounded-full bg-gold" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-white/90">{c.label}</span>
                    {c.custodianVerified ? (
                      <span className="chip border-emerald-400/25 bg-emerald-400/10 text-[10px] text-emerald-300">verified</span>
                    ) : (
                      <span className="chip border-amber-400/25 bg-amber-400/10 text-[10px] text-amber-300">unverified</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-mist">
                    {c.kind.replace(/_/g, ' ').toLowerCase()} · {c.currency}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium text-white">{selected.label}</p>
              <p className="mt-1 text-[11.5px] text-mist">
                {selected.kind.replace(/_/g, ' ').toLowerCase()} · {selected.currency}
              </p>
            </div>
            {selected.custodianVerified ? (
              <span className="chip border-emerald-400/25 bg-emerald-400/10 text-[10.5px] text-emerald-300">
                <ShieldCheck size={11} /> custodian verified
              </span>
            ) : (
              <span className="chip border-amber-400/25 bg-amber-400/10 text-[10.5px] text-amber-300">
                <AlertTriangle size={11} /> unverified
              </span>
            )}
          </div>

          {!selected.custodianVerified ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-[11.5px] leading-relaxed text-amber-100/85">
                The manager has not attested that these details belong to the custodian. Confirm directly with the
                custodian before paying anything.
              </p>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 border-b border-line pb-2">
                <span className="text-[12px] text-mist">{k}</span>
                <span className="flex items-center gap-2">
                  <span className="max-w-[220px] break-all text-right font-mono text-[11.5px] text-white/85">{v}</span>
                  <button
                    type="button"
                    aria-label={`Copy ${k}`}
                    onClick={() => copy(v, k)}
                    className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white"
                  >
                    {copied === k ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </span>
              </div>
            ))}
            <div className="flex items-start justify-between gap-3 border-b border-line pb-2">
              <span className="text-[12px] text-mist">Your payment reference</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[11.5px] text-white/85">{reference}</span>
                <button
                  type="button"
                  aria-label="Copy reference"
                  onClick={() => copy(reference, 'ref')}
                  className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white"
                >
                  {copied === 'ref' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </span>
            </div>
          </div>

          {selected.instructions ? (
            <p className="mt-3 text-[12px] leading-relaxed text-mist">{selected.instructions}</p>
          ) : null}

          <p className="mt-4 text-[11px] leading-relaxed text-white/35">
            Use the reference above so the custodian can allocate your payment. After settling, the manager posts the
            entry to your capital account.
          </p>
        </div>
      ) : null}
    </div>
  );
}
