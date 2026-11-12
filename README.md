# apextrailfunds

Fund marketing site + investor portal for a systematic digital-asset programme.

The portal records and reports; it does not take custody of client money. Subscriptions are funded at a
licensed third-party custodian, and capital-account entries are posted by the manager only after the
custodian confirms settlement.

## Stack

- Next.js 14 (App Router, server actions)
- PostgreSQL + Prisma
- Tailwind CSS
- Resend for transactional email (optional — falls back to an admin outbox)
- Tawk.to live chat
- Render blueprint (`render.yaml`)

## What is included

**Public site** — landing page, strategy, performance, fees, document library, risk disclosures, contact.
Performance is only ever the manager's published monthly figures; there are no projected, backtested or
"guaranteed" returns anywhere in the code.

**Investor onboarding** — application form (eligibility, experience, intended commitment), account creation,
email confirmation, manager review, approval email, custodian subscription handoff.

**Investor portal** — capital account summary derived from ledger entries, full ledger, subscription and
redemption requests, documents (including private per-investor statements), profile and password management.

**Admin** — application review, investor management and suspension, capital-entry posting, request queue,
monthly performance publishing (draft/published), document uploads with visibility rules, broadcast email
with unsubscribe, per-investor email, settings, and an audit log.

## Local setup

```bash
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET, ADMIN_*
npm install
npx prisma migrate deploy # or: npx prisma db push
npm run seed              # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

Optional sample data for UI review (never on production):

```bash
npm run seed:demo         # demo.investor@example.com / demo-password-123
```

## Deploying to Render (free tier)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, select the repo. `render.yaml` provisions a free Postgres instance,
   the free web service, `AUTH_SECRET`, the database URL and the build/start commands. No card required.
3. Fill the prompted values: `APP_URL` (your canonical https URL), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   and `BREVO_API_KEY` for email delivery.
4. Deploy. Migrations and the admin seed run during the build; health check is `/api/health`.

**Free-tier limits you should plan around**

- The web service sleeps after 15 minutes of inactivity and takes ~30 seconds to wake. The first visit
  after a quiet period will feel slow; that is the platform, not the app.
- Render's free Postgres is deleted **30 days after creation**. Before that date, either upgrade the
  database to a paid plan or point `DATABASE_URL` at a permanent Postgres (Neon, Supabase, Railway, or
  Render's paid Postgres) and redeploy. The app needs no code change — `DATABASE_URL` is the only input.
- Free instances have 512 MB RAM and a shared CPU; fine for a fund site with modest investor traffic.

To swap the database later: create the new Postgres, set `DATABASE_URL` on the web service to the new
internal connection string, then run `npx prisma migrate deploy` once (Render's build already does this on
the next deploy).

After the first deploy, sign in at `/admin` and complete **Settings → Identity**. Until the legal entity,
jurisdiction, licence reference and custodian are filled in, the public site deliberately shows
"regulatory details pending" rather than claiming a licence it does not have.

### Manual (non-blueprint) deploy

Create a Node web service with:

- Build: `npm ci && npx prisma generate && npx prisma migrate deploy && npm run seed && npm run build`
- Start: `npm start`
- Health check: `/api/health`
- Plan: Free (or Starter for always-on)
- Env: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMAIL_FROM`, `BREVO_API_KEY`

## Email

Brevo is the default provider; Resend is also supported and is used when only `RESEND_API_KEY` is present.

- `BREVO_API_KEY` — Brevo v3 transactional API. `EMAIL_FROM` must be an **active sender** in Brevo
  (Senders & IP → Senders). Free tier allows 300 messages/day.
  The blueprint ships with a verified mailbox sender; authenticate the `apextrailfunds.com` domain
  (DKIM + SPF) in Brevo before switching `EMAIL_FROM` to an address on that domain, otherwise sends fail
  with *sender not valid*.
- `RESEND_API_KEY` — optional alternative.
- `EMAIL_PROVIDER` — force `brevo`, `resend` or `none`; detected from the keys when unset.

Without a configured key every message is written to the admin outbox (`/admin/email`) and nothing is
delivered — useful for staging, not for production. The outbox shows the provider's error verbatim, which
is the fastest way to diagnose an unverified sender or a revoked key.

## Operational notes

- Never ask an investor to send funds to a wallet or account in an email. Subscription instructions come
  from the custodian in the subscription documents.
- Post ledger entries only with a custodian reference in the memo. Deleting an entry is audited.
- Publish performance only from the administrator's report, and keep the risk warning intact.
- Identity, entity and source-of-funds verification is a prerequisite for accepting any subscription; the
  portal records decisions but does not replace your compliance file.

## Security

- Passwords: bcrypt (cost 12). Sessions: signed HS256 JWT in an httpOnly, SameSite=Lax cookie, 7 days.
- `AUTH_SECRET` must be 32+ random characters; the app refuses to sign sessions without it.
- Document access is enforced server-side per visibility; private files are owner-or-admin only.
- All admin mutations are role-checked server-side and written to the audit log.
