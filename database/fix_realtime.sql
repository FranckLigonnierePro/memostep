-- Script pour corriger les problèmes de realtime et de visibilité des joueurs
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que la table players a les bonnes politiques RLS
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Allow public read access to players" ON players;
DROP POLICY IF EXISTS "Allow public insert access to players" ON players;
DROP POLICY IF EXISTS "Allow public update access to players" ON players;
DROP POLICY IF EXISTS "Allow public delete access to players" ON players;

-- Activer RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Créer des politiques permissives pour tous
CREATE POLICY "Enable read access for all users" ON players
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON players
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON players
  FOR DELETE USING (true);

-- 2. Vérifier que la table rooms a les bonnes politiques RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable insert access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable update access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable delete access for all users" ON rooms;

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON rooms
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON rooms
  FOR DELETE USING (true);

-- 3. Recréer la vue rooms_with_players
DROP VIEW IF EXISTS rooms_with_players;

CREATE VIEW rooms_with_players AS
SELECT 
  r.code,
  r.host_id,
  r.guest_id,
  r.status,
  r.seed,
  r.start_at_ms,
  r.winner_id,
  r.winner_time_ms,
  r.created_at,
  r.updated_at,
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
GROUP BY r.code, r.host_id, r.guest_id, r.status, r.seed, r.start_at_ms, r.winner_id, r.winner_time_ms, r.created_at, r.updated_at;

-- 4. Activer Realtime pour les tables
-- Vérifier que Realtime est activé pour la table players
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Vérifier que Realtime est activé pour la table rooms
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- 5. Test: Afficher une room avec ses joueurs
SELECT 
  code,
  status,
  jsonb_array_length(players) as player_count,
  players
FROM rooms_with_players
LIMIT 1;

-- 6. Test: Afficher tous les joueurs
SELECT 
  room_code,
  player_id,
  name,
  color,
  score,
  lives
FROM players
ORDER BY room_code, created_at;

-- 7. Vérification finale
DO $$
DECLARE
  room_count INTEGER;
  player_count INTEGER;
  view_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO room_count FROM rooms;
  SELECT COUNT(*) INTO player_count FROM players;
  
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_name = 'rooms_with_players'
  ) INTO view_exists;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Vérification du système';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Rooms: %', room_count;
  RAISE NOTICE 'Players: %', player_count;
  RAISE NOTICE 'Vue rooms_with_players existe: %', view_exists;
  RAISE NOTICE '==============================================';
  
  IF view_exists THEN
    RAISE NOTICE '✓ La vue existe et devrait fonctionner';
  ELSE
    RAISE WARNING '✗ La vue n''existe pas!';
  END IF;
END $$;
