# 🎨 Affichage des bonus - Documentation

## ✅ Modifications effectuées

Les icônes de bonus (💰💎⚡🧪) sont maintenant affichées visuellement sur les cases de la grille !

---

## 📝 Changements dans App.vue

### 1. Ajout de `gridContent` au state

```javascript
const state = reactive({
  // ... autres propriétés
  gridContent: null,    // grid[r][c] = { type, value?, gold?, essence? }
});
```

### 2. Stockage de la grille dans `applyEnrichedGrid()`

```javascript
function applyEnrichedGrid(floorNumber = 1, runCounters = { gem: 0, potion: 0 }) {
  const { grid, runCounters: newCounters } = generateEnrichedGrid(state.path, floorNumber, runCounters);
  
  // Stocker la grille enrichie dans le state pour affichage visuel
  state.gridContent = grid;
  
  // ... reste du code
}
```

### 3. Passage de `gridContent` à BoardView

```vue
<BoardView
  :gridContent="state.gridContent"
  ...
/>
```

---

## 📝 Changements dans BoardView.vue

### 1. Ajout de la prop `gridContent`

```javascript
const props = defineProps({
  // ... autres props
  gridContent: { type: [Array, Object], default: null },
});
```

### 2. Fonctions helper pour récupérer les bonus

```javascript
// Get cell content from gridContent
function getCellContent(r, c) {
  if (!props.gridContent || !Array.isArray(props.gridContent)) return null;
  if (r < 0 || r >= props.gridContent.length) return null;
  if (c < 0 || !props.gridContent[r] || c >= props.gridContent[r].length) return null;
  return props.gridContent[r][c];
}

// Check if cell has gold bonus
function hasGoldBonus(r, c) {
  const cell = getCellContent(r, c);
  if (!cell) return false;
  if (cell.type === 'path' && cell.gold) return { value: cell.gold, onPath: true };
  if (cell.type === 'gold' && cell.value) return { value: cell.value, onPath: false };
  return false;
}

// Check if cell has gem bonus
function hasGemBonus(r, c) {
  const cell = getCellContent(r, c);
  return cell && cell.type === 'gem';
}

// Check if cell has essence bonus
function hasEssenceBonus(r, c) {
  const cell = getCellContent(r, c);
  if (!cell) return false;
  if (cell.type === 'path' && cell.essence) return { value: cell.essence, onPath: true };
  if (cell.type === 'essence') return { value: 1, onPath: false };
  return false;
}

// Check if cell has potion bonus
function hasPotionBonus(r, c) {
  const cell = getCellContent(r, c);
  return cell && cell.type === 'potion';
}
```

### 3. Affichage des icônes dans le template

```vue
<!-- Bonus icons from gridContent -->
<div v-if="hasGoldBonus(cell.r, cell.c)" class="bonus-icon gold-icon" 
     :title="`+${hasGoldBonus(cell.r, cell.c).value} or`">
  💰
</div>
<div v-if="hasGemBonus(cell.r, cell.c)" class="bonus-icon gem-icon" 
     title="Gemme rare">
  💎
</div>
<div v-if="hasEssenceBonus(cell.r, cell.c)" class="bonus-icon essence-icon" 
     :title="`+${hasEssenceBonus(cell.r, cell.c).value} essence`">
  ⚡
</div>
<div v-if="hasPotionBonus(cell.r, cell.c)" class="bonus-icon potion-icon" 
     title="+1 vie">
  🧪
</div>
```

### 4. Styles CSS pour les icônes

```css
/* Bonus icons overlay */
.bonus-icon {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 16px;
  z-index: 7;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  animation: bonusFloat 2s ease-in-out infinite;
  pointer-events: none;
}

.gold-icon {
  animation-delay: 0s;
}

.gem-icon {
  animation-delay: 0.2s;
  font-size: 18px;
}

.essence-icon {
  animation-delay: 0.4s;
  bottom: 4px;
  left: 4px;
  right: auto;
}

.potion-icon {
  animation-delay: 0.6s;
  font-size: 18px;
}

@keyframes bonusFloat {
  0%, 100% { 
    transform: translateY(0) scale(1); 
    opacity: 0.9; 
  }
  50% { 
    transform: translateY(-3px) scale(1.1); 
    opacity: 1; 
  }
}
```

---

## 🎮 Résultat visuel

### Pendant la mémorisation

Les icônes de bonus sont **visibles** sur les cases :
- 💰 **Or** : coin inférieur droit
- 💎 **Gemme** : coin inférieur droit (plus grande)
- ⚡ **Essence** : coin inférieur gauche
- 🧪 **Potion** : coin inférieur droit (plus grande)

### Pendant le jeu

Les icônes **restent visibles** pour aider le joueur à :
1. Se rappeler où sont les bonus
2. Planifier son parcours
3. Maximiser ses gains

### Animation

Toutes les icônes ont une **animation flottante** :
- Mouvement vertical doux
- Légère variation d'échelle
- Délais différents pour chaque type
- Effet visuel agréable

