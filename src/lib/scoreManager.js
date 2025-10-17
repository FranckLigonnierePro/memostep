/**
 * ScoreManager - Gestion du score et des statistiques Flow
 * Gère le score total, les combos, les streaks et les achievements
 */

import { SCORING } from './flowConfig.js';

/**
 * Classe de gestion du score
 */
export class ScoreManager {
  constructor() {
    this.totalScore = 0;
    this.currentCombo = SCORING.COMBO_START;
    this.maxCombo = SCORING.COMBO_START;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.perfectCount = 0;
    this.totalPatterns = 0;
    this.perfectPatterns = 0;
    this.jackpotCount = 0;
    this.totalErrors = 0;
    
    // Historique des scores par motif
    this.patternHistory = [];
  }

  /**
   * Ajoute des points au score total
   */
  addScore(points) {
    this.totalScore += points;
    return this.totalScore;
  }

  /**
   * Met à jour le combo
   */
  updateCombo(newCombo) {
    this.currentCombo = newCombo;
    if (newCombo > this.maxCombo) {
      this.maxCombo = newCombo;
    }
    return this.currentCombo;
  }

  /**
   * Reset le combo
   */
  resetCombo() {
    this.currentCombo = SCORING.COMBO_START;
    return this.currentCombo;
  }

  /**
   * Incrémente le streak
   */
  incrementStreak() {
    this.currentStreak++;
    if (this.currentStreak > this.maxStreak) {
      this.maxStreak = this.currentStreak;
    }
    return this.currentStreak;
  }

  /**
   * Reset le streak
   */
  resetStreak() {
    this.currentStreak = 0;
    return this.currentStreak;
  }

  /**
   * Enregistre la complétion d'un motif
   */
  recordPattern(patternData) {
    const {
      length,
      isPerfect,
      errors,
      timeMs,
      score,
      combo,
    } = patternData;

    this.totalPatterns++;
    
    if (isPerfect) {
      this.perfectPatterns++;
      this.perfectCount++;
      this.incrementStreak();
    } else {
      this.resetStreak();
      this.perfectCount = 0; // Reset du compteur jackpot
    }

    this.totalErrors += errors;

    // Ajouter à l'historique
    this.patternHistory.push({
      index: this.totalPatterns,
      length,
      isPerfect,
      errors,
      timeMs,
      score,
      combo,
      timestamp: Date.now(),
    });

    return {
      totalScore: this.totalScore,
      currentStreak: this.currentStreak,
      perfectCount: this.perfectCount,
    };
  }

  /**
   * Enregistre un jackpot
   */
  recordJackpot() {
    this.jackpotCount++;
    this.addScore(SCORING.JACKPOT_BONUS);
    return this.jackpotCount;
  }

  /**
   * Calcule le taux de précision
   */
  getAccuracy() {
    if (this.totalPatterns === 0) return 100;
    return Math.round((this.perfectPatterns / this.totalPatterns) * 100);
  }

  /**
   * Calcule le temps moyen par motif
   */
  getAverageTime() {
    if (this.patternHistory.length === 0) return 0;
    
    const totalTime = this.patternHistory.reduce((sum, p) => sum + p.timeMs, 0);
    return Math.round(totalTime / this.patternHistory.length);
  }

  /**
   * Obtient les statistiques complètes
   */
  getStats() {
    return {
      totalScore: this.totalScore,
      currentCombo: this.currentCombo,
      maxCombo: this.maxCombo,
      currentStreak: this.currentStreak,
      maxStreak: this.maxStreak,
      totalPatterns: this.totalPatterns,
      perfectPatterns: this.perfectPatterns,
      jackpotCount: this.jackpotCount,
      totalErrors: this.totalErrors,
      accuracy: this.getAccuracy(),
      averageTime: this.getAverageTime(),
      perfectCount: this.perfectCount,
    };
  }

  /**
   * Obtient l'historique des motifs
   */
  getHistory() {
    return [...this.patternHistory];
  }

  /**
   * Obtient les N derniers motifs
   */
  getRecentHistory(count = 5) {
    return this.patternHistory.slice(-count);
  }

  /**
   * Reset toutes les statistiques
   */
  reset() {
    this.totalScore = 0;
    this.currentCombo = SCORING.COMBO_START;
    this.maxCombo = SCORING.COMBO_START;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.perfectCount = 0;
    this.totalPatterns = 0;
    this.perfectPatterns = 0;
    this.jackpotCount = 0;
    this.totalErrors = 0;
    this.patternHistory = [];
  }

  /**
   * Exporte les données pour sauvegarde
   */
  export() {
    return {
      totalScore: this.totalScore,
      maxCombo: this.maxCombo,
      maxStreak: this.maxStreak,
      totalPatterns: this.totalPatterns,
      perfectPatterns: this.perfectPatterns,
      jackpotCount: this.jackpotCount,
      totalErrors: this.totalErrors,
      patternHistory: this.patternHistory,
    };
  }

  /**
   * Importe des données sauvegardées
   */
  import(data) {
    if (!data) return;

    this.totalScore = data.totalScore || 0;
    this.maxCombo = data.maxCombo || SCORING.COMBO_START;
    this.maxStreak = data.maxStreak || 0;
    this.totalPatterns = data.totalPatterns || 0;
    this.perfectPatterns = data.perfectPatterns || 0;
    this.jackpotCount = data.jackpotCount || 0;
    this.totalErrors = data.totalErrors || 0;
    this.patternHistory = data.patternHistory || [];
  }
}

/**
 * Formatte le score avec séparateurs de milliers
 */
export function formatScore(score) {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formatte le combo avec décimales
 */
export function formatCombo(combo) {
  return `×${combo.toFixed(1)}`;
}

/**
 * Formatte le temps en secondes
 */
export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const deciseconds = Math.floor((ms % 1000) / 100);
  return `${seconds}.${deciseconds}s`;
}

/**
 * Calcule le rang selon le score
 */
export function calculateRank(score) {
  if (score >= 10000) return { rank: 'S', color: '#FFD700' };
  if (score >= 7500) return { rank: 'A', color: '#12b886' };
  if (score >= 5000) return { rank: 'B', color: '#4dabf7' };
  if (score >= 2500) return { rank: 'C', color: '#fab005' };
  return { rank: 'D', color: '#868e96' };
}

/**
 * Factory pour créer un ScoreManager
 */
export function createScoreManager() {
  return new ScoreManager();
}
