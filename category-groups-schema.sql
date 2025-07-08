-- Add category groups table for multi-select category summation feature
CREATE TABLE category_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  categories TEXT[] NOT NULL,
  group_type TEXT DEFAULT 'expense' CHECK (group_type IN ('expense', 'income', 'mixed')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_category_groups_user_id ON category_groups(user_id);
CREATE INDEX idx_category_groups_default ON category_groups(user_id, is_default);
CREATE INDEX idx_category_groups_type ON category_groups(user_id, group_type);

-- Insert some default category groups for new users
-- Note: These would typically be inserted when a user first connects their bank
-- INSERT INTO category_groups (user_id, name, categories, group_type, is_default) VALUES
-- ('user-id-here', 'Essential Expenses', ARRAY['Bills', 'Groceries', 'Transport', 'Healthcare'], 'expense', true),
-- ('user-id-here', 'Discretionary Spending', ARRAY['Entertainment', 'Dining', 'Shopping'], 'expense', false),
-- ('user-id-here', 'Income Sources', ARRAY['Income', 'Internal Transfer'], 'income', true);
