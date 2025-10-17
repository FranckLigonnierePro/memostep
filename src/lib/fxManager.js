/**
 * FXManager - Gestion des effets visuels et sonores
 * Coordonne les animations, particules, sons selon les états du flow
 */

import { VISUAL_FX, SOUND_FX, TIMINGS } from './flowConfig.js';

/**
 * Classe de gestion des effets visuels
 */
export class VisualFXManager {
  constructor(callbacks = {}) {
    this.callbacks = {
      onGlow: callbacks.onGlow || (() => {}),
      onShake: callbacks.onShake || (() => {}),
      onPerfectHalo: callbacks.onPerfectHalo || (() => {}),
      onJackpotExplosion: callbacks.onJackpotExplosion || (() => {}),
      onPulse: callbacks.onPulse || (() => {}),
    };

    this.activeEffects = new Map();
  }

  /**
   * Effet glow sur une cellule (input correct)
   */
  triggerGlow(cell, color = '#12b886') {
    const key = `glow-${cell.r}-${cell.c}`;
    
    this.callbacks.onGlow({
      cell,
      color,
      duration: VISUAL_FX.GLOW_DURATION,
    });

    // Auto-cleanup
    if (this.activeEffects.has(key)) {
      clearTimeout(this.activeEffects.get(key));
    }

    const timeout = setTimeout(() => {
      this.activeEffects.delete(key);
    }, VISUAL_FX.GLOW_DURATION);

    this.activeEffects.set(key, timeout);
  }

  /**
   * Effet shake sur une cellule (erreur)
   */
  triggerShake(cell, intensity = 1.0) {
    const key = `shake-${cell.r}-${cell.c}`;
    
    this.callbacks.onShake({
      cell,
      intensity,
      duration: VISUAL_FX.ERROR_SHAKE_DURATION,
    });

    // Auto-cleanup
    if (this.activeEffects.has(key)) {
      clearTimeout(this.activeEffects.get(key));
    }

    const timeout = setTimeout(() => {
      this.activeEffects.delete(key);
    }, VISUAL_FX.ERROR_SHAKE_DURATION);

    this.activeEffects.set(key, timeout);
  }

  /**
   * Effet halo pour motif parfait
   */
  triggerPerfectHalo() {
    this.callbacks.onPerfectHalo({
      scale: VISUAL_FX.PERFECT_HALO_SIZE,
      duration: TIMINGS.PERFECT_FX,
    });

    const timeout = setTimeout(() => {
      this.activeEffects.delete('perfect-halo');
    }, TIMINGS.PERFECT_FX);

    this.activeEffects.set('perfect-halo', timeout);
  }

  /**
   * Effet explosion de particules pour jackpot
   */
  triggerJackpotExplosion() {
    this.callbacks.onJackpotExplosion({
      particleCount: VISUAL_FX.JACKPOT_PARTICLES,
      duration: TIMINGS.JACKPOT_FX,
    });

    const timeout = setTimeout(() => {
      this.activeEffects.delete('jackpot-explosion');
    }, TIMINGS.JACKPOT_FX);

    this.activeEffects.set('jackpot-explosion', timeout);
  }

  /**
   * Effet pulse au tempo (pendant observation)
   */
  triggerPulse(cell, bpm) {
    const interval = 60000 / bpm; // Convertir BPM en ms

    this.callbacks.onPulse({
      cell,
      interval,
    });
  }

  /**
   * Nettoie tous les effets actifs
   */
  cleanup() {
    for (const timeout of this.activeEffects.values()) {
      clearTimeout(timeout);
    }
    this.activeEffects.clear();
  }
}

/**
 * Classe de gestion des effets sonores
 */
export class AudioFXManager {
  constructor() {
    this.sounds = new Map();
    this.muted = false;
    this.volume = 1.0;
  }

  /**
   * Charge un son
   */
  loadSound(id, url) {
    const audio = new Audio(url);
    audio.volume = this.volume;
    this.sounds.set(id, audio);
    return audio;
  }

