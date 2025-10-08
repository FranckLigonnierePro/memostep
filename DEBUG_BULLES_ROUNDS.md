# 🐛 Debug: Les bulles ne bougent plus automatiquement

## Symptôme

Les bulles des joueurs adverses ne se mettent à jour que quand tu cliques sur une case, pas automatiquement toutes les 100ms.

## Causes Possibles

### 1. Realtime pas activé pour `players`

**Vérification:**
- Supabase Dashboard → Database → Replication
- Vérifiez que `players` est coché

**Solution:**
- Cocher `players`
- Attendre 30 secondes
- Rafraîchir les navigateurs

### 2. La colonne `current_round` n'existe pas

**Vérification SQL:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name = 'current_round';
```

**Solution:**
```sql
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;
```

### 3. Les événements Realtime n'arrivent pas

**Vérification dans la Console (F12):**

Sur l'écran du **spectateur**, cherchez:
```
[setPlayerProgress] ✅ Progression mise à jour: { playerId: "abc123", progress: 0.2 }
```

Si vous voyez ce log côté joueur actif mais PAS côté spectateur:
→ Realtime ne fonctionne pas

**Logs attendus côté spectateur:**
```
[subscribeRoom] Changement détecté dans players: { ... }
[subscribeRoom] Cache disponible: true Payload: true
[subscribeRoom] Mise à jour du joueur: abc123 progress: 0.2
[subscribeRoom] ✅ Optimistic room update from payload: { ... }
```

### 4. Le cache n'est pas initialisé

**Vérification dans les logs:**
```
[subscribeRoom] ⚠️ Pas de cache ou payload vide, skip optimistic update
```

**Solution:**
Vérifiez que vous voyez ces logs au démarrage:
```
[VersusView] Chargement initial de la room: ABC123
[VersusView] Room chargée, initialisation du cache: 2 joueurs
```

## Test Rapide

### Test 1: Vérifier que les données sont écrites

Pendant qu'un joueur joue, exécutez dans Supabase SQL Editor:
```sql
SELECT 
  player_id,
  progress,
  current_round,
  updated_at
FROM players 
WHERE room_code = 'VOTRE_CODE'
ORDER BY updated_at DESC;
```

**Résultat attendu:** La colonne `progress` et `updated_at` changent toutes les secondes.

✅ Si ça change → Les données sont écrites
❌ Si ça ne change pas → `setPlayerProgress` ne fonctionne pas

### Test 2: Vérifier Realtime avec SQL manuel

Pendant que les deux joueurs sont dans la room, exécutez:
```sql
UPDATE players 
SET progress = 0.99 
WHERE room_code = 'VOTRE_CODE' 
AND player_id = (
  SELECT player_id FROM players 
  WHERE room_code = 'VOTRE_CODE' 
  LIMIT 1
);
```

**Résultat attendu sur l'autre écran:**
```
[subscribeRoom] Changement détecté dans players: { ... }
[subscribeRoom] ✅ Optimistic room update from payload: { progress: 0.99 }
```

✅ Si vous voyez ces logs → Realtime fonctionne
❌ Si vous ne voyez PAS ces logs → Realtime n'est pas activé

### Test 3: Vérifier la fréquence des updates

Dans la console du joueur actif, comptez les logs:
```
[setPlayerProgress] ✅ Progression mise à jour: { progress: 0.1 }
[setPlayerProgress] ✅ Progression mise à jour: { progress: 0.2 }
[setPlayerProgress] ✅ Progression mise à jour: { progress: 0.3 }
```

**Fréquence attendue:** 1 log par case correcte (pas toutes les 100ms grâce au cache).

Si vous voyez beaucoup de logs identiques:
→ Le cache ne fonctionne pas, vérifiez `lastPublishedProgress`

## Logs Détaillés

### Côté Joueur Actif

**Toutes les 100ms (mais publié seulement si changement):**
```
[App] Publishing progress: 0.2 (was: 0.1)
[setPlayerProgress] ✅ Progression mise à jour: { playerId: "abc123", progress: 0.2 }
```

### Côté Spectateur

**Quand la progression change:**
```
[subscribeRoom] Changement détecté dans players: { 
  eventType: "UPDATE",
  new: { player_id: "abc123", progress: 0.2, current_round: 1, ... }
}
[subscribeRoom] Cache disponible: true Payload: true
[subscribeRoom] Mise à jour du joueur: abc123 progress: 0.2
[subscribeRoom] Index du joueur dans le cache: 0 Total joueurs: 2
[subscribeRoom] ✅ Optimistic room update from payload: { 
  playerId: "abc123", 
  progress: 0.2,
  allPlayers: [
    { id: "abc123", progress: 0.2 },
    { id: "def456", progress: 0.5 }
  ]
}
[App] Room update received: playing [...]
[versusPlayers] Room players: [
  { id: "abc123", progress: 0.2 },
  { id: "def456", progress: 0.5 }
]
```

## Checklist de Vérification

### Côté Joueur Actif:
- [ ] Log `[App] Publishing progress` apparaît quand la progression change
- [ ] Log `[setPlayerProgress] ✅ Progression mise à jour` apparaît
- [ ] SQL: La colonne `progress` change dans la base

### Côté Spectateur:
- [ ] Log `[subscribeRoom] Changement détecté dans players` apparaît
- [ ] Log `[subscribeRoom] Cache disponible: true`
- [ ] Log `[subscribeRoom] ✅ Optimistic room update from payload`
- [ ] Log `[App] Room update received`
- [ ] Log `[versusPlayers] Room players` avec les bonnes progressions

### Base de données:
- [ ] Colonne `current_round` existe dans `players`
- [ ] Realtime activé pour `players` dans Dashboard
- [ ] SQL: `progress` change en temps réel

## Solution Rapide

**Dans 95% des cas, le problème vient de:**

1. **Realtime pas activé:**
   - Dashboard → Database → Replication
   - Cocher `players`
   - Attendre 30 secondes
   - Rafraîchir les navigateurs

2. **Colonne `current_round` manquante:**
   ```sql
   ALTER TABLE players 
   ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;
   ```

3. **Cache pas initialisé:**
   - Vérifier les logs au démarrage
   - Rafraîchir les navigateurs

## Commandes de Debug

Dans la console du spectateur:

```javascript
// Voir la room actuelle
console.log('versusRoom:', versusRoom.value);

// Voir les joueurs avec leur progression
console.log('Players:', versusRoom.value?.players?.map(p => ({
  id: p.id?.slice(0,6),
  round: p.current_round,
  progress: p.progress
})));

// Forcer un refresh
getRoom(versusCode.value).then(r => {
  console.log('Room refreshed:', r.players);
  versusRoom.value = r;
});
```

## Si Rien ne Marche

Partagez ces informations:

1. **Logs du joueur actif** (tous les `[setPlayerProgress]`)
2. **Logs du spectateur** (tous les `[subscribeRoom]`)
3. **Résultat SQL:**
```sql
SELECT * FROM players WHERE room_code = 'VOTRE_CODE';
```
4. **Test SQL manuel:** Est-ce que le UPDATE déclenche des logs côté spectateur?
5. **Capture d'écran** de Database → Replication
