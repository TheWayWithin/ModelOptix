import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type definitions
interface NotificationPreference {
  id: string;
  user_id: string;
  channel: 'email' | 'slack' | 'discord';
  alert_types: string[];
  is_enabled: boolean;
  min_severity: 'info' | 'warning' | 'urgent' | 'critical';
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'never';
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_ALERT_TYPES = ['opportunity', 'price_change'];
const VALID_CHANNELS = ['email', 'slack', 'discord'];
const VALID_SEVERITIES = ['info', 'warning', 'urgent', 'critical'];
const VALID_FREQUENCIES = ['immediate', 'daily_digest', 'weekly_digest', 'never'];

/**
 * GET /api/settings/notifications
 *
 * Get user's notification preferences.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, return defaults for email channel
    if (!preferences || preferences.length === 0) {
      return NextResponse.json({
        preferences: [
          {
            id: null,
            channel: 'email',
            alertTypes: DEFAULT_ALERT_TYPES,
            isEnabled: true,
            minSeverity: 'info',
            frequency: 'immediate',
            webhookUrl: null,
          },
        ],
      });
    }

    // Format response
    const formattedPreferences = preferences.map((pref: NotificationPreference) => ({
      id: pref.id,
      channel: pref.channel,
      alertTypes: pref.alert_types,
      isEnabled: pref.is_enabled,
      minSeverity: pref.min_severity,
      frequency: pref.frequency,
      webhookUrl: pref.webhook_url,
    }));

    return NextResponse.json({ preferences: formattedPreferences });
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/notifications
 *
 * Create or update notification preferences for a channel.
 * Uses upsert to handle both create and update.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      channel,
      alert_types = DEFAULT_ALERT_TYPES,
      is_enabled = true,
      min_severity = 'info',
      frequency = 'immediate',
      webhook_url,
    } = body;

    // Validate channel
    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: 'Valid channel is required (email, slack, discord)' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!VALID_SEVERITIES.includes(min_severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Validate frequency
    if (!VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }

    // Webhook URL required for slack/discord
    if ((channel === 'slack' || channel === 'discord') && is_enabled && !webhook_url) {
      return NextResponse.json(
        { error: `Webhook URL is required for ${channel} channel` },
        { status: 400 }
      );
    }

    // Upsert the preference
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          channel,
          alert_types,
          is_enabled,
          min_severity,
          frequency,
          webhook_url: webhook_url || null,
        },
        {
          onConflict: 'user_id,channel',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting notification preference:', error);
      return NextResponse.json(
        { error: 'Failed to save preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preference: {
        id: data.id,
        channel: data.channel,
        alertTypes: data.alert_types,
        isEnabled: data.is_enabled,
        minSeverity: data.min_severity,
        frequency: data.frequency,
        webhookUrl: data.webhook_url,
      },
    });
  } catch (error) {
    console.error('Notification preferences POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/notifications
 *
 * Delete a notification preference by channel.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: 'Valid channel is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('channel', channel);

    if (error) {
      console.error('Error deleting notification preference:', error);
      return NextResponse.json(
        { error: 'Failed to delete preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification preferences DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
