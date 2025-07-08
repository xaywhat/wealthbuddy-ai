-- WealthBuddy AI Complete Database Schema
-- This script drops all existing tables and recreates everything from scratch
-- Run this in your Supabase SQL editor

-- Drop all existing tables and functions (in correct order to handle dependencies)
DROP TABLE IF EXISTS sync_history CASCADE;
DROP TABLE IF EXISTS transaction_category_updates CASCADE;
DROP TABLE IF EXISTS categorization_rules CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS categorize_transaction_enhanced(UUID, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS categorize_transaction(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_transaction_category(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS apply_categorization_rules(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_effective_category(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_categorize_transaction_enhanced() CASCADE;
DROP FUNCTION IF EXISTS auto_categorize_transaction() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyphrase TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table with all sync tracking fields
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nordigen_account_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  iban TEXT,
  currency TEXT DEFAULT 'DKK',
  balance DECIMAL(15,2) DEFAULT 0,
  institution_id TEXT,
  requisition_id TEXT,
  access_token TEXT,
  last_sync_date TIMESTAMP WITH TIME ZONE,
  sync_status TEXT CHECK (sync_status IN ('never', 'in_progress', 'success', 'error')) DEFAULT 'never',
  sync_error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table with categorization fields
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  nordigen_transaction_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'DKK',
  description TEXT,
  creditor_name TEXT,
  debtor_name TEXT,
  category TEXT,
  user_category TEXT,
  category_source TEXT CHECK (category_source IN ('auto', 'manual', 'rule')) DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categorization rules table
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

-- Sync history table for detailed sync tracking
CREATE TABLE sync_history (
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

-- Create indexes for performance
CREATE INDEX idx_users_keyphrase ON users(keyphrase);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_nordigen_account_id ON accounts(nordigen_account_id);
CREATE INDEX idx_accounts_requisition_id ON accounts(requisition_id);
CREATE INDEX idx_accounts_user_id_sync_status ON accounts(user_id, sync_status);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_nordigen_transaction_id ON transactions(nordigen_transaction_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_category);
CREATE INDEX idx_transactions_category_source ON transactions(category_source);

CREATE INDEX idx_categorization_rules_user_id ON categorization_rules(user_id);
CREATE INDEX idx_categorization_rules_keyword ON categorization_rules(keyword);
CREATE INDEX idx_categorization_rules_priority ON categorization_rules(priority DESC);

CREATE INDEX idx_transaction_category_updates_transaction_id ON transaction_category_updates(transaction_id);
CREATE INDEX idx_transaction_category_updates_user_id ON transaction_category_updates(user_id);

CREATE INDEX idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX idx_sync_history_account_id ON sync_history(account_id);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_category_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on categorization_rules" ON categorization_rules FOR ALL USING (true);
CREATE POLICY "Allow all operations on transaction_category_updates" ON transaction_category_updates FOR ALL USING (true);
CREATE POLICY "Allow all operations on sync_history" ON sync_history FOR ALL USING (true);

-- Basic categorization function
CREATE OR REPLACE FUNCTION categorize_transaction(
  p_description TEXT, 
  p_creditor_name TEXT, 
  p_debtor_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  search_text TEXT;
BEGIN
  -- Combine all text fields for searching
  search_text := LOWER(COALESCE(p_description, '') || ' ' || COALESCE(p_creditor_name, '') || ' ' || COALESCE(p_debtor_name, ''));
  
  -- Internal transfers
  IF search_text LIKE '%fra forsikringer%' OR search_text LIKE '%til forsikringer%' OR 
     search_text LIKE '%overførsel%' OR search_text LIKE '%transfer%' OR
     search_text LIKE '%fra løn%' OR search_text LIKE '%til løn%' THEN
    RETURN 'Internal Transfer';
  END IF;
  
  -- MobilePay
  IF search_text LIKE '%mobilepay%' THEN
    RETURN 'MobilePay';
  END IF;
  
  -- Convenience stores
  IF search_text LIKE '%7-eleven%' OR search_text LIKE '%7eleven%' OR 
     search_text LIKE '%netto%' OR search_text LIKE '%rema%' OR 
     search_text LIKE '%irma%' OR search_text LIKE '%fakta%' THEN
    RETURN 'Convenience Stores';
  END IF;
  
  -- Bills & Utilities
  IF search_text LIKE '%el %' OR search_text LIKE '%gas%' OR search_text LIKE '%vand%' OR
     search_text LIKE '%varme%' OR search_text LIKE '%internet%' OR search_text LIKE '%telefon%' OR
     search_text LIKE '%forsikring%' OR search_text LIKE '%insurance%' OR
     search_text LIKE '%regning%' OR search_text LIKE '%bill%' THEN
    RETURN 'Bills';
  END IF;
  
  -- Gas stations
  IF search_text LIKE '%shell%' OR search_text LIKE '%q8%' OR search_text LIKE '%esso%' OR
     search_text LIKE '%ok benzin%' OR search_text LIKE '%circle k%' THEN
    RETURN 'Gas';
  END IF;
  
  -- Groceries
  IF search_text LIKE '%bilka%' OR search_text LIKE '%føtex%' OR 
     search_text LIKE '%kvickly%' OR search_text LIKE '%super brugsen%' OR
     search_text LIKE '%meny%' OR search_text LIKE '%aldi%' OR search_text LIKE '%lidl%' THEN
    RETURN 'Groceries';
  END IF;
  
  -- Transport
  IF search_text LIKE '%dsb%' OR search_text LIKE '%metro%' OR search_text LIKE '%bus%' OR
     search_text LIKE '%rejsekort%' OR search_text LIKE '%transport%' THEN
    RETURN 'Transport';
  END IF;
  
  -- Entertainment
  IF search_text LIKE '%spotify%' OR search_text LIKE '%netflix%' OR 
     search_text LIKE '%disney%' OR search_text LIKE '%hbo%' THEN
    RETURN 'Entertainment';
  END IF;
  
  -- Dining
  IF search_text LIKE '%restaurant%' OR search_text LIKE '%cafe%' OR 
     search_text LIKE '%pizza%' OR search_text LIKE '%burger%' OR
     search_text LIKE '%mcdonalds%' OR search_text LIKE '%kfc%' THEN
    RETURN 'Dining';
  END IF;
  
  -- Shopping
  IF search_text LIKE '%h&m%' OR search_text LIKE '%zara%' OR 
     search_text LIKE '%magasin%' OR search_text LIKE '%illums%' THEN
    RETURN 'Shopping';
  END IF;
  
  -- Healthcare
  IF search_text LIKE '%apotek%' OR search_text LIKE '%læge%' OR 
     search_text LIKE '%tandlæge%' OR search_text LIKE '%hospital%' THEN
    RETURN 'Healthcare';
  END IF;
  
  RETURN 'Uncategorized';
END;
$$ LANGUAGE plpgsql;

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
    END,
    updated_at = NOW()
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

-- Auto-categorization trigger function
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
  
  -- Set updated_at
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the auto-categorization trigger
CREATE TRIGGER trigger_auto_categorize_transaction_enhanced
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_transaction_enhanced();

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at BEFORE UPDATE ON categorization_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user for development
INSERT INTO users (keyphrase) VALUES ('test') ON CONFLICT (keyphrase) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'WealthBuddy AI database schema created successfully!';
  RAISE NOTICE 'Test user "test" has been created for development.';
  RAISE NOTICE 'All tables, indexes, functions, and triggers are now ready.';
END $$;
