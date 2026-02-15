'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User, CreditCard, Bell, ExternalLink, Check, Mail, AlertCircle } from 'lucide-react';
import { tierConfigs, type SubscriptionTier } from '@/lib/stripe';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  company_name: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  stripe_customer_id: string | null;
}

interface NotificationPreference {
  id: string | null;
  channel: 'email' | 'slack' | 'discord';
  alertTypes: string[];
  isEnabled: boolean;
  minSeverity: 'info' | 'warning' | 'urgent' | 'critical';
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'never';
  webhookUrl: string | null;
}

const ALERT_TYPE_OPTIONS = [
  { value: 'opportunity', label: 'New Opportunities', description: 'When we find a better model for you' },
  { value: 'price_change', label: 'Price Changes', description: 'When model pricing changes significantly' },
  { value: 'deprecation', label: 'Model Deprecations', description: 'When a model you use is being deprecated' },
  { value: 'savings_report', label: 'Savings Reports', description: 'Weekly summary of your savings' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Notification preferences state
  const [emailPrefs, setEmailPrefs] = useState<NotificationPreference | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  const loadNotificationPreferences = useCallback(async () => {
    setNotifLoading(true);
    try {
      const response = await fetch('/api/settings/notifications');
      if (response.ok) {
        const data = await response.json();
        // Find email preferences (we're only supporting email for MVP)
        const email = data.preferences.find((p: NotificationPreference) => p.channel === 'email');
        if (email) {
          setEmailPrefs(email);
        } else {
          // Default email preferences
          setEmailPrefs({
            id: null,
            channel: 'email',
            alertTypes: ['opportunity', 'price_change'],
            isEnabled: true,
            minSeverity: 'info',
            frequency: 'immediate',
            webhookUrl: null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
      setDisplayName(data.display_name || '');
      setCompanyName(data.company_name || '');
      setLoading(false);
    }

    loadProfile();
    loadNotificationPreferences();
  }, [router, loadNotificationPreferences]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({
        display_name: displayName || null,
        company_name: companyName || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    if (!emailPrefs) return;

    setNotifSaving(true);
    setNotifError(null);

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          alert_types: emailPrefs.alertTypes,
          is_enabled: emailPrefs.isEnabled,
          min_severity: emailPrefs.minSeverity,
          frequency: emailPrefs.frequency,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await response.json();
      setEmailPrefs(data.preference);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setNotifError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setNotifSaving(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setPortalLoading(true);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const toggleAlertType = (alertType: string) => {
    if (!emailPrefs) return;
    const newAlertTypes = emailPrefs.alertTypes.includes(alertType)
      ? emailPrefs.alertTypes.filter((t) => t !== alertType)
      : [...emailPrefs.alertTypes, alertType];
    setEmailPrefs({ ...emailPrefs, alertTypes: newAlertTypes });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tierConfig = profile ? tierConfigs[profile.subscription_tier] || tierConfigs.free : tierConfigs.free;

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account settings and preferences
      </p>

      <div className="mt-8 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your company (optional)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tierConfig.name} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.subscription_tier === 'free'
                      ? 'Free tier - limited features'
                      : tierConfig.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    profile?.subscription_status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : profile?.subscription_status === 'trialing'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : profile?.subscription_status === 'past_due'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {profile?.subscription_status === 'active' ? 'Active' :
                     profile?.subscription_status === 'trialing' ? 'Trial' :
                     profile?.subscription_status === 'past_due' ? 'Past Due' :
                     profile?.subscription_status === 'cancelled' ? 'Cancelled' : 'Inactive'}
                  </span>
                </div>
              </div>

              {profile?.subscription_tier !== 'free' && (
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Products</span>
                    <span>{tierConfig.features.products === 'unlimited' ? 'Unlimited' : tierConfig.features.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sanity Checks/Month</span>
                    <span>{tierConfig.features.sanityChecksPerMonth === 'unlimited' ? 'Unlimited' : tierConfig.features.sanityChecksPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Test History</span>
                    <span>{tierConfig.features.testHistory}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {profile?.stripe_customer_id ? (
                <Button
                  variant="outline"
                  onClick={handleOpenBillingPortal}
                  disabled={portalLoading}
                >
                  {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => router.push('/pricing')}
                >
                  Upgrade Plan
                </Button>
              )}

              {profile?.subscription_tier === 'free' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/pricing')}
                >
                  View Plans
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Email preferences and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notifLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : emailPrefs ? (
              <>
                {/* Email Notifications Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts and updates via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={emailPrefs.isEnabled}
                    onCheckedChange={(checked) =>
                      setEmailPrefs({ ...emailPrefs, isEnabled: checked })
                    }
                  />
                </div>

                {emailPrefs.isEnabled && (
                  <>
                    {/* Alert Types */}
                    <div className="space-y-3">
                      <Label>Alert Types</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose which notifications you want to receive
                      </p>
                      <div className="space-y-3">
                        {ALERT_TYPE_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-start space-x-3"
                          >
                            <Checkbox
                              id={option.value}
                              checked={emailPrefs.alertTypes.includes(option.value)}
                              onCheckedChange={() => toggleAlertType(option.value)}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={option.value}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {option.label}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={emailPrefs.frequency}
                        onValueChange={(value: NotificationPreference['frequency']) =>
                          setEmailPrefs({ ...emailPrefs, frequency: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily_digest">Daily Digest</SelectItem>
                          <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {emailPrefs.frequency === 'immediate'
                          ? 'Get notified as soon as something happens'
                          : emailPrefs.frequency === 'daily_digest'
                          ? 'Receive a daily summary of all notifications'
                          : 'Receive a weekly summary of all notifications'}
                      </p>
                    </div>

                    {/* Minimum Severity */}
                    <div className="space-y-2">
                      <Label>Minimum Severity</Label>
                      <Select
                        value={emailPrefs.minSeverity}
                        onValueChange={(value: NotificationPreference['minSeverity']) =>
                          setEmailPrefs({ ...emailPrefs, minSeverity: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">All (Info and above)</SelectItem>
                          <SelectItem value="warning">Warning and above</SelectItem>
                          <SelectItem value="urgent">Urgent and above</SelectItem>
                          <SelectItem value="critical">Critical only</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Only receive notifications at this severity level or higher
                      </p>
                    </div>
                  </>
                )}

                {notifError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {notifError}
                  </div>
                )}

                <Button onClick={handleSaveNotifications} disabled={notifSaving}>
                  {notifSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notification Preferences
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unable to load notification preferences. Please refresh the page.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
