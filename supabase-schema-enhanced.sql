-- Enhanced WealthBuddy AI Database Schema for Manual Categorization
-- Run this SQL in your Supabase SQL editor AFTER the main schema

-- Categorization rules table for user-defined rules
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('contains', 'starts_with', 'ends_with', 'exact')) DEFAULT 'contains',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction category updates audit trail
CREATE TABLE transaction_category_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_category TEXT,
  new_category TEXT NOT NULL,
  update_reason TEXT CHECK (update_reason IN ('manual', 'rule', 'bulk')) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_category field to transactions table for manual overrides
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_category TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_source TEXT CHECK (category_source IN ('auto', 'manual', 'rule')) DEFAULT 'auto';

-- Add sync tracking fields to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS requisition_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sync_status TEXT CHECK (sync_status IN ('never', 'in_progress', 'success', 'error')) DEFAULT 'never';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sync_error_message TEXT;

-- Add sync tracking table for detailed sync history
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  sync_type TEXT CHECK (sync_type IN ('initial', 'incremental')) DEFAULT 'incremental',
  transactions_fetched INTEGER DEFAULT 0,
  transactions_new INTEGER DEFAULT 0,
  sync_status TEXT CHECK (sync_status IN ('in_progress', 'success', 'error')) DEFAULT 'in_progress',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_categorization_rules_user_id ON categorization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_keyword ON categorization_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_priority ON categorization_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_category_updates_transaction_id ON transaction_category_updates(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_category_updates_user_id ON transaction_category_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_category);

