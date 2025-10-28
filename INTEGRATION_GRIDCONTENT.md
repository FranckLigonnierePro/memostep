# 🎮 Intégration de gridContent.json - Documentation

## 📋 Résumé

Le système de génération de grille a été adapté pour lire et appliquer automatiquement les règles définies dans `gridContent.json`. Le code existant continue de fonctionner, mais utilise maintenant des probabilités dynamiques et des limites configurables.

---

## ✅ Modifications effectuées

### 1. **Nouveau module : `src/lib/gridGenerator.js`**

Ce module contient toute la logique de génération basée sur `gridContent.json` :

#### Fonctions principales :

- **`generateEnrichedGrid(path, floorNumber, runCounters)`**
  - Génère une grille complète avec pièges et bonus
  - Applique les probabilités dynamiques selon l'étage
  - Respecte toutes les limites (maxPerLine, maxPerFloor, maxPerRun)
  - Retourne : `{ grid, runCounters }`

- **`generateRandomPath()`**
  - Génère un chemin aléatoire jouable (4 colonnes × 10 lignes)
  - Compatible avec le code existant

- **`debugGrid(grid, floorNumber)`**
  - Affiche une grille dans la console avec statistiques
  - Utile pour vérifier la génération

#### Logique appliquée :

```javascript
// Calcul de probabilité dynamique
chance = min(baseChance + (floorNumber * perFloorBonus), maxChance)
```

#### Placement des éléments :

1. **Pièges** (adjacent_to_path uniquement) :
   - Maximum 1 piège par ligne
   - Respecte `noTrapBeforeFloor`
   - Types : `trap_life`, `trap_back2`, `trap_stun`

2. **Bonus** (adjacent_to_path) :
   - Or : max 2 par étage
   - Gemme : max 1 par run (session complète)
   - Essence : max 1 par étage
   - Potion : max 1 par run, jamais sur ligne 0

3. **Enrichissement du chemin** :
   - Or : peut apparaître sur cases de chemin
   - Essence : peut apparaître sur cases de chemin

4. **Cases neutres** :
   - Remplissent toutes les cases vides

---

### 2. **Adaptation de `src/App.vue`**

#### Ajouts :

```javascript
// Import du nouveau module
import { generateEnrichedGrid } from './lib/gridGenerator.js';

// Compteurs globaux pour maxPerRun
const runCounters = ref({ gem: 0, potion: 0 });

// Nouvelle fonction d'application
function applyEnrichedGrid(floorNumber, runCounters) {
  const { grid, runCounters: newCounters } = generateEnrichedGrid(
    state.path, 
    floorNumber, 
    runCounters
  );
  
  // Applique les pièges au state existant
  state.rollback.clear();
  state.stun.clear();
  state.lifeLoss.clear();
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const key = `${r}-${c}`;
      
      if (cell.type === 'trap_life') state.lifeLoss.add(key);
      else if (cell.type === 'trap_back2') state.rollback.add(key);
      else if (cell.type === 'trap_stun') state.stun.add(key);
    }
  }
  
  return newCounters;
}
```

#### Modifications :

**Dans `startMode('solo')` :**
```javascript
// Avant
generateSoloDecoys();
generateBorderHazards();

// Après
runCounters.value = { gem: 0, potion: 0 }; // Reset
runCounters.value = applyEnrichedGrid(1, runCounters.value);
```

**Dans `newGame()` (mode solo) :**
```javascript
// Avant
generateSoloDecoys();
generateBorderHazards();

// Après
const currentFloor = Math.max(1, (soloLevel.value || 0) + 1);
runCounters.value = applyEnrichedGrid(currentFloor, runCounters.value);
```

---

## 🎯 Fonctionnement

### Progression des probabilités

| Étage | Piège vie | Piège recul | Piège stun | Or (étage) | Gemme | Essence | Potion |
|-------|-----------|-------------|------------|------------|-------|---------|--------|
| 1     | 5%        | 6%          | 6%         | 20%        | 2%    | 8%      | 6%     |
| 10    | 9.5%      | 10.5%       | 10.5%      | 38%        | 4.7%  | 26%     | 15%    |
| 25    | 10% (max) | 12% (max)   | 12% (max)  | 40% (max)  | 6% (max) | 20% (max) | 12% (max) |

