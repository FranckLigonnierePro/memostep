# 🚀 Quick Start - Système de grilles dynamiques

## ⚡ Démarrage rapide

Votre jeu MémoStep a été enrichi avec un système de génération de grilles dynamiques et l'affichage visuel des bonus !

---

## 🎮 Tester maintenant

### Option 1 : Test visuel (5 secondes)

```bash
open test_grid_generation.html
```

Vous verrez immédiatement 3 grilles avec statistiques.

### Option 2 : Jouer (30 secondes)

```bash
npm run dev
```

1. Cliquer sur **"Solo"**
2. Observer les icônes : 💰💎⚡🧪
3. Mémoriser le chemin
4. Jouer !

---

## 📋 Ce qui a changé

### ✅ Avant

```javascript
// Génération fixe
generateBorderHazards(); // 40% rollback, 40% stun, 20% life
```

### ✅ Maintenant

```javascript
// Génération dynamique basée sur gridContent.json
applyEnrichedGrid(floorNumber, runCounters);
// → Probabilités évolutives selon l'étage
// → Limites configurables
// → Bonus visibles : 💰💎⚡🧪
```

---

## 🎯 Résultat

### Étage 1 (Facile)

```
PATH | .... | .... | ....
.... | PATH💰| .... | ....
.... | PATH | .... | ....

Pièges: 1-2 (5-6%)
Or: 0-2
```

### Étage 10 (Moyen)

```
PATH | .... | 💔TRP| ....
.... | PATH💰| .... | ....
⬅️TRP| .... | PATH | ....
.... | .... | PATH | ⚡TRP
.... | PATH | .... | 6💰
PATH | 💎GEM| .... | ....

Pièges: 3-5 (10-11%)
Or: 1-2
Gemme: 0-1
```

### Étage 25 (Difficile)

```
PATH⚡| .... | 💔TRP| ....
.... | PATH💰| .... | ⚡TRP
⬅️TRP| .... | PATH | ....
.... | PATH | 💔TRP| 7💰

Pièges: 6-8 (10-12% max)
Or: 2 (max)
```

---

## 🔧 Configuration

### Modifier les règles

Éditer `src/lib/gridContent.json` :

```json
{
  "traps": {
    "life_loss": {
      "baseChancePerLine": 0.10,  // ← Changer ici
      "perFloorBonus": 0.01,      // ← Et ici
      "maxChance": 0.20           // ← Et ici
    }
  }
}
```

**Sauvegardez → Rechargez → C'est appliqué !**

---

## 📊 Icônes affichées

| Icône | Nom | Où | Fréquence |
|-------|-----|-----|-----------|
| 💰 | Or | Chemin ou adjacent | Fréquent |
| 💎 | Gemme | Adjacent | Rare |
| ⚡ | Essence | Chemin ou adjacent | Occasionnel |
| 🧪 | Potion | Adjacent | Rare |

---

## 📚 Documentation

| Fichier | Pour quoi |
|---------|-----------|
| `RESUME_FINAL.md` | Vue d'ensemble complète |
| `TEST_INSTRUCTIONS.md` | Comment tester |
| `AFFICHAGE_BONUS.md` | Détails affichage |
| `INTEGRATION_GRIDCONTENT.md` | Technique |

---

## ✅ Vérification rapide

```bash
# 1. Test visuel
open test_grid_generation.html

# 2. Vérifier que vous voyez :
# - 3 grilles (étages 1, 10, 25)
# - Statistiques détaillées
# - Icônes colorées

# 3. Lancer le jeu
npm run dev

# 4. Mode Solo → Observer les icônes 💰💎⚡🧪
```

---

## 🎉 C'est tout !

Le système est **opérationnel** et **prêt à l'emploi** !

**Bon jeu !** 🎮✨
