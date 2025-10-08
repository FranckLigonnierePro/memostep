-- Migration complète: Restructuration de la base de données
-- Ce script gère tous les cas de figure (avec ou sans données existantes)
-- À exécuter dans Supabase SQL Editor

-- ============================================================================
-- ÉTAPE 1: Sauvegarder les données existantes si la colonne players existe
-- ============================================================================

-- Créer une table temporaire pour sauvegarder les données
CREATE TEMP TABLE IF NOT EXISTS temp_players_backup AS
SELECT 
  r.code as room_code,
  p->>'id' as player_id,
  COALESCE(p->>'name', 'Player') as name,
  COALESCE(p->>'color', '#ffffff') as color,
  COALESCE((p->>'score')::INTEGER, 0) as score,
  COALESCE((p->>'lives')::INTEGER, 3) as lives,
  COALESCE((p->>'progress')::REAL, 0) as progress
FROM rooms r,
LATERAL jsonb_array_elements(
  CASE 
    WHEN jsonb_typeof(r.players) = 'array' THEN r.players
    ELSE '[]'::jsonb
  END
) as p
WHERE EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'rooms' 
  AND column_name = 'players'
);

-- ============================================================================
-- ÉTAPE 2: Supprimer la colonne players de rooms
-- ============================================================================

ALTER TABLE rooms DROP COLUMN IF EXISTS players;

-- ============================================================================
-- ÉTAPE 3: Créer la nouvelle table players
-- ============================================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Player',
  color TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  lives INTEGER NOT NULL DEFAULT 3,
  progress REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_code, player_id)
);

-- ============================================================================
-- ÉTAPE 4: Créer les index
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);

-- ============================================================================
-- ÉTAPE 5: Restaurer les données depuis la sauvegarde temporaire
-- ============================================================================

INSERT INTO players (room_code, player_id, name, color, score, lives, progress)
SELECT 
  room_code,
  player_id,
  name,
  color,
  score,
  lives,
  progress
FROM temp_players_backup
WHERE player_id IS NOT NULL
ON CONFLICT (room_code, player_id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  score = EXCLUDED.score,
  lives = EXCLUDED.lives,
  progress = EXCLUDED.progress;

-- Afficher le nombre de joueurs migrés
DO $$
DECLARE
  player_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO player_count FROM players;
  RAISE NOTICE 'Nombre de joueurs migrés: %', player_count;
END $$;

-- ============================================================================
-- ÉTAPE 6: Configurer Row Level Security (RLS)
-- ============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow public read access to players" ON players;
DROP POLICY IF EXISTS "Allow public insert access to players" ON players;
DROP POLICY IF EXISTS "Allow public update access to players" ON players;
DROP POLICY IF EXISTS "Allow public delete access to players" ON players;

-- Créer les nouvelles politiques
CREATE POLICY "Allow public read access to players"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to players"
  ON players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to players"
  ON players FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to players"
  ON players FOR DELETE
  USING (true);

-- ============================================================================
-- ÉTAPE 7: Créer la fonction trigger pour updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 8: Créer le trigger
-- ============================================================================

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ÉTAPE 9: Créer la vue rooms_with_players
-- ============================================================================

DROP VIEW IF EXISTS rooms_with_players;
CREATE VIEW rooms_with_players AS
SELECT 
  r.code,
  r.status,
  r.host_id,
  r.seed,
  r.start_at_ms,
  r.winner_id,
  r.winner_time_ms,
  r.created_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.player_id,
        'name', p.name,
        'color', p.color,
        'score', p.score,
        'lives', p.lives,
        'progress', p.progress
      ) ORDER BY p.created_at
    ) FILTER (WHERE p.player_id IS NOT NULL),
    '[]'::jsonb
  ) as players
FROM rooms r
LEFT JOIN players p ON r.code = p.room_code
GROUP BY r.code, r.status, r.host_id, r.seed, r.start_at_ms, r.winner_id, r.winner_time_ms, r.created_at;

-- ============================================================================
-- ÉTAPE 10: Vérification finale
-- ============================================================================

DO $$
DECLARE
  room_count INTEGER;
  player_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO room_count FROM rooms;
  SELECT COUNT(*) INTO player_count FROM players;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration terminée avec succès!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Nombre de rooms: %', room_count;
  RAISE NOTICE 'Nombre de joueurs: %', player_count;
  RAISE NOTICE '==============================================';
  
  -- Vérifier que la colonne players n'existe plus dans rooms
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rooms' 
    AND column_name = 'players'
  ) THEN
    RAISE NOTICE '✓ La colonne players a été supprimée de la table rooms';
  ELSE
    RAISE WARNING '✗ La colonne players existe encore dans la table rooms';
  END IF;
  
  -- Vérifier que la table players existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'players'
  ) THEN
    RAISE NOTICE '✓ La table players a été créée';
  ELSE
    RAISE WARNING '✗ La table players n''existe pas';
  END IF;
  
  -- Vérifier que la vue existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_name = 'rooms_with_players'
  ) THEN
    RAISE NOTICE '✓ La vue rooms_with_players a été créée';
  ELSE
    RAISE WARNING '✗ La vue rooms_with_players n''existe pas';
  END IF;
  
  RAISE NOTICE '==============================================';
END $$;
