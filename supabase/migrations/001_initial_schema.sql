-- ModelOptix Database Schema
-- Migration: 001_initial_schema
-- Created: 2026-01-18
-- Description: Complete database schema for ModelOptix MVP

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable pgvector for natural language search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USER DOMAIN TABLES
-- =============================================================================

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

-- =============================================================================
-- MODEL DOMAIN TABLES (providers must be created before models)
-- =============================================================================

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

    -- Context and output limits
    context_length INTEGER NOT NULL,
    max_output_tokens INTEGER,

    -- Latency
    latency_p50 INTEGER,  -- milliseconds
    latency_p95 INTEGER,

    -- Capabilities
    is_available BOOLEAN DEFAULT TRUE,
    supports_vision BOOLEAN NOT NULL DEFAULT FALSE,
    supports_function_calling BOOLEAN NOT NULL DEFAULT FALSE,
    supports_streaming BOOLEAN NOT NULL DEFAULT FALSE,
    supports_json_mode BOOLEAN NOT NULL DEFAULT FALSE,
    supports_system_prompt BOOLEAN NOT NULL DEFAULT TRUE,

    -- Benchmarks (JSONB from Artificial Analysis)
    benchmarks JSONB DEFAULT '{}',

    -- Capabilities (JSONB for flexibility)
    capabilities JSONB DEFAULT '{}',

    -- Embeddings for NL search (size matches OpenAI text-embedding-3-small)
    embedding vector(1536),

    -- Status and lifecycle
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'preview', 'sunset')),
    deprecated_at TIMESTAMPTZ,
    sunset_at TIMESTAMPTZ,
    replacement_model_id UUID REFERENCES models(id),

    -- Admin controls
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadata
    release_date DATE,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specific LLM usage within functions (created after models for FK)
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
    input_price DECIMAL(12,8),  -- per 1K tokens
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

-- =============================================================================
-- ACTION DOMAIN TABLES
-- =============================================================================

-- Recommendations with improvement metrics
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,

    -- Recommended model
    recommended_model_id UUID REFERENCES models(id) ON DELETE SET NULL,

    -- Opportunity details
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('cost_saving', 'speed_improvement', 'quality_upgrade', 'trust_upgrade')),
    improvement_percentage DECIMAL(5,2),
    estimated_monthly_savings DECIMAL(10,2),
    confidence_score DECIMAL(5,2) NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),

    -- Evidence and reasoning
    evidence JSONB,
    recommendation_reason TEXT,
    trade_offs TEXT[],

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'accepted', 'expired')),
    dismissed_reason TEXT,
    actioned_at TIMESTAMPTZ,

    -- Lifecycle
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Side-by-side model comparisons
CREATE TABLE sanity_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

    -- Test configuration
    prompt TEXT NOT NULL,
    test_parameters JSONB NOT NULL DEFAULT '{}',

    -- Models being compared
    current_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    recommended_model_id UUID REFERENCES models(id) ON DELETE SET NULL,

    -- Results
    current_response TEXT,
    recommended_response TEXT,
    current_latency INTEGER,
    recommended_latency INTEGER,
    current_tokens_used INTEGER,
    recommended_tokens_used INTEGER,
    current_cost DECIMAL(10,6),
    recommended_cost DECIMAL(10,6),

    -- User evaluation
    user_preference TEXT CHECK (user_preference IN ('current', 'recommended', 'neither', 'tie')),
    user_notes TEXT,
    evaluation_criteria JSONB NOT NULL DEFAULT '{}',

    -- Guest access
    is_guest BOOLEAN DEFAULT FALSE,
    guest_session_id TEXT,

    -- Status
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

    -- Alert content
    alert_type TEXT NOT NULL CHECK (alert_type IN ('opportunity', 'price_change', 'model_deprecated', 'trust_change', 'new_model', 'usage_limit', 'subscription', 'system')),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent', 'critical')),
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    action_label TEXT,

    -- Related entities
    related_model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    related_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    related_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,

    -- Delivery
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,

    -- Lifecycle
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

