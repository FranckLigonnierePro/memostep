-- Script de test pour vérifier que Realtime fonctionne
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que les tables sont dans la publication realtime
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename = ANY(
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN '✓ Activé'
    ELSE '✗ Désactivé'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('rooms', 'players')
ORDER BY tablename;

-- 2. Lister toutes les tables dans la publication realtime
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 3. Vérifier les politiques RLS pour players
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- 4. Vérifier les politiques RLS pour rooms
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'rooms'
ORDER BY policyname;

-- 5. Test manuel: Créer une room de test
INSERT INTO rooms (code, status, host_id, guest_id)
VALUES ('TEST01', 'waiting', 'test-host', null)
ON CONFLICT (code) DO UPDATE SET status = 'waiting';

-- 6. Test manuel: Ajouter un joueur
INSERT INTO players (room_code, player_id, name, color, score, lives, progress)
VALUES ('TEST01', 'test-player-1', 'TestPlayer1', '#e74c3c', 0, 3, 0.0)
ON CONFLICT (room_code, player_id) DO UPDATE SET progress = 0.0;

-- 7. Test manuel: Mettre à jour la progression
UPDATE players 
SET progress = 0.5 
WHERE room_code = 'TEST01' AND player_id = 'test-player-1';

-- 8. Vérifier que la mise à jour a fonctionné
SELECT 
  room_code,
  player_id,
  name,
  progress,
  updated_at
FROM players
WHERE room_code = 'TEST01';

-- 9. Vérifier via la vue
SELECT 
  code,
  status,
  jsonb_array_length(players) as player_count,
  jsonb_pretty(players) as players_json
FROM rooms_with_players
WHERE code = 'TEST01';

-- 10. Nettoyer les données de test
-- DELETE FROM players WHERE room_code = 'TEST01';
-- DELETE FROM rooms WHERE code = 'TEST01';

-- Résumé
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Test Realtime terminé';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Vérifiez les résultats ci-dessus:';
  RAISE NOTICE '1. Les tables rooms et players doivent être "✓ Activé"';
  RAISE NOTICE '2. Les politiques RLS doivent permettre SELECT, INSERT, UPDATE';
  RAISE NOTICE '3. La vue rooms_with_players doit retourner les joueurs';
  RAISE NOTICE '==============================================';
END $$;
