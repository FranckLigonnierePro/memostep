-- Ajouter la colonne current_round à la table players
-- Chaque joueur a son propre numéro de round

-- 1. Ajouter la colonne current_round
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;

-- 2. Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_players_current_round ON players(current_round);

-- 3. Vérifier
SELECT 
  player_id,
  name,
  score,
  current_round,
  progress
FROM players
LIMIT 5;
