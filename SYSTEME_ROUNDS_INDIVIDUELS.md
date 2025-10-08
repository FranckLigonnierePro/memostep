# 🎮 Système de Rounds Individuels

## Concept

Chaque joueur avance à son propre rythme sur **le même parcours**, mais quand un joueur finit son round, il passe automatiquement au round suivant sans attendre les autres.

## Fonctionnement

### Structure des Données

**Table `players`:**
- `current_round` (INTEGER): Le numéro du round actuel du joueur (1, 2, 3, ...)
- `progress` (REAL): La progression dans le round actuel (0.0 à 1.0)
- `score` (INTEGER): Nombre de rounds gagnés

**Table `rooms`:**
- `seed` (INTEGER): Seed de base pour générer les parcours
- `start_at_ms` (BIGINT): Timestamp de démarrage

### Génération des Parcours

Chaque round a un seed unique calculé à partir du seed de base:

```javascript
// Round 1: seed = baseSeed + 0 * 1000000
// Round 2: seed = baseSeed + 1 * 1000000
// Round 3: seed = baseSeed + 2 * 1000000
const roundSeed = baseSeed + (currentRound - 1) * 1000000;
```

**Résultat:** Tous les joueurs au round 1 ont le même parcours, tous ceux au round 2 ont le même parcours (différent du round 1), etc.

## Scénario Exemple

### État Initial
```
Room seed: 123456789
Tous les joueurs: current_round = 1

Joueur A: Round 1 (seed: 123456789)
Joueur B: Round 1 (seed: 123456789)
Joueur C: Round 1 (seed: 123456789)

→ Tous jouent le MÊME parcours
```

### Joueur A finit en premier
```
Joueur A: Termine → score: 1, current_round: 2, progress: 0
Joueur B: En cours → current_round: 1, progress: 0.6
Joueur C: En cours → current_round: 1, progress: 0.4

→ Joueur A démarre automatiquement le Round 2 (seed: 124456789)
→ Joueurs B et C continuent le Round 1 (seed: 123456789)
```

### Joueur C finit
```
Joueur A: Round 2 → progress: 0.3
Joueur B: Round 1 → progress: 0.8
Joueur C: Termine Round 1 → score: 1, current_round: 2, progress: 0

→ Joueur C démarre le Round 2 (seed: 124456789)
→ Joueurs A et C jouent maintenant le MÊME parcours (Round 2)
→ Joueur B continue le Round 1
```

### Joueur B finit
```
Joueur A: Round 2 → progress: 0.7
Joueur B: Termine Round 1 → score: 1, current_round: 2, progress: 0
Joueur C: Round 2 → progress: 0.5

→ Joueur B démarre le Round 2
→ Tous les joueurs sont maintenant au Round 2
```

## Implémentation

### 1. Migration SQL

Exécutez `database/add_current_round.sql`:
```sql
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;
```

### 2. Quand un joueur finit (`reportRoundWin`)

```javascript
// Incrémenter le current_round et réinitialiser la progression
await supabase
  .from('players')
  .update({ 
    current_round: currentRound + 1,
    progress: 0,
    score: score + 1
  })
  .eq('room_code', code)
  .eq('player_id', winnerId);
```

### 3. Calcul du seed pour chaque joueur (`beginVersus`)

```javascript
function beginVersus(baseSeed, startAtMs, currentRound = 1) {
  // Seed unique pour ce round
  const seed = baseSeed + (currentRound - 1) * 1000000;
  
  // Générer le parcours avec ce seed
  const rng = seededRng(seed);
  state.path = randomPathWithRng(rng);
}
```

### 4. Démarrage automatique du nouveau round (`handleRoomUpdate`)

```javascript
const myPlayer = room.players?.find(p => p.id === me);
const myRound = myPlayer?.current_round || 1;
const myRoundSeed = room.seed + (myRound - 1) * 1000000;

// Ne redémarrer que si on n'est pas déjà en train de jouer ce round
if (versusSeed.value !== myRoundSeed || !state.inPlay) {
  beginVersus(room.seed, room.start_at_ms, myRound);
}
```

## Logs de Débogage

Dans la console, vous verrez:

**Quand un joueur finit:**
```
[reportRoundWin] Joueur abc123 passe au round 2
```

