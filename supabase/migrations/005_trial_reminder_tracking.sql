-- Migration: Add trial reminder tracking to user_profiles
-- Purpose: Track which trial reminder emails have been sent to avoid duplicates

-- Add trial_reminder_sent column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS trial_reminder_sent TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.trial_reminder_sent IS 'Tracks trial reminder emails sent: null (none), ''first'' (3-day), ''final'' (1-day)';

-- Index for querying users with expiring trials
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires
ON user_profiles (trial_ends_at)
WHERE subscription_status = 'trialing' AND trial_ends_at IS NOT NULL;
