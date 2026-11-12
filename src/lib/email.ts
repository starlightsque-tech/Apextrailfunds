import { prisma } from './prisma';
import { getSettings } from './settings';
import { absoluteUrl, signPurposeToken } from './tokens';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  template: string;
  userId?: string | null;
};

/**
 * Provider selection:
 *   1. EMAIL_PROVIDER env var wins (resend | brevo | none)
 *   2. otherwise whichever API key is present (Brevo preferred, then Resend)
 *   3. otherwise "none" — messages are kept in the admin outbox, nothing is sent
 */
function activeProvider(): 'brevo' | 'resend' | 'none' {
  const explicit = (process.env.EMAIL_PROVIDER ?? '').toLowerCase();
  if (explicit === 'brevo' || explicit === 'resend' || explicit === 'none') {
    if (explicit === 'brevo' && !process.env.BREVO_API_KEY) return 'none';
    if (explicit === 'resend' && !process.env.RESEND_API_KEY) return 'none';
    return explicit;
  }
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'none';
}

export function emailProviderStatus() {
  const provider = activeProvider();
  return {
    provider,
    ready: provider !== 'none',
    detail:
      provider === 'brevo'
        ? 'Brevo configured'
        : provider === 'resend'
          ? 'Resend configured'
          : 'No email provider configured'
  };
}

export async function sendEmail({ to, subject, html, template, userId }: SendArgs) {
  const settings = await getSettings();

  const log = await prisma.emailLog.create({
    data: {
      to,
      subject,
      template,
      body: html.slice(0, 20000),
      userId: userId ?? undefined,
      status: 'QUEUED'
    }
  });

  const provider = activeProvider();

  try {
    if (provider === 'brevo' && process.env.BREVO_API_KEY) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          sender: { name: settings.fundDisplayName, email: settings.fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html
        })
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Brevo ${res.status}: ${detail.slice(0, 300)}`);
      }
      await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'SENT' } });
      return { ok: true as const, queued: false };
    }

    if (provider === 'resend' && process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${settings.fundDisplayName} <${settings.fromEmail}>`,
          to: [to],
          subject,
          html
        })
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
      }
      await prisma.emailLog.update({ where: { id: log.id }, data: { status: 'SENT' } });
      return { ok: true as const, queued: false };
    }

    // No provider configured: the message is retained in the outbox for the admin.
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'QUEUED', error: 'No email provider configured (set BREVO_API_KEY or RESEND_API_KEY).' }
    });
    return { ok: true as const, queued: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', error: message.slice(0, 500) }
    });
    return { ok: false as const, error: message };
  }
}

function shell(settings: { fundDisplayName: string }, heading: string, body: string, footerNote = '') {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14161a">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#a8853a;padding-bottom:20px">${settings.fundDisplayName}</div>
    <div style="background:#ffffff;border:1px solid #e6e4de;border-radius:14px;padding:28px">
      <h1 style="font-size:20px;margin:0 0 16px;line-height:1.35">${heading}</h1>
      <div style="font-size:15px;line-height:1.65;color:#3a3f47">${body}</div>
    </div>
    <div style="font-size:12px;line-height:1.6;color:#8a8f98;padding-top:20px">
      ${footerNote}
      <p>This message is operational correspondence about your account. It is not an offer, solicitation or investment advice. Capital at risk.</p>
    </div>
  </div></body></html>`;
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const settings = await getSettings();
  const token = await signPurposeToken(user.id, 'verify-email', 48);
  const link = absoluteUrl(`/verify-email?token=${token}`);
  return sendEmail({
    to: user.email,
    userId: user.id,
    template: 'verify-email',
    subject: `Confirm your email — ${settings.fundDisplayName}`,
    html: shell(
      settings,
      `Confirm your email address`,
      `<p>Hello ${user.name},</p><p>Please confirm <strong>${user.email}</strong> to continue your investor application.</p>
       <p><a href="${link}" style="display:inline-block;background:#14161a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px">Confirm email</a></p>
       <p style="font-size:13px;color:#8a8f98">Link expires in 48 hours.</p>`
    )
  });
}

export async function sendPasswordResetEmail(user: { id: string; email: string; name: string }) {
  const settings = await getSettings();
  const token = await signPurposeToken(user.id, 'reset-password', 2);
  const link = absoluteUrl(`/reset-password?token=${token}`);
  return sendEmail({
    to: user.email,
    userId: user.id,
    template: 'password-reset',
    subject: `Password reset — ${settings.fundDisplayName}`,
    html: shell(
      settings,
      'Reset your password',
      `<p>Hello ${user.name},</p><p>Use the link below to choose a new password. If you did not request this, you can ignore the message.</p>
       <p><a href="${link}" style="display:inline-block;background:#14161a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px">Choose new password</a></p>
       <p style="font-size:13px;color:#8a8f98">Link expires in 2 hours.</p>`
    )
  });
}

export async function sendApplicationReceived(user: { id: string; email: string; name: string }) {
  const settings = await getSettings();
  return sendEmail({
    to: user.email,
    userId: user.id,
    template: 'application-received',
    subject: `Application received — ${settings.fundDisplayName}`,
    html: shell(
      settings,
      'Your application is with the manager',
      `<p>Hello ${user.name},</p>
       <p>We have received your investor application. A member of the team reviews each application manually, usually within two business days.</p>
       <p>If we need anything further — identification, entity documents or source-of-funds evidence — we will ask through your portal.</p>
       <p><a href="${absoluteUrl('/portal')}" style="display:inline-block;background:#14161a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px">Open portal</a></p>`
    )
  });
}

export async function sendApplicationDecision(
  user: { id: string; email: string; name: string },
  approved: boolean,
  note: string
) {
  const settings = await getSettings();
  return sendEmail({
    to: user.email,
    userId: user.id,
    template: approved ? 'application-approved' : 'application-declined',
    subject: approved
      ? `Access approved — ${settings.fundDisplayName}`
      : `Update on your application — ${settings.fundDisplayName}`,
    html: shell(
      settings,
      approved ? 'Your access is approved' : 'Update on your application',
      approved
        ? `<p>Hello ${user.name},</p><p>Your investor account is now active. You can review the offering documents and submit a subscription request from the portal.</p>
           <p>${note ? `<em>Manager note: ${note}</em></p>` : ''}
           <p>Subscriptions are funded directly with our custodian, ${settings.custodianName || 'details on request'}; the portal never holds your money.</p>
           <p><a href="${absoluteUrl('/portal')}" style="display:inline-block;background:#14161a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px">Open portal</a></p>`
        : `<p>Hello ${user.name},</p><p>We are unable to proceed with your application at this time.</p>
           ${note ? `<p>${note}</p>` : ''}
           <p>You are welcome to reply if you believe this was decided in error.</p>`
    )
  });
}

export async function sendBroadcast(
  recipients: { id: string; email: string; name: string }[],
  subject: string,
  bodyHtml: string
) {
  const settings = await getSettings();
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const token = await signPurposeToken(recipient.id, 'unsubscribe', 24 * 365);
    const html = shell(
      settings,
      subject,
      `${bodyHtml}
       <p style="font-size:12px;color:#8a8f98;margin-top:24px">You receive this because you hold an account with ${settings.fundDisplayName}.
       <a href="${absoluteUrl(`/unsubscribe?token=${token}`)}">Stop non-essential emails</a>.</p>`
    );
    const result = await sendEmail({
      to: recipient.email,
      userId: recipient.id,
      subject,
      html,
      template: 'broadcast'
    });
    if (result.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
