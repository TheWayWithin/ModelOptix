import { Resend } from 'resend';

// Lazy-initialized Resend client (avoids build-time crash when env var missing)
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Email sender configuration
const FROM_EMAIL = 'ModelOptix <hello@modeloptix.com>';
const SUPPORT_EMAIL = 'support@modeloptix.com';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || SUPPORT_EMAIL,
      tags: options.tags,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Send email with error logging but no throw (fire-and-forget)
 */
export async function sendEmailAsync(options: SendEmailOptions): Promise<void> {
  const result = await sendEmail(options);
  if (!result.success) {
    console.error(`Failed to send email to ${options.to}: ${result.error}`);
  }
}

export { FROM_EMAIL, SUPPORT_EMAIL };
