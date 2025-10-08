# Flux de Données - Progression des Bulles

## 📊 Comment ça devrait fonctionner

### 1. Mise à Jour de la Progression (Joueur A)

```javascript
// App.vue - Toutes les 100ms pendant le jeu
setPlayerProgress(versusCode, playerId, progress)
  ↓
// realtime_v2.js
UPDATE players SET progress = 0.5 WHERE room_code = 'ABC123' AND player_id = 'playerA'
  ↓
// PostgreSQL déclenche un événement Realtime
NOTIFY supabase_realtime: { table: 'players', event: 'UPDATE', ... }
```

### 2. Réception par les Autres Joueurs (Joueur B, C, D...)

```javascript
// realtime_v2.js - subscribeRoom()
Realtime Event Received: { table: 'players', room_code: 'ABC123' }
  ↓
getRoomWithPlayers('ABC123')
  ↓
getRoomPlayers('ABC123')
  ↓
SELECT * FROM players WHERE room_code = 'ABC123'
  ↓
// Retourne: [
//   { id: 'playerA', progress: 0.5 },  ← Mis à jour!
//   { id: 'playerB', progress: 0.3 },
//   { id: 'playerC', progress: 0.7 }
// ]
  ↓
callback(room) // room.players contient les données fraîches
  ↓
// App.vue - handleRoomUpdate()
versusRoom.value = room
  ↓
// App.vue - versusPlayers computed
const versusPlayers = computed(() => {
  const roster = versusRoom.value.players;
  return roster.map(p => ({
    id: p.id,
    progress: p.progress  ← Affiché dans les bulles!
  }));
})
  ↓
// BoardView.vue - Affichage des bulles
<div v-for="player in versusPlayers">
  <div :style="{ height: player.progress * 100 + '%' }">
</div>
```

## 🔍 Logs à Vérifier

### Logs Attendus (Console F12)

**Joueur A (qui joue):**
```
[setPlayerProgress] Progression mise à jour: { playerId: "playerA", progress: 0.1 }
[setPlayerProgress] Progression mise à jour: { playerId: "playerA", progress: 0.2 }
[setPlayerProgress] Progression mise à jour: { playerId: "playerA", progress: 0.3 }
...
```

**Joueur B, C, D (qui regardent):**
```
[subscribeRoom] Changement détecté dans players: { eventType: "UPDATE", ... }
[getRoomPlayers] Joueurs récupérés: [
  { id: "player", progress: 0.3 },  ← Progression du Joueur A
  { id: "player", progress: 0 },
  ...
]
[getRoomWithPlayers] Room complète: { code: "ABC123", playerCount: 4 }
[subscribeRoom] Room après changement joueur: { players: [...] }
[App] Room update received: waiting [...]
[versusPlayers] Room players: [
  { id: "player", progress: 0.3 },  ← Devrait être affiché!
  ...
]
```

## ❌ Problèmes Possibles

### Problème 1: Pas de logs `[subscribeRoom] Changement détecté`

**Cause:** Realtime n'est pas activé pour la table `players`

**Solution:**
1. Dashboard → Database → Replication
2. Cocher `players`
3. Attendre 15 secondes

### Problème 2: Logs `[getRoomPlayers]` montrent `progress: 0` pour tous

**Cause:** La base de données ne reçoit pas les mises à jour

**Vérification:**
```sql
SELECT player_id, progress, updated_at 
FROM players 
WHERE room_code = 'VOTRE_CODE'
ORDER BY updated_at DESC;
```

Si `progress` est à 0 dans la base → Le problème est dans `setPlayerProgress`
Si `progress` est correct dans la base → Le problème est Realtime

### Problème 3: `[getRoomPlayers]` montre les bonnes valeurs mais pas l'UI

**Cause:** `versusRoom.value` n'est pas réactif ou le computed ne se déclenche pas

**Solution:** Vérifier que `versusRoom` est bien un `ref()` et pas un objet simple

### Problème 4: Les logs montrent tout correct mais les bulles ne bougent pas

**Cause:** Le composant `BoardView` ne reçoit pas les bonnes props

**Vérification:** Regarder les logs `[versusPlayers]` - ils doivent montrer les progressions

## ✅ Test Complet

### Étape 1: Vérifier que les données sont écrites

```sql
-- Pendant qu'un joueur joue, exécutez cette requête plusieurs fois
SELECT 
  player_id,
  progress,
  updated_at
FROM players 
WHERE room_code = 'VOTRE_CODE'
ORDER BY player_id;
```

**Résultat attendu:** La colonne `progress` et `updated_at` changent pour le joueur actif

### Étape 2: Vérifier que Realtime fonctionne

Ouvrez `test_realtime.html`:
1. Configurez Supabase
2. Créez une room de test
3. Ajoutez un joueur
4. Cliquez sur "S'abonner aux changements"
5. Cliquez sur "Mettre à jour Progression" plusieurs fois

**Résultat attendu:** Vous voyez `🔔 Changement PLAYERS détecté` à chaque clic

### Étape 3: Vérifier les logs de l'application

Ouvrez la console (F12) sur **tous les navigateurs** (joueur actif ET spectateurs):

**Joueur actif:**
- ✅ `[setPlayerProgress] Progression mise à jour`

**Tous les joueurs:**
- ✅ `[subscribeRoom] Changement détecté dans players`
- ✅ `[getRoomPlayers] Joueurs récupérés` avec les bonnes progressions
- ✅ `[versusPlayers] Room players` avec les bonnes progressions

## 🎯 Checklist de Diagnostic

- [ ] Realtime activé pour `players` dans Dashboard
- [ ] SQL: `progress` change dans la table `players`
- [ ] Test HTML: `🔔 Changement PLAYERS détecté` apparaît
- [ ] Console: `[setPlayerProgress]` apparaît (joueur actif)
- [ ] Console: `[subscribeRoom] Changement détecté` apparaît (tous)
- [ ] Console: `[getRoomPlayers]` montre les bonnes progressions
- [ ] Console: `[versusPlayers]` montre les bonnes progressions
- [ ] UI: Les bulles bougent

## 🆘 Si Rien ne Fonctionne

Partagez ces informations:

1. **Logs de la console** (copier/coller tous les logs)
2. **Résultat SQL:**
```sql
SELECT * FROM players WHERE room_code = 'VOTRE_CODE';
```
3. **Test HTML:** Est-ce que `🔔 Changement PLAYERS détecté` apparaît?
4. **Dashboard Replication:** Capture d'écran montrant que `players` est coché
