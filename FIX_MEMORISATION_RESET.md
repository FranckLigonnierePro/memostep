# 🐛 Fix: La Barre de Mémorisation se Remet à Zéro

## Problème

Quand un joueur clique sur une case pendant que l'autre joueur est en phase de mémorisation, la barre de chargement de la mémorisation se remet à zéro.

## Cause

Quand tu cliques sur une case:
1. `setPlayerProgress` met à jour ta progression dans la base
2. Cela déclenche un événement Realtime
3. `handleRoomUpdate` est appelé chez tous les joueurs
4. La condition `alreadyStartedThisRound` vérifie `state.inPlay === true`
5. **Problème:** Pendant la mémorisation, `state.inPlay === false`!
6. Donc `beginVersus` est appelé à nouveau
7. Ce qui réinitialise la barre de mémorisation

## Solution

Ne plus vérifier `state.inPlay`, mais uniquement le `seed` pour savoir si on a déjà démarré ce round.

### Avant (incorrect)

```javascript
const alreadyStartedThisRound = (
  state.mode === 'versus' && 
  versusSeed.value === myRoundSeed &&
  state.inPlay === true  // ← Problème: false pendant la mémorisation
);
```

**Résultat:** Pendant la mémorisation, `state.inPlay` est `false`, donc la condition est fausse, et `beginVersus` est appelé à nouveau.

### Après (correct)

```javascript
const alreadyStartedThisRound = (
  state.mode === 'versus' && 
  versusSeed.value === myRoundSeed  // ← Suffit pour savoir si on a déjà démarré
);
```

**Résultat:** Si le seed correspond, on ne redémarre pas, peu importe si on est en mémorisation ou en jeu.

## Explication Détaillée

### États du Jeu

```
1. Lobby (showVersusView = true)
   state.mode = null
   state.inPlay = false

2. Mémorisation (après beginVersus)
   state.mode = 'versus'
   versusSeed.value = 123456789
   state.inPlay = false  ← Ici!
   → Barre de chargement visible

3. Jeu (après showPath)
   state.mode = 'versus'
   versusSeed.value = 123456789
   state.inPlay = true
   → Grille cliquable

4. Fin de round
   state.mode = 'versus'
   state.inPlay = false
```

### Flux d'Événements

**Scénario problématique:**

```
Joueur A: En mémorisation (state.inPlay = false)
Joueur B: En jeu (state.inPlay = true)

→ Joueur B clique sur une case
→ setPlayerProgress(code, playerB, 0.5)
→ UPDATE players SET progress = 0.5 WHERE player_id = playerB
→ Événement Realtime envoyé à tous

→ Joueur A reçoit l'événement
→ handleRoomUpdate(room) appelé
→ Vérification: alreadyStartedThisRound?
   - state.mode === 'versus' ✓
   - versusSeed.value === myRoundSeed ✓
   - state.inPlay === true ✗ (false pendant mémorisation)
→ alreadyStartedThisRound = false
→ beginVersus() appelé à nouveau ❌
→ Barre de mémorisation réinitialisée ❌
```

**Avec le fix:**

```
Joueur A: En mémorisation (state.inPlay = false)
Joueur B: En jeu (state.inPlay = true)

→ Joueur B clique sur une case
→ setPlayerProgress(code, playerB, 0.5)
→ Événement Realtime envoyé à tous

→ Joueur A reçoit l'événement
→ handleRoomUpdate(room) appelé
→ Vérification: alreadyStartedThisRound?
   - state.mode === 'versus' ✓
   - versusSeed.value === myRoundSeed ✓
→ alreadyStartedThisRound = true ✓
→ beginVersus() PAS appelé ✓
→ Barre de mémorisation continue normalement ✓
```

## Logs de Débogage

Avec le fix, vous verrez maintenant:

**Quand un événement Realtime arrive pendant la mémorisation:**
```
[App] Room update received: playing [...]
[App] Round 1 déjà démarré, skip
```

**Au lieu de:**
```
[App] Room update received: playing [...]
[App] Démarrage du round 1 pour le joueur abc123 (inPlay: false)
[beginVersus] Round 1 avec seed 123456789 (base: 123456789)
```

## Test

1. **Créer une room** avec 2 joueurs
2. **Démarrer** la partie
3. **Joueur A:** Rester en phase de mémorisation (ne pas cliquer)
4. **Joueur B:** Commencer à cliquer sur les cases
5. **Vérifier:** La barre de mémorisation du Joueur A ne se réinitialise pas

## Cas d'Usage

### Cas 1: Mémorisation + Clics de l'autre joueur

```
Joueur A: Mémorisation (0-3 secondes)
Joueur B: Clique sur des cases

→ Joueur A voit la barre de mémorisation progresser normalement
→ Pas de réinitialisation
```

### Cas 2: Deux joueurs en mémorisation

```
Joueur A: Mémorisation
Joueur B: Mémorisation

→ Aucun événement de progression
→ Pas de problème
```

### Cas 3: Changement de round

```
Joueur A: Termine son round → current_round: 2
→ versusSeed change de 123456789 à 124456789
→ alreadyStartedThisRound = false
→ beginVersus() appelé ✓
→ Nouvelle mémorisation démarre ✓
```

## Pourquoi le Seed Suffit

Le `versusSeed` est unique pour chaque round:
- Round 1: `baseSeed + 0 = 123456789`
- Round 2: `baseSeed + 1000000 = 124456789`
- Round 3: `baseSeed + 2000000 = 125456789`

Donc:
- Si `versusSeed === myRoundSeed` → On a déjà démarré ce round
- Si `versusSeed !== myRoundSeed` → C'est un nouveau round, on doit démarrer

Pas besoin de vérifier `state.inPlay` car:
- Pendant la mémorisation: `versusSeed` est déjà défini
- Pendant le jeu: `versusSeed` est toujours le même
- Nouveau round: `versusSeed` change

## Avantages du Fix

✅ **Pas de réinitialisation** de la barre de mémorisation
✅ **Logique plus simple** (une seule condition)
✅ **Moins de bugs** (pas de dépendance sur `state.inPlay`)
✅ **Performance** (moins d'appels à `beginVersus`)

## Inconvénient Potentiel

⚠️ Si `versusSeed` n'est pas correctement réinitialisé entre les parties, il pourrait y avoir un problème. Mais ce n'est pas le cas car:
- `versusSeed` est réinitialisé dans `beginVersus`
- `beginVersus` est appelé à chaque nouveau round
- Le seed change à chaque round

## Vérification

Pour vérifier que le fix fonctionne, regardez les logs:

**Avant le fix:**
```
[App] Démarrage du round 1 pour le joueur abc123 (inPlay: false)
[App] Démarrage du round 1 pour le joueur abc123 (inPlay: false)
[App] Démarrage du round 1 pour le joueur abc123 (inPlay: false)
```
→ Appelé plusieurs fois pendant la mémorisation ❌

**Après le fix:**
```
[App] Démarrage du round 1 pour le joueur abc123 (seed: 123456789 vs undefined)
[App] Round 1 déjà démarré, skip
[App] Round 1 déjà démarré, skip
[App] Round 1 déjà démarré, skip
```
→ Appelé une seule fois au début, puis skip ✓

## Résumé

**Problème:** Vérifier `state.inPlay === true` empêchait de détecter qu'on avait déjà démarré le round pendant la mémorisation.

**Solution:** Ne vérifier que le `seed` pour savoir si on a déjà démarré ce round.

**Résultat:** La barre de mémorisation ne se réinitialise plus quand l'autre joueur clique.
