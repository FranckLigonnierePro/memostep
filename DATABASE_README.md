# Memostep - Documentation Base de Données

## 📋 Vue d'ensemble

Ce document décrit le schéma de base de données complet pour Memostep, incluant toutes les fonctionnalités actuelles et futures.

## 🗂️ Structure des Tables

### 1. **Gestion des Utilisateurs**

#### `profiles`
Profils utilisateurs liés à Supabase Auth.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID utilisateur (référence auth.users) |
| `username` | text | Nom d'utilisateur unique |
| `display_name` | text | Nom d'affichage (optionnel) |
| `avatar_url` | text | URL de l'avatar sélectionné |
| `is_guest` | boolean | Indique si c'est un compte invité |
| `created_at` | timestamp | Date de création |
| `updated_at` | timestamp | Dernière mise à jour |
| `last_seen_at` | timestamp | Dernière connexion |

**Fonctionnalités:**
- Gestion des comptes authentifiés via Supabase Auth
- Support des invités (guests) avec `is_guest = true`
- Liaison avec Google, Apple, Email

---

#### `player_stats`
Statistiques et progression des joueurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `player_id` | uuid | Référence au profil |
| `total_xp` | integer | XP total accumulé |
| `current_level` | integer | Niveau actuel (1-50) |
| `gold` | integer | 🪙 Pièces d'or |
| `essence` | integer | ✨ Essence magique |
| `gems` | integer | 💎 Gemmes |
| `total_matches_played` | integer | Nombre total de parties |
| `total_wins` | integer | Victoires totales |
| `total_losses` | integer | Défaites totales |
| `current_win_streak` | integer | Série de victoires actuelle |
| `best_win_streak` | integer | Meilleure série |
| `solo_best_level` | integer | Meilleur niveau atteint en solo |
| `solo_best_time_ms` | bigint | Meilleur temps en solo |
| `solo_total_levels` | integer | Niveaux solo complétés |
| `versus_wins` | integer | Victoires en versus |
| `versus_losses` | integer | Défaites en versus |
| `versus_matches_played` | integer | Parties versus jouées |

**Fonctionnalités:**
- Système XP et niveaux (1-50)
- Ressources (or, essence, gemmes)
- Statistiques détaillées par mode
- Séries de victoires

---

#### `player_avatars`
Avatars/champions débloqués par joueur.

| Colonne | Type | Description |
|---------|------|-------------|
| `player_id` | uuid | Référence au profil |
| `avatar_id` | text | ID de l'avatar (ex: 'mage', 'guerriere') |
| `unlocked_at` | timestamp | Date de débloquage |
| `is_selected` | boolean | Avatar actuellement sélectionné |

**Avatars disponibles:**
- Mage, Guerrière, Casseur, Dark, Electrik, Frozen
- Forest, Pixel, Danseur, Inventeur, Shadow, Astre
- Colosse, Chrono, Hack, Archie

---

### 2. **Mode Multijoueur (Versus)**

#### `rooms`
Salles de jeu multijoueur.

| Colonne | Type | Description |
|---------|------|-------------|
| `code` | text | Code de la salle (6 caractères) |
| `host_id` | text | ID de l'hôte |
| `guest_id` | text | ID de l'invité |
| `status` | text | État: waiting, playing, finished |
| `seed` | bigint | Seed pour génération aléatoire |
| `start_at_ms` | bigint | Timestamp de démarrage |
| `winner_id` | text | ID du gagnant |
| `winner_time_ms` | bigint | Temps du gagnant |

---

#### `players`
Joueurs dans une salle versus.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `room_code` | text | Code de la salle |
| `player_id` | text | ID du joueur |
| `name` | text | Nom du joueur |
| `color` | text | Couleur du joueur |
| `score` | integer | Score (0-5) |
| `lives` | integer | Vies restantes (0-3) |
| `progress` | real | Progression (0-1) |
| `current_round` | integer | Round actuel |
| `frozen_clicks` | integer | Clics restants si gelé |
| `pending_freeze` | boolean | Gel en attente |
| `avatar_url` | text | Avatar sélectionné |
| `champion_ready` | boolean | Champion choisi |

