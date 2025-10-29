-- ============================================
-- GUIDE DE MIGRATION - MEMOSTEP
-- ============================================
-- Ce fichier contient les étapes pour migrer depuis l'ancien schéma
-- vers le nouveau schéma complet avec toutes les fonctionnalités
-- ============================================

-- ============================================
-- ÉTAPE 1: SAUVEGARDER LES DONNÉES EXISTANTES
-- ============================================

-- Créer des tables temporaires pour sauvegarder les données
CREATE TABLE IF NOT EXISTS temp_old_players AS SELECT * FROM public.players;
CREATE TABLE IF NOT EXISTS temp_old_rooms AS SELECT * FROM public.rooms;
CREATE TABLE IF NOT EXISTS temp_old_solo_scores AS SELECT * FROM public.solo_scores;

-- ============================================
-- ÉTAPE 2: AJOUTER LES NOUVELLES TABLES
-- ============================================

-- Table profiles (nouvelle)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  avatar_url text,
  is_guest boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_username_key UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON public.profiles(is_guest);

-- Table player_stats (nouvelle)
CREATE TABLE IF NOT EXISTS public.player_stats (
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  gold integer NOT NULL DEFAULT 0,
  essence integer NOT NULL DEFAULT 0,
  gems integer NOT NULL DEFAULT 0,
  total_matches_played integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  total_losses integer NOT NULL DEFAULT 0,
  current_win_streak integer NOT NULL DEFAULT 0,
  best_win_streak integer NOT NULL DEFAULT 0,
  solo_best_level integer NOT NULL DEFAULT 0,
  solo_best_time_ms bigint,
  solo_total_levels integer NOT NULL DEFAULT 0,
  versus_wins integer NOT NULL DEFAULT 0,
  versus_losses integer NOT NULL DEFAULT 0,
  versus_matches_played integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_stats_pkey PRIMARY KEY (player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_stats_total_xp ON public.player_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_current_level ON public.player_stats(current_level DESC);

-- Table player_avatars (nouvelle)
CREATE TABLE IF NOT EXISTS public.player_avatars (
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_id text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  is_selected boolean NOT NULL DEFAULT false,
  CONSTRAINT player_avatars_pkey PRIMARY KEY (player_id, avatar_id)
);

-- Table match_history (nouvelle)
CREATE TABLE IF NOT EXISTS public.match_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL,
  result text NOT NULL,
  score integer,
  time_ms bigint,
  level_reached integer,
  xp_gained integer NOT NULL DEFAULT 0,
  gold_earned integer NOT NULL DEFAULT 0,
  essence_earned integer NOT NULL DEFAULT 0,
  gems_earned integer NOT NULL DEFAULT 0,
  bonuses_collected integer NOT NULL DEFAULT 0,
  perfect_run boolean DEFAULT false,
  played_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT match_history_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_match_history_player_id ON public.match_history(player_id, played_at DESC);

-- Table player_inventory (nouvelle)
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT player_inventory_unique UNIQUE (player_id, item_type, item_id)
);

-- Table xp_transactions (nouvelle)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount integer NOT NULL,
  reason text NOT NULL,
  match_id uuid REFERENCES public.match_history(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_transactions_pkey PRIMARY KEY (id)
);

-- ============================================
-- ÉTAPE 3: MODIFIER LES TABLES EXISTANTES
-- ============================================

-- Ajouter les colonnes manquantes à la table players (si elles n'existent pas)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players' AND column_name = 'frozen_clicks') THEN
    ALTER TABLE public.players ADD COLUMN frozen_clicks integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players' AND column_name = 'pending_freeze') THEN
    ALTER TABLE public.players ADD COLUMN pending_freeze boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.players ADD COLUMN avatar_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'players' AND column_name = 'champion_ready') THEN
    ALTER TABLE public.players ADD COLUMN champion_ready boolean DEFAULT false;
  END IF;
END $$;

-- Nettoyer les données invalides avant d'ajouter les contraintes
UPDATE public.players SET score = 0 WHERE score < 0;
UPDATE public.players SET lives = 0 WHERE lives < 0;
UPDATE public.players SET lives = 3 WHERE lives > 3;
UPDATE public.players SET progress = 0 WHERE progress < 0;
UPDATE public.players SET progress = 1 WHERE progress > 1;

-- Ajouter les contraintes manquantes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'players_score_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_score_check CHECK (score >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'players_lives_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_lives_check CHECK (lives >= 0 AND lives <= 3);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'players_progress_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_progress_check CHECK (progress >= 0 AND progress <= 1);
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4: MIGRER LES DONNÉES EXISTANTES
-- ============================================

