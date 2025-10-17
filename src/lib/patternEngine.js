/**
 * PatternEngine - Moteur de génération de motifs pour MemoStep 6×6 Flow
 * Génère des séquences spatiales de 3-6 cases avec validation de voisinage
 */

import { GRID, PATTERN } from './flowConfig.js';

/**
 * Générateur de nombres pseudo-aléatoires avec seed (LCG)
 * Permet de générer des motifs reproductibles pour le mode daily
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Classe principale du moteur de génération de motifs
 */
export class PatternEngine {
  constructor(seed = null) {
    this.rng = seed !== null ? new SeededRandom(seed) : null;
    this.cols = GRID.COLS;
    this.rows = GRID.ROWS;
  }

  /**
   * Génère un nombre aléatoire (avec ou sans seed)
   */
  random() {
    return this.rng ? this.rng.next() : Math.random();
  }

  /**
   * Génère un entier aléatoire entre min et max (inclus)
   */
  randomInt(min, max) {
    return this.rng 
      ? this.rng.nextInt(min, max)
      : Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Vérifie si une cellule est valide (dans la grille)
   */
  isValidCell(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /**
   * Obtient les voisins directs d'une cellule (haut, bas, gauche, droite)
   */
  getDirectNeighbors(r, c) {
    const neighbors = [];
    const directions = [
      [-1, 0], // haut
      [1, 0],  // bas
      [0, -1], // gauche
      [0, 1],  // droite
    ];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isValidCell(nr, nc)) {
        neighbors.push({ r: nr, c: nc });
      }
    }

    return neighbors;
  }

  /**
   * Obtient tous les voisins (incluant diagonales)
   */
  getAllNeighbors(r, c) {
    const neighbors = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isValidCell(nr, nc)) {
        neighbors.push({ r: nr, c: nc });
      }
    }

    return neighbors;
  }

  /**
   * Calcule la distance de Manhattan entre deux cellules
   */
  manhattanDistance(cell1, cell2) {
    return Math.abs(cell1.r - cell2.r) + Math.abs(cell1.c - cell2.c);
  }

  /**
   * Vérifie si une cellule est déjà dans le pattern
   */
  isInPattern(cell, pattern) {
    return pattern.some(p => p.r === cell.r && p.c === cell.c);
  }

  /**
   * Sélectionne un voisin aléatoire qui n'est pas déjà dans le pattern
   */
  selectRandomNeighbor(cell, pattern, allowDiagonal = true) {
    const neighbors = allowDiagonal 
      ? this.getAllNeighbors(cell.r, cell.c)
      : this.getDirectNeighbors(cell.r, cell.c);

    // Filtrer les voisins déjà dans le pattern
    const available = neighbors.filter(n => !this.isInPattern(n, pattern));

    if (available.length === 0) {
      return null;
    }

    // Sélectionner aléatoirement
    const index = this.randomInt(0, available.length - 1);
    return available[index];
  }

  /**
   * Génère une cellule de départ aléatoire
   */
  generateStartCell() {
    return {
      r: this.randomInt(0, this.rows - 1),
      c: this.randomInt(0, this.cols - 1),
    };
  }

  /**
   * Génère un motif de longueur spécifique
   * @param {number} length - Longueur du motif (entre MIN_PATTERN_LENGTH et MAX_PATTERN_LENGTH)
   * @param {object} options - Options de génération
   * @returns {Array} Pattern [{r, c}, ...]
   */
  generatePattern(length = null, options = {}) {
    const {
      allowDiagonal = true,
      maxAttempts = 100,
      startCell = null,
    } = options;

    // Déterminer la longueur
    const patternLength = length !== null 
      ? Math.max(PATTERN.MIN_LENGTH, Math.min(length, PATTERN.MAX_LENGTH))
      : this.randomInt(PATTERN.MIN_LENGTH, PATTERN.MAX_LENGTH);

    let attempts = 0;
    let pattern = [];

    while (attempts < maxAttempts) {
      pattern = [];
      
      // Cellule de départ
      const start = startCell || this.generateStartCell();
      pattern.push(start);

      // Générer les cellules suivantes
      let stuck = false;
      while (pattern.length < patternLength && !stuck) {
        const lastCell = pattern[pattern.length - 1];
        const nextCell = this.selectRandomNeighbor(lastCell, pattern, allowDiagonal);

        if (nextCell === null) {
          // Bloqué, recommencer
          stuck = true;
        } else {
          pattern.push(nextCell);
        }
      }

      // Vérifier si le pattern est complet
      if (pattern.length === patternLength) {
        return pattern;
      }

      attempts++;
    }

    // Si échec après maxAttempts, retourner un pattern simple en ligne
    console.warn('[PatternEngine] Failed to generate pattern, using fallback');
    return this.generateFallbackPattern(patternLength);
  }

  /**
   * Génère un pattern de secours (ligne simple)
   */
  generateFallbackPattern(length) {
    const pattern = [];
    const startR = this.randomInt(0, this.rows - 1);
    const startC = this.randomInt(0, this.cols - length);

    for (let i = 0; i < length; i++) {
      pattern.push({ r: startR, c: startC + i });
    }

    return pattern;
  }

  /**
   * Génère une séquence de motifs pour le mode daily
   * @param {number} count - Nombre de motifs
   * @param {string} difficulty - 'easy', 'medium', 'hard'
   * @returns {Array} Liste de patterns
   */
  generateDailySequence(count = 5, difficulty = 'progressive') {
    const patterns = [];

    if (difficulty === 'progressive') {
      // Progression facile → difficile
      for (let i = 0; i < count; i++) {
        const length = PATTERN.MIN_LENGTH + Math.floor((i / (count - 1)) * (PATTERN.MAX_LENGTH - PATTERN.MIN_LENGTH));
        patterns.push(this.generatePattern(length));
      }
    } else {
      // Difficulté fixe
      const lengthMap = {
        easy: PATTERN.MIN_LENGTH,
        medium: Math.floor((PATTERN.MIN_LENGTH + PATTERN.MAX_LENGTH) / 2),
        hard: PATTERN.MAX_LENGTH,
      };
      const length = lengthMap[difficulty] || PATTERN.MIN_LENGTH;

      for (let i = 0; i < count; i++) {
        patterns.push(this.generatePattern(length));
      }
    }

    return patterns;
  }

  /**
   * Valide qu'un pattern est jouable (pas de cellules isolées, etc.)
   */
  validatePattern(pattern) {
    if (!pattern || pattern.length < PATTERN.MIN_LENGTH) {
      return false;
    }

    // Vérifier que toutes les cellules sont valides
    for (const cell of pattern) {
      if (!this.isValidCell(cell.r, cell.c)) {
        return false;
      }
    }

    // Vérifier que les cellules sont connectées (chaque cellule est voisine de la précédente)
    for (let i = 1; i < pattern.length; i++) {
      const dist = this.manhattanDistance(pattern[i - 1], pattern[i]);
      if (dist > 2) { // Distance max (diagonale = 2 en Manhattan)
        return false;
      }
    }

    return true;
  }
}

/**
 * Fonction helper pour créer un moteur avec seed daily
 */
export function createDailyEngine() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return new PatternEngine(seed);
}

/**
 * Fonction helper pour créer un moteur aléatoire
 */
export function createRandomEngine() {
  return new PatternEngine();
}
