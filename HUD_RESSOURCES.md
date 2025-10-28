# 📊 HUD Ressources - Documentation

## ✅ Fonctionnalité ajoutée

Un **compteur de ressources** a été ajouté dans le HUD (side-actions) pour afficher l'or, l'essence et les gemmes collectées !

---

## 🎨 Affichage

### Position
- **Emplacement** : Side-actions (panneau de droite)
- **Mode** : Solo uniquement
- **Au-dessus de** : Score et chronomètre

### Design

```
┌─────────────────┐
│  💰  12         │  ← Or collecté
│  ⚡  3          │  ← Essence collectée
│  💎  1          │  ← Gemmes collectées
└─────────────────┘
```

### Couleurs
- **Fond** : Dégradé bleu foncé (#2a2e52 → #1f2238)
- **Bordure** : Bleu (#3a3f5d)
- **Texte** : Blanc (#fff)
- **Hover** : Fond plus clair

---

## 💰 Ressources affichées

### 1. Or (💰)
- **Icône** : 💰
- **Valeur** : Somme de tout l'or collecté
- **Collecte** : +3 à +7 par case bonus or
- **Tooltip** : "Or collecté"

### 2. Essence (⚡)
- **Icône** : ⚡
- **Valeur** : Nombre d'essences collectées
- **Collecte** : +1 par case bonus essence
- **Tooltip** : "Essence collectée"

### 3. Gemmes (💎)
- **Icône** : 💎
- **Valeur** : Nombre de gemmes collectées
- **Collecte** : +1 par case bonus gemme
- **Tooltip** : "Gemmes collectées"

---

## 🎮 Comportement

### Collecte automatique

Quand le joueur clique sur une case bonus violette :

```javascript
// Case bonus or
if (cell.type === 'gold') {
  playerGold.value += cell.value; // +3 à +7
  console.log(`+${cell.value} 💰 Or - Total: ${playerGold.value}`);
}

// Case bonus gemme
if (cell.type === 'gem') {
  playerGems.value += 1;
  console.log(`+1 💎 Gemme - Total: ${playerGems.value}`);
}

// Case bonus essence
if (cell.type === 'essence') {
  playerEssence.value += 1;
  console.log(`+1 ⚡ Essence - Total: ${playerEssence.value}`);
}

// Case bonus potion (restaure vie)
if (cell.type === 'potion') {
  soloLivesUsed.value = Math.max(0, soloLivesUsed.value - 1);
  console.log(`+1 🧪 Potion - Vies: ${3 - soloLivesUsed.value}/3`);
}
```

### Mise à jour en temps réel

Les compteurs se mettent à jour **instantanément** quand un bonus est collecté.

---

## 🔧 Implémentation technique

### App.vue

```javascript
// Variables réactives
const playerGold = ref(0);
const playerEssence = ref(0);
const playerGems = ref(0);

// Props passées à BoardView
:playerGold="playerGold"
:playerEssence="playerEssence"
:playerGems="playerGems"
```

### BoardView.vue

```vue
<!-- Template -->
<div v-if="mode === 'solo'" class="resources-card">
  <div class="resource-item" title="Or collecté">
    <span class="resource-icon">💰</span>
    <span class="resource-value">{{ playerGold }}</span>
  </div>
  <div class="resource-item" title="Essence collectée">
    <span class="resource-icon">⚡</span>
    <span class="resource-value">{{ playerEssence }}</span>
  </div>
  <div class="resource-item" title="Gemmes collectées">
    <span class="resource-icon">💎</span>
    <span class="resource-value">{{ playerGems }}</span>
  </div>
</div>

<!-- Props -->
<script setup>
const props = defineProps({
  playerGold: { type: Number, default: 0 },
  playerEssence: { type: Number, default: 0 },
  playerGems: { type: Number, default: 0 },
  // ...
});
</script>
```

### CSS

```css
.resources-card {
  background: linear-gradient(145deg, #2a2e52, #1f2238);
  border-radius: 14px;
  border: 1px solid #3a3f5d;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 
    0 2px 0 #1a1c30,
    0 4px 10px rgba(0, 0, 0, 0.3);
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.resource-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.resource-icon {
  font-size: 20px;
  line-height: 1;
}

.resource-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  min-width: 24px;
  text-align: right;
}
```

---

## 📊 Exemple de partie

### Début de partie

```
┌─────────────────┐
│  💰  0          │
│  ⚡  0          │
│  💎  0          │
└─────────────────┘
```

### Après collecte d'or (ligne 1)

```
Clic sur case OR💜 (ligne 1)
→ +5 💰 Or collecté

┌─────────────────┐
│  💰  5          │
│  ⚡  0          │
│  💎  0          │
└─────────────────┘
```

### Après collecte d'essence (ligne 3)

```
Clic sur case ESSENCE💜 (ligne 3)
→ +1 ⚡ Essence collectée

┌─────────────────┐
│  💰  5          │
│  ⚡  1          │
│  💎  0          │
└─────────────────┘
```

### Après collecte de gemme (ligne 5)

```
Clic sur case GEMME💜 (ligne 5)
→ +1 💎 Gemme collectée

┌─────────────────┐
│  💰  5          │
│  ⚡  1          │
│  💎  1          │
└─────────────────┘
```

---

## 🎯 Utilité future

Ces ressources pourront être utilisées pour :

### 💰 Or
- Acheter des power-ups
- Débloquer des avatars
- Améliorer des capacités

### ⚡ Essence
- Activer des pouvoirs spéciaux
- Augmenter le temps de mémorisation
- Révéler des indices

### 💎 Gemmes
- Monnaie premium
- Débloquer du contenu exclusif
- Acheter des cosmétiques

---

## 🎨 Aperçu visuel

```
┌──────────────────────────────────┐
│                                  │
│  ┌─────────────────┐             │
│  │  💰  12         │             │
│  │  ⚡  3          │             │
│  │  💎  1          │             │
│  └─────────────────┘             │
│                                  │
│  ┌─────────────────┐             │
│  │   Niveau 5      │             │
│  └─────────────────┘             │
│                                  │
│  ┌─────────────────┐             │
│  │   00:45         │             │
│  └─────────────────┘             │
│                                  │
│  ┌─────────────────┐             │
│  │      🏠         │             │
│  └─────────────────┘             │
│                                  │
│       ❤️ ❤️ ❤️                   │
│                                  │
└──────────────────────────────────┘
```

---

## ✅ Fonctionnalités

### Actuellement implémenté

✅ **Affichage** : Compteurs visibles dans le HUD  
✅ **Collecte** : Incrémentation automatique  
✅ **Or** : Somme des valeurs collectées  
✅ **Essence** : Compteur d'essences  
✅ **Gemmes** : Compteur de gemmes  
✅ **Potion** : Restaure 1 vie (pas affiché dans HUD)  
✅ **Logs** : Console logs pour debug  
✅ **Style** : Design cohérent avec le jeu  

### À venir

⏳ **Persistance** : Sauvegarder entre les sessions  
⏳ **Boutique** : Utiliser les ressources  
⏳ **Animations** : Effet de collecte visuel  
⏳ **Sons** : Feedback audio  
⏳ **Statistiques** : Total collecté par run  

---

## 🎉 Résumé

**Le HUD affiche maintenant les ressources collectées !**

✅ **💰 Or** : Somme de l'or collecté  
✅ **⚡ Essence** : Nombre d'essences  
✅ **💎 Gemmes** : Nombre de gemmes  
✅ **Mise à jour** : En temps réel  
✅ **Design** : Cohérent et élégant  

Le joueur peut maintenant **suivre sa progression** et voir ses **récompenses** ! 📊✨
