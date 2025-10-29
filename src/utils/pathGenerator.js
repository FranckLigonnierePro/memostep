/**
 * Générateurs de chemins pour le jeu
 */

import { COLS, ROWS } from '../config/gameConfig.js';

/**
 * RNG déterministe (Mulberry32)
 * @param {number} seed - Seed pour le générateur
 * @returns {Function} Fonction qui retourne un nombre aléatoire entre 0 et 1
 */
export function seededRng(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Hash déterministe d'une chaîne
 * @param {string} s - Chaîne à hasher
 * @returns {number} Hash de la chaîne
 */
export function hashString(s) {
  let hash = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Génère un chemin aléatoire simple
 * @returns {Array<{r: number, c: number}>} Chemin généré
 */
export function randomPath() {
  const arr = [];
  let c = Math.floor(Math.random() * COLS);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      const moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      c = moves[Math.floor(Math.random() * moves.length)];
    }
    arr.push({ r, c });
  }
  return arr;
}

/**
 * Génère un chemin avec un RNG déterministe
 * @param {Function} rng - Fonction RNG
 * @returns {Array<{r: number, c: number}>} Chemin généré
 */
export function randomPathWithRng(rng) {
  const arr = [];
  let c = Math.floor(rng() * COLS);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      const moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      c = moves[Math.floor(rng() * moves.length)];
    }
    arr.push({ r, c });
  }
  return arr;
}

/**
 * Génère un chemin avec un RNG déterministe et une colonne de départ forcée
 * @param {Function} rng - Fonction RNG
 * @param {number} startCol - Colonne de départ (0 à COLS-1)
 * @returns {Array<{r: number, c: number}>} Chemin généré
 */
export function randomPathWithRngAndStart(rng, startCol) {
  const arr = [];
  let c = Math.max(0, Math.min(COLS - 1, startCol));
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      const moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      c = moves[Math.floor(rng() * moves.length)];
    }
    arr.push({ r, c });
  }
  return arr;
}
