# 🎮 Fix: Le parcours change pour tout le monde quand un joueur gagne

## Problème

Quand un joueur gagne son parcours en mode versus, le parcours change immédiatement pour TOUS les joueurs, même ceux qui n'ont pas encore fini.

## Comportement AVANT (incorrect)

```
Joueur A: ████████████ 100% → Gagne!
Joueur B: ████░░░░░░░░  40% → En train de jouer
Joueur C: ██████░░░░░░  60% → En train de jouer

→ Joueur A gagne
→ ❌ NOUVEAU PARCOURS pour tout le monde immédiatement
→ Joueurs B et C perdent leur progression et doivent recommencer un nouveau parcours
```

## Comportement APRÈS (correct)

```
Joueur A: ████████████ 100% → Gagne! (score +1, attend les autres)
Joueur B: ████░░░░░░░░  40% → Continue son parcours
Joueur C: ██████░░░░░░  60% → Continue son parcours

→ Joueur B finit son parcours (ou perd une vie)
→ Joueur C finit son parcours (ou perd une vie)

→ ✅ Quand TOUS les joueurs ont fini:
   → NOUVEAU PARCOURS pour tout le monde
   → Tout le monde démarre en même temps
```

## Solution Appliquée

### Modification de `reportRoundWin()`

**Avant:**
```javascript
// Quand un joueur gagne
const seed = Math.floor(Math.random() * 1e9);
const startAtMs = Date.now() + 1500;

await supabase
  .from('rooms')
  .update({ seed, start_at_ms: startAtMs })
  .eq('code', code);
// ❌ Change le parcours immédiatement
```

**Après:**
```javascript
// Vérifier si TOUS les joueurs ont fini
const allPlayersFinished = updatedPlayers.every(p => {
  return p.progress >= 1 || p.lives <= 0 || p.score >= 5;
});

if (allPlayersFinished) {
  // ✅ Tous ont fini, on peut changer le parcours
  const seed = Math.floor(Math.random() * 1e9);
  const startAtMs = Date.now() + 1500;
  
  // Réinitialiser la progression
  await supabase.from('players').update({ progress: 0 }).eq('room_code', code);
  
  await supabase
    .from('rooms')
    .update({ seed, start_at_ms: startAtMs })
    .eq('code', code);
} else {
  // ⏳ Certains jouent encore, on attend
  console.log('Certains joueurs jouent encore, on attend...');
}
```

## Logique Détaillée

### Conditions pour qu'un joueur soit considéré "fini"

