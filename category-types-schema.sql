-- Category Types Schema for Income/Expense Classification
-- Add this to your Supabase SQL editor

-- Create category_types table
CREATE TABLE IF NOT EXISTS category_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_type TEXT CHECK (category_type IN ('income', 'expense')) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_category_types_user_id ON category_types(user_id);
CREATE INDEX IF NOT EXISTS idx_category_types_category_name ON category_types(category_name);
CREATE INDEX IF NOT EXISTS idx_category_types_type ON category_types(category_type);

-- Enable RLS
ALTER TABLE category_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on category_types" ON category_types FOR ALL USING (true);

-- Insert default category type definitions
INSERT INTO category_types (user_id, category_name, category_type, is_default) VALUES
-- Income categories
(NULL, 'Income', 'income', true),
(NULL, 'Investment', 'income', true),
(NULL, 'Internal Transfer', 'income', true), -- Will be handled dynamically based on amount

-- Expense categories
(NULL, 'MobilePay', 'expense', true),
(NULL, 'Convenience Stores', 'expense', true),
(NULL, 'Bills', 'expense', true),
(NULL, 'Gas', 'expense', true),
(NULL, 'Waste', 'expense', true),
(NULL, 'Groceries', 'expense', true),
(NULL, 'Transport', 'expense', true),
(NULL, 'Entertainment', 'expense', true),
(NULL, 'Dining', 'expense', true),
(NULL, 'Shopping', 'expense', true),
(NULL, 'Healthcare', 'expense', true),
(NULL, 'Subscriptions', 'expense', true),
(NULL, 'Insurance', 'expense', true),
(NULL, 'Rent', 'expense', true),
(NULL, 'Utilities', 'expense', true),
(NULL, 'Education', 'expense', true),
(NULL, 'Fitness', 'expense', true),
(NULL, 'Beauty', 'expense', true),
(NULL, 'Gifts', 'expense', true),
(NULL, 'Travel', 'expense', true),
(NULL, 'Parking', 'expense', true),
(NULL, 'ATM', 'expense', true),
(NULL, 'Loans', 'expense', true),
(NULL, 'Fees', 'expense', true),
(NULL, 'Pet Care', 'expense', true),
(NULL, 'Home Improvement', 'expense', true),
(NULL, 'Clothing', 'expense', true),
(NULL, 'Charity', 'expense', true),
(NULL, 'Uncategorized', 'expense', true)
ON CONFLICT (user_id, category_name) DO NOTHING;

-- Function to get category type (with fallback to default)
CREATE OR REPLACE FUNCTION get_category_type(p_user_id UUID, p_category_name TEXT, p_amount DECIMAL DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  category_type_result TEXT;
BEGIN
  -- Special handling for Internal Transfer based on amount
  IF p_category_name = 'Internal Transfer' AND p_amount IS NOT NULL THEN
    RETURN CASE WHEN p_amount >= 0 THEN 'income' ELSE 'expense' END;
  END IF;
  
  -- Check user-specific category type first
  SELECT category_type INTO category_type_result
  FROM category_types 
  WHERE user_id = p_user_id AND category_name = p_category_name;
  
  -- If not found, check default (user_id IS NULL)
  IF category_type_result IS NULL THEN
    SELECT category_type INTO category_type_result
    FROM category_types 
    WHERE user_id IS NULL AND category_name = p_category_name;
  END IF;
  
  -- Default to expense if not found
  RETURN COALESCE(category_type_result, 'expense');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate financial summary for a user
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_income DECIMAL(15,2),
  total_expenses DECIMAL(15,2),
  net_amount DECIMAL(15,2),
  transaction_count INTEGER
) AS $$
DECLARE
  income_sum DECIMAL(15,2) := 0;
  expense_sum DECIMAL(15,2) := 0;
  trans_count INTEGER := 0;
BEGIN
  -- Calculate income and expenses
  SELECT 
    COALESCE(SUM(CASE WHEN get_category_type(p_user_id, COALESCE(t.user_category, t.category), t.amount) = 'income' THEN ABS(t.amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN get_category_type(p_user_id, COALESCE(t.user_category, t.category), t.amount) = 'expense' THEN ABS(t.amount) ELSE 0 END), 0),
    COUNT(*)
  INTO income_sum, expense_sum, trans_count
  FROM transactions t
  JOIN accounts a ON t.account_id = a.id
  WHERE a.user_id = p_user_id
    AND (p_start_date IS NULL OR t.date >= p_start_date)
    AND (p_end_date IS NULL OR t.date <= p_end_date);
  
  RETURN QUERY SELECT income_sum, expense_sum, income_sum - expense_sum, trans_count;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at
CREATE TRIGGER update_category_types_updated_at BEFORE UPDATE ON category_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Category types schema created successfully!';
  RAISE NOTICE 'Default category types have been inserted.';
  RAISE NOTICE 'Functions for category type management are ready.';
END $$;