---

## 🎯 Comportement par type de bonus

### 💰 Or (Gold)

**Sur le chemin :**
```javascript
{ type: 'path', gold: 5 }
```
- Icône 💰 affichée
- Valeur entre 3-6 (selon gridContent.json)
- Collecté automatiquement en cliquant sur le chemin

**Adjacent au chemin :**
```javascript
{ type: 'gold', value: 7 }
```
- Icône 💰 affichée
- Valeur entre 3-7 (selon gridContent.json)
- Maximum 2 par étage

### 💎 Gemme (Gem)

```javascript
{ type: 'gem' }
```
- Icône 💎 affichée (plus grande)
- Adjacent au chemin uniquement
- Maximum 1 par run (session complète)
- Très rare (2-6% selon étage)

### ⚡ Essence

**Sur le chemin :**
```javascript
{ type: 'path', essence: 1 }
```
- Icône ⚡ affichée (coin gauche)
- Valeur : 1
- Collecté automatiquement

**Adjacent au chemin :**
```javascript
{ type: 'essence' }
```
- Icône ⚡ affichée (coin gauche)
- Maximum 1 par étage

### 🧪 Potion

```javascript
{ type: 'potion' }
```
- Icône 🧪 affichée (plus grande)
- Adjacent au chemin uniquement
- Jamais sur la ligne 0
- Maximum 1 par run
- Restaure 1 vie

---

## 🔍 Positionnement des icônes

```
┌─────────────────────┐
│                     │
│                     │
│         CASE        │
│                     │
│  ⚡              💰 │  ← Icônes en bas
└─────────────────────┘
```

- **Or/Gemme/Potion** : Coin inférieur droit
- **Essence** : Coin inférieur gauche
- **Z-index 7** : Au-dessus des marqueurs (z-index 5)
- **Pointer-events: none** : Ne bloque pas les clics

---

## 🎨 Détails visuels

### Ombre portée

```css
filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
```
- Rend les icônes lisibles sur tous les fonds
- Effet de profondeur

### Tailles

- **Or** : 16px (standard)
- **Gemme** : 18px (plus visible car rare)
- **Essence** : 16px (standard)
- **Potion** : 18px (plus visible car importante)

### Animation

- **Durée** : 2 secondes
- **Mouvement** : -3px vers le haut
- **Scale** : 1.0 → 1.1
- **Opacité** : 0.9 → 1.0
- **Délais** : Échelonnés pour effet cascade

---

## 🧪 Test

### Lancer le jeu

```bash
npm run dev
```

### Démarrer mode Solo

1. Cliquer sur "Solo"
2. Observer la grille pendant la mémorisation
3. Repérer les icônes de bonus :
   - 💰 Or (fréquent)
   - 💎 Gemme (rare)
   - ⚡ Essence (occasionnel)
   - 🧪 Potion (rare)

### Vérifications

- [ ] Les icônes sont visibles
- [ ] L'animation est fluide
- [ ] Les tooltips s'affichent au survol
- [ ] Les icônes ne bloquent pas les clics
- [ ] Les positions sont correctes
- [ ] Les tailles sont appropriées

---

## 🚀 Prochaines étapes (optionnel)

### 1. Collecte des bonus

Ajouter la logique de collecte dans `App.vue` :

```javascript
function onCellClick(r, c) {
  // ... code existant
  
  // Collecter les bonus
  if (state.gridContent && state.gridContent[r] && state.gridContent[r][c]) {
    const cell = state.gridContent[r][c];
    
    if (cell.type === 'gold' && cell.value) {
      // Ajouter l'or au score
      playerGold.value += cell.value;
    }
    
    if (cell.type === 'gem') {
      // Ajouter la gemme à l'inventaire
      playerGems.value += 1;
    }
    
    if (cell.type === 'essence') {
      // Ajouter l'essence
      playerEssence.value += 1;
    }
    
    if (cell.type === 'potion') {
      // Restaurer 1 vie
      soloLivesUsed.value = Math.max(0, soloLivesUsed.value - 1);
    }
  }
}
```

### 2. Animations de collecte

Ajouter des animations quand un bonus est collecté :
- Effet de particules
- Son de collecte
- Popup "+5 💰"
- Disparition de l'icône

### 3. Inventaire

Afficher l'inventaire du joueur :
- Or total
- Gemmes collectées
- Essence accumulée
- Potions disponibles

### 4. Système de boutique

Utiliser l'or et les gemmes pour :
- Acheter des power-ups
- Débloquer des avatars
- Améliorer les capacités

---

## ✅ Résumé

Les bonus sont maintenant **visuellement affichés** sur la grille avec :

✅ Icônes animées (💰💎⚡🧪)  
✅ Positionnement intelligent  
✅ Tooltips informatifs  
✅ Styles cohérents  
✅ Performance optimale  
✅ Compatible avec le code existant  

**Le système d'affichage est opérationnel !** 🎉

Pour activer la collecte des bonus, suivre les étapes de la section "Prochaines étapes".
