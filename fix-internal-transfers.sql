-- Fix Internal Transfers being counted in financial summary
-- Run this in your Supabase SQL editor

-- Updated function that excludes Internal Transfers from income/expense calculations
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
  -- Calculate income and expenses, EXCLUDING Internal Transfers
  SELECT 
    COALESCE(SUM(CASE 
      WHEN COALESCE(t.user_category, t.category) != 'Internal Transfer' 
           AND get_category_type(p_user_id, COALESCE(t.user_category, t.category), t.amount) = 'income' 
      THEN ABS(t.amount) 
      ELSE 0 
    END), 0),
    COALESCE(SUM(CASE 
      WHEN COALESCE(t.user_category, t.category) != 'Internal Transfer' 
           AND get_category_type(p_user_id, COALESCE(t.user_category, t.category), t.amount) = 'expense' 
      THEN ABS(t.amount) 
      ELSE 0 
    END), 0),
    COUNT(CASE WHEN COALESCE(t.user_category, t.category) != 'Internal Transfer' THEN 1 END)
  INTO income_sum, expense_sum, trans_count
  FROM transactions t
  JOIN accounts a ON t.account_id = a.id
  WHERE a.user_id = p_user_id
    AND (p_start_date IS NULL OR t.date >= p_start_date)
    AND (p_end_date IS NULL OR t.date <= p_end_date);
  
  RETURN QUERY SELECT income_sum, expense_sum, income_sum - expense_sum, trans_count;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Financial summary function updated to exclude Internal Transfers!';
END $$;
