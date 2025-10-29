-- ============================================
-- MEMOSTEP - Schéma de base de données complet
-- ============================================
-- Ce schéma inclut toutes les fonctionnalités :
-- - Système de comptes utilisateurs (Supabase Auth)
-- - Profils joueurs avec statistiques
-- - Système XP et niveaux
-- - Ressources (or, essence, gemmes)
-- - Mode solo avec progression
-- - Mode versus/multijoueur
-- - Avatars/champions
-- - Historique des parties
-- ============================================

-- ============================================
-- TABLE: profiles
-- Profils utilisateurs liés à Supabase Auth
-- ============================================
CREATE TABLE public.profiles (
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

-- Index pour recherche rapide par username
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_is_guest ON public.profiles(is_guest);

-- ============================================
-- TABLE: player_stats
-- Statistiques et progression des joueurs
-- ============================================
CREATE TABLE public.player_stats (
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Système XP et niveau
  total_xp integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  -- Ressources
  gold integer NOT NULL DEFAULT 0,
  essence integer NOT NULL DEFAULT 0,
  gems integer NOT NULL DEFAULT 0,
  -- Statistiques générales
  total_matches_played integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  total_losses integer NOT NULL DEFAULT 0,
  current_win_streak integer NOT NULL DEFAULT 0,
  best_win_streak integer NOT NULL DEFAULT 0,
  -- Statistiques solo
  solo_best_level integer NOT NULL DEFAULT 0,
  solo_best_time_ms bigint,
  solo_total_levels integer NOT NULL DEFAULT 0,
  -- Statistiques versus
  versus_wins integer NOT NULL DEFAULT 0,
  versus_losses integer NOT NULL DEFAULT 0,
  versus_matches_played integer NOT NULL DEFAULT 0,
  -- Métadonnées
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_stats_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_stats_total_xp_check CHECK (total_xp >= 0),
  CONSTRAINT player_stats_current_level_check CHECK (current_level >= 1 AND current_level <= 50),
  CONSTRAINT player_stats_gold_check CHECK (gold >= 0),
  CONSTRAINT player_stats_essence_check CHECK (essence >= 0),
  CONSTRAINT player_stats_gems_check CHECK (gems >= 0)
);

-- Index pour classements
CREATE INDEX idx_player_stats_total_xp ON public.player_stats(total_xp DESC);
CREATE INDEX idx_player_stats_current_level ON public.player_stats(current_level DESC);
CREATE INDEX idx_player_stats_solo_best_level ON public.player_stats(solo_best_level DESC);

-- ============================================
-- TABLE: player_avatars
-- Avatars/champions débloqués par joueur
-- ============================================
CREATE TABLE public.player_avatars (
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_id text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  is_selected boolean NOT NULL DEFAULT false,
  CONSTRAINT player_avatars_pkey PRIMARY KEY (player_id, avatar_id)
);

-- Index pour avatar sélectionné
CREATE INDEX idx_player_avatars_selected ON public.player_avatars(player_id, is_selected) WHERE is_selected = true;

-- ============================================
-- TABLE: rooms
-- Salles de jeu multijoueur (versus)
-- ============================================
CREATE TABLE public.rooms (
  code text NOT NULL,
  host_id text NOT NULL,
  guest_id text,
  status text NOT NULL DEFAULT 'waiting'::text,
  seed bigint,
  start_at_ms bigint,
  winner_id text,
  winner_time_ms bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (code),
  CONSTRAINT rooms_status_check CHECK (status = ANY (ARRAY['waiting'::text, 'playing'::text, 'finished'::text]))
);

-- Index pour nettoyage des anciennes salles
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_rooms_created_at ON public.rooms(created_at);

-- ============================================
-- TABLE: players
-- Joueurs dans une salle (versus)
-- ============================================
CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  player_id text NOT NULL,
  name text NOT NULL DEFAULT 'Player'::text,
  color text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  lives integer NOT NULL DEFAULT 3,
  progress real NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  current_round integer NOT NULL DEFAULT 1,
  frozen_clicks integer DEFAULT 0,
  pending_freeze boolean DEFAULT false,
  avatar_url text,
  champion_ready boolean DEFAULT false,
  CONSTRAINT players_pkey PRIMARY KEY (id),
  CONSTRAINT players_score_check CHECK (score >= 0),
  CONSTRAINT players_lives_check CHECK (lives >= 0 AND lives <= 3),
  CONSTRAINT players_progress_check CHECK (progress >= 0 AND progress <= 1)
);

