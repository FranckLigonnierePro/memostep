# Comparaison des Schémas - Ancien vs Nouveau

## 📊 Vue d'ensemble des changements

### Ancien Schéma (3 tables)
- `players` - Joueurs dans les salles versus
- `rooms` - Salles multijoueur
- `solo_scores` - Classement solo

### Nouveau Schéma (13 tables)
- **Utilisateurs**: `profiles`, `player_stats`, `player_avatars`
- **Multijoueur**: `rooms`, `players` (améliorés)
- **Solo**: `solo_scores` (amélioré)
- **Historique**: `match_history`, `xp_transactions`
- **Inventaire**: `player_inventory`
- **Défis**: `daily_challenges`, `daily_challenge_attempts`

---

## 🔄 Tables Modifiées

### `players` - Joueurs Versus

#### ✅ Colonnes Conservées
```sql
id uuid
room_code text
player_id text
name text
color text
score integer (0-5)
lives integer (0-3)
progress real (0-1)
created_at timestamp
updated_at timestamp
current_round integer
```

#### ➕ Colonnes Ajoutées
```sql
frozen_clicks integer DEFAULT 0
  -- Nombre de clics restants pour briser la glace (pouvoir freeze)

pending_freeze boolean DEFAULT false
  -- Indique si un gel est en attente d'application

avatar_url text
  -- URL de l'avatar/champion sélectionné

champion_ready boolean DEFAULT false
  -- Indique si le joueur a choisi son champion
```

#### 📝 Contraintes Ajoutées
```sql
CHECK (score >= 0)
CHECK (lives >= 0 AND lives <= 3)
CHECK (progress >= 0 AND progress <= 1)
```

**Impact**: Compatible avec le code existant, nouvelles fonctionnalités optionnelles.

---

### `rooms` - Salles Multijoueur

#### ✅ Colonnes Conservées
```sql
code text PRIMARY KEY
host_id text
guest_id text
status text ('waiting', 'playing', 'finished')
seed bigint
start_at_ms bigint
winner_id text
winner_time_ms bigint
created_at timestamp
updated_at timestamp
```

#### 📝 Améliorations
- Index ajoutés pour performance
- Trigger `updated_at` automatique
- Contrainte CHECK sur `status`

**Impact**: Aucun changement de structure, seulement des optimisations.

---

### `solo_scores` - Classement Solo

#### ✅ Colonnes Conservées
```sql
player_id text PRIMARY KEY
name text
best_level integer
best_time_ms bigint
total_levels integer
updated_at timestamp
color text
```

#### 📝 Améliorations
- Index sur `best_level` et `best_time_ms`
- Contraintes CHECK pour validation
- Trigger `updated_at` automatique

**Impact**: Compatible, meilleures performances.

---

## 🆕 Nouvelles Tables

