/**
 * Configuration du système Flow 6×6
 * Centralise toutes les constantes et paramètres du nouveau gameplay
 */

// États du jeu (Flow State Machine)
export const FLOW_STATES = {
  OBSERVE: 'OBSERVE',       // Observation du motif
  INPUT: 'INPUT',           // Saisie du joueur
  REWARD: 'REWARD',         // Feedback et récompense
  TRANSITION: 'TRANSITION', // Transition vers le prochain motif
};

// Branches de gameplay (selon performance)
export const BRANCHES = {
  FULL_PREVIEW: 'FULL_PREVIEW',   // Avec erreurs - preview complet
  QUICK_PREVIEW: 'QUICK_PREVIEW', // Parfait mais lent - preview rapide
  FLOW_CHAIN: 'FLOW_CHAIN',       // Parfait et rapide - enchaînement flow
};

// Grille
export const GRID = {
  COLS: 6,
  ROWS: 6,
  TOTAL_CELLS: 36,
};

// Motifs
export const PATTERN = {
  MIN_LENGTH: 3,      // Motif minimum: 3 cases
  MAX_LENGTH: 6,      // Motif maximum: 6 cases
  ERROR_TOLERANCE: 2, // Nombre d'erreurs tolérées par motif
};

// Scoring
export const SCORING = {
  COMBO_START: 1.0,       // Combo initial
  COMBO_INCREMENT: 0.2,   // Incrément par case correcte
  PERFECT_BONUS: 50,      // Bonus pour motif parfait
  JACKPOT_STREAK: 3,      // Jackpot tous les 3 perfects
  JACKPOT_BONUS: 200,     // Bonus jackpot
  BASE_SCORE_PER_CELL: 10, // Score de base par case
};

// Tempo
export const TEMPO = {
  BASE_BPM: 100,        // Tempo de base
  MAX_BPM: 180,         // Tempo maximum
  INCREMENT: 5,         // Augmentation par perfect
  PERFECT_TIME_MS: 3000, // Temps max pour être considéré "rapide"
};

// Timings (en millisecondes)
export const TIMINGS = {
  OBSERVE_BASE: 2000,        // Temps d'observation de base
  OBSERVE_PER_CELL: 400,     // Temps additionnel par case
  QUICK_PREVIEW: 1000,       // Durée du quick preview
  FLOW_CHAIN_PREVIEW: 500,   // Durée du flow chain preview
  REWARD_DISPLAY: 1500,      // Durée d'affichage de la récompense
  PERFECT_FX: 2000,          // Durée de l'effet "Perfect"
  JACKPOT_FX: 3000,          // Durée de l'effet "Jackpot"
  ERROR_FEEDBACK: 800,       // Durée du feedback d'erreur
  TRANSITION: 500,           // Durée de la transition
};

// Effets visuels
export const VISUAL_FX = {
  GLOW_DURATION: 300,        // Durée du glow sur case correcte
  ERROR_SHAKE_DURATION: 400, // Durée du shake sur erreur
  PERFECT_HALO_SIZE: 1.3,    // Taille du halo (scale)
  JACKPOT_PARTICLES: 30,     // Nombre de particules pour jackpot
};

// Effets sonores (identifiants)
export const SOUND_FX = {
  OBSERVE_TICK: 'observe_tick',
  INPUT_CORRECT: 'input_correct',
  INPUT_ERROR: 'input_error',
  PERFECT: 'perfect',
  JACKPOT: 'jackpot',
  COMBO_UP: 'combo_up',
};

// Règles de design
export const DESIGN_RULES = {
  GENEROUS_HITBOX: true,     // Hitbox généreuse
  IMMEDIATE_FEEDBACK: true,  // Feedback immédiat
  NO_HARD_GAME_OVER: true,   // Pas de game over sec
  FLOW_OVER_PUNISHMENT: true, // Flow prime sur punition
};

/**
 * Calcule le temps d'observation pour un motif
 * @param {number} patternLength - Longueur du motif
 * @returns {number} Temps en millisecondes
 */
export function getObserveTime(patternLength) {
  return TIMINGS.OBSERVE_BASE + (patternLength * TIMINGS.OBSERVE_PER_CELL);
}

/**
 * Détermine la branche suivante selon la performance
 * @param {boolean} isPerfect - Motif parfait (sans erreur)
 * @param {number} timeMs - Temps pris pour compléter le motif
 * @returns {string} Branche (FLOW_CHAIN, QUICK_PREVIEW, ou FULL_PREVIEW)
 */
export function decideNextBranch(isPerfect, timeMs) {
  if (!isPerfect) {
    return BRANCHES.FULL_PREVIEW;
  }
  
  if (timeMs <= TEMPO.PERFECT_TIME_MS) {
    return BRANCHES.FLOW_CHAIN;
  }
  
  return BRANCHES.QUICK_PREVIEW;
}

/**
 * Calcule le nouveau tempo selon le streak
 * @param {number} currentBPM - Tempo actuel
 * @param {boolean} isPerfect - Si le motif était parfait
 * @returns {number} Nouveau tempo en BPM
 */
export function calculateNewTempo(currentBPM, isPerfect) {
  if (!isPerfect) {
    return TEMPO.BASE_BPM; // Reset au tempo de base
  }
  
  const newBPM = currentBPM + TEMPO.INCREMENT;
  return Math.min(newBPM, TEMPO.MAX_BPM);
}

/**
 * Calcule le score pour un motif complété
 * @param {number} patternLength - Longueur du motif
 * @param {number} combo - Multiplicateur de combo
 * @param {boolean} isPerfect - Si le motif était parfait
 * @returns {number} Score gagné
 */
export function calculatePatternScore(patternLength, combo, isPerfect) {
  const baseScore = patternLength * SCORING.BASE_SCORE_PER_CELL;
  const comboScore = Math.floor(baseScore * combo);
  const perfectBonus = isPerfect ? SCORING.PERFECT_BONUS : 0;
  
  return comboScore + perfectBonus;
}