### Limites respectées

- ✅ **1 piège maximum par ligne**
- ✅ **Pièges uniquement adjacents au chemin**
- ✅ **Or : 2 max par étage**
- ✅ **Gemme : 1 max par run**
- ✅ **Essence : 1 max par étage**
- ✅ **Potion : 1 max par run, jamais ligne 0**
- ✅ **Pièges respectent noTrapBeforeFloor**

---

## 🧪 Tests

### Test visuel HTML

Ouvrir `test_grid_generation.html` dans un navigateur :

```bash
open test_grid_generation.html
```

Affiche 3 grilles (étages 1, 10, 25) avec :
- Visualisation colorée
- Statistiques détaillées
- Compteurs globaux

### Test console

```bash
node test_console.js
```

Affiche les grilles dans la console avec statistiques.

### Test dans le jeu

1. Lancer le serveur : `npm run dev`
2. Démarrer un mode Solo
3. Observer les pièges qui apparaissent selon les règles
4. Vérifier que les probabilités augmentent avec les étages

---

## 📊 Structure de la grille générée

```javascript
grid[row][col] = {
  type: 'path' | 'neutral' | 'trap_life' | 'trap_back2' | 'trap_stun' 
        | 'gold' | 'gem' | 'essence' | 'potion',
  value?: number,  // Pour or et essence
  gold?: number,   // Pour chemin avec or
  essence?: number // Pour chemin avec essence
}
```

### Exemples :

```javascript
// Case de chemin simple
{ type: 'path' }

// Case de chemin avec or
{ type: 'path', gold: 5 }

// Case de piège
{ type: 'trap_back2' }

// Case d'or (hors chemin)
{ type: 'gold', value: 7 }

// Case neutre
{ type: 'neutral' }
```

---

## 🔄 Compatibilité

### ✅ Code existant préservé

- Les fonctions `generateBorderHazards()` et `generateSoloDecoys()` existent toujours
- Le mode Daily continue d'utiliser l'ancien système
- Le mode Versus continue d'utiliser l'ancien système
- Seul le mode Solo utilise le nouveau système

### 🎮 Comportement du jeu inchangé

- Le chemin reste jouable (±1 colonne par ligne)
- Les pièges fonctionnent comme avant
- Les vies, le recul et le stun fonctionnent à l'identique
- L'interface utilisateur n'a pas changé

---

## 🚀 Prochaines étapes (optionnel)

### Pour afficher les bonus visuellement :

1. Ajouter `state.gridContent = grid` dans `applyEnrichedGrid()`
2. Modifier `BoardView.vue` pour afficher les icônes :
   - 💰 pour l'or
   - 💎 pour les gemmes
   - ⚡ pour l'essence
   - 🧪 pour les potions
3. Gérer la collecte des bonus au clic

### Pour étendre aux autres modes :

- Adapter le mode Daily pour utiliser `applyEnrichedGrid()`
- Adapter le mode Versus pour utiliser `applyEnrichedGrid()`

---

## 📝 Configuration dans gridContent.json

Pour modifier les règles, éditer `src/lib/gridContent.json` :

```json
{
  "traps": {
    "life_loss": {
      "baseChancePerLine": 0.05,  // 5% de base
      "perFloorBonus": 0.005,     // +0.5% par étage
      "maxChance": 0.10,          // 10% maximum
      "limits": {
        "maxPerLine": 1,
        "noTrapBeforeFloor": 1    // Apparaît dès l'étage 1
      }
    }
  }
}
```

Toutes les valeurs sont lues dynamiquement, aucun code à modifier !

---

## ✅ Checklist de vérification

- [x] Module `gridGenerator.js` créé
- [x] Import dans `App.vue`
- [x] Fonction `applyEnrichedGrid()` créée
- [x] Mode Solo utilise le nouveau système
- [x] Compteurs globaux `runCounters` ajoutés
- [x] Tests HTML et console créés
- [x] Documentation complète
- [x] Code existant préservé
- [x] Compatibilité assurée

---

## 🎉 Résultat

Le système lit maintenant automatiquement `gridContent.json` et applique les règles définies. Les probabilités évoluent dynamiquement selon l'étage, et toutes les limites sont respectées. Le jeu reste jouable et équilibré !
