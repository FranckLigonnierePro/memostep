# 🎁 Système de collecte des bonus

## ✅ Implémentation terminée

Les bonus (💰💎⚡🧪) sont maintenant **collectables** ! Le joueur peut cliquer dessus après avoir validé une case de chemin adjacente.

---

## 🎮 Comment ça fonctionne

### 1. Affichage des bonus

Les icônes sont **toujours visibles** sur les cases qui contiennent des bonus :
- 💰 **Or** : Sur le chemin ou adjacent
- 💎 **Gemme** : Adjacent au chemin
- ⚡ **Essence** : Sur le chemin ou adjacent
- 🧪 **Potion** : Adjacent au chemin

### 2. Collecte des bonus

Pour collecter un bonus :

1. **Cliquer sur une case du chemin** (case bleue)
2. **Cliquer sur une case bonus adjacente** à cette case validée
3. Le bonus est collecté et l'icône disparaît

**Exemple :**
```
Ligne 0: PATH | .... | .... | ....
Ligne 1: .... | PATH | 5💰  | ....
         ↑ Clic 1    ↑ Clic 2 (collecte l'or)
```

### 3. Règles de collecte

✅ **Peut collecter si** :
- Au moins une case de chemin adjacente est validée
- Le bonus n'a pas déjà été collecté

❌ **Ne peut PAS collecter si** :
- Aucune case de chemin adjacente n'est validée
- Le bonus a déjà été collecté

---

## 🔧 Implémentation technique

### State ajouté dans App.vue

```javascript
const state = reactive({
  // ...
  collectedBonuses: new Set(), // 'r-c' des bonus collectés
});
```

### Logique dans onCellClick()

```javascript
function onCellClick(r, c) {
  // Vérifier si c'est une case bonus
  if (state.gridContent && state.gridContent[r] && state.gridContent[r][c]) {
    const cell = state.gridContent[r][c];
    const isBonusCell = (cell.type === 'gold' || cell.type === 'gem' || 
                         cell.type === 'essence' || cell.type === 'potion');
    
    if (isBonusCell && !state.collectedBonuses.has(keyAlready)) {
      // Vérifier si une case de chemin adjacente est validée
      const adjacentPathCells = [
        `${r-1}-${c}`, `${r+1}-${c}`, 
        `${r}-${c-1}`, `${r}-${c+1}`
      ];
      const hasAdjacentValidated = adjacentPathCells.some(
        key => state.correctSet.has(key)
      );
      
      if (hasAdjacentValidated) {
        // Collecter le bonus !
        state.collectedBonuses.add(keyAlready);
        console.log(`[Bonus collecté] ${cell.type} à (${r},${c})`);
        return; // Ne pas traiter comme case incorrecte
      }
    }
  }
  
  // ... reste du code (chemin, pièges, etc.)
}
```

### Affichage dans BoardView.vue

```javascript
// Vérifier si le bonus est collecté
function isBonusCollected(r, c) {
  const key = `${r}-${c}`;
  return props.collectedBonuses && props.collectedBonuses.includes(key);
}

// Ne pas afficher si collecté
function hasGoldBonus(r, c) {
  if (isBonusCollected(r, c)) return false;
  // ... reste du code
}
```

---

## 🎯 Exemple de jeu

### Étape 1 : Mémorisation

```
Ligne 0: PATH | .... | .... | ....
Ligne 1: .... | PATH💰| .... | ....
Ligne 2: .... | PATH | ⚡ESS | ....
Ligne 3: 🧪POT| PATH | .... | ....
```

Le joueur voit :
- Le chemin (bleu)
- Les bonus (💰⚡🧪)
- Les marqueurs de pièges (⚪❌🔺)

### Étape 2 : Jeu

Le joueur clique sur les cases du chemin :
1. Clic sur PATH ligne 0 ✅
2. Clic sur PATH ligne 1 ✅
3. **Clic sur 💰 (ligne 1, col 2)** → Collecte l'or ! 💰 disparaît
4. Clic sur PATH ligne 2 ✅
5. **Clic sur ⚡ (ligne 2, col 2)** → Collecte l'essence ! ⚡ disparaît
6. Clic sur PATH ligne 3 ✅
7. **Clic sur 🧪 (ligne 3, col 0)** → Collecte la potion ! 🧪 disparaît

---

## 📊 Logs de debug

Dans la console, vous verrez :

```
[applyEnrichedGrid] Étage: 1
[applyEnrichedGrid] Bonus trouvés: {gold: 2, gem: 0, essence: 1, potion: 1}
...
[Bonus collecté] gold à (1,2)
[Bonus collecté] essence à (2,2)
[Bonus collecté] potion à (3,0)
```

---

## 🚀 Prochaines étapes

### 1. Ajouter les effets des bonus

Actuellement, les bonus sont collectés mais n'ont pas d'effet. À ajouter :

```javascript
// Dans onCellClick(), après state.collectedBonuses.add(keyAlready)

if (cell.type === 'gold') {
  // Ajouter l'or au score
  playerGold.value += cell.value;
  console.log(`+${cell.value} 💰 Or collecté !`);
}

if (cell.type === 'gem') {
  // Ajouter la gemme
  playerGems.value += 1;
  console.log(`+1 💎 Gemme collectée !`);
}

if (cell.type === 'essence') {
  // Ajouter l'essence
  playerEssence.value += 1;
  console.log(`+1 ⚡ Essence collectée !`);
}

if (cell.type === 'potion') {
  // Restaurer 1 vie
  soloLivesUsed.value = Math.max(0, soloLivesUsed.value - 1);
  console.log(`+1 ❤️ Vie restaurée !`);
}
```

### 2. Animations de collecte

- Effet de particules
- Son de collecte
- Popup "+5 💰"
- Animation de disparition

### 3. Affichage de l'inventaire

Créer un panneau pour afficher :
- 💰 Or total : X
- 💎 Gemmes : X
- ⚡ Essence : X

### 4. Système de boutique

Utiliser les ressources pour :
- Acheter des power-ups
- Débloquer des avatars
- Améliorer les capacités

---

## ✅ Test

### Tester maintenant

```bash
npm run dev
```

1. Cliquer sur **"Solo"**
2. Mémoriser le chemin et les bonus
3. Cliquer sur une case du chemin
4. **Cliquer sur un bonus adjacent** → Il devrait disparaître !
5. Vérifier la console : `[Bonus collecté] ...`

### Vérifier dans la console

```javascript
// Voir les bonus collectés
document.querySelector('#app').__vueParentComponent.ctx.state.collectedBonuses
```

---

## 🎉 Résumé

✅ **Bonus affichés** : Icônes visibles sur les cases  
✅ **Collecte fonctionnelle** : Clic après validation du chemin adjacent  
✅ **Disparition visuelle** : Les bonus collectés disparaissent  
✅ **Logs de debug** : Confirmation dans la console  
✅ **Réinitialisation** : Nouveau jeu = nouveaux bonus  

**Le système de collecte est opérationnel !** 🎁✨

Il ne reste plus qu'à ajouter les effets (or, gemmes, essence, potions) pour compléter le système !
