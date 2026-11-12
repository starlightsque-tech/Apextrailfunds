'use client';

import { useEffect, useState } from 'react';

/**
 * Counts elapsed time in a position term. This is deliberately a clock, not an
 * earnings ticker: it reports days elapsed, never money accrued.
 */
export default function TermProgress({
  startedAt,
  termMonths
}: {
  startedAt: string;
  termMonths: number | null;
}) {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.max(0, Math.floor((now - start) / 86_400_000));
  const totalDays = termMonths ? Math.round(termMonths * 30.44) : null;
  const pct = totalDays ? Math.min(100, (days / totalDays) * 100) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="text-mist">Term progress</span>
        <span className="font-mono text-white/80">
          {days} day{days === 1 ? '' : 's'}
          {totalDays ? ` / ${totalDays}` : ''}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gold/60 transition-all"
          style={{ width: pct === null ? '12%' : `${Math.max(2, pct)}%` }}
        />
      </div>
      {totalDays ? (
        <p className="mt-1 text-[10.5px] text-white/30">
          {pct !== null && pct >= 100 ? 'Term complete — awaiting manager settlement' : `${Math.max(0, totalDays - days)} days remaining`}
        </p>
      ) : (
        <p className="mt-1 text-[10.5px] text-white/30">Open-ended programme</p>
      )}
    </div>
  );
}
