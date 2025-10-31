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
 * Contrainte: Maximum 3 cases consécutives dans la même colonne
 * @returns {Array<{r: number, c: number}>} Chemin généré
 */
export function randomPath() {
  const arr = [];
  let c = Math.floor(Math.random() * COLS);
  let consecutiveCount = 1; // Compteur de cases consécutives dans la même colonne
  
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      let moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      
      // Si on a déjà 3 cases consécutives dans la même colonne, forcer un changement
      if (consecutiveCount >= 3) {
        moves = moves.filter(nc => nc !== c);
      }
      
      // Si aucun mouvement disponible (ne devrait pas arriver), forcer un mouvement
      if (moves.length === 0) {
        moves = [-1, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      }
      
      const newC = moves[Math.floor(Math.random() * moves.length)];
      
      // Mettre à jour le compteur
      if (newC === c) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
      }
      
      c = newC;
    }
    arr.push({ r, c });
  }
  return arr;
}

/**
 * Génère un chemin avec un RNG déterministe
 * Contrainte: Maximum 3 cases consécutives dans la même colonne
 * @param {Function} rng - Fonction RNG
 * @returns {Array<{r: number, c: number}>} Chemin généré
 */
export function randomPathWithRng(rng) {
  const arr = [];
  let c = Math.floor(rng() * COLS);
  let consecutiveCount = 1; // Compteur de cases consécutives dans la même colonne
  
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      let moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      
      // Si on a déjà 3 cases consécutives dans la même colonne, forcer un changement
      if (consecutiveCount >= 3) {
        moves = moves.filter(nc => nc !== c);
      }
      
      // Si aucun mouvement disponible (ne devrait pas arriver), forcer un mouvement
      if (moves.length === 0) {
        moves = [-1, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      }
      
      const newC = moves[Math.floor(rng() * moves.length)];
      
      // Mettre à jour le compteur
      if (newC === c) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
      }
      
      c = newC;
    }
    arr.push({ r, c });
  }
  return arr;
}

/**
 * Génère un chemin avec un RNG déterministe et une colonne de départ forcée
 * Contrainte: Maximum 3 cases consécutives dans la même colonne
 * @param {Function} rng - Fonction RNG
 * @param {number} startCol - Colonne de départ (0 à COLS-1)
 * @returns {Array<{r: number, c: number}>} Chemin généré
 */
export function randomPathWithRngAndStart(rng, startCol) {
  const arr = [];
  let c = Math.max(0, Math.min(COLS - 1, startCol));
  let consecutiveCount = 1; // Compteur de cases consécutives dans la même colonne
  
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      let moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      
      // Si on a déjà 3 cases consécutives dans la même colonne, forcer un changement
      if (consecutiveCount >= 3) {
        moves = moves.filter(nc => nc !== c);
      }
      
      // Si aucun mouvement disponible (ne devrait pas arriver), forcer un mouvement
      if (moves.length === 0) {
        moves = [-1, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      }
      
      const newC = moves[Math.floor(rng() * moves.length)];
      
      // Mettre à jour le compteur
      if (newC === c) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
      }
      
      c = newC;
    }
    arr.push({ r, c });
  }
  return arr;
}