Un joueur a fini son round si:
- `progress >= 1` (a terminé le parcours)
- OU `lives <= 0` (n'a plus de vies)
- OU `score >= 5` (a atteint le score maximum)

### Démarrage d'un nouveau round

Un nouveau round démarre UNIQUEMENT quand:
1. **Tous les joueurs** ont fini leur round actuel
2. **ET** le match n'est pas terminé (pas de gagnant final)

Quand un nouveau round démarre:
1. Génération d'un nouveau `seed` (nouveau parcours)
2. Définition d'un `start_at_ms` dans 1.5 secondes
3. Réinitialisation de `progress = 0` pour tous les joueurs
4. Mise à jour de la room avec le nouveau seed

### Fin du match

Le match se termine quand:
- **Tous les joueurs** ont `score >= 5`
- **OU** un seul joueur a encore des vies (`lives > 0`)

## Scénario Exemple

### Round 1
```
Joueur A: Termine en 10s → score: 1, progress: 1.0
Joueur B: Termine en 15s → score: 1, progress: 1.0
Joueur C: Perd une vie  → score: 0, lives: 2, progress: 0.5

→ Tous ont fini (A et B ont progress=1, C a perdu une vie)
→ ✅ Nouveau round démarre dans 1.5s
```

### Round 2
```
Joueur A: Termine en 12s → score: 2, progress: 1.0
Joueur B: En cours...    → score: 1, progress: 0.6
Joueur C: Termine en 14s → score: 1, progress: 1.0

→ Joueur B joue encore (progress < 1)
→ ⏳ On attend que B finisse
→ B termine → progress: 1.0
→ ✅ Nouveau round démarre
```

### Round 3
```
Joueur A: Termine en 11s → score: 3, progress: 1.0
Joueur B: Perd sa dernière vie → score: 1, lives: 0
Joueur C: Termine en 13s → score: 2, progress: 1.0

→ Tous ont fini
→ B n'a plus de vies (lives = 0)
→ ✅ Nouveau round démarre (B ne peut plus jouer mais le match continue)
```

## Logs à Vérifier

Dans la console, vous verrez maintenant:

**Quand un joueur gagne mais d'autres jouent encore:**
```
[reportRoundWin] Certains joueurs jouent encore, on attend...
```

**Quand tous les joueurs ont fini:**
```
[reportRoundWin] Tous les joueurs ont fini, nouveau round!
```

## Test

1. **Créer une room** avec 2-3 joueurs
2. **Démarrer** la partie
3. **Joueur A:** Finir le parcours rapidement
4. **Vérifier:** Les autres joueurs continuent leur parcours actuel
5. **Attendre:** Que tous les joueurs finissent
6. **Vérifier:** Un nouveau parcours démarre pour tout le monde

## Cas Particuliers

### Cas 1: Un joueur perd sa dernière vie

```
Joueur A: progress: 0.8, lives: 1
Joueur B: progress: 0.5, lives: 1

→ Joueur A perd → lives: 0
→ Joueur A est considéré "fini" (lives = 0)
→ On attend que Joueur B finisse
```

### Cas 2: Un joueur atteint le score max (5)

```
Joueur A: score: 5 (a gagné 5 rounds)
Joueur B: score: 3, progress: 0.7

→ Joueur A est considéré "fini" (score >= 5)
→ On attend que Joueur B finisse
→ Puis le match se termine (condition de victoire)
```

### Cas 3: Tous les joueurs perdent leurs vies

```
Joueur A: lives: 0
Joueur B: lives: 0
Joueur C: lives: 0

→ Tous sont "finis" (lives = 0)
→ Match terminé
→ Gagnant = joueur avec le meilleur score
```

## Avantages

✅ **Fair-play:** Chaque joueur finit son parcours avant le changement
✅ **Pas de frustration:** Les joueurs ne perdent plus leur progression
✅ **Synchronisation:** Tout le monde démarre le nouveau round ensemble
✅ **Logique claire:** Un round = un parcours complet pour tous

## Impact sur le Gameplay

**Avant:** Parties rapides mais frustrantes (parcours change sans prévenir)
**Après:** Parties plus longues mais équitables (chacun finit son parcours)

**Durée moyenne d'un round:**
- Avant: ~10-15s (temps du joueur le plus rapide)
- Après: ~20-30s (temps du joueur le plus lent)

C'est un compromis entre rapidité et équité. Si vous voulez des parties plus rapides, vous pouvez:
- Réduire le nombre de cases dans le parcours
- Ajouter un timer par round (ex: 30s max)
- Pénaliser les joueurs trop lents

## Alternative: Mode "First to Finish"

Si vous préférez l'ancien comportement (parcours change dès qu'un joueur gagne), vous pouvez créer un mode de jeu différent:

```javascript
// Mode "Race" (ancien comportement)
if (gameMode === 'race') {
  // Change le parcours immédiatement
  const seed = Math.floor(Math.random() * 1e9);
  await supabase.from('rooms').update({ seed }).eq('code', code);
}

// Mode "Complete" (nouveau comportement)
if (gameMode === 'complete') {
  // Attend que tous finissent
  if (allPlayersFinished) {
    const seed = Math.floor(Math.random() * 1e9);
    await supabase.from('rooms').update({ seed }).eq('code', code);
  }
}
```
