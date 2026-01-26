-- ============================================================================
-- COMBINED MIGRATIONS FOR MODELOPTIX STAGING
-- Run this in Supabase SQL Editor: https://hnjnazfkeaptmfxodzmq.supabase.co
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: INITIAL SCHEMA
-- ============================================================================

-- Enable pgvector for natural language search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Extended user profiles (references Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    company_name TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'solo', 'growth', 'pro')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    trial_ends_at TIMESTAMPTZ,
    billing_cycle_anchor TIMESTAMPTZ,
    monthly_opportunity_count INTEGER NOT NULL DEFAULT 0,
    monthly_sanity_check_count INTEGER NOT NULL DEFAULT 0,
    onboarding_completed_at TIMESTAMPTZ,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User's AI products/applications
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT CHECK (category IN ('chatbot', 'agent', 'copilot', 'automation', 'analytics', 'other')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Features/functions within products
CREATE TABLE functions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    latency_requirement_ms INTEGER,
    quality_requirement TEXT CHECK (quality_requirement IN ('best', 'good', 'acceptable')),
    monthly_volume INTEGER,
    avg_input_tokens INTEGER,
    avg_output_tokens INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Model providers (OpenAI, Anthropic, Google, etc.)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    hq_country TEXT,
    api_base_url TEXT,
    trust_tier TEXT NOT NULL DEFAULT 'unknown' CHECK (trust_tier IN ('A', 'B', 'C', 'unknown')),
    trust_tier_reason TEXT,
    logo_url TEXT,
    documentation_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'beta')),
    features JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LLM catalog with pricing, latency, capabilities, benchmarks
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    openrouter_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    context_length INTEGER NOT NULL,
    max_output_tokens INTEGER,
    latency_p50 INTEGER,
    latency_p95 INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    supports_vision BOOLEAN NOT NULL DEFAULT FALSE,
    supports_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
    supports_streaming BOOLEAN NOT NULL DEFAULT FALSE,
    supports_json_mode BOOLEAN NOT NULL DEFAULT FALSE,
    supports_system_prompt BOOLEAN NOT NULL DEFAULT TRUE,
    benchmarks JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '{}',
    embedding vector(1536),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'preview', 'sunset')),
    deprecated_at TIMESTAMPTZ,
    sunset_at TIMESTAMPTZ,
    replacement_model_id UUID REFERENCES models(id),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    release_date DATE,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specific LLM usage within functions
CREATE TABLE use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_id UUID NOT NULL REFERENCES functions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    current_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    primary_need TEXT NOT NULL CHECK (primary_need IN ('cost', 'speed', 'quality', 'trust', 'context')),
    secondary_need TEXT CHECK (secondary_need IN ('cost', 'speed', 'quality', 'trust', 'context')),
    tertiary_need TEXT CHECK (tertiary_need IN ('cost', 'speed', 'quality', 'trust', 'context')),
    use_equal_weights BOOLEAN DEFAULT FALSE,
    required_context INTEGER DEFAULT 4096,
    estimated_monthly_tokens BIGINT,
    estimated_monthly_spend DECIMAL(10,2),
    input_type TEXT CHECK (input_type IN ('text', 'code', 'structured', 'multimodal')),
    output_type TEXT CHECK (output_type IN ('text', 'code', 'json', 'classification')),
    requires_vision BOOLEAN NOT NULL DEFAULT FALSE,
    requires_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
    requires_streaming BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_cost_current DECIMAL(10,2),
    monthly_cost_optimized DECIMAL(10,2),
    last_analyzed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: same model available from different providers
CREATE TABLE model_provider_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    input_price DECIMAL(12,8),
    output_price DECIMAL(12,8),
    cached_input_price DECIMAL(12,8),
    is_primary BOOLEAN DEFAULT FALSE,
    availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'waitlist', 'limited', 'deprecated')),
    rate_limits JSONB NOT NULL DEFAULT '{}',
    last_synced_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(model_id, provider_id)
);

-- Trust scores by dimension
CREATE TABLE model_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    dimension TEXT NOT NULL CHECK (dimension IN ('data_handling', 'transparency', 'security', 'reliability', 'consistency', 'safety', 'accuracy', 'cost_stability')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    confidence DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
    evidence TEXT,
    source_url TEXT,
    sample_size INTEGER,
    measurement_period_days INTEGER,
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(model_id, dimension)
);

