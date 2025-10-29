# 📊 Résumé du Schéma de Base de Données Memostep

## 🎯 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMOSTEP DATABASE                         │
│                                                              │
│  Ancien: 3 tables → Nouveau: 13 tables                      │
│  Fonctionnalités: Basique → Complet                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Structure Complète

```
┌──────────────────────────────────────────────────────────────┐
│                    👤 UTILISATEURS                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  profiles                    player_stats                    │
│  ├─ id (uuid)               ├─ player_id (uuid)             │
│  ├─ username                ├─ total_xp                      │
│  ├─ display_name            ├─ current_level (1-50)         │
│  ├─ avatar_url              ├─ gold 🪙                       │
│  ├─ is_guest                ├─ essence ✨                    │
│  └─ timestamps              ├─ gems 💎                       │
│                             ├─ total_wins                     │
│  player_avatars             ├─ total_losses                  │
│  ├─ player_id               ├─ win_streak                    │
│  ├─ avatar_id               ├─ solo_best_level               │
│  ├─ unlocked_at             ├─ versus_wins                   │
│  └─ is_selected             └─ versus_losses                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    🎮 GAMEPLAY                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  rooms (Versus)              players (Versus)                │
│  ├─ code (6 chars)          ├─ room_code                     │
│  ├─ host_id                 ├─ player_id                     │
│  ├─ guest_id                ├─ name                          │
│  ├─ status                  ├─ color                         │
│  ├─ seed                    ├─ score (0-5)                   │
│  ├─ start_at_ms             ├─ lives (0-3)                   │
│  └─ winner_id               ├─ progress (0-1)                │
│                             ├─ current_round                 │
│  solo_scores                ├─ frozen_clicks                 │
│  ├─ player_id               ├─ pending_freeze                │
│  ├─ name                    ├─ avatar_url                    │
│  ├─ best_level              └─ champion_ready                │
│  ├─ best_time_ms                                             │
│  └─ total_levels                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    📊 HISTORIQUE                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  match_history              xp_transactions                  │
│  ├─ player_id              ├─ player_id                      │
│  ├─ mode                   ├─ xp_amount                      │
│  ├─ result                 ├─ reason                         │
│  ├─ score                  ├─ match_id                       │
│  ├─ time_ms                └─ created_at                     │
│  ├─ level_reached                                            │
│  ├─ xp_gained                                                │
│  ├─ gold_earned                                              │
│  ├─ essence_earned                                           │
│  ├─ gems_earned                                              │
│  ├─ bonuses_collected                                        │
│  ├─ perfect_run                                              │
│  └─ played_at                                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    🎁 INVENTAIRE                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  player_inventory                                            │
│  ├─ player_id                                                │
│  ├─ item_type (chest, skin, power, boost)                   │
│  ├─ item_id                                                  │
│  ├─ quantity                                                 │
│  └─ acquired_at                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    🏆 DÉFIS (Future)                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  daily_challenges           daily_challenge_attempts         │
│  ├─ challenge_date         ├─ challenge_id                   │
│  ├─ seed                   ├─ player_id                      │
│  ├─ difficulty             ├─ completed                      │
│  └─ created_at             ├─ time_ms                        │
│                            ├─ attempts                        │
│                            └─ xp_gained                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎮 Fonctionnalités par Table

### 👤 Gestion Utilisateurs

| Table | Fonctionnalité | Status |
|-------|---------------|--------|
| `profiles` | Comptes authentifiés (Google, Apple, Email) | ✅ Nouveau |
| `profiles` | Support guests (Memoguest1234) | ✅ Nouveau |
| `player_stats` | Système XP (niveaux 1-50) | ✅ Nouveau |
| `player_stats` | Ressources (🪙 ✨ 💎) | ✅ Nouveau |
| `player_stats` | Statistiques détaillées | ✅ Nouveau |
| `player_avatars` | 16 champions débloquables | ✅ Nouveau |

### 🎮 Gameplay

| Table | Fonctionnalité | Status |
|-------|---------------|--------|
| `rooms` | Salles versus (2-4 joueurs) | ✅ Existant |
| `players` | Système de rounds (1-5) | ✅ Existant |
| `players` | Système de vies (0-3) | ✅ Existant |
| `players` | Pouvoir freeze | ✅ Amélioré |
| `players` | Sélection champion | ✅ Amélioré |
| `solo_scores` | Classement global | ✅ Existant |

### 📊 Progression

| Table | Fonctionnalité | Status |
|-------|---------------|--------|
| `match_history` | Historique complet des parties | ✅ Nouveau |
| `match_history` | Ressources gagnées par partie | ✅ Nouveau |
| `match_history` | Bonus collectés | ✅ Nouveau |
| `xp_transactions` | Audit trail XP | ✅ Nouveau |

### 🎁 Économie

| Table | Fonctionnalité | Status |
|-------|---------------|--------|
| `player_inventory` | Coffres (bronze, silver, gold, legendary) | ✅ Nouveau |
| `player_inventory` | Skins pour avatars | ✅ Nouveau |
| `player_inventory` | Pouvoirs spéciaux | ✅ Nouveau |
| `player_inventory` | Boosters temporaires | ✅ Nouveau |

### 🏆 Défis

| Table | Fonctionnalité | Status |
|-------|---------------|--------|
| `daily_challenges` | Défis quotidiens | 🔜 Future |
| `daily_challenge_attempts` | Classements quotidiens | 🔜 Future |

---

## 🎯 Ressources du Jeu

### 🪙 Or (Gold)
```
Sources:
├─ Bonus sur le chemin (5-15 pièces)
├─ Bonus adjacents (5-15 pièces)
└─ Récompenses de niveau

