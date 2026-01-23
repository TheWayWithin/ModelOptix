/**
 * Trial Reminder Job
 *
 * Sends reminder emails to users whose trials are about to expire.
 * - 3 days before: First reminder
 * - 1 day before: Final reminder
 *
 * Schedule: Daily at 9:00 AM UTC (0 9 * * *)
 *
 * @see architecture.md Section 8 - Background Jobs
 */

import { createServiceClient } from '@/lib/supabase/service';
import { emails } from '@/lib/email';

export interface TrialReminderResult {
  remindersSent: number;
  firstReminders: number;
  finalReminders: number;
  errors: number;
  message: string;
}

interface UserWithTrial {
  id: string;
  email: string;
  display_name: string | null;
  trial_ends_at: string;
  subscription_tier: string;
  trial_reminder_sent: string | null;
}

/**
 * Send trial reminder emails to users with expiring trials.
 *
 * @returns Result with reminder statistics
 */
export async function sendTrialReminders(): Promise<TrialReminderResult> {
  console.log('[TrialReminder] Starting trial reminder job');

  const supabase = createServiceClient();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  let firstReminders = 0;
  let finalReminders = 0;
  let errors = 0;

  // Find users with trials ending in the next 3 days
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, email, display_name, trial_ends_at, subscription_tier, trial_reminder_sent')
    .eq('subscription_status', 'trialing')
    .not('trial_ends_at', 'is', null)
    .lt('trial_ends_at', threeDaysFromNow.toISOString())
    .gt('trial_ends_at', now.toISOString());

  if (error) {
    console.error('[TrialReminder] Failed to fetch users:', error);
    return {
      remindersSent: 0,
      firstReminders: 0,
      finalReminders: 0,
      errors: 1,
      message: `Failed to fetch users: ${error.message}`,
    };
  }

  if (!users || users.length === 0) {
    console.log('[TrialReminder] No users with expiring trials found');
    return {
      remindersSent: 0,
      firstReminders: 0,
      finalReminders: 0,
      errors: 0,
      message: 'No users with expiring trials',
    };
  }

  console.log(`[TrialReminder] Found ${users.length} users with expiring trials`);

  for (const user of users as UserWithTrial[]) {
    const trialEndDate = new Date(user.trial_ends_at);
    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Determine which reminder to send
    let reminderType: 'first' | 'final' | null = null;

    if (daysRemaining <= 1 && user.trial_reminder_sent !== 'final') {
      reminderType = 'final';
    } else if (daysRemaining <= 3 && !user.trial_reminder_sent) {
      reminderType = 'first';
    }

    if (!reminderType) {
      // Already sent appropriate reminder
      continue;
    }

    // Get user email from auth if not in profile
    let userEmail = user.email;
    if (!userEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
      userEmail = authUser?.user?.email || '';
    }

    if (!userEmail) {
      console.warn(`[TrialReminder] No email found for user ${user.id}`);
      continue;
    }

    try {
      const firstName = user.display_name?.split(' ')[0] || 'there';

      // Get total savings found for this user
      const { data: savingsData } = await supabase
        .from('opportunities')
        .select('monthly_savings')
        .eq('user_id', user.id)
        .eq('status', 'open');

      const opportunities = savingsData as { monthly_savings: number | null }[] | null;
      const totalSavingsFound = opportunities?.reduce(
        (sum, opp) => sum + (opp.monthly_savings || 0),
        0
      ) || 0;

      await emails.sendTrialReminder(userEmail, {
        name: firstName,
        daysRemaining,
        totalSavingsFound,
        tier: user.subscription_tier,
      });

      // Update reminder tracking
      // Note: trial_reminder_sent column added in migration 005
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('user_profiles') as any)
        .update({
          trial_reminder_sent: reminderType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (reminderType === 'first') {
        firstReminders++;
      } else {
        finalReminders++;
      }

      console.log(
        `[TrialReminder] Sent ${reminderType} reminder to ${userEmail} (${daysRemaining} days remaining)`
      );
    } catch (emailError) {
      console.error(
        `[TrialReminder] Failed to send reminder to ${userEmail}:`,
        emailError
      );
      errors++;
    }
  }

  const totalSent = firstReminders + finalReminders;
  console.log(
    `[TrialReminder] Completed: ${totalSent} reminders sent (${firstReminders} first, ${finalReminders} final), ${errors} errors`
  );

  return {
    remindersSent: totalSent,
    firstReminders,
    finalReminders,
    errors,
    message: `Sent ${totalSent} trial reminders (${firstReminders} first, ${finalReminders} final)`,
  };
}