**Quand un nouveau round démarre:**
```
[App] Démarrage du round 2 pour le joueur abc123 (inPlay: false)
[beginVersus] Round 2 avec seed 124456789 (base: 123456789)
```

**Quand les joueurs sont récupérés:**
```
[getRoomPlayers] Joueurs récupérés: [
  { id: "abc123", round: 2, progress: 0.3 },
  { id: "def456", round: 1, progress: 0.8 },
  { id: "ghi789", round: 2, progress: 0.5 }
]
```

## Avantages

✅ **Pas d'attente:** Chaque joueur avance à son rythme
✅ **Fair-play:** Tous les joueurs au même round ont le même parcours
✅ **Scalable:** Fonctionne avec n'importe quel nombre de joueurs
✅ **Simple:** Pas besoin de synchronisation complexe

## Cas Particuliers

### Cas 1: Joueur perd une vie

```
Joueur A: Round 2, lives: 1
→ Perd → lives: 0
→ Ne peut plus jouer
→ Reste au Round 2 (current_round ne change pas)
```

### Cas 2: Joueur atteint le score max (5)

```
Joueur A: Round 5, score: 4
→ Termine → score: 5
→ Match terminé pour lui
→ Continue à jouer pour le classement
```

### Cas 3: Tous les joueurs au même round

```
Tous au Round 3:
→ Tous jouent le MÊME parcours
→ Comme une course classique
→ Le premier à finir passe au Round 4
```

## Problèmes Résolus

### ❌ Problème: Boucle infinie au changement de round

**Cause:** `handleRoomUpdate` se déclenchait en boucle car `versusSeed` changeait.

**Solution:** Vérifier aussi `state.inPlay` pour ne pas redémarrer si on est déjà en train de jouer.

```javascript
const alreadyStartedThisRound = (
  state.mode === 'versus' && 
  versusSeed.value === myRoundSeed &&
  state.inPlay === true  // ← Important!
);
```

### ❌ Problème: Parcours change pour tout le monde

**Cause:** Un seul `seed` global pour tous les joueurs.

**Solution:** Chaque joueur calcule son seed en fonction de son `current_round`.

## Test

1. **Exécuter** `database/add_current_round.sql` dans Supabase
2. **Créer** une room avec 2-3 joueurs
3. **Démarrer** la partie
4. **Joueur A:** Finir le parcours rapidement
5. **Vérifier:** Joueur A démarre automatiquement le Round 2
6. **Vérifier:** Les autres joueurs continuent le Round 1
7. **Finir** avec les autres joueurs
8. **Vérifier:** Ils démarrent le Round 2 (même parcours que Joueur A avait)

## Checklist

- [ ] Migration SQL exécutée (`add_current_round.sql`)
- [ ] `current_round` ajouté dans `getRoomPlayers`
- [ ] `current_round` initialisé à 1 dans `joinRoom` et `createRoom`
- [ ] `reportRoundWin` incrémente `current_round`
- [ ] `beginVersus` calcule le seed avec `current_round`
- [ ] `handleRoomUpdate` vérifie `state.inPlay` pour éviter les boucles
- [ ] Logs montrent les bons numéros de round

## Formule du Seed

```
Round 1: seed = baseSeed + 0 × 1000000 = baseSeed
Round 2: seed = baseSeed + 1 × 1000000 = baseSeed + 1000000
Round 3: seed = baseSeed + 2 × 1000000 = baseSeed + 2000000
Round N: seed = baseSeed + (N-1) × 1000000
```

**Pourquoi 1000000?** C'est un grand nombre qui garantit que les seeds de rounds différents ne se chevauchent pas et génèrent des parcours complètement différents.

## Visualisation

```
Timeline:

t=0s   : Tous démarrent Round 1 (seed: 123456789)
t=10s  : Joueur A finit → Round 2 (seed: 124456789)
t=15s  : Joueur C finit → Round 2 (seed: 124456789) ← Même que A
t=20s  : Joueur B finit → Round 2 (seed: 124456789) ← Même que A et C
t=25s  : Joueur A finit → Round 3 (seed: 125456789)
t=30s  : Joueur C finit → Round 3 (seed: 125456789) ← Même que A
...
```

Chaque joueur progresse indépendamment, mais tous ceux au même round jouent le même parcours!
