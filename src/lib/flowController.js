/**
 * FlowController - Contrôleur de la machine à états Flow
 * Gère les transitions OBSERVE → INPUT → REWARD → TRANSITION
 */

import { 
  FLOW_STATES, 
  BRANCHES, 
  PATTERN,
  SCORING,
  TIMINGS,
  decideNextBranch,
  calculateNewTempo,
  calculatePatternScore,
  getObserveTime,
} from './flowConfig.js';

/**
 * Classe principale du contrôleur de flow
 */
export class FlowController {
  constructor(state, patternEngine, callbacks = {}) {
    this.state = state;
    this.patternEngine = patternEngine;
    this.callbacks = {
      onStateChange: callbacks.onStateChange || (() => {}),
      onBranchChange: callbacks.onBranchChange || (() => {}),
      onComboChange: callbacks.onComboChange || (() => {}),
      onScoreChange: callbacks.onScoreChange || (() => {}),
      onPerfect: callbacks.onPerfect || (() => {}),
      onJackpot: callbacks.onJackpot || (() => {}),
      onError: callbacks.onError || (() => {}),
      onPatternComplete: callbacks.onPatternComplete || (() => {}),
    };

    this.currentTimeout = null;
  }

  /**
   * Nettoie les timeouts en cours
   */
  cleanup() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  /**
   * Change l'état du flow
   */
  changeState(newState) {
    console.log(`[FlowController] State: ${this.state.flowState} → ${newState}`);
    this.state.flowState = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Change la branche
   */
  changeBranch(newBranch) {
    console.log(`[FlowController] Branch: ${this.state.branch} → ${newBranch}`);
    this.state.branch = newBranch;
    this.callbacks.onBranchChange(newBranch);
  }

  /**
   * Démarre un nouveau motif
   */
  startNewPattern() {
    this.cleanup();

    // Générer un nouveau motif
    const pattern = this.patternEngine.generatePattern();
    
    console.log('[FlowController] New pattern:', pattern);
    
    this.state.currentPattern = pattern;
    this.state.patternIndex = 0;
    this.state.errorsInPattern = 0;
    this.state.patternStartTime = Date.now();

    // Passer en mode OBSERVE
    this.enterObserveState();
  }

  /**
   * État OBSERVE - Afficher le motif au joueur
   */
  enterObserveState() {
    this.changeState(FLOW_STATES.OBSERVE);

    const observeTime = this.getObserveTimeForBranch();
    
    console.log(`[FlowController] Observe time: ${observeTime}ms for branch ${this.state.branch}`);

    // Synchroniser avec l'ancien système pour l'affichage
    this.state.path = this.state.currentPattern;
    this.state.revealed = true;
    this.state.inPlay = false;
    this.state.nextIndex = 0;
    this.state.correctSet.clear();
    this.state.wrongSet.clear();
    
    // Après le temps d'observation, passer en INPUT
    this.currentTimeout = setTimeout(() => {
      this.enterInputState();
    }, observeTime);
  }

  /**
   * Calcule le temps d'observation selon la branche
   */
  getObserveTimeForBranch() {
    const patternLength = this.state.currentPattern.length;
    
    switch (this.state.branch) {
      case BRANCHES.FLOW_CHAIN:
        return TIMINGS.FLOW_CHAIN_PREVIEW;
      
      case BRANCHES.QUICK_PREVIEW:
        return TIMINGS.QUICK_PREVIEW;
      
      case BRANCHES.FULL_PREVIEW:
      default:
        return getObserveTime(patternLength);
    }
  }

  /**
   * État INPUT - Le joueur reproduit le motif
   */
  enterInputState() {
    this.changeState(FLOW_STATES.INPUT);
    
    // Synchroniser avec l'ancien système
    this.state.revealed = false; // Cacher le motif
    this.state.inPlay = true;    // Activer les clics
    
    // Le joueur peut maintenant cliquer sur les cases
    // Les clics sont gérés par onCellClick()
  }

  /**
   * Gère un clic sur une cellule pendant l'état INPUT
   */
  onCellClick(r, c) {
    if (this.state.flowState !== FLOW_STATES.INPUT) {
      console.warn('[FlowController] Click ignored, not in INPUT state');
      return;
    }

    const expectedCell = this.state.currentPattern[this.state.patternIndex];
    
    if (!expectedCell) {
      console.warn('[FlowController] No expected cell');
      return;
    }

    const isCorrect = (r === expectedCell.r && c === expectedCell.c);

    if (isCorrect) {
      this.handleCorrectInput(r, c);
    } else {
      this.handleIncorrectInput(r, c);
    }
  }

  /**
   * Gère une entrée correcte
   */
  handleCorrectInput(r, c) {
    console.log(`[FlowController] Correct input: (${r}, ${c})`);

    // Synchroniser avec l'ancien système
    this.state.correctSet.add(`${r}-${c}`);
    this.state.nextIndex++;

    // Augmenter le combo
    this.state.combo += SCORING.COMBO_INCREMENT;
    this.callbacks.onComboChange(this.state.combo);

    // Avancer dans le motif
    this.state.patternIndex++;

    // Vérifier si le motif est complet
    if (this.state.patternIndex >= this.state.currentPattern.length) {
      this.enterRewardState();
    }
  }

  /**
   * Gère une entrée incorrecte
   */
  handleIncorrectInput(r, c) {
    console.log(`[FlowController] Incorrect input: (${r}, ${c})`);

    this.state.errorsInPattern++;
    this.callbacks.onError({ r, c });

    // Vérifier la tolérance d'erreur
    if (this.state.errorsInPattern >= PATTERN.ERROR_TOLERANCE) {
      // Trop d'erreurs, reset du motif
      this.resetPattern();
    } else {
      // Erreur tolérée, continuer
      // Le joueur peut réessayer la même case
      console.log(`[FlowController] Error tolerated (${this.state.errorsInPattern}/${PATTERN.ERROR_TOLERANCE})`);
    }
  }

  /**
   * Reset le motif actuel (après trop d'erreurs)
   */
  resetPattern() {
    console.log('[FlowController] Resetting pattern due to errors');

    // Reset du combo
    this.state.combo = SCORING.COMBO_START;
    this.state.streak = 0;
    this.state.perfectCount = 0;

    // Reset du tempo
    this.state.tempoBPM = calculateNewTempo(this.state.tempoBPM, false);

    // Retour en FULL_PREVIEW
    this.changeBranch(BRANCHES.FULL_PREVIEW);

    // Recommencer le même motif
    this.state.patternIndex = 0;
    this.state.errorsInPattern = 0;
    this.state.patternStartTime = Date.now();

    this.enterObserveState();
  }

  /**
   * État REWARD - Afficher la récompense
   */
  enterRewardState() {
    this.changeState(FLOW_STATES.REWARD);

    const isPerfect = this.state.errorsInPattern === 0;
    const timeMs = Date.now() - this.state.patternStartTime;

    // Calculer le score
    const score = calculatePatternScore(
      this.state.currentPattern.length,
      this.state.combo,
      isPerfect
    );

    console.log(`[FlowController] Pattern complete! Score: ${score}, Perfect: ${isPerfect}, Time: ${timeMs}ms`);

    this.callbacks.onScoreChange(score);
    this.callbacks.onPatternComplete({ isPerfect, timeMs, score });

    // Gérer le perfect
    if (isPerfect) {
      this.state.streak++;
      this.state.perfectCount++;

      this.callbacks.onPerfect();

      // Vérifier le jackpot
      if (this.state.perfectCount >= SCORING.JACKPOT_STREAK) {
        this.state.perfectCount = 0; // Reset
        this.callbacks.onJackpot();
        this.callbacks.onScoreChange(SCORING.JACKPOT_BONUS);
      }

      // Augmenter le tempo
      this.state.tempoBPM = calculateNewTempo(this.state.tempoBPM, true);
    } else {
      // Reset streak si pas perfect
      this.state.streak = 0;
      this.state.perfectCount = 0;
      this.state.combo = SCORING.COMBO_START;
    }

    // Décider de la prochaine branche
    const nextBranch = decideNextBranch(isPerfect, timeMs);
    this.changeBranch(nextBranch);

    // Afficher la récompense pendant un certain temps
    this.currentTimeout = setTimeout(() => {
      this.enterTransitionState();
    }, TIMINGS.REWARD_DISPLAY);
  }

  /**
   * État TRANSITION - Préparer le prochain motif
   */
  enterTransitionState() {
    this.changeState(FLOW_STATES.TRANSITION);

    // Court délai avant le prochain motif
    this.currentTimeout = setTimeout(() => {
      this.startNewPattern();
    }, TIMINGS.TRANSITION);
  }

  /**
   * Démarre le flow
   */
  start() {
    console.log('[FlowController] Starting flow');
    this.startNewPattern();
  }

  /**
   * Arrête le flow
   */
  stop() {
    console.log('[FlowController] Stopping flow');
    this.cleanup();
    this.changeState(FLOW_STATES.OBSERVE);
  }

  /**
   * Pause le flow
   */
  pause() {
    console.log('[FlowController] Pausing flow');
    this.cleanup();
  }

  /**
   * Reprend le flow
   */
  resume() {
    console.log('[FlowController] Resuming flow');
    
    // Reprendre selon l'état actuel
    if (this.state.flowState === FLOW_STATES.OBSERVE) {
      this.enterObserveState();
    } else if (this.state.flowState === FLOW_STATES.INPUT) {
      // Déjà en input, rien à faire
    } else if (this.state.flowState === FLOW_STATES.REWARD) {
      this.enterRewardState();
    } else if (this.state.flowState === FLOW_STATES.TRANSITION) {
      this.enterTransitionState();
    }
  }

  /**
   * Obtient l'état actuel du flow
   */
  getState() {
    return {
      flowState: this.state.flowState,
      branch: this.state.branch,
      currentPattern: this.state.currentPattern,
      patternIndex: this.state.patternIndex,
      errorsInPattern: this.state.errorsInPattern,
      combo: this.state.combo,
      streak: this.state.streak,
      perfectCount: this.state.perfectCount,
      tempoBPM: this.state.tempoBPM,
    };
  }
}

/**
 * Factory pour créer un FlowController
 */
export function createFlowController(state, patternEngine, callbacks) {
  return new FlowController(state, patternEngine, callbacks);
}