### 1. `profiles` - Profils Utilisateurs
**Objectif**: Gérer les comptes authentifiés via Supabase Auth

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  is_guest boolean DEFAULT false,
  created_at timestamp,
  updated_at timestamp,
  last_seen_at timestamp
);
```

**Fonctionnalités**:
- Liaison avec Supabase Auth (Google, Apple, Email)
- Support des invités (guests)
- Profil public visible par tous

---

### 2. `player_stats` - Statistiques Joueur
**Objectif**: Centraliser toutes les statistiques et ressources

```sql
CREATE TABLE player_stats (
  player_id uuid PRIMARY KEY REFERENCES profiles(id),
  -- XP et Niveau
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  -- Ressources
  gold integer DEFAULT 0,
  essence integer DEFAULT 0,
  gems integer DEFAULT 0,
  -- Stats générales
  total_matches_played integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  total_losses integer DEFAULT 0,
  current_win_streak integer DEFAULT 0,
  best_win_streak integer DEFAULT 0,
  -- Stats solo
  solo_best_level integer DEFAULT 0,
  solo_best_time_ms bigint,
  solo_total_levels integer DEFAULT 0,
  -- Stats versus
  versus_wins integer DEFAULT 0,
  versus_losses integer DEFAULT 0,
  versus_matches_played integer DEFAULT 0
);
```

**Fonctionnalités**:
- Système XP et niveaux (1-50)
- Ressources: or, essence, gemmes
- Statistiques détaillées par mode
- Séries de victoires

---

### 3. `player_avatars` - Avatars Débloqués
**Objectif**: Gérer les avatars/champions possédés

```sql
CREATE TABLE player_avatars (
  player_id uuid REFERENCES profiles(id),
  avatar_id text,
  unlocked_at timestamp,
  is_selected boolean,
  PRIMARY KEY (player_id, avatar_id)
);
```

**Fonctionnalités**:
- Liste des avatars débloqués
- Avatar actuellement sélectionné
- Date de débloquage

---

### 4. `match_history` - Historique des Parties
**Objectif**: Enregistrer toutes les parties jouées

```sql
CREATE TABLE match_history (
  id uuid PRIMARY KEY,
  player_id uuid REFERENCES profiles(id),
  mode text, -- 'solo', 'versus', 'daily'
  result text, -- 'win', 'lose', 'abandon'
  score integer,
  time_ms bigint,
  level_reached integer,
  xp_gained integer,
  gold_earned integer,
  essence_earned integer,
  gems_earned integer,
  bonuses_collected integer,
  perfect_run boolean,
  played_at timestamp
);
```

**Fonctionnalités**:
- Historique complet des parties
- Statistiques détaillées par partie
- Ressources gagnées
- Bonus collectés

---

### 5. `xp_transactions` - Audit XP
**Objectif**: Tracer tous les gains/pertes d'XP

```sql
CREATE TABLE xp_transactions (
  id uuid PRIMARY KEY,
  player_id uuid REFERENCES profiles(id),
  xp_amount integer,
  reason text,
  match_id uuid REFERENCES match_history(id),
  created_at timestamp
);
```

**Fonctionnalités**:
- Audit trail complet
- Lien avec les parties
- Raison de chaque transaction

---

### 6. `player_inventory` - Inventaire
**Objectif**: Gérer les items possédés

```sql
CREATE TABLE player_inventory (
  id uuid PRIMARY KEY,
  player_id uuid REFERENCES profiles(id),
  item_type text, -- 'chest', 'skin', 'power', 'boost'
  item_id text,
  quantity integer,
  acquired_at timestamp,
  UNIQUE (player_id, item_type, item_id)
);
```

**Fonctionnalités**:
- Coffres (bronze, silver, gold, legendary)
- Skins pour avatars
- Pouvoirs spéciaux
- Boosters temporaires

---

### 7. `daily_challenges` - Défis Quotidiens
**Objectif**: Générer des défis quotidiens

```sql
CREATE TABLE daily_challenges (
  id uuid PRIMARY KEY,
  challenge_date date UNIQUE,
  seed bigint,
  difficulty text, -- 'easy', 'medium', 'hard'
  created_at timestamp
);
```

---

### 8. `daily_challenge_attempts` - Tentatives Défis
**Objectif**: Enregistrer les tentatives des joueurs

```sql
CREATE TABLE daily_challenge_attempts (
  id uuid PRIMARY KEY,
  challenge_id uuid REFERENCES daily_challenges(id),
  player_id uuid REFERENCES profiles(id),
  completed boolean,
  time_ms bigint,
  attempts integer,
  xp_gained integer,
  attempted_at timestamp,
  UNIQUE (challenge_id, player_id)
);
```

---

## 🎮 Nouvelles Fonctionnalités Supportées

### 1. Système de Comptes
**Avant**: Seulement guests avec localStorage
**Après**: 
- ✅ Comptes Google, Apple, Email
- ✅ Profils persistants
- ✅ Liaison de comptes guests
- ✅ Synchronisation multi-appareils

### 2. Système XP et Niveaux
**Avant**: Aucun système de progression
**Après**:
- ✅ 50 niveaux de progression
- ✅ Gains XP par partie
- ✅ Récompenses par niveau
- ✅ Audit trail complet

### 3. Ressources
**Avant**: Aucune ressource
**Après**:
- ✅ 🪙 Or (gold) - Collecté en jeu
- ✅ ✨ Essence - Bonus spéciaux
- ✅ 💎 Gemmes - Ressource rare

### 4. Bonus Collectables
**Avant**: Aucun bonus
**Après**:
- ✅ Or sur le chemin (5-15 pièces)
- ✅ Essence sur le chemin
- ✅ Gemmes adjacentes (max 1/run)
- ✅ Potions (restaure 1 vie)

### 5. Pièges
**Avant**: Aucun piège
**Après**:
- ✅ Perte de vie (💔)
- ✅ Recul de 2 cases (⬅️)
- ✅ Stun 1 seconde (⚡)
- ✅ Cases neutres (pas de pénalité)

### 6. Avatars/Champions
**Avant**: Sélection simple
**Après**:
- ✅ 16 champions disponibles
- ✅ Système de débloquage
- ✅ Sélection pré-partie
- ✅ Avatars réservés en versus

### 7. Statistiques
**Avant**: Basique (best_level, best_time)
**Après**:
- ✅ Stats globales (victoires, défaites)
- ✅ Stats par mode (solo, versus)
- ✅ Séries de victoires
- ✅ Historique complet des parties
- ✅ Taux de victoire

### 8. Inventaire
**Avant**: Aucun inventaire
**Après**:
- ✅ Coffres à ouvrir
- ✅ Skins pour avatars
- ✅ Pouvoirs spéciaux
- ✅ Boosters temporaires

### 9. Défis Quotidiens
**Avant**: Aucun défi
**Après**:
- ✅ Défis générés quotidiennement
- ✅ Classements quotidiens
- ✅ Récompenses XP
- ✅ Tentatives multiples

---

## 🔄 Migration des Données

### Données Préservées

#### `solo_scores`
```sql
-- Avant et Après: Structure identique
player_id text
name text
best_level integer
best_time_ms bigint
total_levels integer
color text
```
✅ **Aucune migration nécessaire**

#### `rooms` et `players`
```sql
-- Structure de base préservée
-- Nouvelles colonnes optionnelles ajoutées
```
✅ **Compatible avec le code existant**

### Nouvelles Données

#### Création de profils
```sql
-- Pour chaque joueur existant dans solo_scores
INSERT INTO profiles (id, username, is_guest)
VALUES (gen_random_uuid(), name, true);

