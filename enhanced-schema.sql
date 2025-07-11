-- Enhanced WealthBuddy AI Database Schema
-- Includes: Internal Transfers, Advanced Categorization, Budgets, Goals, Subscriptions, etc.

-- Enhanced Merchant Database for better categorization
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    aliases TEXT[], -- Array of alternative names
    category VARCHAR(100) NOT NULL,
    country VARCHAR(2) DEFAULT 'DK',
    merchant_type VARCHAR(50), -- 'chain', 'franchise', 'independent'
    is_danish_specific BOOLEAN DEFAULT true,
    confidence_score DECIMAL(3,2) DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Internal Transfer Detection Rules
CREATE TABLE IF NOT EXISTS internal_transfer_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    from_account_pattern VARCHAR(255), -- Pattern to match source account
    to_account_pattern VARCHAR(255), -- Pattern to match destination account
    amount_threshold DECIMAL(10,2), -- Minimum amount to consider
    time_window_hours INTEGER DEFAULT 24, -- Time window for matching
    description_patterns TEXT[], -- Array of description patterns
    is_active BOOLEAN DEFAULT true,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Detected Internal Transfers
CREATE TABLE IF NOT EXISTS internal_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    to_transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transfer_date DATE NOT NULL,
    detection_confidence DECIMAL(3,2) NOT NULL,
    detection_method VARCHAR(50) NOT NULL, -- 'same_day', 'description_match', 'amount_match'
    user_confirmed BOOLEAN DEFAULT NULL, -- NULL = pending, true = confirmed, false = rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Learning for Categorization
CREATE TABLE IF NOT EXISTS user_categorization_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_name VARCHAR(255) NOT NULL,
    description_pattern VARCHAR(255) NOT NULL,
    learned_category VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'monthly', 'weekly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_adjust BOOLEAN DEFAULT false, -- AI can adjust based on patterns
    alert_threshold DECIMAL(3,2) DEFAULT 0.8, -- Alert at 80% of budget
    created_by VARCHAR(20) DEFAULT 'user', -- 'user', 'ai_suggestion'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Budget Alerts
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold_reached', 'exceeded', 'ai_suggestion'
    message TEXT NOT NULL,
    amount_spent DECIMAL(10,2) NOT NULL,
    amount_remaining DECIMAL(10,2) NOT NULL,
    percentage_used DECIMAL(5,2) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Goals
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- 'savings', 'debt_payoff', 'vacation', 'emergency_fund'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    category VARCHAR(100), -- Related spending category to reduce
    auto_save_amount DECIMAL(10,2), -- Automatic savings per period
    auto_save_frequency VARCHAR(20), -- 'weekly', 'monthly', 'paycheck'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Goal Progress Tracking
CREATE TABLE IF NOT EXISTS goal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
    amount_added DECIMAL(10,2) NOT NULL,
    progress_date DATE NOT NULL,
    source VARCHAR(50), -- 'manual', 'automatic', 'windfall'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription Detection and Management
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'weekly'
    next_payment_date DATE,
    category VARCHAR(100) DEFAULT 'Subscriptions',
    is_active BOOLEAN DEFAULT true,
    detection_confidence DECIMAL(3,2) NOT NULL,
    first_detected DATE NOT NULL,
    last_payment_date DATE,
    auto_detected BOOLEAN DEFAULT true,
    user_confirmed BOOLEAN DEFAULT NULL,
    cancellation_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription Alerts
CREATE TABLE IF NOT EXISTS subscription_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'unused', 'price_increase', 'free_trial_ending'
    message TEXT NOT NULL,
    suggested_action VARCHAR(100), -- 'cancel', 'downgrade', 'review'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Achievements and Gamification
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'savings', 'budgeting', 'goals', 'streaks'
    points INTEGER NOT NULL,
    icon VARCHAR(50), -- Emoji or icon identifier
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    progress_value DECIMAL(10,2), -- For tracking progress towards achievement
    is_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- Saving Challenges
