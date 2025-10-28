# 🧪 Instructions de test - Génération de grilles MémoStep

## 🎯 Objectif

Vérifier que le système de génération basé sur `gridContent.json` fonctionne correctement et respecte toutes les règles définies.

---

## 📋 Tests disponibles

### 1. **Test visuel HTML** (Recommandé)

Le plus simple et visuel pour vérifier rapidement.

```bash
# Ouvrir le fichier de test dans le navigateur
open test_grid_generation.html
```

**Ce que vous verrez :**
- 3 grilles générées (étages 1, 10, 25)
- Visualisation colorée des cases
- Statistiques détaillées
- Bouton pour régénérer

**Vérifications :**
- ✅ Chaque ligne a exactement 1 case PATH (bleue)
- ✅ Maximum 1 piège par ligne
- ✅ Les pièges sont adjacents au chemin
- ✅ Les probabilités augmentent avec l'étage
- ✅ Or max 2 par étage
- ✅ Gemme/Potion max 1 par run

---

### 2. **Test dans le jeu**

Tester directement en jouant.

```bash
# Lancer le serveur de développement
npm run dev
```

**Étapes :**
1. Cliquer sur "Solo"
2. Observer les marqueurs sur les cases :
   - ⚪ Cercle = case neutre
   - ❌ Croix = piège recul (-2)
   - 🔺 Triangle = piège stun
3. Jouer plusieurs niveaux
4. Vérifier que la difficulté augmente

**Console du navigateur :**
```javascript
// Afficher les pièges actuels
console.log('Rollback:', Array.from(state.rollback))
console.log('Stun:', Array.from(state.stun))
console.log('Life Loss:', Array.from(state.lifeLoss))
```

---

### 3. **Test console Node.js**

Pour les développeurs qui préfèrent la console.

```bash
node test_console.js
```

**Sortie attendue :**
```
🎮 TEST DE GÉNÉRATION DE GRILLES MEMOSTEP 🎮
============================================================

📍 GÉNÉRATION ÉTAGE 1

=== GRILLE ÉTAGE 1 ===
Ligne 0: PATH | ..... | ..... | .....
Ligne 1: ..... | PATH | ..... | 💔TRP
...

--- Statistiques ---
Cases chemin: 10
Pièges vie: 1
...
```

---

## 🔍 Points de vérification détaillés

### ✅ Structure du chemin

- [ ] 10 lignes (0 à 9)
- [ ] 4 colonnes (0 à 3)
- [ ] 1 case de chemin par ligne
- [ ] Chemin jouable (colonne ±1 entre lignes)

### ✅ Pièges

**Placement :**
- [ ] Uniquement adjacents au chemin (pas en diagonal)
- [ ] Maximum 1 piège par ligne
- [ ] Jamais sur le chemin lui-même

**Types et apparition :**
- [ ] `trap_life` (💔) : dès étage 1
- [ ] `trap_back2` (⬅️) : dès étage 2
- [ ] `trap_stun` (⚡) : dès étage 3

**Probabilités :**
- [ ] Augmentent avec l'étage
- [ ] Plafonnent à maxChance

### ✅ Bonus

**Or (💰) :**
- [ ] Maximum 2 par étage (hors chemin)
- [ ] Peut apparaître sur le chemin
- [ ] Valeur entre 3 et 7

**Gemme (💎) :**
- [ ] Maximum 1 par run (session complète)
- [ ] Adjacent au chemin
- [ ] Rare

**Essence (⚡) :**
- [ ] Maximum 1 par étage
- [ ] Peut être sur le chemin ou adjacent
- [ ] Valeur : 1

**Potion (🧪) :**
- [ ] Maximum 1 par run
- [ ] Jamais sur la ligne 0
- [ ] Adjacent au chemin

### ✅ Cases neutres

- [ ] Remplissent toutes les cases vides
- [ ] Pas de piège, pas de bonus
- [ ] Rebond au dernier checkpoint si cliquées

---

## 📊 Exemples de résultats attendus

### Étage 1 (faible difficulté)

```
Pièges vie: 0-1
Pièges recul: 0
Pièges stun: 0
Or: 0-2
Gemmes: 0-1
Essence: 0-1
Potions: 0-1
```

### Étage 10 (difficulté moyenne)

```
Pièges vie: 1-2
Pièges recul: 1-2
Pièges stun: 1-2
Or: 1-2
Gemmes: 0 (si déjà pris)
Essence: 0-1
Potions: 0 (si déjà pris)
```

### Étage 25 (haute difficulté)

```
Pièges vie: 2-3
Pièges recul: 2-3
Pièges stun: 2-3
Or: 2
Gemmes: 0 (limite atteinte)
Essence: 1
Potions: 0 (limite atteinte)
```

---

## 🐛 Problèmes courants

### Le serveur ne démarre pas

```bash
# Installer les dépendances
npm install

# Relancer
npm run dev
```

### Le test HTML ne s'affiche pas

```bash
# Vérifier que vous êtes dans le bon dossier
cd /Users/Git/memostep

# Ouvrir avec le navigateur par défaut
open test_grid_generation.html
```

### Erreur "Cannot find module"

Le test Node.js nécessite que le projet soit configuré avec les modules ES6.

Solution : Utiliser le test HTML à la place.

---

## 📝 Rapport de test

Après avoir effectué les tests, vérifier :

1. **Génération correcte** ✅
   - Les grilles sont générées sans erreur
   - Le chemin est toujours jouable

2. **Règles respectées** ✅
   - Limites maxPerLine, maxPerFloor, maxPerRun
   - Placement adjacent_to_path
   - noTrapBeforeFloor

3. **Probabilités dynamiques** ✅
   - Augmentent avec l'étage
   - Plafonnent à maxChance

4. **Équilibrage** ✅
   - Étage 1 : facile
   - Étage 10 : moyen
   - Étage 25 : difficile

---

## 🎉 Validation finale

Si tous les points sont vérifiés, le système fonctionne correctement !

Le jeu lit maintenant `gridContent.json` et applique automatiquement :
- ✅ Probabilités dynamiques
- ✅ Limites configurables
- ✅ Placement intelligent
- ✅ Progression équilibrée

**Le système est prêt à être utilisé en production !** 🚀
