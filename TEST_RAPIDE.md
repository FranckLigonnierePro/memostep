# 🧪 Test Rapide - 5 Minutes

## Étape 1: Vérifier Realtime (30 secondes)

1. **Ouvrir** Supabase Dashboard
2. **Aller** dans Database → Replication
3. **Vérifier** que `players` et `rooms` sont **cochés**
4. Si pas cochés: **cocher** et **attendre 20 secondes**

## Étape 2: Test SQL (1 minute)

Dans Supabase SQL Editor, exécutez:

```sql
-- Créer une room de test
INSERT INTO rooms (code, status, host_id, guest_id)
VALUES ('TEST99', 'playing', 'test-host', null)
ON CONFLICT (code) DO UPDATE SET status = 'playing';

-- Ajouter un joueur
INSERT INTO players (room_code, player_id, name, color, score, lives, progress)
VALUES ('TEST99', 'test-player-1', 'TestPlayer', '#e74c3c', 0, 3, 0.0)
ON CONFLICT (room_code, player_id) DO UPDATE SET progress = 0.0;

-- Mettre à jour la progression 5 fois
UPDATE players SET progress = 0.2 WHERE room_code = 'TEST99' AND player_id = 'test-player-1';
UPDATE players SET progress = 0.4 WHERE room_code = 'TEST99' AND player_id = 'test-player-1';
UPDATE players SET progress = 0.6 WHERE room_code = 'TEST99' AND player_id = 'test-player-1';
UPDATE players SET progress = 0.8 WHERE room_code = 'TEST99' AND player_id = 'test-player-1';
UPDATE players SET progress = 1.0 WHERE room_code = 'TEST99' AND player_id = 'test-player-1';

-- Vérifier
SELECT player_id, progress FROM players WHERE room_code = 'TEST99';
```

**Résultat attendu:** `progress` doit être à `1.0`

## Étape 3: Test HTML (2 minutes)

1. **Ouvrir** `test_realtime.html` dans votre navigateur
2. **Entrer** URL et clé Supabase
3. **Cliquer** "Initialiser"
4. **Entrer** `TEST99` comme code room
5. **Cliquer** "S'abonner aux changements"
6. **Retourner** dans Supabase SQL Editor
7. **Exécuter** plusieurs fois:
```sql
UPDATE players 
SET progress = random() 
WHERE room_code = 'TEST99' AND player_id = 'test-player-1';
```

**Résultat attendu:** Dans test_realtime.html, vous devez voir:
```
🔔 Changement PLAYERS détecté: UPDATE
Données: {"player_id":"test-player-1","progress":0.xyz,...}
```

✅ **Si vous voyez ce message:** Realtime fonctionne!
❌ **Si vous ne voyez PAS ce message:** Realtime n'est pas activé

## Étape 4: Test dans l'Application (2 minutes)

1. **Ouvrir** deux navigateurs (ou onglets privés)
2. **Ouvrir** la Console (F12) dans les deux
3. **Créer** une room dans le premier
4. **Rejoindre** la room dans le second
5. **Démarrer** la partie
6. **Regarder** les logs dans les deux consoles

### Logs attendus dans le navigateur du joueur actif:

```
[App] Publishing progress: 0.1 (was: -1)
[setPlayerProgress] Progression mise à jour: { playerId: "...", progress: 0.1 }
```

### Logs attendus dans le navigateur du spectateur:

```
[subscribeRoom] Changement détecté dans players: { ... }
[subscribeRoom] Cache disponible: true Payload: true
[subscribeRoom] Mise à jour du joueur: ... progress: 0.1
[subscribeRoom] Index du joueur dans le cache: 0 Total joueurs: 2
[subscribeRoom] ✅ Optimistic room update from payload: { playerId: "...", progress: 0.1, allPlayers: [...] }
[App] Room update received: playing [...]
[versusPlayers] Room players: [{ id: "...", progress: 0.1 }, ...]
```

## Diagnostic Rapide

### Cas 1: Pas de logs `[subscribeRoom] Changement détecté`
→ **Realtime pas activé** - Retour Étape 1

### Cas 2: Logs `[subscribeRoom] ⚠️ Pas de cache`
→ **Cache pas initialisé** - La room n'a pas été chargée au départ
→ **Solution:** Vérifiez que `getRoom()` est appelé au démarrage

### Cas 3: Logs OK mais `progress: 0` partout
→ **Données pas écrites** - Retour Étape 2

### Cas 4: Tous les logs OK mais bulles ne bougent pas
→ **Problème d'affichage** - Vérifiez BoardView.vue

## Commandes de Debug dans la Console

Pendant le jeu, tapez dans la console:

```javascript
// Voir la room actuelle
console.log(versusRoom.value);

// Voir les joueurs
console.log(versusPlayers.value);

// Voir le cache
console.log(window.supabase); // Pas accessible, mais on peut voir les logs

// Forcer un refresh
getRoom(versusCode.value).then(r => console.log('Room:', r));
```

## Nettoyage

Après les tests, nettoyez:

```sql
DELETE FROM players WHERE room_code = 'TEST99';
DELETE FROM rooms WHERE code = 'TEST99';
```

## Checklist Finale

- [ ] Realtime activé (Étape 1)
- [ ] SQL fonctionne (Étape 2)
- [ ] Test HTML montre `🔔 Changement PLAYERS détecté` (Étape 3)
- [ ] Logs `[subscribeRoom] Changement détecté` dans l'app (Étape 4)
- [ ] Logs `[subscribeRoom] ✅ Optimistic room update` dans l'app
- [ ] Logs `[App] Room update received` dans l'app
- [ ] Logs `[versusPlayers]` avec bonnes progressions

Si toutes les cases sont cochées mais les bulles ne bougent toujours pas:
→ Le problème est dans le composant BoardView qui affiche les bulles.