Utilisations:
├─ Achats boutique
├─ Débloquer avatars
└─ Ouvrir coffres bronze/silver
```

### ✨ Essence
```
Sources:
├─ Bonus sur le chemin (1 essence)
├─ Bonus adjacents (1 essence)
└─ Récompenses de niveau

Utilisations:
├─ Débloquer pouvoirs
├─ Améliorer avatars
└─ Ouvrir coffres gold
```

### 💎 Gemmes
```
Sources:
├─ Bonus adjacents (max 1/run)
├─ Récompenses de niveau
└─ Coffres légendaires

Utilisations:
├─ Coffres premium
├─ Skins exclusifs
└─ Avatars légendaires
```

---

## 📈 Système XP

### Gains d'XP

```
Mode Solo:
├─ Base: 30 XP
├─ Multiplicateur étage: +10% par étage (max x3)
├─ Bonus temps: +0% à +50%
└─ Abandon: -50%

Mode Match:
├─ Victoire: 40 XP
├─ Défaite: 15 XP
├─ Partie parfaite: +50 XP
├─ Record temps: +20 XP
└─ Tous bonus: +20 XP

Mode Versus:
├─ Victoire duel: 60 XP
├─ Top 3 BR: 50 XP
└─ Victoire BR: 120 XP
```

### Progression des Niveaux

```
Niveau 1  →  2:  100 XP   (Total: 100)
Niveau 2  →  3:  150 XP   (Total: 250)
Niveau 3  →  4:  200 XP   (Total: 450)
Niveau 4  →  5:  250 XP   (Total: 700)
Niveau 5  →  6:  300 XP   (Total: 1000)
...
Niveau 49 → 50: 2550 XP   (Total: ~50000)
```

### Récompenses

```
Niveau 2:  50 🪙
Niveau 5:  100 🪙 + 1 💎
Niveau 10: Coffre Bronze
Niveau 15: Nouveau Champion
Niveau 20: Coffre Silver
Niveau 25: Skin Exclusif
Niveau 30: Coffre Gold
Niveau 40: Champion Légendaire
Niveau 50: Coffre Legendary
```

---

## 🎮 Éléments de Gameplay

### Bonus Collectables

```
Sur le Chemin:
├─ 🪙 Or (5-15 pièces) - Max 2/étage
└─ ✨ Essence (1) - Max 1/étage

Adjacent au Chemin:
├─ 🪙 Or (5-15 pièces)
├─ 💎 Gemme (1) - Max 1/run
├─ ✨ Essence (1)
└─ 🧪 Potion (+1 vie) - Max 1/run
```

### Pièges

```
Adjacent au Chemin (Max 1/ligne):
├─ 💔 Perte de vie (-1 vie)
├─ ⬅️ Recul (-2 cases)
└─ ⚡ Stun (1 seconde)

Cases Neutres:
└─ Aucun effet (marqué erreur sans pénalité)
```

### Avatars/Champions

```
Disponibles (16):
├─ Mage, Guerrière, Casseur, Dark
├─ Electrik, Frozen, Forest, Pixel
├─ Danseur, Inventeur, Shadow, Astre
└─ Colosse, Chrono, Hack, Archie

