# Guide de Débogage - Problème de Visibilité des Joueurs

## 🔍 Symptôme

Quand un joueur rejoint une room:
- ✅ Le joueur voit qu'il a rejoint
- ❌ L'hôte ne voit pas le nouveau joueur
- ❌ Le bouton "Démarrer" reste désactivé

## 🛠️ Étapes de Résolution

### Étape 1: Exécuter le script de correction

Dans **Supabase SQL Editor**, exécutez:
```
database/fix_realtime.sql
```

Ce script va:
- ✅ Configurer les politiques RLS correctement
- ✅ Créer/recréer la vue `rooms_with_players`
- ✅ Activer Realtime pour les tables `players` et `rooms`
- ✅ Afficher un rapport de vérification

### Étape 2: Vérifier les logs dans la console

Ouvrez la **Console du navigateur** (F12) et regardez les logs:

**Logs attendus quand un joueur rejoint:**
```
[joinRoom] Tentative de rejoindre: { code: "ABC123", playerId: "...", name: "..." }
[joinRoom] Room trouvée: { ... }
[joinRoom] Nouveau joueur, création...
[joinRoom] Couleur choisie: #e74c3c
[joinRoom] Joueur créé avec succès
[joinRoom] Joueurs dans la room après join: [...]
```

**Logs attendus côté hôte (subscription):**
```
[subscribeRoom] Changement détecté dans players: { ... }
[subscribeRoom] Room après changement joueur: { players: [...] }
```

### Étape 3: Vérifier dans Supabase

Dans le **Table Editor** de Supabase:

1. **Table `players`** - Vérifiez que le joueur est bien créé:
```sql
SELECT * FROM players WHERE room_code = 'VOTRE_CODE';
```
Vous devriez voir tous les joueurs de la room.

2. **Vue `rooms_with_players`** - Vérifiez que la vue fonctionne:
```sql
SELECT code, status, players 
FROM rooms_with_players 
WHERE code = 'VOTRE_CODE';
```
La colonne `players` devrait contenir un array JSON avec tous les joueurs.

### Étape 4: Vérifier Realtime

Dans **Supabase Dashboard > Database > Replication**:

1. Vérifiez que les tables sont activées pour Realtime:
   - ✅ `rooms` doit être coché
   - ✅ `players` doit être coché

2. Si elles ne sont pas cochées, cochez-les et attendez quelques secondes.

### Étape 5: Tester à nouveau

1. **Créer une nouvelle room** (avec un nouveau code)
2. **Rejoindre depuis un autre navigateur/onglet**
3. **Observer les logs** dans les deux consoles

## 🐛 Problèmes Courants

### Problème 1: "Could not find the 'players' column"

**Cause:** La vue `rooms_with_players` n'existe pas ou est mal configurée.

**Solution:** Exécutez `fix_realtime.sql`

### Problème 2: Pas de logs "[subscribeRoom] Changement détecté"

**Cause:** Realtime n'est pas activé pour les tables.

**Solution:** 
1. Allez dans **Supabase Dashboard > Database > Replication**
2. Cochez `rooms` et `players`
3. Attendez 10 secondes
4. Testez à nouveau

### Problème 3: Erreur "permission denied"

**Cause:** Les politiques RLS bloquent l'accès.

**Solution:** Exécutez `fix_realtime.sql` qui configure les politiques correctement.

### Problème 4: Le joueur est créé mais pas visible

**Cause:** La subscription ne se déclenche pas.

**Solution:**
1. Vérifiez que Realtime est activé (voir Problème 2)
2. Vérifiez les logs de la console
3. Essayez de rafraîchir la page de l'hôte

## 📊 Vérification Manuelle

Si après toutes ces étapes ça ne fonctionne toujours pas, vérifiez manuellement:

```sql
-- 1. Compter les joueurs dans une room
SELECT 
  r.code,
  r.status,
  COUNT(p.id) as player_count
FROM rooms r
LEFT JOIN players p ON r.code = p.room_code
WHERE r.code = 'VOTRE_CODE'
GROUP BY r.code, r.status;

-- 2. Voir tous les joueurs d'une room
SELECT 
  p.player_id,
  p.name,
  p.color,
  p.created_at
FROM players p
WHERE p.room_code = 'VOTRE_CODE'
ORDER BY p.created_at;

-- 3. Tester la vue
SELECT 
  code,
  jsonb_array_length(players) as player_count,
  jsonb_pretty(players) as players_json
FROM rooms_with_players
WHERE code = 'VOTRE_CODE';
```

## ✅ Checklist de Vérification

- [ ] Script `fix_realtime.sql` exécuté sans erreur
- [ ] Vue `rooms_with_players` existe et fonctionne
- [ ] Realtime activé pour `rooms` et `players` dans Supabase Dashboard
- [ ] Politiques RLS configurées (SELECT, INSERT, UPDATE permis pour tous)
- [ ] Logs dans la console montrent les changements détectés
- [ ] Les joueurs sont visibles dans la table `players` via SQL
- [ ] La vue `rooms_with_players` retourne les bons joueurs

## 🆘 Si rien ne fonctionne

Partagez les informations suivantes:

1. **Logs de la console** (copier/coller les logs `[joinRoom]` et `[subscribeRoom]`)
2. **Résultat de cette requête SQL:**
```sql
SELECT * FROM rooms_with_players WHERE code = 'VOTRE_CODE';
```
3. **Capture d'écran** de Supabase Dashboard > Database > Replication