-- Fonction pour migrer les joueurs guests existants vers profiles
CREATE OR REPLACE FUNCTION migrate_guest_players()
RETURNS void AS $$
DECLARE
  guest_record RECORD;
  new_user_id uuid;
BEGIN
  -- Pour chaque joueur unique dans solo_scores qui ressemble à un guest
  FOR guest_record IN 
    SELECT DISTINCT player_id, name, color
    FROM temp_old_solo_scores
    WHERE player_id LIKE 'guest-%' OR name LIKE 'Memoguest%'
  LOOP
    -- Générer un UUID pour ce guest
    new_user_id := gen_random_uuid();
    
    -- Créer un profil guest (sans lien auth.users car c'est un guest)
    -- Note: Pour les guests, on ne peut pas créer d'entrée dans auth.users
    -- On va plutôt garder le système actuel pour les guests
    -- et utiliser profiles uniquement pour les vrais comptes
    
    -- Pour l'instant, on laisse les guests dans solo_scores tel quel
    NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÉTAPE 5: CRÉER LES FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers sur les tables existantes
DROP TRIGGER IF EXISTS update_players_updated_at ON public.players;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_solo_scores_updated_at ON public.solo_scores;
CREATE TRIGGER update_solo_scores_updated_at BEFORE UPDATE ON public.solo_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour créer automatiquement les stats
CREATE OR REPLACE FUNCTION create_player_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (player_id)
  VALUES (NEW.id)
  ON CONFLICT (player_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_stats_on_profile_creation ON public.profiles;
CREATE TRIGGER create_stats_on_profile_creation AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_player_stats_for_new_profile();

-- ============================================
-- ÉTAPE 6: FONCTION UTILITAIRE POUR CRÉER UN PROFIL COMPLET
-- ============================================

-- Fonction pour créer un profil utilisateur complet (appelée depuis l'app)
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id uuid,
  p_username text,
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_is_guest boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Insérer le profil
  INSERT INTO public.profiles (id, username, display_name, avatar_url, is_guest)
  VALUES (p_user_id, p_username, p_display_name, p_avatar_url, p_is_guest)
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = now()
  RETURNING id INTO v_profile_id;
  
  -- Les stats seront créées automatiquement par le trigger
  
  -- Débloquer les avatars de base (optionnel)
  INSERT INTO public.player_avatars (player_id, avatar_id, is_selected)
  VALUES 
    (v_profile_id, 'mage', true),  -- Avatar par défaut
    (v_profile_id, 'guerriere', false)
  ON CONFLICT (player_id, avatar_id) DO NOTHING;
  
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÉTAPE 7: FONCTION POUR ENREGISTRER UNE PARTIE
-- ============================================

CREATE OR REPLACE FUNCTION record_match(
  p_player_id uuid,
  p_mode text,
  p_result text,
  p_score integer DEFAULT NULL,
  p_time_ms bigint DEFAULT NULL,
  p_level_reached integer DEFAULT NULL,
  p_xp_gained integer DEFAULT 0,
  p_gold_earned integer DEFAULT 0,
  p_essence_earned integer DEFAULT 0,
  p_gems_earned integer DEFAULT 0,
  p_bonuses_collected integer DEFAULT 0,
  p_perfect_run boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_match_id uuid;
BEGIN
  -- Insérer l'historique de match
  INSERT INTO public.match_history (
    player_id, mode, result, score, time_ms, level_reached,
    xp_gained, gold_earned, essence_earned, gems_earned,
    bonuses_collected, perfect_run
  )
  VALUES (
    p_player_id, p_mode, p_result, p_score, p_time_ms, p_level_reached,
    p_xp_gained, p_gold_earned, p_essence_earned, p_gems_earned,
    p_bonuses_collected, p_perfect_run
  )
  RETURNING id INTO v_match_id;
  
  -- Mettre à jour les statistiques du joueur
  UPDATE public.player_stats
  SET 
    total_matches_played = total_matches_played + 1,
    total_wins = total_wins + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    total_losses = total_losses + CASE WHEN p_result = 'lose' THEN 1 ELSE 0 END,
    current_win_streak = CASE 
      WHEN p_result = 'win' THEN current_win_streak + 1 
      ELSE 0 
    END,
    best_win_streak = GREATEST(
      best_win_streak,
      CASE WHEN p_result = 'win' THEN current_win_streak + 1 ELSE current_win_streak END
    ),
    total_xp = total_xp + p_xp_gained,
    gold = gold + p_gold_earned,
    essence = essence + p_essence_earned,
    gems = gems + p_gems_earned,
    -- Stats spécifiques au mode
    solo_best_level = CASE 
      WHEN p_mode = 'solo' THEN GREATEST(solo_best_level, COALESCE(p_level_reached, 0))
      ELSE solo_best_level
    END,
    solo_best_time_ms = CASE
      WHEN p_mode = 'solo' AND p_time_ms IS NOT NULL THEN 
        CASE 
          WHEN solo_best_time_ms IS NULL THEN p_time_ms
          ELSE LEAST(solo_best_time_ms, p_time_ms)
        END
      ELSE solo_best_time_ms
    END,
    solo_total_levels = CASE
      WHEN p_mode = 'solo' THEN solo_total_levels + 1
      ELSE solo_total_levels
    END,
    versus_wins = CASE
      WHEN p_mode = 'versus' AND p_result = 'win' THEN versus_wins + 1
      ELSE versus_wins
    END,
    versus_losses = CASE
      WHEN p_mode = 'versus' AND p_result = 'lose' THEN versus_losses + 1
      ELSE versus_losses
    END,
    versus_matches_played = CASE
      WHEN p_mode = 'versus' THEN versus_matches_played + 1
      ELSE versus_matches_played
    END
  WHERE player_id = p_player_id;
  
  -- Recalculer le niveau basé sur l'XP total
  UPDATE public.player_stats
  SET current_level = calculate_level_from_xp(total_xp)
  WHERE player_id = p_player_id;
  
  -- Enregistrer la transaction XP
  IF p_xp_gained > 0 THEN
    INSERT INTO public.xp_transactions (player_id, xp_amount, reason, match_id)
    VALUES (p_player_id, p_xp_gained, p_mode || ' match ' || p_result, v_match_id);
  END IF;
  
  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÉTAPE 8: FONCTION POUR CALCULER LE NIVEAU
-- ============================================

-- Fonction pour calculer le niveau basé sur l'XP total
-- Basée sur le système défini dans playerXpSystem.json
CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_total_xp integer)
RETURNS integer AS $$
DECLARE
  v_level integer := 1;
  v_xp_used integer := 0;
  v_xp_required integer;
BEGIN
  -- Parcourir les niveaux de 1 à 50
  FOR i IN 1..50 LOOP
    -- XP requis pour le niveau i (formule progressive)
    -- Niveau 1->2: 100 XP, puis augmentation progressive
    v_xp_required := 100 + (i - 1) * 50;
    
    IF p_total_xp >= v_xp_used + v_xp_required THEN
      v_xp_used := v_xp_used + v_xp_required;
      v_level := i + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN LEAST(v_level, 50); -- Max niveau 50
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ÉTAPE 9: VUES UTILES
-- ============================================

-- Vue pour le classement
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.username,
  p.display_name,
  p.avatar_url,
  ps.current_level,
  ps.total_xp,
  ps.total_wins,
  ps.solo_best_level,
  ps.versus_wins,
  ROW_NUMBER() OVER (ORDER BY ps.total_xp DESC) as rank
FROM public.profiles p
JOIN public.player_stats ps ON p.id = ps.player_id
WHERE p.is_guest = false
ORDER BY ps.total_xp DESC
LIMIT 100;

-- ============================================
-- ÉTAPE 10: NETTOYAGE (À FAIRE APRÈS VÉRIFICATION)
-- ============================================

-- Une fois la migration vérifiée, supprimer les tables temporaires
-- DROP TABLE IF EXISTS temp_old_players;
-- DROP TABLE IF EXISTS temp_old_rooms;
-- DROP TABLE IF EXISTS temp_old_solo_scores;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================

/*
MIGRATION POUR LES GUESTS:
- Les guests actuels (Memoguest1234) restent dans localStorage
- Ils n'ont PAS de compte dans auth.users
- Ils peuvent continuer à jouer et apparaître dans solo_scores
- Quand ils créent un compte, on peut migrer leurs données:
  1. Créer un profil dans profiles avec leur auth.uid()
  2. Copier leurs stats de solo_scores vers player_stats
  3. Lier leur player_id guest à leur nouveau UUID

MIGRATION POUR LES UTILISATEURS AUTHENTIFIÉS:
- Lors de la première connexion après migration:
  1. Vérifier si profiles existe pour auth.uid()
  2. Si non, créer via create_user_profile()
  3. Importer les données de localStorage si disponibles

COMPATIBILITÉ:
- Les tables rooms, players, solo_scores restent pour compatibilité
- Le code actuel continue de fonctionner
- On ajoute progressivement les nouvelles fonctionnalités
*/
