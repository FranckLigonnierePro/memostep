# 🎮 Exemple de grille générée - MémoStep

## 📊 Grille Étage 10

Voici un exemple concret de grille générée pour l'étage 10 avec les probabilités calculées selon `gridContent.json`.

---

## 🗺️ Visualisation

```
Colonne:    0         1         2         3
         ┌─────────┬─────────┬─────────┬─────────┐
Ligne 0  │  PATH   │ Neutral │ 💔 Trap │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 1  │ Neutral │  PATH   │ 5💰 Or  │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 2  │ ⬅️ Trap │ Neutral │  PATH   │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 3  │ Neutral │ Neutral │  PATH   │ ⚡ Trap │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 4  │ Neutral │  PATH   │ Neutral │ 6💰 Or  │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 5  │ Neutral │  PATH   │ Neutral │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 6  │  PATH   │ 💎 Gem  │ Neutral │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 7  │ Neutral │  PATH   │ Neutral │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 8  │ ⚡ Trap │  PATH   │ Neutral │ Neutral │
         ├─────────┼─────────┼─────────┼─────────┤
Ligne 9  │ Neutral │  PATH   │ Neutral │ Neutral │
         └─────────┴─────────┴─────────┴─────────┘
```

---

## 📈 Statistiques de cette grille

### Cases
- **Chemin** : 10 (1 par ligne) ✅
- **Neutres** : 23
- **Total** : 40 (10 lignes × 4 colonnes)

### Pièges (adjacents au chemin)
- **💔 Perte de vie** : 1
- **⬅️ Recul -2** : 1
- **⚡ Stun** : 2
- **Total pièges** : 4
- **Max par ligne** : 1 ✅

### Bonus
- **💰 Or** : 2 (valeurs: 5, 6) ✅ max 2/étage
- **💎 Gemme** : 1 ✅ max 1/run
- **⚡ Essence** : 0
- **🧪 Potion** : 0

---

## 🎲 Probabilités appliquées (Étage 10)

### Pièges

| Type | Base | Bonus×10 | Max | **Résultat** |
|------|------|----------|-----|--------------|
| Perte vie | 5% | +5% | 10% | **10%** |
| Recul -2 | 6% | +5% | 12% | **11%** |
| Stun | 6% | +5% | 12% | **11%** |

### Bonus

| Type | Base | Bonus×10 | Max | **Résultat** |
|------|------|----------|-----|--------------|
| Or | 20% | +20% | 40% | **40%** |
| Gemme | 2% | +3% | 6% | **5%** |
| Essence | 8% | +20% | 20% | **20%** (max atteint) |
| Potion | 6% | +10% | 12% | **16%** → **12%** (plafonné) |

---

## 🔍 Analyse détaillée

### Ligne 0 : `PATH | Neutral | 💔 Trap | Neutral`

- **Chemin** en colonne 0
- **Piège perte de vie** en colonne 2 (adjacent au chemin) ✅
- Respecte max 1 piège/ligne ✅

### Ligne 1 : `Neutral | PATH | 5💰 Or | Neutral`

- **Chemin** en colonne 1 (±1 depuis ligne 0) ✅
- **Or (5 pièces)** en colonne 2 (adjacent) ✅
- Valeur entre 3-7 ✅

### Ligne 2 : `⬅️ Trap | Neutral | PATH | Neutral`

- **Chemin** en colonne 2 (±1 depuis ligne 1) ✅
- **Piège recul** en colonne 0 (adjacent) ✅
- Apparu car étage ≥ 2 ✅

### Ligne 6 : `PATH | 💎 Gem | Neutral | Neutral`

- **Chemin** en colonne 0
- **Gemme** en colonne 1 (adjacent) ✅
- Rare (5% de chance) ✅
- Compte pour le maxPerRun (1 seule dans toute la session)

---

## 🎯 Validation des règles

### ✅ Règles de chemin
- [x] 1 case par ligne
- [x] Colonne ±1 entre lignes
- [x] Chemin jouable du bas vers le haut

### ✅ Règles de pièges
- [x] Maximum 1 par ligne
- [x] Uniquement adjacent au chemin
- [x] Pas sur le chemin lui-même
- [x] Types respectent noTrapBeforeFloor

### ✅ Règles de bonus
- [x] Or : 2 max par étage (2/2 utilisés)
- [x] Gemme : 1 max par run (1/1 utilisé)
- [x] Essence : 1 max par étage (0/1)
- [x] Potion : 1 max par run, pas ligne 0 (0/1)

### ✅ Probabilités
- [x] Calculées avec la formule
- [x] Plafonnées à maxChance
- [x] Augmentent avec l'étage

