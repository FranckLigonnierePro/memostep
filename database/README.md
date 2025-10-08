# Migration de la base de données - Table Players

## Vue d'ensemble

Cette migration transforme la structure de la base de données pour séparer les joueurs dans une table dédiée au lieu de les stocker dans une colonne JSON dans la table `rooms`.

## Structure actuelle

**Table `rooms`:**
```
- code (TEXT, PRIMARY KEY)
- status (TEXT)
- host_id (TEXT)
- seed (INTEGER)
- start_at_ms (BIGINT)
- winner_id (TEXT)
- winner_time_ms (INTEGER)
- players (JSONB) ← Colonne à supprimer
- created_at (TIMESTAMPTZ)
```

## Nouvelle structure

**Table `rooms`:**
```
- code (TEXT, PRIMARY KEY)
- status (TEXT)
- host_id (TEXT)
- seed (INTEGER)
- start_at_ms (BIGINT)
- winner_id (TEXT)
- winner_time_ms (INTEGER)
- created_at (TIMESTAMPTZ)
```

**Table `players` (nouvelle):**
```
- id (UUID, PRIMARY KEY)
- room_code (TEXT, FOREIGN KEY → rooms.code)
- player_id (TEXT)
- name (TEXT)
- color (TEXT)
- score (INTEGER)
- lives (INTEGER)
- progress (REAL)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- UNIQUE(room_code, player_id)
```

## Avantages de cette structure

1. **Normalisation**: Les données sont mieux structurées selon les principes de normalisation des bases de données
2. **Performance**: Les requêtes sur les joueurs sont plus rapides avec des index appropriés
3. **Flexibilité**: Plus facile d'ajouter de nouvelles colonnes pour les joueurs
4. **Intégrité**: Les contraintes de clé étrangère garantissent l'intégrité référentielle
5. **Requêtes**: Plus facile de faire des requêtes complexes sur les joueurs (tri, filtrage, agrégation)
6. **Realtime**: Meilleure granularité pour les mises à jour en temps réel (un changement de joueur ne déclenche pas une mise à jour de toute la room)

## Étapes de migration

### 1. Exécuter le script SQL

Connectez-vous à votre dashboard Supabase et exécutez le fichier `migration_players_table.sql` dans le SQL Editor.

Le script va:
- Créer la nouvelle table `players`
- Créer les index nécessaires
- Migrer les données existantes de `rooms.players` vers la table `players`
- Configurer les politiques RLS
- Créer une vue `rooms_with_players` pour faciliter les requêtes

### 2. Vérifier la migration

Après l'exécution du script, vérifiez que:
- La table `players` contient toutes les données migrées
- Les relations entre `rooms` et `players` sont correctes
- Les politiques RLS fonctionnent correctement

```sql
-- Vérifier le nombre de joueurs migrés
SELECT COUNT(*) FROM players;

-- Vérifier les données d'une room spécifique
SELECT * FROM rooms_with_players WHERE code = 'VOTRE_CODE';
```

### 3. Mettre à jour le code de l'application

Remplacez l'import dans votre application:

**Avant:**
```javascript
import { ... } from './lib/realtime.js';
```

**Après:**
```javascript
import { ... } from './lib/realtime_v2.js';
```

Ou renommez directement les fichiers:
```bash
mv src/lib/realtime.js src/lib/realtime_old.js
mv src/lib/realtime_v2.js src/lib/realtime.js
```

### 4. Tester l'application

Testez toutes les fonctionnalités du mode versus:
- Création de room
- Rejoindre une room
- Démarrage d'une partie
- Mise à jour de la progression
- Gestion des scores et des vies
- Fin de partie

### 5. Supprimer l'ancienne colonne (optionnel)

Une fois que vous avez vérifié que tout fonctionne correctement, vous pouvez supprimer l'ancienne colonne `players` de la table `rooms`:

```sql
ALTER TABLE rooms DROP COLUMN IF EXISTS players;
```

⚠️ **Attention**: Cette action est irréversible. Assurez-vous d'avoir une sauvegarde avant de procéder.

## Rollback

Si vous devez revenir en arrière:

1. Restaurez l'ancienne colonne `players`:
```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS players JSONB;
```

2. Migrez les données de la table `players` vers `rooms.players`:
```sql
UPDATE rooms r
SET players = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.player_id,
      'name', p.name,
      'color', p.color,
      'score', p.score,
      'lives', p.lives,
      'progress', p.progress
    )
  )
  FROM players p
  WHERE p.room_code = r.code
);
```

3. Revenez à l'ancien fichier `realtime.js`

## Support

Si vous rencontrez des problèmes lors de la migration, vérifiez:
- Les logs Supabase pour les erreurs SQL
- Les permissions RLS
- Les contraintes de clé étrangère
- La console du navigateur pour les erreurs JavaScript
