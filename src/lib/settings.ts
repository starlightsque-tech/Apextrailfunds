import { prisma } from './prisma';

export type FundSettings = {
  fundDisplayName: string;
  fundLegalName: string;
  custodianName: string;
  jurisdiction: string;
  licenceRef: string;
  auditorName: string;
  adminEmail: string;
  fromEmail: string;
  minSubscription: string;
  liquidityNoticeDays: string;
  managementFee: string;
  performanceFee: string;
  addressLine: string;
  complianceApproved: string;
};

const DEFAULTS: FundSettings = {
  fundDisplayName: 'apextrailfunds',
  fundLegalName: '',
  custodianName: '',
  jurisdiction: '',
  licenceRef: '',
  auditorName: '',
  adminEmail: '',
  fromEmail: 'no-reply@apextrailfunds.com',
  minSubscription: '25000',
  liquidityNoticeDays: '30',
  managementFee: '1.50',
  performanceFee: '15',
  addressLine: '',
  complianceApproved: 'false'
};

export async function getSettings(): Promise<FundSettings> {
  try {
    const rows = await prisma.setting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULTS, ...map } as FundSettings;
  } catch {
    return DEFAULTS;
  }
}

/**
 * Regulatory identity is only treated as real when the manager has supplied it.
 * Nothing here invents a licence, custodian or regulator.
 */
export function regulatoryReady(s: FundSettings) {
  return Boolean(s.fundLegalName && s.custodianName && s.jurisdiction && s.licenceRef);
}

export function regulatorLine(s: FundSettings) {
  if (!regulatoryReady(s)) return 'Regulatory and custody details pending manager confirmation.';
  return `${s.fundLegalName} · ${s.jurisdiction} · Licence ${s.licenceRef} · Custody: ${s.custodianName}`;
}
