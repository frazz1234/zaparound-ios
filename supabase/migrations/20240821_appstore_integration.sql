-- Create App Store transactions table
CREATE TABLE IF NOT EXISTS appstore_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT NOT NULL UNIQUE,
    product_id TEXT NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'verified', 'expired', 'refunded', 'failed')),
    original_transaction_id TEXT,
    expires_date TIMESTAMP WITH TIME ZONE,
    is_trial_period BOOLEAN DEFAULT FALSE,
    is_intro_offer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table (replaces Stripe subscriptions)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    product_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'expired', 'cancelled', 'refunded', 'failed')),
    transaction_id TEXT,
    original_transaction_id TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE,
    expires_date TIMESTAMP WITH TIME ZONE,
    is_trial_period BOOLEAN DEFAULT FALSE,
    is_intro_offer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create App Store products table
CREATE TABLE IF NOT EXISTS appstore_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    period TEXT NOT NULL CHECK (period IN ('month', 'year', 'one_time')),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create App Store webhook logs table
CREATE TABLE IF NOT EXISTS appstore_webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type TEXT NOT NULL,
    subtype TEXT,
    transaction_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'pending')),
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appstore_transactions_user_id ON appstore_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_appstore_transactions_status ON appstore_transactions(status);
CREATE INDEX IF NOT EXISTS idx_appstore_transactions_product_id ON appstore_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_appstore_products_product_id ON appstore_products(product_id);
CREATE INDEX IF NOT EXISTS idx_appstore_webhook_logs_notification_type ON appstore_webhook_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_appstore_webhook_logs_processed_at ON appstore_webhook_logs(processed_at);

-- Create RLS policies
ALTER TABLE appstore_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appstore_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appstore_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for appstore_transactions
CREATE POLICY "Users can view their own transactions" ON appstore_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" ON appstore_transactions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policy for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policy for appstore_products
CREATE POLICY "Anyone can view active products" ON appstore_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage all products" ON appstore_products
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policy for appstore_webhook_logs
CREATE POLICY "Service role can manage all webhook logs" ON appstore_webhook_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert default products
INSERT INTO appstore_products (product_id, title, description, price, currency, period, features) VALUES
('com.zaparound.zaptrip.monthly', 'ZapTrip Monthly', 'Essential trip planning features for solo travelers', 4.99, 'USD', 'month', '["Basic trip planning", "Route optimization", "Basic maps", "Trip sharing"]'),
('com.zaparound.zaptrip.yearly', 'ZapTrip Yearly', 'Essential trip planning features for solo travelers with savings', 53.99, 'USD', 'year', '["Basic trip planning", "Route optimization", "Basic maps", "Trip sharing", "2 months free"]'),
('com.zaparound.zapout.monthly', 'ZapOut Monthly', 'Enhanced outdoor adventure planning and tracking', 4.99, 'USD', 'month', '["Outdoor route planning", "Weather integration", "Safety features", "Community trails"]'),
('com.zaparound.zapout.yearly', 'ZapOut Yearly', 'Enhanced outdoor adventure planning and tracking with savings', 53.99, 'USD', 'year', '["Outdoor route planning", "Weather integration", "Safety features", "Community trails", "2 months free"]'),
('com.zaparound.zaproad.monthly', 'ZapRoad Monthly', 'Comprehensive road trip planning and navigation', 4.99, 'USD', 'month', '["Road trip planning", "Gas station finder", "Rest stop locator", "Traffic updates"]'),
('com.zaparound.zaproad.yearly', 'ZapRoad Yearly', 'Comprehensive road trip planning and navigation with savings', 53.99, 'USD', 'year', '["Road trip planning", "Gas station finder", "Rest stop locator", "Traffic updates", "2 months free"]'),
('com.zaparound.zappro.monthly', 'ZapPro Monthly', 'Premium travel planning with advanced features and AI', 9.99, 'USD', 'month', '["All ZapTrip features", "All ZapOut features", "All ZapRoad features", "AI recommendations", "Priority support", "Premium content"]'),
('com.zaparound.zappro.yearly', 'ZapPro Yearly', 'Premium travel planning with advanced features and AI with savings', 107.99, 'USD', 'year', '["All ZapTrip features", "All ZapOut features", "All ZapRoad features", "AI recommendations", "Priority support", "Premium content", "2 months free"]')
ON CONFLICT (product_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_appstore_transactions_updated_at BEFORE UPDATE ON appstore_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appstore_products_updated_at BEFORE UPDATE ON appstore_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT ON appstore_products TO authenticated;
GRANT SELECT ON appstore_transactions TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