-- =============================================================================
-- INFRASTRUCTURE TABLES
-- =============================================================================

-- Job locking and heartbeat tracking
CREATE TABLE job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    heartbeat_at TIMESTAMPTZ DEFAULT NOW(),

    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

    -- Progress
    cursor TEXT,  -- for resumable jobs
    items_processed INTEGER DEFAULT 0,

    -- Error handling
    error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique partial index to prevent concurrent runs of same job
CREATE UNIQUE INDEX idx_job_runs_active_lock
    ON job_runs(job_name)
    WHERE status = 'running';

-- Idempotency for webhooks (Stripe, etc.)
CREATE TABLE webhook_events (
    id TEXT PRIMARY KEY,  -- Stripe event ID
    event_type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe', 'github', 'resend', 'system')),

    -- Processing
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'ignored')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,

    -- Payload
    payload JSONB,
    response JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tier limit enforcement
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month TEXT NOT NULL,  -- Format: YYYY-MM

    -- Usage counts
    products_count INTEGER DEFAULT 0,
    functions_count INTEGER DEFAULT 0,
    sanity_checks_used INTEGER DEFAULT 0,

    -- Limits (from tier)
    products_limit INTEGER NOT NULL,
    sanity_checks_limit INTEGER NOT NULL,

    -- Alerts
    limit_warning_sent BOOLEAN NOT NULL DEFAULT FALSE,
    limit_warning_sent_at TIMESTAMPTZ,
    limit_reached_sent BOOLEAN NOT NULL DEFAULT FALSE,
    limit_reached_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, month)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

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

-- Provider indexes
CREATE INDEX idx_providers_trust_tier ON providers(trust_tier);
CREATE INDEX idx_providers_status ON providers(status);

-- Model pricing and trust indexes
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

-- Vector similarity search index (for natural language model search)
-- Note: IVFFlat requires sufficient training data. For small datasets (<1000), use HNSW instead
CREATE INDEX idx_models_embedding ON models USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_functions_updated_at
    BEFORE UPDATE ON functions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_use_cases_updated_at
    BEFORE UPDATE ON use_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_provider_pricing_updated_at
    BEFORE UPDATE ON model_provider_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_trust_scores_updated_at
    BEFORE UPDATE ON model_trust_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parameter_support_updated_at
    BEFORE UPDATE ON parameter_support
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editorial_overrides_updated_at
    BEFORE UPDATE ON editorial_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sanity_checks_updated_at
    BEFORE UPDATE ON sanity_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile data linked to Supabase auth.users';
COMMENT ON TABLE products IS 'User AI products/applications being optimized';
COMMENT ON TABLE functions IS 'Features/capabilities within products';
COMMENT ON TABLE use_cases IS 'Specific LLM usage scenarios within functions';
COMMENT ON TABLE providers IS 'LLM providers with trust tiers (OpenAI, Anthropic, etc.)';
COMMENT ON TABLE models IS 'LLM catalog with pricing, latency, capabilities, and benchmarks';
COMMENT ON TABLE model_provider_pricing IS 'Same model available from different providers at different prices';
COMMENT ON TABLE model_trust_scores IS 'Trust scores by dimension for each model';
COMMENT ON TABLE parameter_support IS 'API parameter compatibility matrix by model';
COMMENT ON TABLE editorial_overrides IS 'Admin controls for model exclusion, downranking, or warnings';
COMMENT ON TABLE opportunities IS 'Model optimization recommendations with improvement metrics';
COMMENT ON TABLE sanity_checks IS 'Side-by-side model comparison tests';
COMMENT ON TABLE alerts IS 'User notifications for opportunities, deprecations, etc.';
COMMENT ON TABLE notification_preferences IS 'User preferences for alert delivery';
COMMENT ON TABLE job_runs IS 'Background job execution tracking with locking';
COMMENT ON TABLE webhook_events IS 'Webhook event log for idempotent processing';
COMMENT ON TABLE usage_tracking IS 'Subscription tier limit tracking per billing period';
