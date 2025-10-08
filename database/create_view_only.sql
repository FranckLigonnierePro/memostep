-- Créer uniquement la vue rooms_with_players pour votre schéma existant
-- À exécuter dans Supabase SQL Editor

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS rooms_with_players;

-- Créer la vue avec toutes les colonnes de votre table rooms
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

-- Vérifier que la vue fonctionne
SELECT * FROM rooms_with_players LIMIT 1;
