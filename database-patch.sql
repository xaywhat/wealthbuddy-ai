-- Database patch to add missing balance_type column
-- Run this in your Supabase SQL editor

-- Add the missing balance_type column to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance_type TEXT DEFAULT 'closingBooked';

-- Create an index for the new column for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_balance_type ON accounts(balance_type);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database patch applied successfully!';
  RAISE NOTICE 'Added balance_type column to accounts table.';
END $$;
