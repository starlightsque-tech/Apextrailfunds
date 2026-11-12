'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/investors', label: 'Investors' },
  { href: '/admin/requests', label: 'Requests' },
  { href: '/admin/plans', label: 'Programmes' },
  { href: '/admin/funding', label: 'Funding accounts' },
  { href: '/admin/ledger', label: 'Capital entries' },
  { href: '/admin/performance', label: 'Performance' },
  { href: '/admin/documents', label: 'Documents' },
  { href: '/admin/email', label: 'Email' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {ITEMS.map((i) => {
        const active = pathname === i.href || (i.href !== '/admin' && pathname.startsWith(i.href));
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition ${
              active ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