CREATE TABLE IF NOT EXISTS saving_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_type VARCHAR(50) NOT NULL, -- 'no_spend_weekend', 'cook_at_home', 'coffee_challenge'
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    target_amount DECIMAL(10,2),
    target_days INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    current_progress DECIMAL(10,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    reward_points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'paused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Challenge Progress
CREATE TABLE IF NOT EXISTS challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES saving_challenges(id) ON DELETE CASCADE,
    progress_date DATE NOT NULL,
    amount_saved DECIMAL(10,2) DEFAULT 0,
    activity_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Insights and Tips
CREATE TABLE IF NOT EXISTS financial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'spending_pattern', 'saving_opportunity', 'budget_suggestion'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    actionable_advice TEXT,
    potential_savings DECIMAL(10,2),
    confidence_score DECIMAL(3,2) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    is_acted_upon BOOLEAN DEFAULT false,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Export and Integration Logs
CREATE TABLE IF NOT EXISTS export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL, -- 'csv', 'pdf', 'email_summary'
    file_name VARCHAR(255),
    date_range_start DATE,
    date_range_end DATE,
    categories_included TEXT[],
    status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Danish-Specific Cost of Living Data
CREATE TABLE IF NOT EXISTS danish_cost_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(50) NOT NULL, -- 'Copenhagen', 'Aarhus', 'Odense', 'National'
    category VARCHAR(100) NOT NULL,
    average_amount DECIMAL(10,2) NOT NULL,
    median_amount DECIMAL(10,2) NOT NULL,
    percentile_25 DECIMAL(10,2) NOT NULL,
    percentile_75 DECIMAL(10,2) NOT NULL,
    sample_size INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(region, category, period_month, period_year)
);

