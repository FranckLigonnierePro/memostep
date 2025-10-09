-- Add freeze power system to players table
-- This migration adds columns for the freeze power that freezes the entire grid

-- Add frozen_clicks column (number of clicks needed to break the ice)
ALTER TABLE players ADD COLUMN IF NOT EXISTS frozen_clicks INTEGER NOT NULL DEFAULT 0;

-- Add pending_freeze column (whether a freeze is pending to be applied)
ALTER TABLE players ADD COLUMN IF NOT EXISTS pending_freeze BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_players_frozen_clicks ON players(frozen_clicks) WHERE frozen_clicks > 0;

-- Create PostgreSQL function to apply freeze power
-- This function applies a freeze to all opponents in a room
CREATE OR REPLACE FUNCTION apply_freeze_power(
  p_room_code TEXT,
  p_player_id TEXT
)
RETURNS void AS $$
BEGIN
  -- Set pending_freeze to true for all opponents in the room
  UPDATE players
  SET pending_freeze = true
  WHERE room_code = p_room_code
    AND player_id != p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION apply_freeze_power(TEXT, TEXT) TO authenticated, anon;

-- Verification
DO $$
DECLARE
  has_frozen_clicks BOOLEAN;
  has_pending_freeze BOOLEAN;
  has_function BOOLEAN;
BEGIN
  -- Check if frozen_clicks column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'players' 
    AND column_name = 'frozen_clicks'
  ) INTO has_frozen_clicks;
  
  -- Check if pending_freeze column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'players' 
    AND column_name = 'pending_freeze'
  ) INTO has_pending_freeze;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'apply_freeze_power'
  ) INTO has_function;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Freeze System Migration';
  RAISE NOTICE '==============================================';
  
  IF has_frozen_clicks THEN
    RAISE NOTICE '✓ Column frozen_clicks added';
  ELSE
    RAISE WARNING '✗ Column frozen_clicks not found';
  END IF;
  
  IF has_pending_freeze THEN
    RAISE NOTICE '✓ Column pending_freeze added';
  ELSE
    RAISE WARNING '✗ Column pending_freeze not found';
  END IF;
  
  IF has_function THEN
    RAISE NOTICE '✓ Function apply_freeze_power created';
  ELSE
    RAISE WARNING '✗ Function apply_freeze_power not found';
  END IF;
  
  RAISE NOTICE '==============================================';
END $$;