-- Parameter compatibility matrix
CREATE TABLE parameter_support (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    is_supported BOOLEAN DEFAULT TRUE,
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    default_value DECIMAL(10,4),
    value_type TEXT NOT NULL DEFAULT 'float' CHECK (value_type IN ('integer', 'float', 'boolean', 'string', 'array')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(model_id, parameter_name)
);

-- Admin "kill switch" for model exclusion/downranking
CREATE TABLE editorial_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    override_type TEXT NOT NULL CHECK (override_type IN ('exclude', 'downrank', 'flag')),
    reason TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    warning_message TEXT,
    downrank_factor DECIMAL(3,2) DEFAULT 1.0 CHECK (downrank_factor > 0 AND downrank_factor <= 2.0),
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recommendations with improvement metrics
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
    recommended_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('cost_saving', 'speed_improvement', 'quality_upgrade', 'trust_upgrade')),
    improvement_percentage DECIMAL(5,2),
    estimated_monthly_savings DECIMAL(10,2),
    confidence_score DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    evidence JSONB,
    recommendation_reason TEXT,
    trade_offs TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'accepted', 'expired')),
    dismissed_reason TEXT,
    actioned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Side-by-side model comparisons
CREATE TABLE sanity_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    test_parameters JSONB NOT NULL DEFAULT '{}',
    current_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    recommended_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    current_response TEXT,
    recommended_response TEXT,
    current_latency INTEGER,
    recommended_latency INTEGER,
    current_tokens_used INTEGER,
    recommended_tokens_used INTEGER,
    current_cost DECIMAL(10,6),
    recommended_cost DECIMAL(10,6),
    user_preference TEXT CHECK (user_preference IN ('current', 'recommended', 'neither', 'tie')),
    user_notes TEXT,
    evaluation_criteria JSONB NOT NULL DEFAULT '{}',
    is_guest BOOLEAN DEFAULT FALSE,
    guest_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'expired')),
    error_message TEXT,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications for users
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('opportunity', 'price_change', 'model_deprecated', 'trust_change', 'new_model', 'usage_limit', 'subscription', 'system')),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent', 'critical')),
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    action_label TEXT,
    related_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    related_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    related_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User alert preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'discord')),
    alert_types TEXT[] DEFAULT ARRAY['opportunity', 'price_change'],
    is_enabled BOOLEAN DEFAULT TRUE,
    min_severity TEXT NOT NULL DEFAULT 'info' CHECK (min_severity IN ('info', 'warning', 'urgent', 'critical')),
    frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily_digest', 'weekly_digest', 'never')),
    webhook_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, channel)
);

-- Job locking and heartbeat tracking
CREATE TABLE job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    cursor TEXT,
    items_processed INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique partial index to prevent concurrent runs of same job
CREATE UNIQUE INDEX idx_job_runs_active_lock
    ON job_runs(job_name)
    WHERE status = 'running';

-- Idempotency for webhooks
CREATE TABLE webhook_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe', 'github', 'resend', 'system')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'ignored')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    payload JSONB,
    response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tier limit enforcement
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    products_count INTEGER DEFAULT 0,
    functions_count INTEGER DEFAULT 0,
    sanity_checks_used INTEGER DEFAULT 0,
    products_limit INTEGER NOT NULL,
    sanity_checks_limit INTEGER NOT NULL,
    limit_warning_sent BOOLEAN NOT NULL DEFAULT FALSE,
    limit_warning_sent_at TIMESTAMPTZ,
    limit_reached_sent BOOLEAN NOT NULL DEFAULT FALSE,
    limit_reached_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- User domain indexes
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_user_status ON products(user_id, status);
CREATE INDEX idx_functions_product_id ON functions(product_id);
CREATE INDEX idx_use_cases_function_id ON use_cases(function_id) WHERE status = 'active';
CREATE INDEX idx_use_cases_current_model ON use_cases(current_model_id) WHERE current_model_id IS NOT NULL;

