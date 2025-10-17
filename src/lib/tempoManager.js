/**
 * TempoManager - Gestion du tempo dynamique
 * Synchronise les animations, sons et transitions avec le BPM
 */

import { TEMPO, calculateNewTempo } from './flowConfig.js';

/**
 * Classe de gestion du tempo
 */
export class TempoManager {
  constructor(initialBPM = TEMPO.BASE_BPM, callbacks = {}) {
    this.currentBPM = initialBPM;
    this.targetBPM = initialBPM;
    this.callbacks = {
      onTempoChange: callbacks.onTempoChange || (() => {}),
      onBeat: callbacks.onBeat || (() => {}),
      onBar: callbacks.onBar || (() => {}),
    };

    this.beatCount = 0;
    this.barCount = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.lastBeatTime = 0;
    
    // Transition smooth du tempo
    this.transitionSpeed = 0.1; // Vitesse de transition (0-1)
  }

  /**
   * Calcule l'intervalle en ms pour un BPM
   */
  getBeatInterval(bpm = this.currentBPM) {
    return 60000 / bpm; // 60000ms = 1 minute
  }

  /**
   * Démarre le métronome
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.beatCount = 0;
    this.barCount = 0;
    this.lastBeatTime = Date.now();

    this.scheduleBeat();
  }

  /**
   * Arrête le métronome
   */
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Planifie le prochain beat
   */
  scheduleBeat() {
    if (!this.isRunning) return;

    // Transition smooth vers le BPM cible
    if (Math.abs(this.currentBPM - this.targetBPM) > 0.1) {
      const diff = this.targetBPM - this.currentBPM;
      this.currentBPM += diff * this.transitionSpeed;
    } else {
      this.currentBPM = this.targetBPM;
    }

    const interval = this.getBeatInterval();
    
    this.intervalId = setTimeout(() => {
      this.onBeat();
      this.scheduleBeat();
    }, interval);
  }

  /**
   * Callback sur chaque beat
   */
  onBeat() {
    this.beatCount++;
    this.lastBeatTime = Date.now();

    // Callback beat
    this.callbacks.onBeat({
      beatCount: this.beatCount,
      bpm: this.currentBPM,
      timestamp: this.lastBeatTime,
    });

    // Tous les 4 beats = 1 bar
    if (this.beatCount % 4 === 0) {
      this.barCount++;
      this.callbacks.onBar({
        barCount: this.barCount,
        bpm: this.currentBPM,
      });
    }
  }

  /**
   * Change le tempo (avec transition smooth)
   */
  setTempo(newBPM, immediate = false) {
    const clampedBPM = Math.max(TEMPO.BASE_BPM, Math.min(newBPM, TEMPO.MAX_BPM));
    
    if (immediate) {
      this.currentBPM = clampedBPM;
      this.targetBPM = clampedBPM;
    } else {
      this.targetBPM = clampedBPM;
    }

    console.log(`[TempoManager] Tempo: ${this.currentBPM.toFixed(1)} → ${this.targetBPM} BPM`);

    this.callbacks.onTempoChange({
      current: this.currentBPM,
      target: this.targetBPM,
    });
  }

  /**
   * Augmente le tempo (après perfect)
   */
  increaseTempo() {
    const newBPM = calculateNewTempo(this.targetBPM, true);
    this.setTempo(newBPM);
    return newBPM;
  }

  /**
   * Reset le tempo (après erreur)
   */
  resetTempo() {
    const newBPM = calculateNewTempo(this.targetBPM, false);
    this.setTempo(newBPM);
    return newBPM;
  }

  /**
   * Obtient le BPM actuel
   */
  getCurrentBPM() {
    return this.currentBPM;
  }

  /**
   * Obtient le BPM cible
   */
  getTargetBPM() {
    return this.targetBPM;
  }

  /**
   * Obtient le temps depuis le dernier beat
   */
  getTimeSinceLastBeat() {
    return Date.now() - this.lastBeatTime;
  }

  /**
   * Obtient le progrès vers le prochain beat (0-1)
   */
  getBeatProgress() {
    const timeSince = this.getTimeSinceLastBeat();
    const interval = this.getBeatInterval();
    return Math.min(1, timeSince / interval);
  }

  /**
   * Synchronise une action avec le beat
   */
  syncToBeat(callback, beatOffset = 0) {
    const progress = this.getBeatProgress();
    const interval = this.getBeatInterval();
    const timeToNextBeat = interval * (1 - progress);
    const delay = timeToNextBeat + (beatOffset * interval);

    return setTimeout(callback, delay);
  }

