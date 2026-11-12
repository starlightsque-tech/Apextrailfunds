'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/strategy', label: 'Strategy' },
  { href: '/plans', label: 'Programmes' },
  { href: '/performance', label: 'Performance' },
  { href: '/fees', label: 'Fees' },
  { href: '/documents', label: 'Documents' },
  { href: '/disclosures', label: 'Disclosures' },
  { href: '/contact', label: 'Contact' }
];

export default function SiteNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 glass">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-7 w-7 place-items-center rounded-md border border-gold/40 bg-gold/10 text-[11px] font-semibold text-gold">
            AT
          </span>
          <span className="text-[15px] font-medium tracking-tight">
            apextrail<span className="text-gold">funds</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13.5px] text-white/65 transition hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href={loggedIn ? '/portal' : '/login'} className="text-[13.5px] text-white/70 transition hover:text-white">
            {loggedIn ? 'Portal' : 'Investor login'}
          </Link>
          <Link href="/signup" className="btn-primary btn-sm">
            Create account
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-ink px-5 pb-5 pt-3 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/[0.06] py-3 text-sm text-white/75"
              >
                {l.label}
              </Link>
            ))}
            <Link href={loggedIn ? '/portal' : '/login'} onClick={() => setOpen(false)} className="py-3 text-sm text-white/75">
              {loggedIn ? 'Investor portal' : 'Investor login'}
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary mt-3">
              Create account
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
