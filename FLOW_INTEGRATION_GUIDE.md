# Guide d'Intégration - MemoStep Flow 6×6

## 📋 Vue d'ensemble

Ce guide explique comment intégrer le nouveau système Flow 6×6 dans l'application MemoStep existante.

## ✅ Modifications Effectuées

### Phase 1: Architecture & Configuration
- ✅ Grille modifiée: **4×10 → 6×6** (36 cases)
- ✅ Nouvelles variables d'état ajoutées dans `App.vue`:
  - `flowState`, `branch`, `currentPattern`, `patternIndex`
  - `errorsInPattern`, `combo`, `streak`, `perfectCount`
  - `tempoBPM`, `patternStartTime`, `showPerfectFX`, `showJackpotFX`
- ✅ Fichier de configuration: `src/lib/flowConfig.js`

### Phase 2: PatternEngine
- ✅ Moteur de génération de motifs: `src/lib/patternEngine.js`
- ✅ Génération de motifs 3-6 cases avec validation
- ✅ Support du seed pour le mode daily

### Phase 3: FlowController
- ✅ Machine à états: `src/lib/flowController.js`
- ✅ États: OBSERVE → INPUT → REWARD → TRANSITION
- ✅ Branches: FLOW_CHAIN, QUICK_PREVIEW, FULL_PREVIEW

### Phase 4: Système de Scoring
- ✅ Gestionnaire de score: `src/lib/scoreManager.js`
- ✅ Combo, streak, perfect bonus, jackpot

### Phase 5: Gestion des Erreurs
- ✅ Système de tolérance: `src/lib/errorHandler.js`
- ✅ 2 erreurs tolérées par motif
- ✅ Retry rapide au lieu de game over

### Phase 6: Effets Visuels & Sonores
- ✅ Gestionnaire d'effets: `src/lib/fxManager.js`
- ✅ Glow, shake, halo, explosion de particules
- ✅ Sons synchronisés avec les actions

### Phase 7: Système de Tempo
- ✅ Gestionnaire de tempo: `src/lib/tempoManager.js`
- ✅ BPM dynamique (100-180)
- ✅ Synchronisation des animations

### Phase 8: Mode Daily
- ✅ Gestionnaire daily: `src/lib/dailyManager.js`
- ✅ 5 motifs avec progression de difficulté
- ✅ Seed quotidien fixe

### Phase 9: HUD & Interface
- ✅ Composant HUD: `src/components/FlowHUD.vue`
- ✅ Affichage: combo, score, streak, branch, tempo, erreurs

## 🔧 Intégration dans App.vue

### 1. Importer les modules Flow

```javascript
import { createRandomEngine, createDailyEngine } from './lib/patternEngine.js';
import { createFlowController } from './lib/flowController.js';
import { createScoreManager } from './lib/scoreManager.js';
import { createTempoManager } from './lib/tempoManager.js';
import { createDailyManager } from './lib/dailyManager.js';
import { createVisualFXManager, createAudioFXManager } from './lib/fxManager.js';
import { createErrorHandler } from './lib/errorHandler.js';
```

### 2. Initialiser les gestionnaires

```javascript
// Dans la section setup() ou mounted()
let flowController = null;
let scoreManager = null;
let tempoManager = null;
let dailyManager = null;
let fxManager = null;
let audioManager = null;
let errorHandler = null;

function initializeFlowSystem() {
  // Pattern Engine
  const patternEngine = state.mode === 'daily' 
    ? createDailyEngine() 
    : createRandomEngine();

  // Score Manager
  scoreManager = createScoreManager();

  // Tempo Manager
  tempoManager = createTempoManager(state.tempoBPM, {
    onTempoChange: (data) => {
      state.tempoBPM = data.target;
    },
    onBeat: (data) => {
      // Synchroniser les animations
    },
  });

  // Error Handler
  errorHandler = createErrorHandler({
    onError: (data) => {
      // Afficher feedback d'erreur
      fxManager.triggerShake(data.cell);
      audioManager.playInputError();
    },
    onErrorTolerated: (data) => {
      console.log(`Erreur tolérée: ${data.remaining} restantes`);
    },
  });

  // FX Managers
  fxManager = createVisualFXManager({
    onGlow: (data) => {
      // Appliquer effet glow sur la cellule
    },
    onPerfectHalo: () => {
      state.showPerfectFX = true;
      setTimeout(() => { state.showPerfectFX = false; }, 2000);
    },
    onJackpotExplosion: () => {
      state.showJackpotFX = true;
      setTimeout(() => { state.showJackpotFX = false; }, 3000);
    },
  });

  audioManager = createAudioFXManager();

  // Flow Controller
  flowController = createFlowController(state, patternEngine, {
    onStateChange: (newState) => {
      console.log('Flow state:', newState);
    },
    onComboChange: (combo) => {
      scoreManager.updateCombo(combo);
    },
    onScoreChange: (points) => {
      scoreManager.addScore(points);
    },
    onPerfect: () => {
      fxManager.triggerPerfectHalo();
      audioManager.playPerfect();
      tempoManager.increaseTempo();
    },
    onJackpot: () => {
      fxManager.triggerJackpotExplosion();
      audioManager.playJackpot();
      scoreManager.recordJackpot();
    },
    onError: (data) => {
      const result = errorHandler.recordError(data.cell, data.expectedCell);
      if (result === 'limit_reached') {
        // Reset du motif
        tempoManager.resetTempo();
      }
    },
    onPatternComplete: (data) => {
      scoreManager.recordPattern({
        length: state.currentPattern.length,
        isPerfect: data.isPerfect,
        errors: state.errorsInPattern,
        timeMs: data.timeMs,
        score: data.score,
        combo: state.combo,
      });
    },
  });
}
```

