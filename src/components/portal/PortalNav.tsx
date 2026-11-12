'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/account', label: 'Capital account' },
  { href: '/portal/subscribe', label: 'Subscribe' },
  { href: '/portal/redeem', label: 'Redeem' },
  { href: '/portal/documents', label: 'Documents' },
  { href: '/portal/profile', label: 'Profile & security' }
];

export default function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition ${
              active ? 'bg-white/[0.07] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
