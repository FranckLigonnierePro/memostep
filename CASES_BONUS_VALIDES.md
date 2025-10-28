# 💜 Cases Bonus Valides - Documentation

## ✅ Nouvelle fonctionnalité

Les cases contenant des bonus (💰💎⚡🧪) sont maintenant des **cases valides** (comme le chemin) et s'affichent en **violet** pour les distinguer !

---

## 🎯 Concept

### Avant
- **Chemin** (bleu) = cases à cliquer
- **Bonus** (icônes) = à collecter après validation du chemin adjacent
- **Neutre** (gris) = cases sans effet

### Maintenant
- **Chemin** (bleu) = cases principales
- **Bonus** (violet) = **cases valides alternatives** 💜
- **Neutre** (gris) = cases sans effet

---

## 💜 Cases Bonus (VIOLET)

### Visuel
- **Couleur** : Violet (#9b59b6)
- **Icône** : 💰💎⚡🧪 (selon le type)
- **Label** : "BONUS"

### Types de bonus

| Bonus | Icône | Effet |
|-------|-------|-------|
| Or | 💰 | +X or |
| Gemme | 💎 | +1 gemme (rare) |
| Essence | ⚡ | +1 essence |
| Potion | 🧪 | +1 cœur |

### Comportement

```javascript
// Clic sur case bonus (sur la bonne ligne)
state.correctSet.add(key);        // Marquée comme correcte ✓
state.collectedBonuses.add(key);  // Bonus collecté
state.nextIndex++;                // Avance à la ligne suivante
// Permet de continuer le chemin !
```

### Règle
> Les cases bonus sont des **cases valides alternatives** au chemin ! 
> 
> **IMPORTANT** : Le bonus doit être sur la **même ligne** que la prochaine case de chemin attendue. Si vous êtes à la ligne 3, vous pouvez cliquer sur le chemin OU sur un bonus de la ligne 3. Cela vous fait avancer à la ligne 4.

---

## 🎨 Palette de couleurs

| Type | Couleur | Code |
|------|---------|------|
| **BONUS** 💜 | Violet | #9b59b6 |
| **CHEMIN** 🔵 | Bleu | #1e90ff |
| **VALIDÉ** ✅ | Vert | #24a95b |
| **NEUTRE** ⚪ | Gris | #5a5f6d |
| **PIÈGE** ⚠️ | Orange/Jaune/Rouge | Variable |

---

## 🎮 Exemple de grille

### Pendant la mémorisation

```
Ligne 0: CHEMIN🔵 | NEUTRE⚪  | STUN⚡    | NEUTRE⚪
Ligne 1: NEUTRE⚪  | CHEMIN🔵 | OR💜      | NEUTRE⚪
Ligne 2: NEUTRE⚪  | CHEMIN🔵 | GEMME💜   | NEUTRE⚪
Ligne 3: VIE💔     | CHEMIN🔵 | NEUTRE⚪  | NEUTRE⚪
Ligne 4: NEUTRE⚪  | CHEMIN🔵 | ESSENCE💜 | NEUTRE⚪
```

### Légende
- 🔵 **CHEMIN** : Cases principales (bleues)
- 💜 **BONUS** : Cases valides alternatives (violettes)
- ⚪ **NEUTRE** : Cases sans effet
- ⚠️ **PIÈGES** : Cases dangereuses

### Exemple de partie

```
Vous êtes à : nextIndex = 0 (ligne 0)
Vous pouvez cliquer sur :
  ✅ CHEMIN🔵 (ligne 0, col 0) → Avance ligne 1
  ❌ OR💜 (ligne 1) → Pas encore, vous êtes ligne 0

Clic sur CHEMIN🔵 ligne 0 ✓
→ nextIndex = 1 (ligne 1)

Vous pouvez maintenant cliquer sur :
  ✅ CHEMIN🔵 (ligne 1, col 1) → Avance ligne 2
  ✅ OR💜 (ligne 1, col 2) → Avance ligne 2 + collecte or
  
Clic sur OR💜 ligne 1 ✓
→ nextIndex = 2 (ligne 2)
→ Or collecté ! 💰

Vous pouvez maintenant cliquer sur :
  ✅ CHEMIN🔵 (ligne 2, col 1) → Avance ligne 3
  ✅ GEMME💜 (ligne 2, col 2) → Avance ligne 3 + collecte gemme
```

---

## 🎯 Stratégies de jeu

### Option 1 : Suivre le chemin principal
```
Clic : CHEMIN → CHEMIN → CHEMIN → ...
Résultat : Progression normale
```

### Option 2 : Collecter les bonus
```
Ligne 0 : Clic CHEMIN🔵 → Avance ligne 1
Ligne 1 : Clic OR💜 (au lieu du chemin) → Avance ligne 2 + collecte or
Ligne 2 : Clic CHEMIN🔵 → Avance ligne 3
Ligne 3 : Clic GEMME💜 (au lieu du chemin) → Avance ligne 4 + collecte gemme

Résultat : Progression normale + bonus collectés !
```

### Option 3 : Mixte
```
Clic : CHEMIN → CHEMIN → OR💜 → CHEMIN → ...
Résultat : Optimal !
```

---

## 📊 Avantages

### Pour le joueur

✅ **Plus de liberté** : Peut choisir son chemin  
✅ **Récompenses** : Collecter des bonus  
✅ **Stratégie** : Optimiser son parcours  
✅ **Visibilité** : Cases violettes bien distinctes  

### Pour le gameplay

✅ **Plus dynamique** : Plusieurs chemins possibles  
✅ **Plus gratifiant** : Bonus = cases valides  
✅ **Moins linéaire** : Choix stratégiques  
✅ **Plus clair** : Couleurs distinctes  

---

## 🔧 Implémentation technique

### BoardView.vue

```javascript
// Détection des cases bonus
function isBonusCell(r, c) {
  if (isBonusCollected(r, c)) return false;
  const cell = getCellContent(r, c);
  if (!cell) return false;
  return cell.type === 'gold' || cell.type === 'gem' || 
         cell.type === 'essence' || cell.type === 'potion';
}

// Icône du bonus
function getBonusIcon(r, c) {
  const cell = getCellContent(r, c);
  const icons = {
    'gold': '💰',
    'gem': '💎',
    'essence': '⚡',
    'potion': '🧪'
  };
  return icons[cell.type] || '?';
}
```

### Template

```vue
<!-- BONUS (cases valides en violet) -->
<div v-if="isBonusCell(cell.r, cell.c)" class="cell-indicator bonus-indicator">
  <div class="indicator-icon">{{ getBonusIcon(cell.r, cell.c) }}</div>
  <div class="indicator-label">BONUS</div>
</div>
```

### CSS

```css
.bonus-indicator {
  background: linear-gradient(145deg, #9b59b6, #8e44ad);
  color: white;
}
```

### App.vue

```javascript
// Clic sur case bonus
if (isBonusCell && !state.collectedBonuses.has(keyAlready)) {
  // Marquer comme correcte (comme le chemin)
  state.correctSet.add(keyAlready);
  state.collectedBonuses.add(keyAlready);
  console.log(`[Bonus collecté] ${cell.type} à (${r},${c})`);
  return; // Traité comme case correcte
}
```

---

## 🎮 Scénarios de jeu

### Scénario 1 : Chemin classique

```
Joueur : Suit le chemin bleu uniquement
Clics : 🔵 → 🔵 → 🔵 → 🔵 → ...

Résultat :
- Progression normale
- Pas de bonus collectés
- Temps optimal
```

### Scénario 2 : Collecte de bonus

```
Joueur : Dévie pour collecter les bonus
Clics : 🔵 → 💜 → 🔵 → 💜 → 🔵 → ...

Résultat :
- Progression normale
- Bonus collectés : 💰💎⚡🧪
- Temps légèrement plus long
- Plus de récompenses !
```

### Scénario 3 : Erreur puis bonus

```
Joueur : Se trompe puis clique sur bonus
Clics : 🔵 → ⚪ (erreur) → 💜 (bonus)

Résultat :
- Case neutre : aucun effet
- Case bonus : validée et collectée
- Continue normalement
```

---

## 📈 Statistiques

### Probabilité d'avoir des bonus

| Étage | Or | Gemme | Essence | Potion |
|-------|----|----|---------|--------|
| 1 | 20% | 2% | 8% | 6% |
| 10 | 40% | 5% | 20% | 12% |
| 25 | 40% | 6% | 20% | 12% |

### Nombre moyen de cases bonus par grille

| Étage | Bonus total |
|-------|-------------|
| 1 | 1-2 |
| 10 | 2-3 |
| 25 | 2-3 |

---

## ✅ Règles importantes

### 1. Cases bonus = Cases valides alternatives
- ✅ Doivent être sur la **même ligne** que la prochaine case de chemin
- ✅ Comptent comme cases correctes
- ✅ Font avancer à la ligne suivante (nextIndex++)
- ✅ Collectent le bonus automatiquement

### 2. Une seule collecte
- ✅ Chaque bonus ne peut être collecté qu'une fois
- ✅ Après collecte, la case devient neutre
- ✅ L'icône disparaît

### 3. Limites respectées
- ✅ Or : max 2 par étage
- ✅ Gemme : max 1 par run
- ✅ Essence : max 1 par étage
- ✅ Potion : max 1 par run

---

## 🎨 Comparaison visuelle

### Avant (avec collecte après adjacence)

```
1. Mémoriser le chemin
2. Cliquer sur le chemin
3. Cliquer sur bonus adjacent
4. Bonus collecté
```

### Maintenant (cases valides)

```
1. Mémoriser le chemin ET les bonus
2. Cliquer sur chemin OU bonus
3. Bonus collecté automatiquement
```

**Plus simple et plus direct !**

---

## 🎯 Conseils stratégiques

### Priorité 1 : Mémoriser
- 🔵 **Chemin principal** (bleu)
- 💜 **Cases bonus** (violet)
- ⚠️ **Pièges** (orange/jaune/rouge)

### Priorité 2 : Planifier
- Décider si collecter les bonus
- Évaluer le risque (pièges adjacents)
- Optimiser le parcours

### Priorité 3 : Exécuter
- Cliquer sur chemin ou bonus
- Éviter les pièges
- Collecter stratégiquement

---

## 🎉 Résumé

**Les cases bonus sont maintenant des cases valides en violet !**

✅ **Violet** = Case bonus valide  
✅ **Bleu** = Chemin principal  
✅ **Vert** = Case validée  
✅ **Gris** = Case neutre  
✅ **Rouge/Orange/Jaune** = Pièges  

Le jeu est maintenant **plus flexible** et **plus gratifiant** ! 💜🎮✨
