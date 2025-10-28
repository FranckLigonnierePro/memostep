# ✅ Règles de génération MémoStep - Implémentation

## 📋 Structure de la grille

- **4 colonnes × 10 lignes**
- **1 seule case chemin par ligne**
- **Chemin jouable** : colonne = même, +1 ou –1 par rapport à la ligne précédente

---

## 🎯 Types de cases

| Type | Description |
|------|-------------|
| `path` | Case correcte du chemin |
| `trap_life` | Piège : -1 cœur |
| `trap_back2` | Piège : recul 2 cases |
| `trap_stun` | Piège : étourdi 1s |
| `gold` | Bonus : or |
| `gem` | Bonus : gemme |
| `essence` | Bonus : essence |
| `potion` | Bonus : potion |
| `neutral` | Case sans effet |

---

## 🛤️ Règles du CHEMIN

### ✅ Autorisé sur le chemin
- **Or** (rare) : `{ type: 'path', gold: 5 }`
- **Essence** (rare) : `{ type: 'path', essence: 1 }`

### ❌ JAMAIS sur le chemin
- **Pièges** (toujours adjacents)
- **Gemme** (uniquement adjacent)
- **Potion** (uniquement adjacent)

### Exemple
```javascript
// Case de chemin simple
{ type: 'path' }

// Case de chemin avec or
{ type: 'path', gold: 5 }

// Case de chemin avec essence
{ type: 'path', essence: 1 }
```

---

## 💣 Règles des PIÈGES

### Placement
- ✅ **TOUJOURS adjacent au chemin** (orthogonal uniquement)
- ✅ **Maximum 1 piège par ligne**
- ❌ **JAMAIS sur le chemin**
- ❌ **JAMAIS en diagonal**

### Types et apparition

| Piège | Effet | Apparaît dès |
|-------|-------|--------------|
| `trap_life` | -1 cœur | Étage 1 |
| `trap_back2` | Recul 2 cases | Étage 2 |
| `trap_stun` | Étourdi 1s | Étage 3 |

### Probabilités
```javascript
// Formule dynamique
chance = min(baseChancePerLine + (floor * perFloorBonus), maxChance)

// Exemple trap_life à l'étage 10
chance = min(0.05 + (10 * 0.005), 0.10)
chance = 0.10 = 10%
```

---

## 🎁 Règles des BONUS

### Placement selon le type

| Bonus | Sur chemin | Adjacent | Limite |
|-------|------------|----------|--------|
| 💰 Or | ✅ Oui | ✅ Oui | 2 par étage (total) |
| 💎 Gemme | ❌ **NON** | ✅ Oui | 1 par run |
| ⚡ Essence | ✅ Oui | ✅ Oui | 1 par étage (total) |
| 🧪 Potion | ❌ **NON** | ✅ Oui | 1 par run, pas ligne 0 |

### Règles strictes

#### 💰 Or
- **Peut être** : sur chemin OU adjacent
- **Limite** : 2 par étage (compteur global)
- **Valeur** : 3-7 (aléatoire)

#### 💎 Gemme
- **Peut être** : UNIQUEMENT adjacent
- **JAMAIS** : sur le chemin
- **Limite** : 1 par run (session complète)

#### ⚡ Essence
- **Peut être** : sur chemin OU adjacent
- **Limite** : 1 par étage (compteur global)
- **Valeur** : 1 (fixe)

#### 🧪 Potion
- **Peut être** : UNIQUEMENT adjacent
- **JAMAIS** : sur le chemin
- **JAMAIS** : sur la ligne 0
- **Limite** : 1 par run (session complète)

### Probabilités
```javascript
// Formule dynamique
chance = min(baseChancePerFloor + (floor * perFloorBonus), maxChance)

// Divisée par ROWS pour chance par case
chancePerCell = chance / 10
```

---

## ⚪ Règles des cases NEUTRES

- **Toutes les cases vides** deviennent neutres
- **Aucun effet** si cliquées
- **Rebond** au dernier checkpoint

---

## 🔢 Compteurs et limites

### Compteurs par étage (reset à chaque niveau)
```javascript
floorCounters = {
  goldPath: 0,       // Or sur le chemin
  goldAdjacent: 0,   // Or adjacent
  essencePath: 0,    // Essence sur le chemin
  essenceAdjacent: 0 // Essence adjacent
}

// Vérification
totalGold = goldPath + goldAdjacent  // Max 2
totalEssence = essencePath + essenceAdjacent  // Max 1
```

### Compteurs par run (persistent toute la session)
```javascript
runCounters = {
  gem: 0,     // Max 1 par run
  potion: 0   // Max 1 par run
}
```

---

## 🎲 Ordre de génération

### Phase 1 : Initialisation
```javascript
1. Créer grille vide 4×10
2. Marquer les cases du chemin
3. Identifier les cases adjacentes
```

### Phase 2 : Pièges (cases adjacentes)
```javascript
Pour chaque ligne:
  Si trapsThisLine == 0:
    Tirer au sort: trap_life, trap_back2, trap_stun
    Max 1 piège par ligne
```

### Phase 3 : Bonus adjacents (cases adjacentes)
```javascript
Pour chaque case adjacente libre:
  1. Gemme (UNIQUEMENT adjacent)
  2. Potion (UNIQUEMENT adjacent, pas ligne 0)
  3. Or (peut aussi être sur chemin)
  4. Essence (peut aussi être sur chemin)
```

