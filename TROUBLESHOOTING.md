# 🔧 Dépannage - Icônes de bonus

## 🎯 Problème : Les icônes ne s'affichent pas

### Étape 1 : Vérifier que le serveur est lancé

```bash
npm run dev
```

Ouvrir http://localhost:5173 (ou le port indiqué)

### Étape 2 : Ouvrir la console du navigateur

1. Appuyer sur **F12** (ou Cmd+Option+I sur Mac)
2. Aller dans l'onglet **Console**

### Étape 3 : Démarrer le mode Solo

1. Cliquer sur **"Solo"**
2. Observer la console

### Étape 4 : Vérifier les logs

Vous devriez voir :

```
[applyEnrichedGrid] Étage: 1
[applyEnrichedGrid] Grille générée: Array(10) [ ... ]
[applyEnrichedGrid] Bonus trouvés: { gold: 2, gem: 0, essence: 1, potion: 0 }
```

**Si vous ne voyez PAS ces logs :**
- Le nouveau système n'est pas utilisé
- Vérifier que vous êtes bien en mode Solo

**Si vous voyez "Bonus trouvés: { gold: 0, gem: 0, essence: 0, potion: 0 }" :**
- La génération fonctionne mais aucun bonus n'a été tiré (probabilités)
- Relancer plusieurs fois pour avoir des bonus

### Étape 5 : Vérifier gridContent

Dans la console, taper :

```javascript
// Pendant le jeu
document.querySelector('#app').__vueParentComponent.ctx.state.gridContent
```

**Si undefined ou null :**
- `state.gridContent` n'est pas défini
- Problème dans `applyEnrichedGrid()`

**Si vous voyez un Array :**
- ✅ La grille est bien stockée !

### Étape 6 : Vérifier que les icônes sont dans le DOM

1. Pendant le jeu (après la mémorisation)
2. Clic droit sur une case → **Inspecter**
3. Chercher dans le HTML :

```html
<div class="bonus-icon gold-icon" title="+5 or">
  💰
</div>
```

**Si vous trouvez cet élément :**
- ✅ Les icônes sont générées !
- Le problème vient du CSS (z-index, position, etc.)

**Si vous ne trouvez PAS cet élément :**
- Les fonctions helper ne retournent pas true
- Vérifier les logs `[hasGoldBonus]`

## 🐛 Problèmes courants

### Problème 1 : "gridContent non disponible"

**Log dans la console :**
```
[getCellContent] gridContent non disponible: null
```

**Solution :**
Le prop n'est pas passé correctement. Vérifier dans `App.vue` ligne 119 :

```vue
<BoardView
  :gridContent="state.gridContent"
  ...
/>
```

### Problème 2 : Aucun bonus généré

**Log dans la console :**
```
[applyEnrichedGrid] Bonus trouvés: { gold: 0, gem: 0, essence: 0, potion: 0 }
```

**Raison :**
- Étage 1 a de faibles probabilités
- Pas de chance au tirage aléatoire

**Solution :**
- Relancer plusieurs parties
- Ou augmenter les probabilités dans `gridContent.json`

### Problème 3 : Icônes masquées

**Les icônes sont dans le DOM mais invisibles**

**Solution :**
Vérifier le CSS dans DevTools :

```css
.bonus-icon {
  z-index: 7 !important;
  opacity: 1 !important;
  display: block !important;
}
```

### Problème 4 : Icônes visibles seulement pendant la mémorisation

**Les icônes disparaissent après le flip**

**Raison :**
Les icônes sont sur la face "front" qui est cachée après le flip.

**Solution :**
C'est normal ! Les icônes doivent être visibles pendant la mémorisation pour que le joueur les repère.

Si vous voulez les garder visibles pendant le jeu, il faudrait :
1. Les afficher aussi sur la face "back"
2. Ou les mettre en dehors du système de flip

## ✅ Test de validation

### Test 1 : Génération

```bash
open test_grid_generation.html
```

Vous devriez voir les icônes dans les grilles affichées.

**Si ça fonctionne ici mais pas dans le jeu :**
- Le problème vient de l'intégration dans App.vue

### Test 2 : Console

Dans la console du navigateur pendant le jeu :

```javascript
// Vérifier state
const app = document.querySelector('#app').__vueParentComponent.ctx;
console.log('State:', app.state);
console.log('GridContent:', app.state.gridContent);

// Vérifier une case spécifique
if (app.state.gridContent) {
  console.log('Case [0][0]:', app.state.gridContent[0][0]);
  console.log('Case [1][1]:', app.state.gridContent[1][1]);
}
```

### Test 3 : Forcer l'affichage

Modifier temporairement `BoardView.vue` :

```vue
<!-- Remplacer les conditions par un affichage forcé -->
<div class="bonus-icon gold-icon" title="Test">
  💰 TEST
</div>
```

Si l'icône apparaît, le problème vient des fonctions helper.

## 📞 Besoin d'aide ?

Si le problème persiste, fournir :

1. **Les logs de la console** (copier-coller)
2. **Le résultat de** `state.gridContent` dans la console
3. **Une capture d'écran** de l'inspecteur d'éléments
4. **La version du navigateur** utilisé

## 🎯 Solution rapide

Si vous voulez juste voir les icônes fonctionner :

1. Augmenter les probabilités dans `gridContent.json` :

```json
{
  "bonuses": {
    "gold": {
      "baseChancePerFloor": 0.80,  // 80% au lieu de 20%
      "maxPerFloor": 5              // 5 au lieu de 2
    }
  }
}
```

2. Relancer le jeu
3. Vous devriez voir beaucoup d'icônes 💰

Une fois que ça fonctionne, remettre les valeurs normales !