-- Create indexes for sync tracking
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_sync_status ON accounts(user_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_accounts_requisition_id ON accounts(requisition_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_account_id ON sync_history(account_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON sync_history(started_at DESC);

-- RLS policies for new tables
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_category_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on categorization_rules" ON categorization_rules FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_category_updates" ON transaction_category_updates FOR ALL USING (true);
CREATE POLICY "Allow all operations on sync_history" ON sync_history FOR ALL USING (true);

-- Enhanced categorization function that considers user rules
CREATE OR REPLACE FUNCTION categorize_transaction_enhanced(
  p_user_id UUID,
  p_description TEXT, 
  p_creditor_name TEXT, 
  p_debtor_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  rule_category TEXT;
  search_text TEXT;
  rule_record RECORD;
BEGIN
  -- Combine all text fields for searching
  search_text := LOWER(COALESCE(p_description, '') || ' ' || COALESCE(p_creditor_name, '') || ' ' || COALESCE(p_debtor_name, ''));
  
  -- Check user-defined rules first (ordered by priority)
  FOR rule_record IN 
    SELECT keyword, category, rule_type 
    FROM categorization_rules 
    WHERE user_id = p_user_id 
    ORDER BY priority DESC, created_at ASC
  LOOP
    CASE rule_record.rule_type
      WHEN 'contains' THEN
        IF search_text LIKE '%' || LOWER(rule_record.keyword) || '%' THEN
          RETURN rule_record.category;
        END IF;
      WHEN 'starts_with' THEN
        IF search_text LIKE LOWER(rule_record.keyword) || '%' THEN
          RETURN rule_record.category;
        END IF;
      WHEN 'ends_with' THEN
        IF search_text LIKE '%' || LOWER(rule_record.keyword) THEN
          RETURN rule_record.category;
        END IF;
      WHEN 'exact' THEN
        IF search_text = LOWER(rule_record.keyword) THEN
          RETURN rule_record.category;
        END IF;
    END CASE;
  END LOOP;
  
  -- Fall back to default categorization logic
  RETURN categorize_transaction(p_description, p_creditor_name, p_debtor_name);
END;
$$ LANGUAGE plpgsql;

-- Function to update transaction category with audit trail
CREATE OR REPLACE FUNCTION update_transaction_category(
  p_transaction_id UUID,
  p_user_id UUID,
  p_new_category TEXT,
  p_update_reason TEXT DEFAULT 'manual'
)
RETURNS BOOLEAN AS $$
DECLARE
  old_category TEXT;
BEGIN
  -- Get current category
  SELECT COALESCE(user_category, category) INTO old_category
  FROM transactions 
  WHERE id = p_transaction_id;
  
  -- Update the transaction
  UPDATE transactions 
  SET 
    user_category = p_new_category,
    category_source = CASE 
      WHEN p_update_reason = 'manual' THEN 'manual'
      WHEN p_update_reason = 'rule' THEN 'rule'
      ELSE 'auto'
    END
  WHERE id = p_transaction_id;
  
  -- Insert audit record
  INSERT INTO transaction_category_updates (
    transaction_id, 
    user_id, 
    old_category, 
    new_category, 
    update_reason
  ) VALUES (
    p_transaction_id, 
    p_user_id, 
    old_category, 
    p_new_category, 
    p_update_reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to apply categorization rules to existing transactions
CREATE OR REPLACE FUNCTION apply_categorization_rules(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  transaction_record RECORD;
  new_category TEXT;
BEGIN
  -- Loop through all transactions for the user that don't have manual categories
  FOR transaction_record IN 
    SELECT t.id, t.description, t.creditor_name, t.debtor_name, t.category
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE a.user_id = p_user_id 
    AND (t.user_category IS NULL OR t.category_source = 'auto')
  LOOP
    -- Get new category based on rules
    new_category := categorize_transaction_enhanced(
      p_user_id,
      transaction_record.description,
      transaction_record.creditor_name,
      transaction_record.debtor_name
    );
    
    -- Update if category changed
    IF new_category != transaction_record.category THEN
      PERFORM update_transaction_category(
        transaction_record.id,
        p_user_id,
        new_category,
        'rule'
      );
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get effective category (user_category if set, otherwise category)
CREATE OR REPLACE FUNCTION get_effective_category(p_user_category TEXT, p_auto_category TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(p_user_category, p_auto_category);
END;
$$ LANGUAGE plpgsql;

-- Update the auto-categorization trigger to use enhanced function
CREATE OR REPLACE FUNCTION auto_categorize_transaction_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get user_id from account
  SELECT a.user_id INTO user_id_val
  FROM accounts a
  WHERE a.id = NEW.account_id;
  
  -- Only auto-categorize if no user category is set
  IF NEW.user_category IS NULL AND (NEW.category IS NULL OR NEW.category = '') THEN
    NEW.category := categorize_transaction_enhanced(
      user_id_val,
      NEW.description, 
      NEW.creditor_name, 
      NEW.debtor_name
    );
    NEW.category_source := 'auto';
  ELSIF NEW.user_category IS NOT NULL THEN
    NEW.category_source := 'manual';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger
DROP TRIGGER IF EXISTS trigger_auto_categorize_transaction ON transactions;
CREATE TRIGGER trigger_auto_categorize_transaction_enhanced
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_transaction_enhanced();

-- Add some default categorization rules for common Danish patterns
INSERT INTO categorization_rules (user_id, keyword, category, rule_type, priority) 
SELECT u.id, 'dsb', 'Transportation', 'contains', 100
FROM users u WHERE u.keyphrase = 'test'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (user_id, keyword, category, rule_type, priority) 
SELECT u.id, '7-eleven', 'Convenience Store', 'contains', 100
FROM users u WHERE u.keyphrase = 'test'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (user_id, keyword, category, rule_type, priority) 
SELECT u.id, 'netto', 'Groceries', 'contains', 100
FROM users u WHERE u.keyphrase = 'test'
ON CONFLICT DO NOTHING;

INSERT INTO categorization_rules (user_id, keyword, category, rule_type, priority) 
SELECT u.id, 'mobilepay', 'MobilePay', 'contains', 100
FROM users u WHERE u.keyphrase = 'test'
ON CONFLICT DO NOTHING;
