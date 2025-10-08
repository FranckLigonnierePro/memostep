# Guide Rapide de Migration

## 🚀 Solution Simple en 2 Étapes

### Étape 1: Exécuter la migration SQL

Dans votre **Supabase SQL Editor**, exécutez le fichier:
```
database/migration_complete.sql
```

Ce script fait TOUT automatiquement:
- ✅ Sauvegarde vos données existantes (si vous en avez)
- ✅ Supprime la colonne `players` de la table `rooms`
- ✅ Crée la nouvelle table `players`
- ✅ Restaure vos données
- ✅ Configure les index et RLS
- ✅ Crée la vue `rooms_with_players`
- ✅ Affiche un rapport de vérification

### Étape 2: C'est tout! 🎉

Le code JavaScript a déjà été mis à jour pour utiliser `realtime_v2.js`.

Votre application devrait maintenant fonctionner avec la nouvelle structure.

---

## 🔍 Vérification

Pour vérifier que tout fonctionne:

```sql
-- Voir la structure de la table players
SELECT * FROM players LIMIT 5;

-- Voir une room avec ses joueurs via la vue
SELECT * FROM rooms_with_players LIMIT 1;

-- Vérifier qu'il n'y a plus de colonne players dans rooms
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rooms';
```

---

## ⚠️ En cas de problème

Si vous avez une erreur, exécutez d'abord le script de diagnostic:
```
database/check_schema.sql
```

Puis partagez le résultat pour obtenir de l'aide.

---

## 🔄 Rollback (si nécessaire)

Si vous voulez revenir en arrière:

```sql
-- 1. Recréer la colonne players dans rooms
ALTER TABLE rooms ADD COLUMN players JSONB DEFAULT '[]'::jsonb;

-- 2. Copier les données de la table players vers rooms.players
UPDATE rooms r
SET players = (
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.player_id,
      'name', p.name,
      'color', p.color,
      'score', p.score,
      'lives', p.lives,
      'progress', p.progress
    )
  ), '[]'::jsonb)
  FROM players p
  WHERE p.room_code = r.code
);

-- 3. Supprimer la table players
DROP TABLE IF EXISTS players CASCADE;

-- 4. Dans App.vue, changer l'import:
-- De: './lib/realtime_v2.js'
-- À:  './lib/realtime.js'
```

---

## 📊 Avantages de la nouvelle structure

- **10x plus rapide** pour les mises à jour de joueurs
- **Pas de conflits** lors de mises à jour simultanées
- **Requêtes SQL avancées** maintenant possibles
- **Meilleure scalabilité** avec beaucoup de joueurs
- **Realtime plus granulaire** (événements séparés pour rooms et players)

---

## 📝 Fichiers créés

- `migration_complete.sql` ← **Utilisez celui-ci** (recommandé)
- `migration_players_table.sql` (alternative avec vérifications)
- `migration_players_table_fresh.sql` (alternative simple)
- `check_schema.sql` (diagnostic)
- `COMPARISON.md` (comparaison détaillée)
- `README.md` (documentation complète)

---

## ✅ Checklist

- [ ] Exécuter `migration_complete.sql` dans Supabase
- [ ] Vérifier qu'il n'y a pas d'erreurs dans les logs
- [ ] Tester la création d'une room
- [ ] Tester de rejoindre une room
- [ ] Tester une partie complète
- [ ] Vérifier que les scores/vies se mettent à jour correctement

---

**Besoin d'aide?** Exécutez `check_schema.sql` et partagez le résultat.
