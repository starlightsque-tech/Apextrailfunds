import { prisma } from './prisma';

export type AccountSummary = {
  contributions: number;
  withdrawals: number;
  distributions: number;
  fees: number;
  adjustments: number;
  nav: number;
  units: number;
  entries: Awaited<ReturnType<typeof prisma.ledgerEntry.findMany>>;
};

export async function getCapitalAccount(userId: string): Promise<AccountSummary> {
  const entries = await prisma.ledgerEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const sum = (type: string) =>
    entries.filter((e) => e.type === type).reduce((acc, e) => acc + Number(e.amount), 0);

  const contributions = sum('SUBSCRIPTION');
  const withdrawals = sum('WITHDRAWAL');
  const distributions = sum('DISTRIBUTION');
  const fees = sum('FEE');
  const adjustments = sum('ADJUSTMENT');

  const nav = contributions + distributions + adjustments - withdrawals - fees;
  const units = entries.reduce((acc, e) => {
    const u = e.units ? Number(e.units) : 0;
    if (e.type === 'SUBSCRIPTION' || e.type === 'ADJUSTMENT') return acc + u;
    if (e.type === 'WITHDRAWAL') return acc - u;
    return acc;
  }, 0);

  return { contributions, withdrawals, distributions, fees, adjustments, nav, units, entries };
}
