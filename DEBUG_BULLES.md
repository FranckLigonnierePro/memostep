# 🐛 Debug: Les Bulles ne Bougent Pas

## Étape 1: Vérifier que les données sont dans la base

Pendant qu'un joueur joue, exécutez cette requête SQL dans Supabase:

```sql
SELECT 
  player_id,
  name,
  progress,
  updated_at
FROM players 
WHERE room_code = 'VOTRE_CODE'
ORDER BY updated_at DESC;
```

**Résultat attendu:** La colonne `progress` et `updated_at` changent toutes les secondes.

✅ Si ça change → Les données sont bien écrites, le problème est Realtime
❌ Si ça ne change pas → Le problème est dans `setPlayerProgress`

---

## Étape 2: Vérifier que Realtime est activé

1. **Supabase Dashboard** → **Database** → **Replication**
2. Vérifiez que ces tables sont **cochées**:
   - ✅ `rooms`
   - ✅ `players`

Si elles ne sont pas cochées:
1. Cochez-les
2. Attendez 15-20 secondes
3. Rafraîchissez toutes les pages (F5)

---

## Étape 3: Vérifier les logs de la console

Ouvrez la **Console (F12)** sur **TOUS les navigateurs** (joueur actif ET spectateurs).

### Logs attendus sur le joueur actif:

```
[App] Publishing progress: 0.1 (was: -1)
[setPlayerProgress] Progression mise à jour: { playerId: "abc123", progress: 0.1 }
[App] Publishing progress: 0.2 (was: 0.1)
[setPlayerProgress] Progression mise à jour: { playerId: "abc123", progress: 0.2 }
```

### Logs attendus sur les spectateurs:

```
[subscribeRoom] Changement détecté dans players: { eventType: "UPDATE", ... }
[subscribeRoom] Optimistic room update from payload: { playerId: "abc123", progress: 0.1 }
[getRoomPlayers] Joueurs récupérés: [{ id: "abc123", progress: 0.1 }, ...]
[subscribeRoom] Room après refresh joueur: { players: [...] }
[App] Room update received: playing [...]
[versusPlayers] Room players: [{ id: "abc123", progress: 0.1 }, ...]
```

---

## Étape 4: Diagnostic selon les logs

### Cas A: Pas de logs `[subscribeRoom] Changement détecté`

**Problème:** Realtime n'est pas activé ou ne fonctionne pas.

**Solution:**
1. Vérifiez Étape 2 (Replication)
2. Exécutez ce script SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
```
3. Attendez 20 secondes
4. Rafraîchissez les pages

### Cas B: Logs `[subscribeRoom] Changement détecté` mais pas `[App] Room update received`

**Problème:** La subscription ne déclenche pas le callback dans App.vue.

**Solution:** Vérifiez que `subscribeToRoom()` dans App.vue appelle bien `versusRoom.value = room`.

### Cas C: Logs `[App] Room update received` mais pas `[versusPlayers] Room players`

**Problème:** Le computed `versusPlayers` ne se déclenche pas.

**Solution:** Vérifiez que `versusRoom` est bien un `ref()` réactif.

### Cas D: Logs `[versusPlayers]` corrects mais bulles ne bougent pas

**Problème:** BoardView ne reçoit pas les bonnes props ou ne les affiche pas.

**Solution:** Vérifiez le composant BoardView et ses props `versusPlayers`.

---

## Étape 5: Test avec test_realtime.html

1. Ouvrez `test_realtime.html` dans votre navigateur
2. Configurez Supabase (URL + clé)
3. Créez une room de test
4. Ajoutez un joueur
5. Cliquez sur "S'abonner aux changements"
6. Cliquez plusieurs fois sur "Mettre à jour Progression"

**Résultat attendu:** Vous devez voir `🔔 Changement PLAYERS détecté` à chaque clic.

✅ Si vous voyez le message → Realtime fonctionne, le problème est dans App.vue
❌ Si vous ne voyez PAS le message → Realtime n'est pas activé

---

## Étape 6: Vérifier la structure des données

Dans la console, tapez:

```javascript
console.log('versusRoom:', versusRoom.value);
console.log('versusPlayers:', versusPlayers.value);
```

**Résultat attendu:**
```javascript
versusRoom: {
  code: "ABC123",
  status: "playing",
  players: [
    { id: "player1", name: "Player 1", progress: 0.3, color: "#e74c3c" },
    { id: "player2", name: "Player 2", progress: 0.1, color: "#3498db" }
  ]
}

versusPlayers: [
  { id: "player1", name: "Player 1", progress: 0.3, wins: 0, color: "#e74c3c" },
  { id: "player2", name: "Player 2", progress: 0.1, wins: 0, color: "#3498db" }
]
```

Si `players` est vide ou `progress` est toujours à 0 → Le problème est dans `getRoomWithPlayers`.

---

## Checklist Complète

- [ ] SQL: `progress` change dans la table `players`
- [ ] Dashboard: `players` et `rooms` cochés dans Replication
- [ ] Test HTML: `🔔 Changement PLAYERS détecté` apparaît
- [ ] Console joueur actif: `[setPlayerProgress]` apparaît
- [ ] Console spectateurs: `[subscribeRoom] Changement détecté` apparaît
- [ ] Console spectateurs: `[subscribeRoom] Optimistic room update` apparaît
- [ ] Console spectateurs: `[App] Room update received` apparaît
- [ ] Console spectateurs: `[versusPlayers] Room players` avec bonnes progressions
- [ ] Console: `versusRoom.value.players` contient les bonnes progressions
- [ ] Console: `versusPlayers.value` contient les bonnes progressions

---

## Solution Rapide (90% des cas)

Le problème vient souvent de Realtime pas activé:

1. **Supabase Dashboard** → **Database** → **Replication**
2. **Cocher** `players` et `rooms`
3. **Attendre 20 secondes**
4. **Rafraîchir** toutes les pages (F5)
5. **Tester** à nouveau

Si ça ne marche toujours pas, partagez:
- Les logs de la console (copier/coller)
- Le résultat de la requête SQL de l'Étape 1
- Une capture d'écran de Database → Replication
