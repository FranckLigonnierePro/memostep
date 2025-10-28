# 🐛 Debug - Icônes de bonus non visibles

## Problème

Les icônes de bonus (💰💎⚡🧪) ne s'affichent pas sur les cases.

## Causes possibles

### 1. La grille n'est pas générée

**Vérification :**
```bash
npm run dev
# → Ouvrir la console (F12)
# → Démarrer mode Solo
# → Chercher dans la console :
[applyEnrichedGrid] Étage: 1
[applyEnrichedGrid] Grille générée: [...]
[applyEnrichedGrid] Bonus trouvés: { gold: X, gem: X, ... }
```

**Si vous ne voyez pas ces logs :**
- La fonction `applyEnrichedGrid()` n'est pas appelée
- Vérifier que le mode Solo utilise bien le nouveau système

### 2. gridContent n'est pas passé à BoardView

**Vérification :**
```javascript
// Dans la console du navigateur pendant le jeu
console.log('gridContent:', this.$parent.state.gridContent);
```

**Si null ou undefined :**
- Le prop n'est pas passé correctement
- Vérifier dans App.vue ligne 119

### 3. Les fonctions helper ne trouvent pas les bonus

**Vérification :**
```bash
# Dans la console, chercher :
[hasGoldBonus] Or trouvé sur chemin (X,Y): 5
[hasGoldBonus] Or trouvé adjacent (X,Y): 7
```

**Si vous ne voyez pas ces logs :**
- Les fonctions ne sont pas appelées
- Ou la grille ne contient pas de bonus

### 4. Les icônes sont masquées par le CSS

**Vérification :**
```css
/* Dans DevTools, inspecter une case et vérifier */
.bonus-icon {
  z-index: 7; /* Doit être supérieur aux autres éléments */
  position: absolute;
  display: block; /* Pas display: none */
}
```

## Solutions

### Solution 1 : Forcer la régénération

```javascript
// Dans App.vue, fonction startMode('solo')
// Ajouter un log avant l'appel
console.log('[startMode] Avant applyEnrichedGrid');
runCounters.value = applyEnrichedGrid(1, runCounters.value);
console.log('[startMode] Après applyEnrichedGrid, gridContent:', state.gridContent);
```

### Solution 2 : Vérifier que gridContent est réactif

Le problème peut venir du fait que `state.gridContent` n'est pas réactif.

**Test :**
```javascript
// Dans la console du navigateur
// Pendant le jeu, taper :
window.app = document.querySelector('#app').__vueParentComponent.ctx;
console.log('State:', window.app.state);
console.log('GridContent:', window.app.state.gridContent);
```

### Solution 3 : Afficher temporairement toutes les icônes

Pour tester, modifions temporairement BoardView pour afficher une icône sur chaque case :

```vue
<!-- Dans BoardView.vue, remplacer les conditions -->
<div class="bonus-icon gold-icon" title="Test">
  💰
</div>
```

Si l'icône apparaît, le problème vient des fonctions helper.
Si elle n'apparaît pas, le problème vient du CSS.

## Checklist de debug

- [ ] Ouvrir la console (F12)
- [ ] Démarrer mode Solo
- [ ] Vérifier les logs `[applyEnrichedGrid]`
- [ ] Vérifier les logs `[hasGoldBonus]`
- [ ] Inspecter une case avec DevTools
- [ ] Vérifier que `.bonus-icon` existe dans le DOM
- [ ] Vérifier le z-index et la position
- [ ] Vérifier que `gridContent` n'est pas null

## Test rapide

Ouvrir `test_grid_generation.html` dans le navigateur :
```bash
open test_grid_generation.html
```

Si les icônes s'affichent dans le test HTML mais pas dans le jeu, le problème vient de l'intégration dans App.vue.

## Commandes utiles

```bash
# Vérifier que le fichier existe
ls -la src/lib/gridGenerator.js

# Vérifier qu'il n'y a pas d'erreur de syntaxe
npm run dev
# → Regarder la console pour les erreurs

# Tester la génération isolée
node test_console.js
```

## Prochaine étape

Une fois le problème identifié, je pourrai vous aider à le corriger !
