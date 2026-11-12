import type { Metadata } from 'next';
import './globals.css';
import TawkWidget from '@/components/site/TawkWidget';

export const metadata: Metadata = {
  title: {
    default: 'apextrailfunds — systematic digital-asset fund',
    template: '%s · apextrailfunds'
  },
  description:
    'apextrailfunds is a systematic digital-asset investment fund. Investor portal for approved investors, with custody and execution held at a licensed third-party custodian.',
  metadataBase: new URL(process.env.APP_URL ?? 'https://apextrailfunds.com'),
  openGraph: {
    title: 'apextrailfunds',
    description: 'Systematic digital-asset fund. Custody held with a licensed third-party custodian.',
    type: 'website'
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-sans text-white antialiased">
        {children}
        <TawkWidget />
      </body>
    </html>
  );
}
