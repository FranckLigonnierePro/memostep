/**
 * Composable pour gérer l'état global du jeu
 */

import { reactive, ref, computed } from 'vue';
import { COLS, ROWS, TARGET_CELL, REVEAL_MS } from '../config/gameConfig.js';

export function useGameState() {
  // État réactif principal du jeu
  const state = reactive({
    path: [],            // [{r,c}, ...]
    nextIndex: 0,
    inPlay: false,
    revealed: false,     // pendant l'exposition du chemin
    statusText: 'Nouveau jeu',
    correctSet: new Set(), // 'r-c'
    wrongSet: new Set(),   // 'r-c'
    cellSize: TARGET_CELL, // pixels
    scale: 1,
    timerId: null,
    intervalId: null,
    revealEndAt: 0,
    revealDuration: REVEAL_MS,
    nowMs: Date.now(),
    mode: 'solo',
    
    // Solo
    soloPath: [],
    preparedHeart: null,
    heartCell: null,
    
    // Decoys et hazards
    decoys: new Set(),
    rollback: new Set(),
    stun: new Set(),
    lifeLoss: new Set(),
    
    // Freeze power (versus)
    frozenGrid: false,
    frozenClicksLeft: 0,
    powerUsed: false,
    showSnowstorm: false,
    
    // Grille enrichie avec bonus et pièges
    gridContent: null,
    collectedBonuses: new Set(),
    
    // Phase de jeu
    phase: 'idle', // 'idle' | 'show' | 'input' | 'result'
  });

  // Refs supplémentaires
  const flipActive = ref(false);
  const flipBackActive = ref(false);
  const stunActive = ref(false);
  const faceDownActive = ref(false);
  const faceColors = ref({});
  const shakeActive = ref(false);
  const clickBlocked = ref(false);
  const mirrorColumns = ref(false);
  const revealComplete = ref(false);
  const highlightIdx = ref(null);

  // Solo
  const soloLivesUsed = ref(0);
  const soloLevel = ref(0);
  const runCounters = ref({ gem: 0, potion: 0 });
  const soloErrorCount = ref(0); // Track errors for perfect stage detection

  // Computed
  const cells = computed(() => {
    const arr = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        arr.push({ r, c });
      }
    }
    return arr;
  });

  const boardStyle = computed(() => ({
    '--cell': `${state.cellSize}px`,
    transform: 'none',
  }));

  const revealMsLeft = computed(() => {
    if (!state.revealed || !state.revealEndAt) return 0;
    return Math.max(0, state.revealEndAt - state.nowMs);
  });

  const revealProgress = computed(() => {
    if (!state.revealed || !state.revealEndAt) return 0;
    const elapsed = Math.min(state.revealDuration, state.revealDuration - revealMsLeft.value);
    return Math.min(1, Math.max(0, elapsed / state.revealDuration));
  });

  const revealSecondsText = computed(() => {
    if (!state.revealed) return (state.revealDuration / 1000).toFixed(1) + ' s';
    const s = revealMsLeft.value / 1000;
    return s.toFixed(1) + ' s';
  });

  const nextCell = computed(() => {
    if (state.phase !== 'input' || !state.inPlay) return null;
    return state.path[state.nextIndex] || null;
  });

  const livesUsed = computed(() => {
    if (state.mode === 'solo') return Math.min(3, soloLivesUsed.value);
    // Versus sera géré par useVersusMode
    return 0;
  });

  const lastExtinguishedIndex = computed(() => {
    if (state.mode === 'solo') return Math.min(2, livesUsed.value - 1);
    return -1;
  });

  // Fonctions utilitaires
  function cellClass(r, c) {
    const classes = [];
    const key = `${r}-${c}`;

    if (state.revealed) {
      const idx = state.path.findIndex(p => p.r === r && p.c === c);
      if (idx !== -1) {
        classes.push('path');
        if (idx === 0) classes.push('start');
        if (idx === state.path.length - 1) classes.push('end');
      }
    }

    if (state.correctSet.has(key)) classes.push('correct');
    if (state.wrongSet.has(key)) classes.push('wrong');

    return classes;
  }

  function startRevealTicker() {
    stopRevealTicker();
    state.intervalId = setInterval(() => {
      state.nowMs = Date.now();
    }, 100);
  }

  function stopRevealTicker() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function resetGameState() {
    state.path = [];
    state.nextIndex = 0;
    state.revealed = false;
    state.inPlay = false;
    state.correctSet.clear();
    state.wrongSet.clear();
    state.collectedBonuses.clear();
    faceDownActive.value = false;
    soloErrorCount.value = 0;
    stopRevealTicker();
  }

  return {
    // State
    state,
    flipActive,
    flipBackActive,
    stunActive,
    faceDownActive,
    faceColors,
    shakeActive,
    clickBlocked,
    mirrorColumns,
    revealComplete,
    highlightIdx,
    soloLivesUsed,
    soloLevel,
    runCounters,
    soloErrorCount,
    
    // Computed
    cells,
    boardStyle,
    revealMsLeft,
    revealProgress,
    revealSecondsText,
    nextCell,
    livesUsed,
    lastExtinguishedIndex,
    
    // Functions
    cellClass,
    startRevealTicker,
    stopRevealTicker,
    resetGameState,
  };
}
