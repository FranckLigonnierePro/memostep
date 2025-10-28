# 🎮 Effets des cases - MémoStep

## 📋 Résumé des effets par type de case

| Type | Icône | Effet | Perd vie ? |
|------|-------|-------|------------|
| **CHEMIN** | ✓ | Valide la progression | ❌ Non |
| **NEUTRE** | ○ | Aucun effet (reste en place) | ❌ Non |
| **TRAP_BACK2** | ⬅ | Recul de 2 cases | ❌ Non |
| **TRAP_STUN** | ⚡ | Bloqué 1 seconde | ❌ Non |
| **TRAP_LIFE** | 💔 | Perd 1 cœur | ✅ Oui |

---

## ✅ CHEMIN (PATH)

### Visuel
- **Couleur** : Bleu (#1e90ff)
- **Icône** : ✓
- **Label** : "CHEMIN"

### Effet
```javascript
// Clic sur case de chemin correcte
state.correctSet.add(key);
state.nextIndex++;
// Continue vers la case suivante
```

### Perd une vie ?
**❌ Non** - C'est la bonne case !

---

## ○ NEUTRE

### Visuel
- **Couleur** : Gris (#5a5f6d)
- **Icône** : ○
- **Label** : "NEUTRE"

### Effet
```javascript
// Clic sur case neutre
state.wrongSet.add(key);
state.statusText = 'Miss';

// Aucun effet (reste en place, pas de perte de vie)
// nextIndex reste inchangé
// correctSet reste inchangé
```

### Perd une vie ?
**❌ Non** - Aucun effet

### Règle
> Une case neutre est une **case sans effet**. Le joueur reste à sa position actuelle sans perdre de cœur. C'est simplement marqué comme erreur mais **sans conséquence**.

---

## ⬅ PIÈGE RECUL (TRAP_BACK2)

### Visuel
- **Couleur** : Orange (#f39c12)
- **Icône** : ⬅
- **Label** : "RECUL -2"

### Effet
```javascript
// Clic sur piège recul
state.wrongSet.add(key);
state.statusText = 'Miss';

// Recule de 2 cases (pas de perte de vie)
const prevIndex = state.nextIndex;
const newIndex = Math.max(0, prevIndex - 2);
state.nextIndex = newIndex;

// Efface les 2 dernières validations
for (let i = prevIndex - 1; i >= newIndex; i--) {
  state.correctSet.delete(pathKey[i]);
}
```

### Perd une vie ?
**❌ Non** - Recule de 2 cases seulement

### Règle
> Le piège recul fait **reculer de 2 cases** sur le chemin sans perdre de cœur. C'est une **pénalité de temps**.

---

## ⚡ PIÈGE STUN

### Visuel
- **Couleur** : Jaune (#f1c40f)
- **Icône** : ⚡
- **Label** : "STUN"

### Effet
```javascript
// Clic sur piège stun
state.wrongSet.add(key);
state.statusText = 'Miss';

// Bloque les clics pendant 1 seconde (pas de perte de vie)
clickBlocked.value = true;
stunActive.value = true;

setTimeout(() => {
  clickBlocked.value = false;
  stunActive.value = false;
}, 1000);
```

### Perd une vie ?
**❌ Non** - Bloque juste pendant 1 seconde

### Règle
> Le piège stun **bloque le joueur pendant 1 seconde**. Aucun clic n'est accepté pendant ce temps. C'est une **pénalité de temps**.

---

## 💔 PIÈGE VIE (TRAP_LIFE)

### Visuel
- **Couleur** : Rouge (#e74c3c)
- **Icône** : 💔
- **Label** : "-1 VIE"

### Effet
```javascript
// Clic sur piège vie
state.wrongSet.add(key);
state.statusText = 'Miss';

// Animation de cœur qui s'éteint
justLost.value = true;
setTimeout(() => { justLost.value = false; }, 900);

// PERD 1 CŒUR
if (state.mode === 'solo') {
  soloLivesUsed.value = Math.min(3, soloLivesUsed.value + 1);
}

// Si 3 cœurs perdus → Game Over
if (soloLivesUsed.value >= 3) {
  state.inPlay = false;
  loseActive.value = true;
}
```

### Perd une vie ?
**✅ OUI** - Perd 1 cœur (3 max = Game Over)

### Règle
> Le piège vie fait **perdre 1 cœur**. Après **3 cœurs perdus**, c'est **Game Over**. C'est la **pénalité la plus sévère**.

---

## 🎁 BONUS (collectables)

Les bonus ne sont **pas des cases cliquables par erreur**. Ils sont collectés **après avoir validé une case de chemin adjacente**.

| Bonus | Effet | Perd vie ? |
|-------|-------|------------|
| 💰 Or | +X or | ❌ Non |
| 💎 Gemme | +1 gemme | ❌ Non |
| ⚡ Essence | +1 essence | ❌ Non |
| 🧪 Potion | +1 cœur | ❌ Non (restaure !) |

---

## 📊 Tableau récapitulatif

### Effets sur la progression

| Type | Effet sur nextIndex | Effet sur correctSet |
|------|---------------------|----------------------|
| **CHEMIN** | +1 | Ajoute la case |
| **NEUTRE** | Aucun (reste en place) | Aucun |
| **TRAP_BACK2** | -2 (min 0) | Efface 2 dernières |
| **TRAP_STUN** | Aucun | Aucun |
| **TRAP_LIFE** | Aucun | Aucun |

### Effets sur les vies

| Type | Perd vie ? | Animation |
|------|------------|-----------|
| **CHEMIN** | ❌ Non | Vert ✓ |
| **NEUTRE** | ❌ Non | Rouge ✗ |
| **TRAP_BACK2** | ❌ Non | Rouge ✗ |
| **TRAP_STUN** | ❌ Non | Loader ⚡ |
| **TRAP_LIFE** | ✅ Oui | Cœur 💔 |

---

## 🎮 Exemples de jeu

### Scénario 1 : Clic sur case neutre

```
Joueur : Ligne 5, a validé 5 cases
Clic sur : Case neutre (ligne 6, col 2)

Résultat :
- ✗ Marquée en rouge
- nextIndex : 5 (inchangé)
- Vies : 3/3 (pas de perte)
- Effet : Reste à la ligne 5, aucun effet
```

### Scénario 2 : Clic sur piège recul

```
Joueur : Ligne 5, a validé 5 cases
Clic sur : Piège recul (ligne 6, col 1)

Résultat :
- ✗ Marquée en rouge
- nextIndex : 5 → 3 (recul de 2)
- Vies : 3/3 (pas de perte)
- Effet : Reprend à la ligne 3
```

### Scénario 3 : Clic sur piège stun

```
Joueur : Ligne 5, a validé 5 cases
Clic sur : Piège stun (ligne 6, col 3)

Résultat :
- ✗ Marquée en rouge
- nextIndex : 5 (inchangé)
- Vies : 3/3 (pas de perte)
- Effet : Bloqué 1 seconde, puis continue
```

### Scénario 4 : Clic sur piège vie

```
Joueur : Ligne 5, a validé 5 cases
Clic sur : Piège vie (ligne 6, col 0)

Résultat :
- ✗ Marquée en rouge
- nextIndex : 5 (inchangé)
- Vies : 3/3 → 2/3 (perd 1 cœur)
- Effet : Animation cœur, continue à ligne 5
```

---

## 🔧 Code de vérification

```javascript
function onCellClick(r, c) {
  const key = `${r}-${c}`;
  const cell = state.gridContent?.[r]?.[c];
  
  // Vérifier le type de case
  if (cell) {
    console.log(`Case (${r},${c}):`, {
      type: cell.type,
      perdVie: cell.type === 'trap_life',
      effet: getEffectDescription(cell.type)
    });
  }
}

function getEffectDescription(type) {
  const effects = {
    'path': 'Valide la progression',
    'neutral': 'Aucun effet, reste en place (pas de perte de vie)',
    'trap_back2': 'Recul de 2 cases (pas de perte de vie)',
    'trap_stun': 'Bloqué 1 seconde (pas de perte de vie)',
    'trap_life': 'PERD 1 CŒUR ❤️'
  };
  return effects[type] || 'Inconnu';
}
```

---

## ✅ Règles importantes

### 1. Seul le piège vie fait perdre un cœur
- ✅ **TRAP_LIFE** → Perd 1 cœur
- ❌ **NEUTRAL** → Pas de perte
- ❌ **TRAP_BACK2** → Pas de perte
- ❌ **TRAP_STUN** → Pas de perte

### 2. Les pénalités de temps
- **TRAP_BACK2** : Recule de 2 cases
- **TRAP_STUN** : Bloqué 1 seconde
- **NEUTRAL** : Reset au début

### 3. Game Over
- **3 cœurs perdus** = Game Over
- Seul **TRAP_LIFE** fait perdre des cœurs
- Les autres pièges sont des **pénalités de temps**

---

## 🎯 Stratégie de jeu

### Priorités d'évitement

1. **💔 TRAP_LIFE** (rouge) - À ÉVITER ABSOLUMENT (perd 1 cœur)
2. **⬅ TRAP_BACK2** (orange) - Perte de temps importante (recul 2 cases)
3. **⚡ TRAP_STUN** (jaune) - Perte de temps modérée (bloqué 1s)
4. **○ NEUTRAL** (gris) - Aucun effet (peut cliquer sans risque)

### Conseils

- **Mémoriser** surtout les pièges vie (rouges)
- **Éviter** les pièges recul et stun si possible
- **Pas de risque** sur les cases neutres (aucun effet, pas de perte de vie)
- **Collecter** les bonus après validation du chemin

---

## 🎉 Résumé

**Seul le piège vie (💔 TRAP_LIFE) fait perdre un cœur !**

Tous les autres types de cases (neutre, recul, stun) sont des **pénalités de temps** sans perte de vie.

Le jeu est maintenant **plus équilibré** et **moins punitif** ! 🎮✨