**Fonctionnalités:**
- Système de rounds (jusqu'à 5)
- Système de vies (3 max)
- Pouvoir de gel (freeze)
- Sélection de champion

---

### 3. **Mode Solo**

#### `solo_scores`
Classement global du mode solo.

| Colonne | Type | Description |
|---------|------|-------------|
| `player_id` | text | ID du joueur |
| `name` | text | Nom du joueur |
| `best_level` | integer | Meilleur niveau atteint |
| `best_time_ms` | bigint | Meilleur temps |
| `total_levels` | integer | Niveaux complétés |
| `color` | text | Couleur du joueur |

**Fonctionnalités:**
- Classement public
- Progression infinie
- Système de vies (3 max)
- Bonus collectables

---

### 4. **Historique et Progression**

#### `match_history`
Historique complet des parties.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `player_id` | uuid | Référence au profil |
| `mode` | text | solo, versus, daily |
| `result` | text | win, lose, abandon |
| `score` | integer | Score final |
| `time_ms` | bigint | Temps de jeu |
| `level_reached` | integer | Niveau atteint |
| `xp_gained` | integer | XP gagné |
| `gold_earned` | integer | Or gagné |
| `essence_earned` | integer | Essence gagnée |
| `gems_earned` | integer | Gemmes gagnées |
| `bonuses_collected` | integer | Bonus collectés |
| `perfect_run` | boolean | Partie parfaite |
| `played_at` | timestamp | Date de la partie |

---

#### `xp_transactions`
Historique des gains/pertes d'XP (audit).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `player_id` | uuid | Référence au profil |
| `xp_amount` | integer | Montant d'XP |
| `reason` | text | Raison du gain/perte |
| `match_id` | uuid | Référence à la partie |
| `created_at` | timestamp | Date de la transaction |

---

### 5. **Inventaire et Items**

#### `player_inventory`
Inventaire des joueurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `player_id` | uuid | Référence au profil |
| `item_type` | text | chest, skin, power, boost |
| `item_id` | text | ID de l'item |
| `quantity` | integer | Quantité possédée |
| `acquired_at` | timestamp | Date d'acquisition |

**Types d'items:**
- **chest**: Coffres (bronze, silver, gold, legendary)
- **skin**: Skins pour avatars
- **power**: Pouvoirs spéciaux
- **boost**: Boosters temporaires

---

### 6. **Défis Quotidiens (Future)**

#### `daily_challenges`
Défis quotidiens générés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `challenge_date` | date | Date du défi |
| `seed` | bigint | Seed pour génération |
| `difficulty` | text | easy, medium, hard |

---

#### `daily_challenge_attempts`
Tentatives des joueurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `challenge_id` | uuid | Référence au défi |
| `player_id` | uuid | Référence au profil |
| `completed` | boolean | Défi complété |
| `time_ms` | bigint | Temps de complétion |
| `attempts` | integer | Nombre de tentatives |
| `xp_gained` | integer | XP gagné |

---

## 🎮 Système de Gameplay

### Ressources

#### 🪙 Or (Gold)
- Gagné en collectant des bonus sur le chemin
- Valeur variable: 5-15 pièces par bonus
- Utilisé pour: achats dans la boutique

#### ✨ Essence
- Gagnée en collectant des bonus spéciaux
- 1 essence par bonus
- Utilisée pour: débloquer des pouvoirs

#### 💎 Gemmes
- Rares, max 1 par run
- Gagnées en collectant des bonus adjacents
- Utilisées pour: coffres premium, skins exclusifs

### Bonus Collectables

#### Sur le Chemin
- **Or**: 5-15 pièces (max 2 par étage)
- **Essence**: 1 essence (max 1 par étage)

#### Adjacent au Chemin
- **Or**: 5-15 pièces
- **Gemme**: 1 gemme (max 1 par run)
- **Essence**: 1 essence
- **Potion**: Restaure 1 vie (max 1 par run)

### Pièges

#### Types de Pièges (Adjacent au Chemin)
- **Perte de vie** (💔): Fait perdre 1 vie
- **Recul** (⬅️): Recule de 2 cases
- **Stun** (⚡): Bloque les clics pendant 1s

#### Cases Neutres
- Pas d'effet, mais marquées comme erreur
- Ne font pas perdre de vie

---

## 📊 Système XP et Niveaux

### Gains d'XP

#### Mode Match
- **Victoire**: 40 XP
- **Défaite**: 15 XP
- **Partie parfaite**: +50 XP bonus
- **Record de temps**: +20 XP bonus
- **Tous les bonus collectés**: +20 XP bonus

#### Mode Multijoueur
- **Victoire en duel**: 60 XP
- **Top 3 Battle Royale**: 50 XP
- **Victoire Battle Royale**: 120 XP

#### Mode Solo
Formule: `XP = baseXP × stageMultiplier × timeBonus × statusMultiplier`

- **baseXP**: 30 XP
- **stageMultiplier**: 1 + (stage - 1) × 0.1 (max 3.0)
- **timeBonus**: Basé sur le temps (1.0 à 1.5)
- **statusMultiplier**:
  - Complété: 1.0
  - Abandon: 0.5
  - Plus de vies: 0.8

### Progression des Niveaux

Niveaux 1-50 avec XP croissant:
- Niveau 1→2: 100 XP
- Niveau 2→3: 150 XP
- Niveau 3→4: 200 XP
- ...
- Niveau 49→50: 2550 XP

### Récompenses par Niveau

Exemples de récompenses:
- **Niveau 2**: 50 pièces
- **Niveau 5**: 100 pièces + 1 gemme
- **Niveau 10**: Coffre bronze
- **Niveau 15**: Nouveau personnage
- **Niveau 20**: Coffre argent
- **Niveau 25**: Skin exclusif
- **Niveau 30**: Coffre or
- **Niveau 50**: Coffre légendaire

---

## 🔐 Sécurité (RLS)

### Row Level Security activé sur:
- `profiles`: Les utilisateurs peuvent voir tous les profils, mais modifier uniquement le leur
- `player_stats`: Visibles par tous, modifiables par le propriétaire
- `player_avatars`: Visibles et modifiables uniquement par le propriétaire
- `match_history`: Visible uniquement par le propriétaire
- `player_inventory`: Visible et modifiable uniquement par le propriétaire
- `xp_transactions`: Visible uniquement par le propriétaire

### Tables publiques (sans RLS strict):
- `rooms`, `players`: Nécessaires pour le gameplay multijoueur
- `solo_scores`: Classement public
- `daily_challenges`: Défis publics

---

## 🔄 Fonctions Utilitaires

### `create_user_profile()`
Crée un profil complet pour un nouvel utilisateur.

```sql
SELECT create_user_profile(
  auth.uid(),
  'username',
  'Display Name',
  '/avatars/mage.png',
  false
);
```

### `record_match()`
Enregistre une partie et met à jour les statistiques.

```sql
SELECT record_match(
  auth.uid(),
  'solo',
  'win',
  NULL,
  45000,
  10,
  50,
  75,
  2,
  1,
  5,
  false
);
```

### `calculate_level_from_xp()`
Calcule le niveau basé sur l'XP total.

```sql
SELECT calculate_level_from_xp(1500); -- Retourne le niveau
```

---

## 📈 Vues

### `leaderboard`
Classement des 100 meilleurs joueurs par XP.

```sql
SELECT * FROM leaderboard LIMIT 10;
```

### `player_stats_enriched`
Statistiques enrichies avec taux de victoire.

```sql
SELECT * FROM player_stats_enriched WHERE id = auth.uid();
```

---

## 🚀 Migration

Pour migrer depuis l'ancien schéma:

1. **Sauvegarder les données existantes**
   ```sql
   -- Voir migration_guide.sql
   ```

2. **Exécuter le nouveau schéma**
   ```sql
   \i database_schema.sql
   ```

3. **Exécuter la migration**
   ```sql
   \i migration_guide.sql
   ```

4. **Vérifier les données**
   ```sql
   SELECT * FROM profiles;
   SELECT * FROM player_stats;
   ```

---

## 📝 Notes Importantes

### Gestion des Guests
- Les guests (Memoguest1234) restent dans `localStorage`
- Ils n'ont PAS de compte dans `auth.users`
- Ils peuvent jouer et apparaître dans `solo_scores`
- Lors de la création d'un compte:
  1. Créer un profil dans `profiles`
  2. Migrer les données de `solo_scores` vers `player_stats`
  3. Lier l'ancien `player_id` au nouveau UUID

### Compatibilité
- Les tables `rooms`, `players`, `solo_scores` restent pour compatibilité
- Le code actuel continue de fonctionner
- Ajout progressif des nouvelles fonctionnalités

### Performance
- Index sur toutes les colonnes fréquemment recherchées
- Triggers pour `updated_at` automatique
- Contraintes pour garantir l'intégrité des données

---

## 🎯 Prochaines Étapes

1. **Authentification**
   - Intégrer Supabase Auth (Google, Apple, Email)
   - Gérer la liaison des comptes guests

2. **Système de Boutique**
   - Achats avec or/gemmes
   - Coffres et récompenses

3. **Défis Quotidiens**
   - Génération automatique
   - Classements quotidiens

4. **Battle Royale**
   - Mode 4+ joueurs
   - Système d'élimination

5. **Quêtes et Achievements**
   - Quêtes quotidiennes/hebdomadaires
   - Système d'achievements

---

## 📞 Support

Pour toute question sur le schéma de base de données, consultez:
- `database_schema.sql`: Schéma complet
- `migration_guide.sql`: Guide de migration
- Ce README pour la documentation

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-01-29
