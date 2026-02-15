-- Savings Tracking Schema
-- Records savings when users implement optimization opportunities

CREATE TABLE IF NOT EXISTS savings_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