-- Créer les stats associées
INSERT INTO player_stats (player_id, solo_best_level, solo_best_time_ms)
SELECT id, best_level, best_time_ms
FROM profiles
WHERE is_guest = true;
```

#### Liaison des comptes
```sql
-- Quand un guest crée un compte
UPDATE profiles
SET is_guest = false
WHERE id = auth.uid();

-- Migrer les données du guest
UPDATE player_stats
SET player_id = auth.uid()
WHERE player_id = (SELECT id FROM profiles WHERE username = 'Memoguest1234');
```

---

## 📊 Comparaison des Performances

### Requêtes Fréquentes

#### Charger le profil d'un joueur

**Avant**:
```sql
-- 2 requêtes séparées
SELECT * FROM solo_scores WHERE player_id = 'xxx';
SELECT * FROM players WHERE player_id = 'xxx';
```

**Après**:
```sql
-- 1 requête avec JOIN
SELECT p.*, ps.*
FROM profiles p
JOIN player_stats ps ON p.id = ps.player_id
WHERE p.id = 'xxx';
```

#### Classement global

**Avant**:
```sql
-- Seulement solo
SELECT * FROM solo_scores
ORDER BY best_level DESC, best_time_ms ASC
LIMIT 100;
```

**Après**:
```sql
-- Classement complet avec XP
SELECT * FROM leaderboard
LIMIT 100;
-- Vue pré-calculée avec index
```

---

## 🔐 Sécurité Améliorée

### Row Level Security (RLS)

**Avant**: Aucune sécurité au niveau des lignes

**Après**:
```sql
-- Les utilisateurs ne peuvent voir que leurs propres données
CREATE POLICY "Users can view own data" ON player_stats
  FOR SELECT USING (auth.uid() = player_id);

-- Les utilisateurs ne peuvent modifier que leurs propres données
CREATE POLICY "Users can update own data" ON player_stats
  FOR UPDATE USING (auth.uid() = player_id);
```

### Contraintes de Validation

**Avant**: Validation côté client uniquement

**Après**:
```sql
-- Validation au niveau de la base de données
CHECK (lives >= 0 AND lives <= 3)
CHECK (score >= 0)
CHECK (progress >= 0 AND progress <= 1)
CHECK (current_level >= 1 AND current_level <= 50)
```

---

## 📈 Évolutivité

### Ancien Schéma
- ❌ Limité au gameplay de base
- ❌ Pas de progression long-terme
- ❌ Pas de monétisation possible
- ❌ Pas de système social

### Nouveau Schéma
- ✅ Support complet de la progression
- ✅ Système de récompenses
- ✅ Prêt pour la monétisation
- ✅ Base pour système social
- ✅ Extensible pour futures fonctionnalités

---

## 🎯 Recommandations

### Phase 1: Migration (Semaine 1)
1. Déployer le nouveau schéma
2. Migrer les données existantes
3. Tester la compatibilité

### Phase 2: Intégration Auth (Semaine 2-3)
1. Intégrer Supabase Auth
2. Créer les flows de connexion
3. Gérer la liaison des comptes guests

### Phase 3: Nouvelles Fonctionnalités (Semaine 4+)
1. Activer le système XP
2. Implémenter les bonus collectables
3. Ajouter les pièges
4. Développer la boutique

### Phase 4: Fonctionnalités Avancées (Mois 2+)
1. Défis quotidiens
2. Battle Royale
3. Quêtes et achievements
4. Système social

---

## ✅ Checklist de Migration

- [ ] Sauvegarder la base de données actuelle
- [ ] Exécuter `database_schema.sql`
- [ ] Exécuter `migration_guide.sql`
- [ ] Vérifier l'intégrité des données
- [ ] Tester les requêtes existantes
- [ ] Mettre à jour le code client
- [ ] Déployer progressivement
- [ ] Monitorer les performances
- [ ] Nettoyer les tables temporaires

---

**Conclusion**: Le nouveau schéma est **100% compatible** avec l'existant tout en ajoutant des fonctionnalités puissantes pour l'avenir du jeu.
