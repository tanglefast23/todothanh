-- Add rejection_reason column to expenses table
-- Run this in Supabase SQL Editor

-- Add rejection_reason column
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update tab_history type constraint to include 'adjustment'
ALTER TABLE tab_history
DROP CONSTRAINT IF EXISTS tab_history_type_check;

ALTER TABLE tab_history
ADD CONSTRAINT tab_history_type_check
CHECK (type IN ('initial', 'add', 'expense_approved', 'expense_rejected', 'adjustment'));
