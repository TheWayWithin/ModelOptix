/**
 * Email Module
 *
 * Provides email sending functionality via Resend with templated emails.
 *
 * Usage:
 * ```ts
 * import { emails } from '@/lib/email';
 *
 * // Send welcome email
 * await emails.sendWelcome('user@example.com', { name: 'John', tier: 'solo', isTrialing: true });
 *
 * // Send opportunity alert
 * await emails.sendOpportunityAlert('user@example.com', { ... });
 * ```
 */

import { sendEmail, type EmailResult } from './client';
import {
  welcomeEmail,
  opportunityAlertEmail,
  trialReminderEmail,
  weeklyDigestEmail,
  priceChangeAlertEmail,
  deprecationAlertEmail,
} from './templates';

// Re-export types and utilities
export { sendEmail, sendEmailAsync, type EmailResult } from './client';
export * from './templates';

/**
 * Email sending functions with templated content
 */
export const emails = {
  /**
   * Send welcome email to new user
   */
  async sendWelcome(
    to: string,
    params: Parameters<typeof welcomeEmail>[0]
  ): Promise<EmailResult> {
    const { subject, html } = welcomeEmail(params);
    return sendEmail({
      to,
      subject,
      html,
      tags: [{ name: 'type', value: 'welcome' }],
    });
  },

  /**
   * Send opportunity alert email
   */
  async sendOpportunityAlert(
    to: string,
    params: Parameters<typeof opportunityAlertEmail>[0]
  ): Promise<EmailResult> {
    const { subject, html } = opportunityAlertEmail(params);
    return sendEmail({
      to,
      subject,
      html,
      tags: [{ name: 'type', value: 'opportunity_alert' }],
    });
  },

  /**
   * Send trial reminder email
   */
  async sendTrialReminder(
    to: string,
    params: Parameters<typeof trialReminderEmail>[0]
  ): Promise<EmailResult> {
    const { subject, html } = trialReminderEmail(params);
    return sendEmail({
      to,
      subject,
      html,
      tags: [{ name: 'type', value: 'trial_reminder' }],
    });
  },

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(
    to: string,
    params: Parameters<typeof weeklyDigestEmail>[0]
  ): Promise<EmailResult> {
    const { subject, html } = weeklyDigestEmail(params);
    return sendEmail({
      to,
      subject,
      html,
      tags: [{ name: 'type', value: 'weekly_digest' }],
    });
  },

  /**
   * Send price change alert email
   */
  async sendPriceChangeAlert(
    to: string,
    params: Parameters<typeof priceChangeAlertEmail>[0]
  ): Promise<EmailResult> {
    const { subject, html } = priceChangeAlertEmail(params);
    return sendEmail({
      to,
      subject,
      html,
      tags: [{ name: 'type', value: 'price_change' }],
    });
  },

  /**
   * Send deprecation alert email
   */
  async sendDeprecationAlert(
    to: string,
    params: Parameters<typeof deprecationAlertEmail>[0]
  ): Promise<EmailResult> {
    const { subject, html } = deprecationAlertEmail(params);
    return sendEmail({
      to,
      subject,
      html,
      tags: [{ name: 'type', value: 'deprecation' }],
    });
  },
};

export default emails;