  /**
   * Joue un son
   */
  play(id, options = {}) {
    if (this.muted) return;

    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[AudioFX] Sound not found: ${id}`);
      return;
    }

    const {
      volume = 1.0,
      rate = 1.0,
      loop = false,
    } = options;

    sound.volume = this.volume * volume;
    sound.playbackRate = rate;
    sound.loop = loop;

    // Reset et jouer
    sound.currentTime = 0;
    sound.play().catch(err => {
      console.warn('[AudioFX] Play failed:', err);
    });
  }

  /**
   * Arrête un son
   */
  stop(id) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  /**
   * Joue le tick d'observation (au tempo)
   */
  playObserveTick(bpm) {
    const rate = bpm / 100; // Ajuster la vitesse selon le BPM
    this.play(SOUND_FX.OBSERVE_TICK, { rate });
  }

  /**
   * Joue le son d'input correct
   */
  playInputCorrect(combo) {
    // Pitch plus élevé avec le combo
    const rate = 1.0 + (combo - 1.0) * 0.1;
    this.play(SOUND_FX.INPUT_CORRECT, { rate: Math.min(rate, 2.0) });
  }

  /**
   * Joue le son d'erreur
   */
  playInputError() {
    this.play(SOUND_FX.INPUT_ERROR);
  }

  /**
   * Joue le son de perfect
   */
  playPerfect() {
    this.play(SOUND_FX.PERFECT);
  }

  /**
   * Joue le son de jackpot
   */
  playJackpot() {
    this.play(SOUND_FX.JACKPOT);
  }

  /**
   * Joue le son de combo up
   */
  playComboUp() {
    this.play(SOUND_FX.COMBO_UP);
  }

  /**
   * Active/désactive le son
   */
  setMuted(muted) {
    this.muted = muted;
  }

  /**
   * Définit le volume global
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Mettre à jour tous les sons
    for (const sound of this.sounds.values()) {
      sound.volume = this.volume;
    }
  }

  /**
   * Nettoie tous les sons
   */
  cleanup() {
    for (const sound of this.sounds.values()) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

/**
 * Générateur de particules pour les effets
 */
export class ParticleGenerator {
  /**
   * Génère des particules pour l'explosion jackpot
   */
  static generateJackpotParticles(count, centerX, centerY) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 2 + Math.random() * 3;
      const size = 4 + Math.random() * 8;
      const color = this.getRandomJackpotColor();
      
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size,
        color,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
    
    return particles;
  }

  /**
   * Génère des particules pour le perfect halo
   */
  static generatePerfectParticles(count, centerX, centerY, radius) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      particles.push({
        x,
        y,
        angle,
        radius,
        size: 3,
        color: '#12b886',
        life: 1.0,
        decay: 0.015,
      });
    }
    
    return particles;
  }

  /**
   * Couleurs aléatoires pour le jackpot
   */
  static getRandomJackpotColor() {
    const colors = [
      '#FFD700', // Or
      '#12b886', // Vert
      '#4dabf7', // Bleu
      '#fa5252', // Rouge
      '#fab005', // Jaune
      '#cc5de8', // Violet
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Met à jour les particules (pour animation)
   */
  static updateParticles(particles, deltaTime = 16) {
    const active = [];
    
    for (const p of particles) {
      p.life -= p.decay;
      
      if (p.life > 0) {
        // Mise à jour position
        if (p.vx !== undefined) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1; // Gravité
        }
        
        active.push(p);
      }
    }
    
    return active;
  }
}

/**
 * Gestionnaire de couleurs pour les états
 */
export class ColorManager {
  static getStateColor(state) {
    const colors = {
      OBSERVE: '#4dabf7',
      INPUT: '#12b886',
      REWARD: '#FFD700',
      TRANSITION: '#868e96',
    };
    return colors[state] || '#ffffff';
  }

  static getBranchColor(branch) {
    const colors = {
      FLOW_CHAIN: '#12b886',
      QUICK_PREVIEW: '#fab005',
      FULL_PREVIEW: '#4dabf7',
    };
    return colors[branch] || '#ffffff';
  }

  static getComboColor(combo) {
    if (combo >= 3.0) return '#FFD700'; // Or
    if (combo >= 2.0) return '#12b886'; // Vert
    if (combo >= 1.5) return '#4dabf7'; // Bleu
    return '#868e96'; // Gris
  }

  static getErrorColor(errorCount, tolerance) {
    const ratio = errorCount / tolerance;
    if (ratio >= 0.8) return '#fa5252'; // Rouge
    if (ratio >= 0.5) return '#fab005'; // Jaune
    return '#12b886'; // Vert
  }
}

/**
 * Factory pour créer un VisualFXManager
 */
export function createVisualFXManager(callbacks) {
  return new VisualFXManager(callbacks);
}

/**
 * Factory pour créer un AudioFXManager
 */
export function createAudioFXManager() {
  return new AudioFXManager();
}