-- Index pour recherche rapide
CREATE INDEX idx_players_room_code ON public.players(room_code);
CREATE INDEX idx_players_player_id ON public.players(player_id);

-- ============================================
-- TABLE: solo_scores
-- Classement global solo (leaderboard)
-- ============================================
CREATE TABLE public.solo_scores (
  player_id text NOT NULL,
  name text NOT NULL,
  best_level integer NOT NULL DEFAULT 0,
  best_time_ms bigint,
  total_levels integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  color text,
  CONSTRAINT solo_scores_pkey PRIMARY KEY (player_id),
  CONSTRAINT solo_scores_best_level_check CHECK (best_level >= 0),
  CONSTRAINT solo_scores_total_levels_check CHECK (total_levels >= 0)
);

-- Index pour classement
CREATE INDEX idx_solo_scores_best_level ON public.solo_scores(best_level DESC);
CREATE INDEX idx_solo_scores_best_time ON public.solo_scores(best_time_ms ASC) WHERE best_time_ms IS NOT NULL;

-- ============================================
-- TABLE: match_history
-- Historique des parties jouées
-- ============================================
CREATE TABLE public.match_history (
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
  CONSTRAINT match_history_pkey PRIMARY KEY (id),
  CONSTRAINT match_history_mode_check CHECK (mode = ANY (ARRAY['solo'::text, 'versus'::text, 'daily'::text])),
  CONSTRAINT match_history_result_check CHECK (result = ANY (ARRAY['win'::text, 'lose'::text, 'abandon'::text]))
);

-- Index pour historique joueur
CREATE INDEX idx_match_history_player_id ON public.match_history(player_id, played_at DESC);
CREATE INDEX idx_match_history_mode ON public.match_history(mode);

-- ============================================
-- TABLE: daily_challenges
-- Défis quotidiens (pour future implémentation)
-- ============================================
CREATE TABLE public.daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL,
  seed bigint NOT NULL,
  difficulty text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT daily_challenges_challenge_date_key UNIQUE (challenge_date),
  CONSTRAINT daily_challenges_difficulty_check CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))
);

-- ============================================
-- TABLE: daily_challenge_attempts
-- Tentatives des joueurs sur les défis quotidiens
-- ============================================
CREATE TABLE public.daily_challenge_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  time_ms bigint,
  attempts integer NOT NULL DEFAULT 1,
  xp_gained integer NOT NULL DEFAULT 0,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_challenge_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT daily_challenge_attempts_unique UNIQUE (challenge_id, player_id)
);

-- Index pour recherche
CREATE INDEX idx_daily_challenge_attempts_player ON public.daily_challenge_attempts(player_id);
CREATE INDEX idx_daily_challenge_attempts_challenge ON public.daily_challenge_attempts(challenge_id);

-- ============================================
-- TABLE: player_inventory
-- Inventaire des joueurs (coffres, items, etc.)
-- ============================================
CREATE TABLE public.player_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT player_inventory_unique UNIQUE (player_id, item_type, item_id),
  CONSTRAINT player_inventory_quantity_check CHECK (quantity >= 0),
  CONSTRAINT player_inventory_item_type_check CHECK (item_type = ANY (ARRAY['chest'::text, 'skin'::text, 'power'::text, 'boost'::text]))
);

