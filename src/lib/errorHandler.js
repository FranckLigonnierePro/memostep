/**
 * ErrorHandler - Gestion des erreurs et feedbacks
 * Implémente le système de tolérance d'erreur et retry rapide
 */

import { PATTERN, TIMINGS } from './flowConfig.js';

/**
 * Classe de gestion des erreurs
 */
export class ErrorHandler {
  constructor(callbacks = {}) {
    this.callbacks = {
      onError: callbacks.onError || (() => {}),
      onErrorTolerated: callbacks.onErrorTolerated || (() => {}),
      onErrorLimitReached: callbacks.onErrorLimitReached || (() => {}),
      onRetry: callbacks.onRetry || (() => {}),
    };

    this.errorCount = 0;
    this.errorHistory = [];
    this.lastErrorTime = 0;
  }

  /**
   * Enregistre une erreur
   */
  recordError(cell, expectedCell) {
    this.errorCount++;
    this.lastErrorTime = Date.now();

    const errorData = {
      cell,
      expectedCell,
      timestamp: this.lastErrorTime,
      count: this.errorCount,
    };

    this.errorHistory.push(errorData);

    console.log(`[ErrorHandler] Error #${this.errorCount}: clicked (${cell.r}, ${cell.c}), expected (${expectedCell.r}, ${expectedCell.c})`);

    this.callbacks.onError(errorData);

    // Vérifier si l'erreur est tolérée
    if (this.errorCount < PATTERN.ERROR_TOLERANCE) {
      this.callbacks.onErrorTolerated({
        errorCount: this.errorCount,
        remaining: PATTERN.ERROR_TOLERANCE - this.errorCount,
      });
      return 'tolerated';
    } else {
      this.callbacks.onErrorLimitReached({
        errorCount: this.errorCount,
      });
      return 'limit_reached';
    }
  }

  /**
   * Reset le compteur d'erreurs (nouveau motif)
   */
  reset() {
    this.errorCount = 0;
    this.errorHistory = [];
    this.lastErrorTime = 0;
  }

  /**
   * Obtient le nombre d'erreurs restantes tolérées
   */
  getRemainingErrors() {
    return Math.max(0, PATTERN.ERROR_TOLERANCE - this.errorCount);
  }

  /**
   * Vérifie si la limite d'erreurs est atteinte
   */
  isLimitReached() {
    return this.errorCount >= PATTERN.ERROR_TOLERANCE;
  }

  /**
   * Obtient les statistiques d'erreurs
   */
  getStats() {
    return {
      errorCount: this.errorCount,
      remaining: this.getRemainingErrors(),
      limitReached: this.isLimitReached(),
      history: [...this.errorHistory],
    };
  }

  /**
   * Calcule le délai de retry selon le nombre d'erreurs
   */
  getRetryDelay() {
    // Plus d'erreurs = délai plus long pour encourager la concentration
    return TIMINGS.ERROR_FEEDBACK + (this.errorCount * 200);
  }
}

/**
 * Gestion des vies (système alternatif pour modes solo/daily)
 */
export class LivesManager {
  constructor(maxLives = 3, callbacks = {}) {
    this.maxLives = maxLives;
    this.currentLives = maxLives;
    this.callbacks = {
      onLifeLost: callbacks.onLifeLost || (() => {}),
      onGameOver: callbacks.onGameOver || (() => {}),
      onLifeRestored: callbacks.onLifeRestored || (() => {}),
    };
  }

  /**
   * Perd une vie
   */
  loseLife() {
    if (this.currentLives > 0) {
      this.currentLives--;
      
      console.log(`[LivesManager] Life lost. Remaining: ${this.currentLives}/${this.maxLives}`);
      
      this.callbacks.onLifeLost({
        remaining: this.currentLives,
        total: this.maxLives,
      });

      if (this.currentLives === 0) {
        this.callbacks.onGameOver();
        return 'game_over';
      }

      return 'continue';
    }

    return 'game_over';
  }

  /**
   * Restaure une vie
   */
  restoreLife() {
    if (this.currentLives < this.maxLives) {
      this.currentLives++;
      
      console.log(`[LivesManager] Life restored. Current: ${this.currentLives}/${this.maxLives}`);
      
      this.callbacks.onLifeRestored({
        current: this.currentLives,
        total: this.maxLives,
      });

      return true;
    }

    return false;
  }

  /**
   * Reset les vies
   */
  reset() {
    this.currentLives = this.maxLives;
  }

  /**
   * Obtient le nombre de vies restantes
   */
  getLives() {
    return this.currentLives;
  }

  /**
   * Vérifie si le joueur a encore des vies
   */
  hasLives() {
    return this.currentLives > 0;
  }

  /**
   * Obtient le pourcentage de vies restantes
   */
  getLifePercentage() {
    return (this.currentLives / this.maxLives) * 100;
  }
}

/**
 * Système de feedback progressif pour les erreurs
 */
export class ErrorFeedbackSystem {
  constructor() {
    this.feedbackLevels = [
      {
        threshold: 0,
        message: '',
        color: '#12b886',
        intensity: 0,
      },
      {
        threshold: 1,
        message: 'Attention !',
        color: '#fab005',
        intensity: 0.3,
      },
      {
        threshold: 2,
        message: 'Dernière chance !',
        color: '#fa5252',
        intensity: 0.7,
      },
    ];
  }

  /**
   * Obtient le feedback selon le nombre d'erreurs
   */
  getFeedback(errorCount) {
    // Trouver le niveau de feedback approprié
    let level = this.feedbackLevels[0];
    
    for (const l of this.feedbackLevels) {
      if (errorCount >= l.threshold) {
        level = l;
      }
    }

    return level;
  }

  /**
   * Génère un effet de vibration selon l'intensité
   */
  getVibrationPattern(intensity) {
    if (intensity === 0) return [];
    if (intensity < 0.5) return [50];
    if (intensity < 0.8) return [50, 50, 50];
    return [100, 50, 100];
  }

  /**
   * Applique la vibration (si supportée)
   */
  vibrate(intensity) {
    if ('vibrate' in navigator) {
      const pattern = this.getVibrationPattern(intensity);
      navigator.vibrate(pattern);
    }
  }
}

/**
 * Factory pour créer un ErrorHandler
 */
export function createErrorHandler(callbacks) {
  return new ErrorHandler(callbacks);
}

/**
 * Factory pour créer un LivesManager
 */
export function createLivesManager(maxLives, callbacks) {
  return new LivesManager(maxLives, callbacks);
}

/**
 * Factory pour créer un ErrorFeedbackSystem
 */
export function createErrorFeedbackSystem() {
  return new ErrorFeedbackSystem();
}
