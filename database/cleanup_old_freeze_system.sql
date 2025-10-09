-- Cleanup script for old freeze system
-- This removes the obsolete frozen_row column if it exists
-- Safe to run multiple times

-- Drop the old frozen_row column if it exists
ALTER TABLE players DROP COLUMN IF EXISTS frozen_row;

-- Verification
DO $$
DECLARE
  has_frozen_row BOOLEAN;
BEGIN
  -- Check if frozen_row column still exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'players' 
    AND column_name = 'frozen_row'
  ) INTO has_frozen_row;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Old Freeze System Cleanup';
  RAISE NOTICE '==============================================';
  
  IF NOT has_frozen_row THEN
    RAISE NOTICE '✓ Column frozen_row removed (or never existed)';
  ELSE
    RAISE WARNING '✗ Column frozen_row still exists';
  END IF;
  
  RAISE NOTICE '==============================================';
END $$;
