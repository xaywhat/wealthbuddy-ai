-- WealthBuddy AI Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyphrase TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank connections table
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requisition_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nordigen_account_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  iban TEXT,
  currency TEXT DEFAULT 'DKK',
  balance DECIMAL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  nordigen_transaction_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'DKK',
  description TEXT,
  category TEXT,
  creditor_name TEXT,
  debtor_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync logs table
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('success', 'error', 'in_progress')) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_nordigen_id ON accounts(nordigen_account_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_nordigen_id ON transactions(nordigen_transaction_id);
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on bank_connections" ON bank_connections FOR ALL USING (true);
CREATE POLICY "Allow all operations on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on sync_logs" ON sync_logs FOR ALL USING (true);

-- Insert test user
INSERT INTO users (keyphrase) VALUES ('test') ON CONFLICT (keyphrase) DO NOTHING;

-- Create a function to automatically categorize transactions
CREATE OR REPLACE FUNCTION categorize_transaction(description TEXT, creditor_name TEXT, debtor_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase for case-insensitive matching
  description := LOWER(COALESCE(description, ''));
  creditor_name := LOWER(COALESCE(creditor_name, ''));
  debtor_name := LOWER(COALESCE(debtor_name, ''));
  
  -- Internal transfers
  IF description LIKE '%overførsel%' OR description LIKE '%transfer%' THEN
    RETURN 'Internal Transfer';
  END IF;
  
  -- MobilePay
  IF description LIKE '%mobilepay%' OR creditor_name LIKE '%mobilepay%' THEN
    RETURN 'MobilePay';
  END IF;
  
  -- Grocery stores
  IF creditor_name LIKE '%netto%' OR creditor_name LIKE '%rema%' OR creditor_name LIKE '%aldi%' 
     OR creditor_name LIKE '%lidl%' OR creditor_name LIKE '%irma%' OR creditor_name LIKE '%kvickly%'
     OR creditor_name LIKE '%super brugsen%' OR creditor_name LIKE '%meny%' THEN
    RETURN 'Groceries';
  END IF;
  
  -- Convenience stores
  IF creditor_name LIKE '%7-eleven%' OR creditor_name LIKE '%7eleven%' OR creditor_name LIKE '%kiosk%' THEN
    RETURN '7-Eleven';
  END IF;
  
  -- Transportation
  IF creditor_name LIKE '%dsb%' OR creditor_name LIKE '%metro%' OR creditor_name LIKE '%bus%'
     OR creditor_name LIKE '%rejsekort%' OR creditor_name LIKE '%taxi%' THEN
    RETURN 'Transportation';
  END IF;
  
  -- Restaurants and food
  IF creditor_name LIKE '%restaurant%' OR creditor_name LIKE '%cafe%' OR creditor_name LIKE '%pizza%'
     OR creditor_name LIKE '%burger%' OR creditor_name LIKE '%mcdonalds%' OR creditor_name LIKE '%kfc%' THEN
    RETURN 'Dining';
  END IF;
  
  -- Bills and utilities
  IF creditor_name LIKE '%energi%' OR creditor_name LIKE '%el%' OR creditor_name LIKE '%gas%'
     OR creditor_name LIKE '%vand%' OR creditor_name LIKE '%varme%' OR creditor_name LIKE '%internet%'
     OR creditor_name LIKE '%telefon%' OR creditor_name LIKE '%forsikring%' THEN
    RETURN 'Bills';
  END IF;
  
  -- Shopping
  IF creditor_name LIKE '%magasin%' OR creditor_name LIKE '%illum%' OR creditor_name LIKE '%h&m%'
     OR creditor_name LIKE '%zara%' OR creditor_name LIKE '%ikea%' THEN
    RETURN 'Shopping';
  END IF;
  
  -- Default category
  RETURN 'Other';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically categorize transactions on insert/update
CREATE OR REPLACE FUNCTION auto_categorize_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category IS NULL OR NEW.category = '' THEN
    NEW.category := categorize_transaction(NEW.description, NEW.creditor_name, NEW.debtor_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_categorize_transaction
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_transaction();