-- User Preferences and Settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    budget_alerts_enabled BOOLEAN DEFAULT true,
    goal_reminders_enabled BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    weekly_summary_email BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'standard', -- 'minimal', 'standard', 'full'
    preferred_currency VARCHAR(3) DEFAULT 'DKK',
    timezone VARCHAR(50) DEFAULT 'Europe/Copenhagen',
    language VARCHAR(5) DEFAULT 'da-DK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_merchants_name ON merchants(name);
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_user_id ON internal_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_date ON internal_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON financial_goals(target_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON financial_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON financial_insights(created_at);

-- Insert Default Danish Merchants
INSERT INTO merchants (name, aliases, category, merchant_type, is_danish_specific) VALUES
('Netto', ARRAY['NETTO'], 'Groceries', 'chain', true),
('Rema 1000', ARRAY['REMA', 'REMA1000'], 'Groceries', 'chain', true),
('Bilka', ARRAY['BILKA'], 'Groceries', 'chain', true),
('Føtex', ARRAY['FOETEX', 'FOTEX'], 'Groceries', 'chain', true),
('Irma', ARRAY['IRMA'], 'Groceries', 'chain', true),
('SuperBrugsen', ARRAY['SUPER BRUGSEN', 'SUPERBRUGSEN'], 'Groceries', 'chain', true),
('Kvickly', ARRAY['KVICKLY'], 'Groceries', 'chain', true),
('Lidl', ARRAY['LIDL'], 'Groceries', 'chain', true),
('Aldi', ARRAY['ALDI'], 'Groceries', 'chain', true),
('7-Eleven', ARRAY['7-ELEVEN', '7ELEVEN', 'SEVEN ELEVEN'], 'Convenience Stores', 'chain', true),
('DSB', ARRAY['DSB', 'DANSKE STATSBANER'], 'Transport', 'chain', true),
('Rejsekort', ARRAY['REJSEKORT'], 'Transport', 'chain', true),
('Movia', ARRAY['MOVIA'], 'Transport', 'chain', true),
('Shell', ARRAY['SHELL'], 'Gas', 'chain', true),
('Q8', ARRAY['Q8'], 'Gas', 'chain', true),
('Circle K', ARRAY['CIRCLE K', 'CIRCLEK'], 'Gas', 'chain', true),
('OK Benzin', ARRAY['OK BENZIN', 'OK'], 'Gas', 'chain', true),
('Magasin', ARRAY['MAGASIN'], 'Shopping', 'chain', true),
('H&M', ARRAY['H&M', 'HM'], 'Clothing', 'chain', true),
('Zara', ARRAY['ZARA'], 'Clothing', 'chain', true),
('Bauhaus', ARRAY['BAUHAUS'], 'Home Improvement', 'chain', true),
('Silvan', ARRAY['SILVAN'], 'Home Improvement', 'chain', true),
('IKEA', ARRAY['IKEA'], 'Home Improvement', 'chain', true),
('Apotek', ARRAY['APOTEK'], 'Healthcare', 'chain', true),
('Matas', ARRAY['MATAS'], 'Healthcare', 'chain', true),
('TDC', ARRAY['TDC'], 'Bills', 'chain', true),
('YouSee', ARRAY['YOUSEE'], 'Bills', 'chain', true),
('Telenor', ARRAY['TELENOR'], 'Bills', 'chain', true),
('3 Danmark', ARRAY['3 DANMARK', '3DK'], 'Bills', 'chain', true),
('Dong Energy', ARRAY['DONG ENERGY', 'DONG'], 'Utilities', 'chain', true),
('Ørsted', ARRAY['ORSTED'], 'Utilities', 'chain', true);

-- Insert Default Achievements
INSERT INTO achievements (name, description, category, points, icon, rarity) VALUES
('First Budget', 'Created your first budget', 'budgeting', 100, '🎯', 'common'),
('Budget Master', 'Stayed within budget for 3 months', 'budgeting', 500, '🏆', 'rare'),
('Savings Starter', 'Saved your first 1000 DKK', 'savings', 200, '💰', 'common'),
('Savings Hero', 'Saved 10,000 DKK', 'savings', 1000, '🦸', 'epic'),
('Goal Getter', 'Completed your first financial goal', 'goals', 300, '🎯', 'common'),
('Streak Master', 'No unnecessary spending for 7 days', 'streaks', 250, '🔥', 'common'),
('Category King', 'Categorized 100 transactions', 'budgeting', 150, '📊', 'common'),
('Thrifty Shopper', 'Saved 20% on groceries for a month', 'savings', 400, '🛒', 'rare'),
('Emergency Fund', 'Built emergency fund of 6 months expenses', 'savings', 2000, '🛡️', 'legendary'),
('Debt Slayer', 'Paid off a debt completely', 'goals', 800, '⚔️', 'epic');

-- Insert Default Saving Challenges
INSERT INTO saving_challenges (user_id, challenge_type, name, description, target_amount, target_days, start_date, end_date) VALUES
-- These will be created dynamically for each user, this is just for reference
-- ('user_id', 'no_spend_weekend', 'No-Spend Weekend', 'Avoid all non-essential purchases this weekend', 0, 2, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days');

-- Views for Common Queries
CREATE OR REPLACE VIEW user_financial_summary AS
SELECT 
    u.id as user_id,
    u.keyphrase,
    COUNT(DISTINCT a.id) as total_accounts,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(DISTINCT b.id) as active_budgets,
    COUNT(DISTINCT g.id) as active_goals,
    COUNT(DISTINCT s.id) as active_subscriptions,
    COUNT(DISTINCT ua.id) as achievements_earned,
    COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(a.balance), 0) as total_balance
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id
LEFT JOIN transactions t ON a.id = t.account_id
LEFT JOIN budgets b ON u.id = b.user_id AND b.is_active = true
LEFT JOIN financial_goals g ON u.id = g.user_id AND g.is_active = true
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id, u.keyphrase;

-- Enable Row Level Security
ALTER TABLE internal_transfer_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categorization_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Example for budgets table)
CREATE POLICY "Users can view their own budgets" ON budgets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own budgets" ON budgets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets" ON budgets
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets" ON budgets
    FOR DELETE USING (user_id = auth.uid());
