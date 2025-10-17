/**
 * DailyManager - Gestion du mode Daily 6×6
 * Génère une séquence quotidienne de motifs avec seed fixe
 */

import { createDailyEngine } from './patternEngine.js';
import { PATTERN } from './flowConfig.js';

/**
 * Classe de gestion du mode Daily
 */
export class DailyManager {
  constructor() {
    this.currentDate = this.getTodayDate();
    this.seed = this.generateDailySeed();
    this.patternEngine = createDailyEngine();
    this.patterns = [];
    this.currentPatternIndex = 0;
    this.completed = false;
    this.stats = {
      totalScore: 0,
      perfectCount: 0,
      totalErrors: 0,
      totalTime: 0,
      attempts: 0,
    };
  }

  /**
   * Obtient la date du jour (format YYYYMMDD)
   */
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Génère le seed quotidien
   */
  generateDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }

  /**
   * Vérifie si c'est un nouveau jour
   */
  isNewDay() {
    const todayDate = this.getTodayDate();
    return todayDate !== this.currentDate;
  }

  /**
   * Initialise le daily (génère les 5 motifs)
   */
  initialize() {
    console.log(`[DailyManager] Initializing daily for ${this.currentDate} (seed: ${this.seed})`);

    // Générer 5 motifs avec progression de difficulté
    this.patterns = this.patternEngine.generateDailySequence(5, 'progressive');
    this.currentPatternIndex = 0;
    this.completed = false;

    console.log('[DailyManager] Generated patterns:', this.patterns.map(p => p.length));

    return this.patterns;
  }

  /**
   * Obtient le motif actuel
   */
  getCurrentPattern() {
    if (this.currentPatternIndex >= this.patterns.length) {
      return null;
    }
    return this.patterns[this.currentPatternIndex];
  }

  /**
   * Passe au motif suivant
   */
  nextPattern() {
    this.currentPatternIndex++;

    if (this.currentPatternIndex >= this.patterns.length) {
      this.completed = true;
      console.log('[DailyManager] Daily completed!');
      return null;
    }

    return this.getCurrentPattern();
  }

  /**
   * Enregistre la complétion d'un motif
   */
  recordPatternCompletion(patternData) {
    const { score, isPerfect, errors, timeMs } = patternData;

    this.stats.totalScore += score;
    if (isPerfect) {
      this.stats.perfectCount++;
    }
    this.stats.totalErrors += errors;
    this.stats.totalTime += timeMs;

    console.log(`[DailyManager] Pattern ${this.currentPatternIndex + 1}/5 completed:`, patternData);
  }

  /**
   * Enregistre une tentative
   */
  recordAttempt() {
    this.stats.attempts++;
  }

  /**
   * Vérifie si le daily est complété
   */
  isCompleted() {
    return this.completed;
  }

  /**
   * Obtient la progression (0-1)
   */
  getProgress() {
    return this.currentPatternIndex / this.patterns.length;
  }

  /**
   * Obtient le numéro du motif actuel (1-based)
   */
  getCurrentPatternNumber() {
    return this.currentPatternIndex + 1;
  }

  /**
   * Obtient le nombre total de motifs
   */
  getTotalPatterns() {
    return this.patterns.length;
  }

  /**
   * Obtient les statistiques
   */
  getStats() {
    return {
      ...this.stats,
      date: this.currentDate,
      seed: this.seed,
      progress: this.getProgress(),
      currentPattern: this.getCurrentPatternNumber(),
      totalPatterns: this.getTotalPatterns(),
      completed: this.completed,
    };
  }

  /**
   * Obtient le rang selon le score
   */
  getRank() {
    const score = this.stats.totalScore;
    
    if (score >= 2000) return { rank: 'S', color: '#FFD700', label: 'Parfait!' };
    if (score >= 1500) return { rank: 'A', color: '#12b886', label: 'Excellent!' };
    if (score >= 1000) return { rank: 'B', color: '#4dabf7', label: 'Bien!' };
    if (score >= 500) return { rank: 'C', color: '#fab005', label: 'Correct' };
    return { rank: 'D', color: '#868e96', label: 'À améliorer' };
  }

  /**
   * Reset le daily (nouveau jour)
   */
  reset() {
    this.currentDate = this.getTodayDate();
    this.seed = this.generateDailySeed();
    this.patternEngine = createDailyEngine();
    this.patterns = [];
    this.currentPatternIndex = 0;
    this.completed = false;
    this.stats = {
      totalScore: 0,
      perfectCount: 0,
      totalErrors: 0,
      totalTime: 0,
      attempts: 0,
    };
  }

  /**
   * Exporte les données pour sauvegarde
   */
  export() {
    return {
      date: this.currentDate,
      seed: this.seed,
      currentPatternIndex: this.currentPatternIndex,
      completed: this.completed,
      stats: this.stats,
    };
  }

  /**
   * Importe des données sauvegardées
   */
  import(data) {
    if (!data) return;

    // Vérifier si c'est le même jour
    if (data.date !== this.currentDate) {
      console.log('[DailyManager] Saved data is from a different day, resetting');
      this.reset();
      return;
    }

    this.currentPatternIndex = data.currentPatternIndex || 0;
    this.completed = data.completed || false;
    this.stats = data.stats || this.stats;

    // Régénérer les patterns avec le même seed
    this.initialize();
  }
}

