# 📘 Guide de refactorisation BoardView.vue

## 📦 Modules créés

### Composables (3 fichiers)

#### 1. `composables/board/useCellStates.js`
Gère l'état et la détection des cellules.

**Fonctions exportées** :
- `isCellWrong(cellClass, r, c)` - Vérifie si cellule wrong
- `isRollbackCell(rollbackKeys, r, c)` - Vérifie si cellule rollback
- `isStunCell(stunKeys, r, c)` - Vérifie si cellule stun
- `isPathCell(cellClass, r, c)` - Vérifie si cellule path
- `isCorrectCell(cellClass, r, c)` - Vérifie si cellule correct
- `getCellContent(gridContent, r, c)` - Récupère contenu cellule
- `isBonusCollected(collectedBonuses, r, c)` - Vérifie si bonus collecté
- `isBonusCell(gridContent, collectedBonuses, r, c)` - Vérifie si cellule bonus
- `getBonusIcon(gridContent, r, c)` - Récupère icône bonus
- `showHeart(heartCell, revealComplete, revealed, r, c)` - Affiche cœur
- `nextPlayableRow(path, playerProgress)` - Calcule prochaine ligne
- `canClickCell(revealComplete, path, playerProgress, r, c)` - Autorise clic

#### 2. `composables/board/usePlayerPositioning.js`
Gère le positionnement des avatars.

**Fonctions exportées** :
- `soloPlayerPosition(path, playerProgress, collectedBonuses)` - Position solo
- `playerBubblePosition(player, versusPathsByPlayer, fallbackPath)` - Position versus
- `playerBubbleStyle(player, selfId, versusPathsByPlayer, fallbackPath)` - Style complet

#### 3. `composables/board/usePlayerAvatars.js`
Gère les avatars et leur état.

**Exports** :
- `usePlayerAvatars(props)` - Composable principal
  - `avatarByKey` (computed) - Map des avatars
  - `playerIsFrozen(player)` - Détecte freeze
  - `getAvatar(player)` - Récupère avatar
- `useFreezeDetection(props)` - Détection transitions freeze
  - `justFrozen` (ref) - Set des joueurs just frozen
  - `isJustFrozen(player)` - Vérifie just frozen
  - `updateFreezeState(players, playerIsFrozenFn)` - Met à jour état

### Utilitaires (2 fichiers)

#### 4. `utils/board/cellHelpers.js`
Fonctions utilitaires pour les cellules.

**Fonctions exportées** :
- `hashString(s)` - Hash simple
- `initial(name)` - Première lettre
- `bubbleTextColor(bg)` - Couleur de texte optimale

#### 5. `utils/board/animationHelpers.js`
Génération de styles d'animation.

**Fonctions exportées** :
- `snowflakeStyle(index)` - Style flocon
- `crackStyle(crackIndex)` - Style fissure
- `brokenCrackStyle(crackIndex)` - Style fissure cassée
- `pathRevealStyle(r, c, path, revealed, revealComplete)` - Style reveal

### Configuration (1 fichier)

#### 6. `config/boardConfig.js`
Configuration centralisée.

**Constantes** :
- `SNOWFLAKE_COUNT = 50`
- `FREEZE_ANIMATION_DURATION = 700`
- `PATH_REVEAL_DELAY = 200`
- `AVATAR_SIZE = 32`
- `BUBBLE_SIZE = 32`
- `ICON_SIZES = { bonus: 16, heart: 18, ... }`
- `JUST_FROZEN_TIMEOUT = 700`
- `DEFAULT_ROWS = 12`
- `DEFAULT_COLS = 4`

## 🔄 Migration BoardView.vue

### Imports à ajouter

```javascript
// Composables
import { usePlayerAvatars, useFreezeDetection } from '@/composables/board/usePlayerAvatars';
import { soloPlayerPosition, playerBubbleStyle } from '@/composables/board/usePlayerPositioning';
import * as CellStates from '@/composables/board/useCellStates';

// Utilitaires
import { snowflakeStyle, crackStyle, pathRevealStyle } from '@/utils/board/animationHelpers';
import { bubbleTextColor, initial } from '@/utils/board/cellHelpers';

// Configuration
import BOARD_CONFIG from '@/config/boardConfig';
```

### Remplacements dans le script

#### Avant (fonctions locales)
```javascript
function isCellWrong(r, c) {
  const classes = props.cellClass(r, c);
  return classes.includes('wrong');
}
```

#### Après (import)
```javascript
// Utiliser directement
const isCellWrong = (r, c) => CellStates.isCellWrong(props.cellClass, r, c);
```

### Simplification des composables

#### Avant (logique complexe)
```javascript
const avatarByKey = computed(() => {
  // 15 lignes de logique
});

function getAvatar(player) {
  // 42 lignes de logique
}
```

#### Après (composable)
```javascript
const { avatarByKey, getAvatar, playerIsFrozen } = usePlayerAvatars(props);
```

### Watcher simplifié

#### Avant (20 lignes)
```javascript
watch(
  () => (props.versusPlayers || []).map(p => ({ id: p?.id || p?.name || '', frozen: playerIsFrozen(p) })),
  (now) => {
    // 20 lignes de logique
  }
);
```

#### Après (composable)
```javascript
const { isJustFrozen, updateFreezeState } = useFreezeDetection(props);

watch(
  () => props.versusPlayers || [],
  (players) => updateFreezeState(players, playerIsFrozen),
  { immediate: true }
);
```

## 📊 Résultat de la refactorisation

### Avant
- **Script** : 453 lignes
- **Fonctions** : 24 fonctions
- **Computed** : 1 computed
- **Watchers** : 1 watcher complexe

### Après
- **Script** : ~200 lignes (56% réduction)
- **Imports** : 6 modules
- **Fonctions locales** : ~8 fonctions (wrapper)
- **Computed** : Fournis par composables
- **Watchers** : 1 watcher simplifié

### Gains
- ✅ **56% de réduction** du script
- ✅ **Logique réutilisable** dans d'autres composants
- ✅ **Testabilité** : Chaque module testable isolément
- ✅ **Maintenabilité** : Code organisé par responsabilité
- ✅ **Lisibilité** : Moins de code dans le composant

## 🧪 Tests recommandés

### Tests unitaires à créer

1. **useCellStates.test.js**
   - Tester toutes les fonctions de détection
   - Cas limites (null, undefined, arrays vides)

2. **usePlayerPositioning.test.js**
   - Tester positionnement solo
   - Tester positionnement versus
   - Cas limites (path vide, progress invalide)

3. **usePlayerAvatars.test.js**
   - Tester sélection d'avatar
   - Tester état frozen
   - Tester transitions

4. **animationHelpers.test.js**
   - Tester génération de styles
   - Vérifier randomness des flocons

## 🚀 Prochaines étapes

1. ✅ Modules créés
2. ⏳ Refactoriser BoardView.vue
3. ⏳ Tester l'application
4. ⏳ Créer les tests unitaires
5. ⏳ (Optionnel) Extraire les CSS

---

**Date** : 29 octobre 2025  
**Modules créés** : 6 fichiers  
**Réduction estimée** : 56% du script
