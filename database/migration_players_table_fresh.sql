-- Migration: Créer la table players et supprimer la colonne players de rooms
-- À exécuter dans Supabase SQL Editor

-- 0. Supprimer d'abord la colonne players de rooms si elle existe
ALTER TABLE rooms DROP COLUMN IF EXISTS players;

-- 1. Créer la nouvelle table players
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

-- 2. Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);

-- 3. Activer Row Level Security (RLS) pour la table players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- 4. Créer des politiques RLS (ajustez selon vos besoins)
-- Permettre à tout le monde de lire les joueurs
CREATE POLICY "Allow public read access to players"
  ON players FOR SELECT
  USING (true);

-- Permettre à tout le monde d'insérer des joueurs
CREATE POLICY "Allow public insert access to players"
  ON players FOR INSERT
  WITH CHECK (true);

-- Permettre à tout le monde de mettre à jour les joueurs
CREATE POLICY "Allow public update access to players"
  ON players FOR UPDATE
  USING (true);

-- Permettre à tout le monde de supprimer les joueurs
CREATE POLICY "Allow public delete access to players"
  ON players FOR DELETE
  USING (true);

-- 5. Créer une fonction trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Créer une vue pour faciliter les requêtes (optionnel)
CREATE OR REPLACE VIEW rooms_with_players AS
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
