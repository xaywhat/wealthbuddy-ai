-- Internal Transfer Rules Table
-- This table stores rules for automatically categorizing internal transfers between accounts

CREATE TABLE IF NOT EXISTS internal_transfer_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique rule per account pair per user
  UNIQUE(user_id, from_account_id, to_account_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_internal_transfer_rules_user_id ON internal_transfer_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfer_rules_from_account ON internal_transfer_rules(from_account_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfer_rules_to_account ON internal_transfer_rules(to_account_id);

-- Enable Row Level Security
ALTER TABLE internal_transfer_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on internal_transfer_rules" ON internal_transfer_rules FOR ALL USING (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_internal_transfer_rules_updated_at 
  BEFORE UPDATE ON internal_transfer_rules
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Internal transfer rules table created successfully!';
END $$;