/**
 * Classe pour gérer l'historique des dailies
 */
export class DailyHistory {
  constructor() {
    this.history = new Map(); // date -> stats
  }

  /**
   * Ajoute une entrée à l'historique
   */
  addEntry(date, stats) {
    this.history.set(date, {
      ...stats,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtient une entrée de l'historique
   */
  getEntry(date) {
    return this.history.get(date);
  }

  /**
   * Obtient l'historique complet
   */
  getAll() {
    return Array.from(this.history.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }

  /**
   * Obtient les N dernières entrées
   */
  getRecent(count = 7) {
    const entries = this.getAll();
    return entries.slice(-count);
  }

  /**
   * Obtient le streak actuel (jours consécutifs)
   */
  getCurrentStreak() {
    const entries = this.getAll().sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    let currentDate = new Date();

    for (const entry of entries) {
      const entryDate = this.parseDate(entry.date);
      const daysDiff = this.getDaysDifference(entryDate, currentDate);

      if (daysDiff === streak) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Parse une date au format YYYYMMDD
   */
  parseDate(dateStr) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  getDaysDifference(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtient le meilleur score
   */
  getBestScore() {
    const entries = this.getAll();
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(e => e.totalScore || 0));
  }

  /**
   * Obtient les statistiques globales
   */
  getGlobalStats() {
    const entries = this.getAll();
    
    if (entries.length === 0) {
      return {
        totalDays: 0,
        currentStreak: 0,
        bestScore: 0,
        averageScore: 0,
        totalPerfects: 0,
      };
    }

    const totalScore = entries.reduce((sum, e) => sum + (e.totalScore || 0), 0);
    const totalPerfects = entries.reduce((sum, e) => sum + (e.perfectCount || 0), 0);

    return {
      totalDays: entries.length,
      currentStreak: this.getCurrentStreak(),
      bestScore: this.getBestScore(),
      averageScore: Math.round(totalScore / entries.length),
      totalPerfects,
    };
  }

  /**
   * Exporte l'historique
   */
  export() {
    return Array.from(this.history.entries());
  }

  /**
   * Importe l'historique
   */
  import(data) {
    if (!data || !Array.isArray(data)) return;
    
    this.history.clear();
    for (const [date, stats] of data) {
      this.history.set(date, stats);
    }
  }
}

/**
 * Factory pour créer un DailyManager
 */
export function createDailyManager() {
  return new DailyManager();
}

/**
 * Factory pour créer un DailyHistory
 */
export function createDailyHistory() {
  return new DailyHistory();
}