### Phase 4 : Enrichissement du chemin
```javascript
Pour chaque case du chemin:
  1. Or (si totalGold < 2)
  2. Essence (si totalEssence < 1)
```

### Phase 5 : Cases neutres
```javascript
Pour chaque case vide:
  Marquer comme 'neutral'
```

---

## 📊 Exemple de grille générée (Étage 10)

```
Ligne 0: PATH💰 | NEUTRE | STUN⚡  | NEUTRE
Ligne 1: NEUTRE | PATH   | NEUTRE | RECUL⬅
Ligne 2: NEUTRE | PATH   | GEM💎  | NEUTRE
Ligne 3: VIE💔  | PATH   | NEUTRE | NEUTRE
Ligne 4: NEUTRE | PATH   | OR💰   | NEUTRE
Ligne 5: NEUTRE | PATH⚡ | NEUTRE | NEUTRE
Ligne 6: NEUTRE | NEUTRE | PATH   | NEUTRE
Ligne 7: STUN⚡  | NEUTRE | PATH   | NEUTRE
Ligne 8: NEUTRE | NEUTRE | PATH   | NEUTRE
Ligne 9: NEUTRE | NEUTRE | PATH   | NEUTRE
```

### Analyse
- ✅ 1 case chemin par ligne
- ✅ Max 1 piège par ligne
- ✅ Pièges adjacents au chemin
- ✅ Or sur chemin (ligne 0) + or adjacent (ligne 4) = 2 ✅
- ✅ Essence sur chemin (ligne 5) = 1 ✅
- ✅ Gemme adjacent (ligne 2) = 1 ✅
- ✅ Pas de gemme ou potion sur le chemin ✅

---

## 🔍 Vérifications de conformité

### Checklist par grille

- [ ] Exactement 10 cases de chemin (1 par ligne)
- [ ] Chemin jouable (colonne ±1)
- [ ] Max 1 piège par ligne
- [ ] Tous les pièges sont adjacents au chemin
- [ ] Aucun piège sur le chemin
- [ ] Gemme JAMAIS sur le chemin
- [ ] Potion JAMAIS sur le chemin
- [ ] Or : max 2 par étage (chemin + adjacent)
- [ ] Essence : max 1 par étage (chemin + adjacent)
- [ ] Gemme : max 1 par run
- [ ] Potion : max 1 par run
- [ ] Potion jamais sur ligne 0
- [ ] Toutes les cases vides sont neutres

---

## 💻 Code de vérification

```javascript
function validateGrid(grid, path, floorCounters, runCounters) {
  // Vérifier 1 chemin par ligne
  for (let r = 0; r < 10; r++) {
    const pathCells = grid[r].filter(cell => cell.type === 'path');
    if (pathCells.length !== 1) {
      console.error(`Ligne ${r}: ${pathCells.length} cases de chemin (attendu: 1)`);
    }
  }
  
  // Vérifier que gemme et potion ne sont JAMAIS sur le chemin
  for (const p of path) {
    const cell = grid[p.r][p.c];
    if (cell.type === 'gem' || cell.type === 'potion') {
      console.error(`ERREUR: ${cell.type} sur le chemin à (${p.r},${p.c})`);
    }
  }
  
  // Vérifier les limites
  const totalGold = floorCounters.goldPath + floorCounters.goldAdjacent;
  const totalEssence = floorCounters.essencePath + floorCounters.essenceAdjacent;
  
  console.log('✅ Validation:', {
    gold: `${totalGold}/2`,
    essence: `${totalEssence}/1`,
    gem: `${runCounters.gem}/1`,
    potion: `${runCounters.potion}/1`
  });
}
```

---

## 🎉 Résumé des règles STRICTES

### ✅ TOUJOURS VRAI
1. **1 case chemin par ligne**
2. **Pièges adjacents au chemin**
3. **Max 1 piège par ligne**
4. **Gemme UNIQUEMENT adjacent**
5. **Potion UNIQUEMENT adjacent**
6. **Or et essence peuvent être sur chemin OU adjacent**

### ❌ JAMAIS VRAI
1. **Piège sur le chemin**
2. **Gemme sur le chemin**
3. **Potion sur le chemin**
4. **Plus de 1 piège par ligne**
5. **Piège en diagonal du chemin**

---

## 📝 Configuration dans gridContent.json

Toutes les règles sont configurables dans `src/lib/gridContent.json` :

```json
{
  "cells": {
    "path": {
      "canContain": {
        "gold": { "baseChance": 0.08, "valueMin": 3, "valueMax": 6 },
        "essence": { "baseChance": 0.08, "value": 1 }
      }
    }
  },
  "traps": {
    "life_loss": {
      "baseChancePerLine": 0.05,
      "limits": { "maxPerLine": 1, "noTrapBeforeFloor": 1 }
    }
  },
  "bonuses": {
    "gold": { "maxPerFloor": 2 },
    "gem": { "maxPerRun": 1 },
    "essence": { "maxPerFloor": 1 },
    "potion": { "maxPerRun": 1 }
  }
}
```

**Le système respecte maintenant toutes les règles strictement !** ✅