### 3. Démarrer le Flow

```javascript
function startFlowGame() {
  initializeFlowSystem();
  
  // Démarrer le tempo
  tempoManager.start();
  
  // Démarrer le flow
  flowController.start();
}
```

### 4. Gérer les clics de cellules

```javascript
function onCellClick(r, c) {
  if (state.flowState === 'INPUT') {
    flowController.onCellClick(r, c);
  }
}
```

### 5. Intégrer le HUD

```vue
<template>
  <FlowHUD
    :combo="state.combo"
    :score="scoreManager?.totalScore || 0"
    :streak="state.streak"
    :branch="state.branch"
    :flowState="state.flowState"
    :tempoBPM="state.tempoBPM"
    :beatCount="tempoManager?.beatCount || 0"
    :errorsInPattern="state.errorsInPattern"
    :showPerfectFX="state.showPerfectFX"
    :showJackpotFX="state.showJackpotFX"
  />
</template>
```

## 🎮 Mode Daily - Intégration

```javascript
function startDailyMode() {
  dailyManager = createDailyManager();
  dailyManager.initialize();
  
  // Utiliser les motifs daily
  const patterns = dailyManager.patterns;
  
  // Créer le flow controller avec les patterns daily
  // ...
}
```

## 🎨 Styles CSS à Ajouter

Les styles pour les nouveaux effets sont déjà inclus dans `FlowHUD.vue`. Vous pouvez ajouter des styles globaux dans votre fichier CSS principal:

```css
/* Effet glow sur cellule correcte */
.cell.glow {
  box-shadow: 0 0 20px currentColor;
  animation: glow-pulse 0.3s ease-out;
}

/* Effet shake sur erreur */
.cell.shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes glow-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

## 📊 Paramètres Ajustables

Tous les paramètres sont centralisés dans `src/lib/flowConfig.js`:

### Motifs
```javascript
MIN_PATTERN_LENGTH: 3  // Longueur minimale
MAX_PATTERN_LENGTH: 6  // Longueur maximale
ERROR_TOLERANCE: 2     // Erreurs tolérées
```

### Scoring
```javascript
COMBO_INCREMENT: 0.2   // Incrément du combo
PERFECT_BONUS: 50      // Bonus perfect
JACKPOT_BONUS: 200     // Bonus jackpot
```

### Tempo
```javascript
BASE_BPM: 100          // Tempo de base
MAX_BPM: 180           // Tempo maximum
INCREMENT: 5           // Augmentation par perfect
```

### Timings
```javascript
OBSERVE_BASE: 2000     // Temps d'observation de base (ms)
REWARD_DISPLAY: 1500   // Durée affichage récompense (ms)
PERFECT_FX: 2000       // Durée effet perfect (ms)
```

## 🧪 Tests Recommandés

### 1. Test du PatternEngine
```javascript
import { createRandomEngine } from './lib/patternEngine.js';

const engine = createRandomEngine();
const pattern = engine.generatePattern(4);
console.log('Pattern généré:', pattern);
console.log('Valide:', engine.validatePattern(pattern));
```

### 2. Test du FlowController
```javascript
// Simuler un motif complet
flowController.start();
// Attendre l'état INPUT
// Cliquer sur les bonnes cellules
// Vérifier les transitions d'état
```

### 3. Test du Scoring
```javascript
scoreManager.recordPattern({
  length: 4,
  isPerfect: true,
  errors: 0,
  timeMs: 2500,
  score: 100,
  combo: 1.8,
});
console.log('Stats:', scoreManager.getStats());
```

## 🐛 Debugging

Activer les logs détaillés:
```javascript
// Dans flowController.js, flowConfig.js, etc.
const DEBUG = true;

if (DEBUG) {
  console.log('[FlowController] State:', this.state);
}
```

## 📝 Checklist d'Intégration

- [ ] Importer tous les modules Flow
- [ ] Initialiser les gestionnaires au démarrage
- [ ] Connecter les callbacks
- [ ] Intégrer le composant FlowHUD
- [ ] Adapter la logique de clic des cellules
- [ ] Tester le mode solo avec Flow
- [ ] Tester le mode daily avec Flow
- [ ] Ajuster les timings selon les retours
- [ ] Ajouter les sons manquants
- [ ] Optimiser les performances

## 🚀 Prochaines Étapes

1. **Intégration progressive**: Commencer par le mode solo
2. **Tests utilisateurs**: Valider le flow et les timings
3. **Ajustements**: Modifier les paramètres selon les retours
4. **Modes versus/battle**: Adapter le système Flow
5. **Pouvoirs 6×**: Intégrer les pouvoirs spéciaux

## 📞 Support

Pour toute question sur l'intégration, référez-vous aux commentaires dans les fichiers sources ou consultez la documentation technique dans `Sans titre.rtf`.
