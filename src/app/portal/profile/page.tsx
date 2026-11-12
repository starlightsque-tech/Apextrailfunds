import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { date } from '@/lib/format';
import { Badge, statusTone } from '@/components/ui/Badge';
import { ProfileForm, PasswordForm, ResendVerification } from '@/components/forms/ProfileForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Profile & security' };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Profile &amp; security</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your details</h1>
      </div>

      <div className="card p-5">
        <div className="mb-5 grid gap-3 border-b border-line pb-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-mist">Email</p>
            <p className="mt-1 text-[13px] text-white/90">{user.email}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-mist">Status</p>
            <p className="mt-1"><Badge tone={statusTone(user.status)}>{user.status}</Badge></p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-mist">Member since</p>
            <p className="mt-1 text-[13px] text-white/90">{date(user.createdAt)}</p>
          </div>
        </div>

        {!user.emailVerified ? (
          <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
            <p className="text-[12.5px] text-amber-100/90">Your email is not yet confirmed.</p>
            <div className="mt-3"><ResendVerification /></div>
          </div>
        ) : null}

        <ProfileForm name={user.name} phone={user.phone ?? ''} country={user.country ?? ''} />
      </div>

      <div className="card p-5">
        <p className="text-[13.5px] font-medium text-white">Password</p>
        <p className="mt-1 text-[12px] text-mist">Use at least 10 characters. Changing your password signs out other browsers within a day.</p>
        <div className="mt-4"><PasswordForm /></div>
      </div>

      <div className="card p-5">
        <p className="text-[13.5px] font-medium text-white">Email preferences</p>
        <p className="mt-1 text-[12px] leading-relaxed text-mist">
          Security, statement and subscription notices are sent regardless of marketing preferences. Non-essential
          updates can be turned off from the link at the bottom of any such email.
        </p>
      </div>
    </div>
  );
}
