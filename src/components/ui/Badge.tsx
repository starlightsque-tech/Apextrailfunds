import { clsx } from 'clsx';

type Tone = 'neutral' | 'gold' | 'green' | 'red' | 'amber' | 'blue';

const tones: Record<Tone, string> = {
  neutral: 'border-white/12 bg-white/[0.04] text-white/70',
  gold: 'border-gold/35 bg-gold/10 text-gold-soft',
  green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  red: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
  amber: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  blue: 'border-sky-400/25 bg-sky-400/10 text-sky-300'
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={clsx('chip', tones[tone])}>{children}</span>;
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'SENT':
    case 'SETTLED':
      return 'green';
    case 'PENDING':
    case 'REQUESTED':
    case 'QUEUED':
      return 'amber';
    case 'SUSPENDED':
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
      return 'red';
    case 'INSTRUCTED':
      return 'blue';
    default:
      return 'neutral';
  }
}