  /**
   * Obtient les statistiques du tempo
   */
  getStats() {
    return {
      currentBPM: this.currentBPM,
      targetBPM: this.targetBPM,
      beatCount: this.beatCount,
      barCount: this.barCount,
      isRunning: this.isRunning,
      beatProgress: this.getBeatProgress(),
    };
  }
}

/**
 * Classe pour animer des éléments au tempo
 */
export class TempoAnimator {
  constructor(tempoManager) {
    this.tempoManager = tempoManager;
    this.animations = new Map();
  }

  /**
   * Anime un élément avec pulse au tempo
   */
  addPulseAnimation(id, element, options = {}) {
    const {
      minScale = 1.0,
      maxScale = 1.1,
      easing = 'ease-in-out',
    } = options;

    const animate = () => {
      if (!element) return;

      const progress = this.tempoManager.getBeatProgress();
      const scale = minScale + (maxScale - minScale) * Math.sin(progress * Math.PI);
      
      element.style.transform = `scale(${scale})`;
    };

    const intervalId = setInterval(animate, 16); // 60fps
    this.animations.set(id, intervalId);

    return () => this.removeAnimation(id);
  }

  /**
   * Anime un élément avec rotation au tempo
   */
  addRotationAnimation(id, element, options = {}) {
    const {
      speed = 1,
    } = options;

    let rotation = 0;

    const animate = () => {
      if (!element) return;

      const bpm = this.tempoManager.getCurrentBPM();
      const increment = (bpm / 60) * speed;
      rotation = (rotation + increment) % 360;
      
      element.style.transform = `rotate(${rotation}deg)`;
    };

    const intervalId = setInterval(animate, 16);
    this.animations.set(id, intervalId);

    return () => this.removeAnimation(id);
  }

  /**
   * Anime la couleur au tempo
   */
  addColorAnimation(id, element, colors = ['#12b886', '#4dabf7']) {
    const animate = () => {
      if (!element) return;

      const progress = this.tempoManager.getBeatProgress();
      const colorIndex = Math.floor(progress * colors.length);
      const color = colors[colorIndex] || colors[0];
      
      element.style.backgroundColor = color;
    };

    const intervalId = setInterval(animate, 16);
    this.animations.set(id, intervalId);

    return () => this.removeAnimation(id);
  }

  /**
   * Supprime une animation
   */
  removeAnimation(id) {
    const intervalId = this.animations.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.animations.delete(id);
    }
  }

  /**
   * Supprime toutes les animations
   */
  removeAllAnimations() {
    for (const intervalId of this.animations.values()) {
      clearInterval(intervalId);
    }
    this.animations.clear();
  }
}

/**
 * Classe pour visualiser le tempo
 */
export class TempoVisualizer {
  /**
   * Génère des barres de visualisation du tempo
   */
  static generateBeatBars(beatCount, barSize = 4) {
    const bars = [];
    const currentBar = Math.floor(beatCount / barSize);
    const beatInBar = beatCount % barSize;

    for (let i = 0; i < barSize; i++) {
      bars.push({
        index: i,
        active: i < beatInBar,
        intensity: i === beatInBar - 1 ? 1.0 : 0.5,
      });
    }

    return bars;
  }

  /**
   * Génère un indicateur de BPM visuel
   */
  static getBPMIndicator(bpm) {
    const normalized = (bpm - TEMPO.BASE_BPM) / (TEMPO.MAX_BPM - TEMPO.BASE_BPM);
    
    return {
      percentage: Math.round(normalized * 100),
      color: this.getBPMColor(normalized),
      label: `${Math.round(bpm)} BPM`,
    };
  }

  /**
   * Obtient la couleur selon le BPM
   */
  static getBPMColor(normalized) {
    if (normalized >= 0.8) return '#fa5252'; // Rouge (très rapide)
    if (normalized >= 0.6) return '#fab005'; // Jaune (rapide)
    if (normalized >= 0.4) return '#12b886'; // Vert (moyen)
    return '#4dabf7'; // Bleu (lent)
  }

  /**
   * Génère un cercle de progression du beat
   */
  static getBeatCircle(progress) {
    const angle = progress * 360;
    
    return {
      angle,
      strokeDasharray: `${angle} ${360 - angle}`,
      rotation: -90, // Commencer en haut
    };
  }
}

/**
 * Factory pour créer un TempoManager
 */
export function createTempoManager(initialBPM, callbacks) {
  return new TempoManager(initialBPM, callbacks);
}

/**
 * Factory pour créer un TempoAnimator
 */
export function createTempoAnimator(tempoManager) {
  return new TempoAnimator(tempoManager);
}