-- Index pour recherche inventaire
CREATE INDEX idx_player_inventory_player_id ON public.player_inventory(player_id);

-- ============================================
-- TABLE: xp_transactions
-- Historique des gains/pertes d'XP (audit)
-- ============================================
CREATE TABLE public.xp_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount integer NOT NULL,
  reason text NOT NULL,
  match_id uuid REFERENCES public.match_history(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_transactions_pkey PRIMARY KEY (id)
);

-- Index pour historique XP
CREATE INDEX idx_xp_transactions_player_id ON public.xp_transactions(player_id, created_at DESC);

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON public.player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solo_scores_updated_at BEFORE UPDATE ON public.solo_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement les stats d'un nouveau joueur
CREATE OR REPLACE FUNCTION create_player_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (player_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer les stats automatiquement
CREATE TRIGGER create_stats_on_profile_creation AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_player_stats_for_new_profile();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour player_stats
CREATE POLICY "Stats are viewable by everyone" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can update own stats" ON public.player_stats
  FOR UPDATE USING (auth.uid() = player_id);

-- Politiques pour player_avatars
CREATE POLICY "Avatars are viewable by owner" ON public.player_avatars
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage own avatars" ON public.player_avatars
  FOR ALL USING (auth.uid() = player_id);

-- Politiques pour match_history
CREATE POLICY "Match history viewable by owner" ON public.match_history
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own match history" ON public.match_history
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Politiques pour player_inventory
CREATE POLICY "Inventory viewable by owner" ON public.player_inventory
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage own inventory" ON public.player_inventory
  FOR ALL USING (auth.uid() = player_id);

-- Politiques pour xp_transactions
CREATE POLICY "XP transactions viewable by owner" ON public.xp_transactions
  FOR SELECT USING (auth.uid() = player_id);

-- Politiques pour daily_challenge_attempts
CREATE POLICY "Challenge attempts viewable by owner" ON public.daily_challenge_attempts
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own attempts" ON public.daily_challenge_attempts
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Tables publiques (pas de RLS strict)
-- rooms, players, solo_scores, daily_challenges restent accessibles pour le gameplay

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour le classement global
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

-- Vue pour les statistiques de joueur enrichies
CREATE OR REPLACE VIEW public.player_stats_enriched AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.is_guest,
  ps.*,
  CASE 
    WHEN ps.total_matches_played > 0 
    THEN ROUND((ps.total_wins::numeric / ps.total_matches_played::numeric) * 100, 2)
    ELSE 0
  END as win_rate_percentage
FROM public.profiles p
JOIN public.player_stats ps ON p.id = ps.player_id;

-- ============================================
-- DONNÉES INITIALES (optionnel)
-- ============================================

-- Avatars par défaut débloqués pour tous les nouveaux joueurs
-- (À implémenter via une fonction trigger si nécessaire)

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs liés à Supabase Auth';
COMMENT ON TABLE public.player_stats IS 'Statistiques et progression des joueurs (XP, niveaux, ressources)';
COMMENT ON TABLE public.player_avatars IS 'Avatars/champions débloqués par chaque joueur';
COMMENT ON TABLE public.rooms IS 'Salles de jeu multijoueur (mode versus)';
COMMENT ON TABLE public.players IS 'Joueurs actifs dans une salle versus';
COMMENT ON TABLE public.solo_scores IS 'Classement global du mode solo';
COMMENT ON TABLE public.match_history IS 'Historique complet des parties jouées';
COMMENT ON TABLE public.daily_challenges IS 'Défis quotidiens générés';
COMMENT ON TABLE public.daily_challenge_attempts IS 'Tentatives des joueurs sur les défis quotidiens';
COMMENT ON TABLE public.player_inventory IS 'Inventaire des joueurs (coffres, skins, items)';
COMMENT ON TABLE public.xp_transactions IS 'Historique des transactions XP (audit trail)';