-- Model domain indexes
CREATE INDEX idx_models_provider_id ON models(provider_id);
CREATE INDEX idx_models_openrouter_id ON models(openrouter_id);
CREATE INDEX idx_models_available ON models(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_featured ON models(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_models_context_length ON models(context_length);
CREATE INDEX idx_providers_trust_tier ON providers(trust_tier);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_model_provider_pricing_model ON model_provider_pricing(model_id);
CREATE INDEX idx_model_provider_pricing_provider ON model_provider_pricing(provider_id);
CREATE INDEX idx_model_trust_scores_model ON model_trust_scores(model_id);
CREATE INDEX idx_parameter_support_model ON parameter_support(model_id);
CREATE INDEX idx_editorial_overrides_model ON editorial_overrides(model_id) WHERE active = TRUE;

-- Action domain indexes
CREATE INDEX idx_opportunities_use_case ON opportunities(use_case_id) WHERE status = 'active';
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_savings ON opportunities(estimated_monthly_savings DESC NULLS LAST);
CREATE INDEX idx_sanity_checks_user ON sanity_checks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sanity_checks_guest ON sanity_checks(created_at) WHERE is_guest = TRUE;
CREATE INDEX idx_sanity_checks_status ON sanity_checks(status);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Infrastructure indexes
CREATE INDEX idx_job_runs_name_status ON job_runs(job_name, status);
CREATE INDEX idx_job_runs_stale ON job_runs(heartbeat_at) WHERE status = 'running';
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month);

-- Vector similarity search index
CREATE INDEX idx_models_embedding ON models USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_functions_updated_at BEFORE UPDATE ON functions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_use_cases_updated_at BEFORE UPDATE ON use_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_provider_pricing_updated_at BEFORE UPDATE ON model_provider_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_trust_scores_updated_at BEFORE UPDATE ON model_trust_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parameter_support_updated_at BEFORE UPDATE ON parameter_support FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_editorial_overrides_updated_at BEFORE UPDATE ON editorial_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sanity_checks_updated_at BEFORE UPDATE ON sanity_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 002: RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanity_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_provider_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- products policies
CREATE POLICY products_select ON products FOR SELECT USING (user_id = auth.uid());
CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY products_update ON products FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY products_delete ON products FOR DELETE USING (user_id = auth.uid());

-- functions policies
CREATE POLICY functions_select ON functions FOR SELECT USING (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));
CREATE POLICY functions_insert ON functions FOR INSERT WITH CHECK (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));
CREATE POLICY functions_update ON functions FOR UPDATE USING (product_id IN (SELECT id FROM products WHERE user_id = auth.uid())) WITH CHECK (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));
CREATE POLICY functions_delete ON functions FOR DELETE USING (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));