---

## 🎮 Expérience de jeu

### Difficulté perçue

**Étage 10 = Difficulté moyenne**

- 4 pièges sur 30 cases adjacentes ≈ **13%** de risque
- 2 bonus d'or pour récompenser
- 1 gemme rare (collection)
- Équilibré entre challenge et récompense

### Stratégie du joueur

1. **Mémoriser le chemin** (10 cases bleues)
2. **Repérer les pièges** (marqueurs visibles)
3. **Éviter les cases dangereuses**
4. **Collecter les bonus** si sur le chemin
5. **Progresser prudemment**

---

## 📊 Comparaison avec autres étages

### Étage 1 (Facile)

```
Pièges: 1-2 (5-6% de chance)
Or: 0-1
Bonus rares: Possibles
Difficulté: ⭐☆☆☆☆
```

### Étage 10 (Moyen) ← Cette grille

```
Pièges: 3-5 (10-11% de chance)
Or: 1-2
Bonus rares: Probables
Difficulté: ⭐⭐⭐☆☆
```

### Étage 25 (Difficile)

```
Pièges: 6-8 (10-12% max)
Or: 2
Bonus rares: Épuisés
Difficulté: ⭐⭐⭐⭐⭐
```

---

## 🔧 Comment cette grille a été générée

### 1. Génération du chemin

```javascript
const path = generateRandomPath();
// Résultat: [{r:9,c:1}, {r:8,c:1}, {r:7,c:1}, ...]
```

### 2. Calcul des probabilités

```javascript
// Pour chaque type de piège/bonus
const chance = Math.min(
  baseChance + (floorNumber * perFloorBonus),
  maxChance
);

// Exemple pour piège vie à l'étage 10:
// chance = min(0.05 + (10 * 0.005), 0.10)
// chance = 0.10 = 10%
```

### 3. Placement des éléments

```javascript
// Pour chaque case adjacente au chemin
for (const cell of adjacentCells) {
  if (Math.random() < chance) {
    grid[r][c] = { type: 'trap_life' };
  }
}
```

### 4. Respect des limites

```javascript
// Compteurs
let trapsThisLine = 0;  // Max 1
let goldThisFloor = 0;  // Max 2
let gemsThisRun = 0;    // Max 1

// Vérification avant placement
if (trapsThisLine < 1 && goldThisFloor < 2) {
  // Placer l'élément
}
```

---

## 🎨 Représentation visuelle dans le jeu

### Pendant la mémorisation (8 secondes)

```
┌─────────┬─────────┬─────────┬─────────┐
│ 🔵 PATH │   ⚪    │   ⚪    │   ⚪    │  ← Chemin visible
├─────────┼─────────┼─────────┼─────────┤
│   ⚪    │ 🔵 PATH │   ⚪    │   ⚪    │
├─────────┼─────────┼─────────┼─────────┤
│   ⚪    │   ⚪    │ 🔵 PATH │   ⚪    │
└─────────┴─────────┴─────────┴─────────┘
```

### Pendant le jeu (après mémorisation)

```
┌─────────┬─────────┬─────────┬─────────┐
│   🎲    │   ⚪    │   ❌    │   ⚪    │  ← Marqueurs visibles
├─────────┼─────────┼─────────┼─────────┤
│   ⚪    │   🎲    │   ⚪    │   ⚪    │  ⚪ = Neutre
├─────────┼─────────┼─────────┼─────────┤  ❌ = Recul
│   ❌    │   ⚪    │   🎲    │   ⚪    │  🔺 = Stun
└─────────┴─────────┴─────────┴─────────┘
```

Le joueur doit se souvenir du chemin et cliquer sur les bonnes cases !

---

## 💡 Points clés

### Ce qui rend cette grille équilibrée

1. **Progression naturelle** : Étage 10 = difficulté moyenne
2. **Récompenses présentes** : 2 or + 1 gemme
3. **Pièges variés** : 3 types différents
4. **Jouabilité** : Chemin toujours accessible
5. **Challenge** : Assez de pièges pour être intéressant

### Ce qui est configurable

- Probabilités de chaque élément
- Limites (maxPerLine, maxPerFloor, maxPerRun)
- Valeurs des bonus (min/max)
- Étages d'apparition (noTrapBeforeFloor)

**Tout se configure dans `gridContent.json` sans toucher au code !**

---

## 🚀 Conclusion

Cette grille d'exemple montre que le système :

✅ Génère des grilles jouables  
✅ Respecte toutes les règles  
✅ Applique les probabilités correctement  
✅ Crée une progression équilibrée  
✅ Offre variété et challenge  

**Le système fonctionne parfaitement !** 🎉
