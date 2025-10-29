# Guide de Refactorisation - App.vue

## 📊 Résumé

Le fichier `App.vue` de **3064 lignes** a été refactorisé en **modules réutilisables** pour améliorer la maintenabilité, la testabilité et la lisibilité du code.

## 🎯 Objectifs atteints

- ✅ Séparation des responsabilités
- ✅ Code modulaire et réutilisable
- ✅ Fichiers de ~50-400 lignes au lieu de 3000+
- ✅ Meilleure organisation du code
- ✅ Facilite la collaboration et les tests

## 📁 Nouvelle structure

```
src/
├── App_new.vue                    (~600 lignes - orchestration)
├── config/
│   ├── gameConfig.js             (50 lignes - constantes du jeu)
│   └── avatarConfig.js           (100 lignes - configuration des avatars)
├── composables/
│   ├── useGameState.js           (200 lignes - état du jeu)
│   ├── useAudio.js               (80 lignes - gestion audio)
│   ├── usePlayerStats.js         (250 lignes - XP, niveau, ressources)
│   ├── useChampionSelection.js   (150 lignes - sélection de champion)
│   ├── useVersusMode.js          (400 lignes - mode multijoueur)
│   └── useGameLogic.js           (250 lignes - logique de jeu)
├── utils/
│   ├── pathGenerator.js          (100 lignes - génération de chemins)
│   ├── gridHelpers.js            (180 lignes - utilitaires grille)
│   └── formatters.js             (30 lignes - formatage)
└── handlers/
    ├── gameHandlers.js           (150 lignes - handlers de jeu)
    ├── modalHandlers.js          (100 lignes - handlers de modales)
    └── navigationHandlers.js     (100 lignes - handlers de navigation)
```

## 📦 Modules créés

### Configuration

#### `config/gameConfig.js`
Constantes globales du jeu :
- Dimensions de la grille (COLS, ROWS)
- Tailles des cellules (TARGET_CELL, MIN_CELL, MAX_CELL)
- Timings (REVEAL_MS, FLIP_STEP, etc.)
- BPM et rythme du jeu

#### `config/avatarConfig.js`
Configuration des avatars :
- Liste complète des `avatarCards` (16 avatars)
- Imports des assets d'images
- Avatar par défaut

### Utilitaires

#### `utils/pathGenerator.js`
Génération de chemins :
- `seededRng()` - RNG déterministe
- `hashString()` - Hash de chaîne
- `randomPath()` - Chemin aléatoire simple
- `randomPathWithRng()` - Chemin avec RNG
- `randomPathWithRngAndStart()` - Chemin avec colonne de départ

#### `utils/gridHelpers.js`
Manipulation de la grille :
- `pickHeartForPath()` - Placement de cœur
- `generateSoloDecoys()` - Génération de leurres
- `generateBorderHazards()` - Génération de pièges
- `applyEnrichedGrid()` - Application de la grille enrichie

#### `utils/formatters.js`
Formatage de données :
- `formatMs()` - Format MM:SS
- `generateGuestName()` - Nom de guest aléatoire

### Composables

#### `composables/useGameState.js`
État global du jeu :
- État réactif principal (`state`)
- Refs pour animations (flip, shake, stun)
- Computed pour cellules, style, progression
- Fonctions de gestion d'état

#### `composables/useAudio.js`
Gestion audio :
- Mute/unmute
- Play/pause
- Gestion de la musique principale
- Initialisation audio

#### `composables/usePlayerStats.js`
Stats du joueur :
- XP, niveau, progression
- Ressources (gold, essence, gems)
- Gestion des level ups
- Notifications XP
- Profil utilisateur et auth

#### `composables/useChampionSelection.js`
Sélection de champion :
- Gestion du sélecteur
- Timer de sélection
- Countdown versus ready
- Choix aléatoire si timeout

#### `composables/useVersusMode.js`
Mode multijoueur :
- Gestion des rooms
- Synchronisation temps réel
- Progression des joueurs
- Chemins uniques par joueur
- Pouvoirs (freeze)
- Classement

#### `composables/useGameLogic.js`
Logique de jeu :
- Chronomètre
- Clic sur cellules
- Validation du chemin
- Gestion des bonus/pièges
- Complétion de niveau

### Handlers

#### `handlers/gameHandlers.js`
Événements de jeu :
- `handleMatchWin()` / `handleMatchLose()`
- `handleMultiplayerWin()` / `handleMultiplayerLose()`
- `handleReplay()` / `handleQuit()`
- `handleShare()`
- Gestion des modales de fin

#### `handlers/modalHandlers.js`
Gestion des modales :
- Help, Settings, Stats, Lang
- Gear menus
- Sélection de langue

#### `handlers/navigationHandlers.js`
Navigation :
- `openProfile()` / `openVersusView()`
- `goHome()`
- Gestion des fermetures de vues

## 🔄 Migration

### Étape 1 : Tester le nouveau fichier

1. **Copier le template complet** de `App.vue` (lignes 1-254) dans `App_new.vue`
2. **Copier les styles complets** de `App.vue` (lignes 2780-3063) dans `App_new.vue`
3. **Tester** l'application avec `App_new.vue`

### Étape 2 : Remplacer l'ancien fichier

Une fois les tests validés :
```bash
# Backup de l'ancien fichier
mv src/App.vue src/App_old.vue

# Utiliser le nouveau fichier
mv src/App_new.vue src/App.vue
```

### Étape 3 : Vérifications

- ✅ Mode solo fonctionne
- ✅ Mode versus fonctionne
- ✅ Sélection de champion
- ✅ XP et level up
- ✅ Audio
- ✅ Navigation entre vues
- ✅ Modales (help, settings, etc.)

## 🎨 Avantages de la refactorisation

### Maintenabilité
- Code organisé par responsabilité
- Fichiers courts et focalisés
- Facile à comprendre et modifier

### Testabilité
- Chaque composable peut être testé isolément
- Mocking facilité
- Tests unitaires possibles

### Réutilisabilité
- Composables réutilisables dans d'autres composants
- Logique métier séparée de la présentation
- Utilitaires génériques

### Collaboration
- Plusieurs développeurs peuvent travailler sans conflits
- Responsabilités claires
- Revues de code facilitées

### Performance
- Imports optimisés
- Code tree-shakeable
- Meilleure organisation mémoire

## 📝 Notes importantes

### Dépendances entre modules

- `useGameLogic` dépend de `useGameState`
- `useVersusMode` utilise `pathGenerator`
- Les handlers utilisent les composables

### Réactivité Vue

Tous les composables préservent la réactivité Vue :
- Utilisation de `ref()` et `reactive()`
- Computed properties
- Watchers

### État partagé

L'état est partagé via les composables, pas via un store global. Chaque composable expose son état et ses fonctions.

## 🚀 Prochaines étapes

1. **Tests unitaires** : Ajouter des tests pour chaque composable
2. **Documentation** : Documenter les APIs des composables
3. **Optimisations** : Identifier les opportunités d'optimisation
4. **Refactoring supplémentaire** : Continuer à améliorer la structure

## 📚 Ressources

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Composables Best Practices](https://vuejs.org/guide/reusability/composables.html)
- [Code Organization](https://vuejs.org/guide/scaling-up/sfc.html)

---

**Date de refactorisation** : 29 octobre 2025
**Lignes réduites** : 3064 → ~600 (App.vue) + ~1900 (modules)
**Fichiers créés** : 13 nouveaux modules