-- use_cases policies
CREATE POLICY use_cases_select ON use_cases FOR SELECT USING (function_id IN (SELECT f.id FROM functions f JOIN products p ON f.product_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY use_cases_insert ON use_cases FOR INSERT WITH CHECK (function_id IN (SELECT f.id FROM functions f JOIN products p ON f.product_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY use_cases_update ON use_cases FOR UPDATE USING (function_id IN (SELECT f.id FROM functions f JOIN products p ON f.product_id = p.id WHERE p.user_id = auth.uid())) WITH CHECK (function_id IN (SELECT f.id FROM functions f JOIN products p ON f.product_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY use_cases_delete ON use_cases FOR DELETE USING (function_id IN (SELECT f.id FROM functions f JOIN products p ON f.product_id = p.id WHERE p.user_id = auth.uid()));

-- opportunities policies
CREATE POLICY opportunities_select ON opportunities FOR SELECT USING (use_case_id IN (SELECT uc.id FROM use_cases uc JOIN functions f ON uc.function_id = f.id JOIN products p ON f.product_id = p.id WHERE p.user_id = auth.uid()));

-- sanity_checks policies
CREATE POLICY sanity_checks_select ON sanity_checks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sanity_checks_insert ON sanity_checks FOR INSERT WITH CHECK (user_id = auth.uid() AND is_guest = FALSE);

-- alerts policies
CREATE POLICY alerts_select ON alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY alerts_update ON alerts FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- notification_preferences policies
CREATE POLICY notification_preferences_select ON notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notification_preferences_insert ON notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY notification_preferences_update ON notification_preferences FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notification_preferences_delete ON notification_preferences FOR DELETE USING (user_id = auth.uid());

-- usage_tracking policies
CREATE POLICY usage_tracking_select ON usage_tracking FOR SELECT USING (user_id = auth.uid());

-- Public read policies for catalog data
CREATE POLICY models_select ON models FOR SELECT USING (true);
CREATE POLICY providers_select ON providers FOR SELECT USING (true);
CREATE POLICY model_provider_pricing_select ON model_provider_pricing FOR SELECT USING (true);
CREATE POLICY parameter_support_select ON parameter_support FOR SELECT USING (true);
CREATE POLICY model_trust_scores_select ON model_trust_scores FOR SELECT USING (true);
CREATE POLICY editorial_overrides_select ON editorial_overrides FOR SELECT USING (true);

-- Helper functions
CREATE OR REPLACE FUNCTION user_owns_product(product_uuid UUID) RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM products WHERE id = product_uuid AND user_id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_owns_function(function_uuid UUID) RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM functions f JOIN products p ON f.product_id = p.id WHERE f.id = function_uuid AND p.user_id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_owns_use_case(use_case_uuid UUID) RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM use_cases uc JOIN functions f ON uc.function_id = f.id JOIN products p ON f.product_id = p.id WHERE uc.id = use_case_uuid AND p.user_id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION 003: AUTH TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _display_name TEXT;
BEGIN
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO public.user_profiles (
    id, email, display_name, subscription_tier, subscription_status, is_admin, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, _display_name, 'free', 'active', FALSE, NOW(), NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================================================
-- MIGRATION 004: SAVINGS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    function_id UUID REFERENCES functions(id) ON DELETE SET NULL,
    old_model TEXT NOT NULL,
    old_provider TEXT NOT NULL,
    new_model TEXT NOT NULL,
    new_provider TEXT NOT NULL,
    monthly_savings DECIMAL(10, 2) NOT NULL,
    savings_percentage DECIMAL(5, 2),
    switched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE savings_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings" ON savings_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings" ON savings_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings" ON savings_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings" ON savings_records FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_records_user_id ON savings_records(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_records_switched_at ON savings_records(switched_at);
CREATE INDEX IF NOT EXISTS idx_savings_records_product_id ON savings_records(product_id);

-- ============================================================================
-- MIGRATION 005: TRIAL REMINDER TRACKING
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_reminder_sent TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_expires
ON user_profiles (trial_ends_at)
WHERE subscription_status = 'trialing' AND trial_ends_at IS NOT NULL;

-- ============================================================================
-- MIGRATION 006: AUDIT LOGS
-- ============================================================================

CREATE TYPE audit_action AS ENUM (
  'trust_score_updated', 'trust_score_approved', 'trust_score_rejected',
  'subscription_created', 'subscription_modified', 'subscription_cancelled',
  'editorial_override_created', 'editorial_override_updated', 'editorial_override_deleted',
  'model_created', 'model_updated', 'model_deleted',
  'provider_created', 'provider_updated', 'provider_deleted',
  'user_role_changed', 'user_suspended', 'user_reactivated',
  'pricing_updated', 'system_config_changed'
);

CREATE TYPE audit_entity_type AS ENUM (
  'model', 'provider', 'user', 'subscription', 'editorial_override', 'pricing', 'system_config'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action audit_action NOT NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  before_state JSONB,
  after_state JSONB,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_composite ON audit_logs(entity_type, action, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true));

-- ============================================================================
-- MIGRATION 007: ELIMINATE FUNCTIONS LAYER
-- ============================================================================

-- Create backups
CREATE TABLE functions_backup AS SELECT * FROM functions;
CREATE TABLE use_cases_backup AS SELECT * FROM use_cases;

-- Add new columns to use_cases
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS latency_requirement_ms INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS quality_requirement TEXT;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS monthly_volume INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS avg_input_tokens INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS avg_output_tokens INTEGER;
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS requires_json_mode BOOLEAN DEFAULT FALSE;

ALTER TABLE use_cases ADD CONSTRAINT use_cases_priority_check CHECK (priority IN ('critical', 'high', 'medium', 'low'));
ALTER TABLE use_cases ADD CONSTRAINT use_cases_quality_requirement_check CHECK (quality_requirement IS NULL OR quality_requirement IN ('best', 'good', 'acceptable'));

-- Migrate data from functions into use_cases
UPDATE use_cases uc SET
  product_id = f.product_id,
  priority = f.priority,
  latency_requirement_ms = f.latency_requirement_ms,
  quality_requirement = f.quality_requirement,
  monthly_volume = f.monthly_volume,
  avg_input_tokens = f.avg_input_tokens,
  avg_output_tokens = f.avg_output_tokens,
  name = CASE WHEN uc.name ~ '^Use Case \d+$' THEN f.name ELSE uc.name END,
  description = CASE
    WHEN uc.description IS NULL OR uc.description = '' THEN f.description
    WHEN f.description IS NULL OR f.description = '' THEN uc.description
    ELSE f.description || ' - ' || uc.description
  END
FROM functions f WHERE uc.function_id = f.id;

-- Convert orphaned functions to use cases
INSERT INTO use_cases (product_id, function_id, name, description, priority, latency_requirement_ms, quality_requirement, monthly_volume, avg_input_tokens, avg_output_tokens, primary_need, status, metadata, created_at, updated_at)
SELECT f.product_id, f.id, f.name, f.description, f.priority, f.latency_requirement_ms, f.quality_requirement, f.monthly_volume, f.avg_input_tokens, f.avg_output_tokens, 'quality', 'active', f.metadata, f.created_at, f.updated_at
FROM functions f WHERE NOT EXISTS (SELECT 1 FROM use_cases uc WHERE uc.function_id = f.id);

-- Migrate capability flags
UPDATE use_cases SET requires_json_mode = TRUE WHERE output_type = 'json';

-- Drop old RLS policies
DROP POLICY IF EXISTS use_cases_select ON use_cases;
DROP POLICY IF EXISTS use_cases_insert ON use_cases;
DROP POLICY IF EXISTS use_cases_update ON use_cases;
DROP POLICY IF EXISTS use_cases_delete ON use_cases;
DROP POLICY IF EXISTS opportunities_select ON opportunities;

-- Drop foreign key and old columns
ALTER TABLE use_cases DROP CONSTRAINT IF EXISTS use_cases_function_id_fkey;
ALTER TABLE use_cases DROP COLUMN IF EXISTS function_id;
ALTER TABLE use_cases DROP COLUMN IF EXISTS input_type;
ALTER TABLE use_cases DROP COLUMN IF EXISTS output_type;
ALTER TABLE use_cases DROP COLUMN IF EXISTS requires_streaming;

-- Add NOT NULL and FK for product_id
ALTER TABLE use_cases ALTER COLUMN product_id SET NOT NULL;
ALTER TABLE use_cases ADD CONSTRAINT use_cases_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Create new indexes
DROP INDEX IF EXISTS idx_use_cases_function_id;
CREATE INDEX idx_use_cases_product_id ON use_cases(product_id) WHERE status = 'active';
CREATE INDEX idx_use_cases_priority ON use_cases(priority);
CREATE INDEX idx_use_cases_primary_need ON use_cases(primary_need);

-- Create new RLS policies
CREATE POLICY "Users can view their own use cases" ON use_cases FOR SELECT USING (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert their own use cases" ON use_cases FOR INSERT WITH CHECK (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own use cases" ON use_cases FOR UPDATE USING (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own use cases" ON use_cases FOR DELETE USING (product_id IN (SELECT id FROM products WHERE user_id = auth.uid()));

CREATE POLICY opportunities_select ON opportunities FOR SELECT USING (use_case_id IN (SELECT uc.id FROM use_cases uc JOIN products p ON uc.product_id = p.id WHERE p.user_id = auth.uid()));

-- Deprecate functions table
DROP POLICY IF EXISTS functions_select ON functions;
DROP POLICY IF EXISTS functions_insert ON functions;
DROP POLICY IF EXISTS functions_update ON functions;
DROP POLICY IF EXISTS functions_delete ON functions;
ALTER TABLE functions RENAME TO functions_deprecated;

-- ============================================================================
-- MIGRATION 008: FIX PRICING CONSTRAINT
-- Note: The unique constraint was already added in 001, but let's ensure it exists
-- ============================================================================

-- This constraint already exists from migration 001, but just in case:
-- UNIQUE(model_id, provider_id) is defined on model_provider_pricing

-- ============================================================================
-- DONE! Verify with: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- ============================================================================