Système:
├─ Débloquage par niveau/coffres
├─ Sélection pré-partie (10s)
├─ Avatars réservés en versus
└─ Skins personnalisables
```

---

## 🔐 Sécurité

### Row Level Security (RLS)

```
Tables Protégées:
├─ profiles: Lecture publique, écriture propriétaire
├─ player_stats: Lecture publique, écriture propriétaire
├─ player_avatars: Propriétaire uniquement
├─ match_history: Propriétaire uniquement
├─ player_inventory: Propriétaire uniquement
└─ xp_transactions: Propriétaire uniquement (lecture)

Tables Publiques:
├─ rooms: Gameplay multijoueur
├─ players: Gameplay multijoueur
├─ solo_scores: Classement public
└─ daily_challenges: Défis publics
```

### Contraintes de Validation

```sql
-- Vies entre 0 et 3
CHECK (lives >= 0 AND lives <= 3)

-- Score positif
CHECK (score >= 0)

-- Progression entre 0 et 1
CHECK (progress >= 0 AND progress <= 1)

-- Niveau entre 1 et 50
CHECK (current_level >= 1 AND current_level <= 50)

-- Ressources positives
CHECK (gold >= 0 AND essence >= 0 AND gems >= 0)
```

---

## 📊 Vues et Fonctions

### Vues Principales

```sql
-- Classement des 100 meilleurs joueurs
leaderboard
├─ username, display_name, avatar_url
├─ current_level, total_xp
├─ total_wins, solo_best_level
└─ rank (calculé)

-- Stats enrichies avec taux de victoire
player_stats_enriched
├─ Toutes les colonnes de player_stats
└─ win_rate_percentage (calculé)
```

### Fonctions Utilitaires

```sql
-- Créer un profil complet
create_user_profile(user_id, username, display_name, avatar_url, is_guest)

-- Enregistrer une partie
record_match(player_id, mode, result, score, time_ms, ...)

-- Calculer le niveau depuis l'XP
calculate_level_from_xp(total_xp)
```

---

## 🚀 Roadmap d'Implémentation

### Phase 1: Migration (✅ Prêt)
- [x] Nouveau schéma SQL
- [x] Guide de migration
- [x] Documentation complète
- [ ] Tests de migration
- [ ] Déploiement

### Phase 2: Authentification (🔜 Prochaine)
- [ ] Intégration Supabase Auth
- [ ] Connexion Google
- [ ] Connexion Apple
- [ ] Connexion Email
- [ ] Liaison comptes guests

### Phase 3: Système XP (🔜 Prochaine)
- [ ] Calcul XP par partie
- [ ] Progression de niveau
- [ ] Récompenses automatiques
- [ ] Notifications XP
- [ ] Modal level up

### Phase 4: Bonus & Pièges (🔜 Prochaine)
- [ ] Génération bonus sur grille
- [ ] Collection bonus
- [ ] Pièges adjacents
- [ ] Cases neutres
- [ ] Effets visuels

### Phase 5: Inventaire (🔮 Future)
- [ ] Système de coffres
- [ ] Ouverture coffres
- [ ] Skins avatars
- [ ] Pouvoirs spéciaux
- [ ] Boutique

### Phase 6: Défis (🔮 Future)
- [ ] Génération défis quotidiens
- [ ] Classements quotidiens
- [ ] Récompenses spéciales
- [ ] Quêtes hebdomadaires

---

## 📞 Fichiers de Référence

| Fichier | Description |
|---------|-------------|
| `database_schema.sql` | Schéma SQL complet |
| `migration_guide.sql` | Guide de migration pas à pas |
| `DATABASE_README.md` | Documentation détaillée |
| `SCHEMA_COMPARISON.md` | Comparaison ancien vs nouveau |
| `SCHEMA_SUMMARY.md` | Ce résumé visuel |

---

## ✅ Checklist de Migration

```
Préparation:
├─ [ ] Sauvegarder la base actuelle
├─ [ ] Lire la documentation
├─ [ ] Comprendre les changements
└─ [ ] Planifier le déploiement

Migration:
├─ [ ] Exécuter database_schema.sql
├─ [ ] Exécuter migration_guide.sql
├─ [ ] Vérifier l'intégrité des données
└─ [ ] Tester les requêtes existantes

Validation:
├─ [ ] Tester le gameplay existant
├─ [ ] Vérifier les classements
├─ [ ] Tester les salles versus
└─ [ ] Valider les performances

Déploiement:
├─ [ ] Mettre à jour le code client
├─ [ ] Déployer progressivement
├─ [ ] Monitorer les erreurs
└─ [ ] Nettoyer les tables temporaires
```

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-01-29  
**Compatibilité**: 100% avec l'existant
