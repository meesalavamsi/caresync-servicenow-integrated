import nodemailer from 'nodemailer';

/**
 * Email service (Gmail via Nodemailer). Used for OTP codes, staff-approval
 * links, and medication-mismatch SLA escalations. If EMAIL_USER/EMAIL_PASS are
 * absent the service becomes a no-op that logs instead of throwing, so the rest
 * of the app still runs in a credential-less dev environment.
 */
const EMAIL_USER = (process.env.EMAIL_USER || 'vamsim005@gmail.com').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || 'lcdonawikthtoypx').replace(/\s+/g, '').trim();

const configured = Boolean(EMAIL_USER && EMAIL_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })
  : null;

export const emailConfigured = configured;

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!transporter) {
    console.warn(`[Email] Not configured — would have sent to ${to}: "${subject}"`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"CareSync Admin" <${EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`[Email] Sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error('[Email Error] Failed to send:', err?.message);
    return false;
  }
}
