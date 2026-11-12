import { getSession } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import SiteNav from '@/components/site/SiteNav';
import SiteFooter from '@/components/site/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getSession(), getSettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav loggedIn={Boolean(session)} />
      <main className="flex-1 pt-16">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
