/**
 * Utilitaires pour la génération et manipulation de la grille
 */

import { COLS, ROWS } from '../config/gameConfig.js';
import { generateEnrichedGrid } from '../lib/gridGenerator.js';

/**
 * Choisit une cellule aléatoire pour placer un cœur sur un chemin
 * Évite le début et la fin si possible
 * @param {Array<{r: number, c: number}>} pathArr - Chemin
 * @returns {{r: number, c: number}|null} Position du cœur ou null
 */
export function pickHeartForPath(pathArr) {
  try {
    if (!Array.isArray(pathArr) || pathArr.length === 0) return null;
    const n = pathArr.length;
    // Préfère les indices [1, n-2] pour éviter début/fin
    const start = n >= 3 ? 1 : 0;
    const end = n >= 3 ? (n - 2) : (n - 1);
    const idx = start + Math.floor(Math.random() * (end - start + 1));
    const p = pathArr[idx];
    if (!p || typeof p.r !== 'number' || typeof p.c !== 'number') return null;
    return { r: p.r, c: p.c };
  } catch (_) {
    return null;
  }
}

/**
 * Génère jusqu'à 2 cellules leurres adjacentes au chemin (mode solo niveau >= 5)
 * @param {Array<{r: number, c: number}>} path - Chemin
 * @param {number} soloLevel - Niveau solo actuel
 * @returns {Set<string>} Set de clés 'r-c' des cellules leurres
 */
export function generateSoloDecoys(path, soloLevel) {
  const decoys = new Set();
  // Seulement pour solo et niveau >= 5
  if (soloLevel < 5) return decoys;
  
  const pathSet = new Set(path.map(p => `${p.r}-${p.c}`));
  const candidates = new Set();
  
  for (const p of path) {
    const neigh = [
      { r: p.r - 1, c: p.c },
      { r: p.r + 1, c: p.c },
      { r: p.r, c: p.c - 1 },
      { r: p.r, c: p.c + 1 },
    ];
    for (const n of neigh) {
      if (n.r < 0 || n.r >= ROWS || n.c < 0 || n.c >= COLS) continue;
      const key = `${n.r}-${n.c}`;
      if (!pathSet.has(key)) candidates.add(key);
    }
  }
  
  const candArr = Array.from(candidates);
  // Mélange
  for (let i = candArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candArr[i], candArr[j]] = [candArr[j], candArr[i]];
  }
  
  // Prend jusqu'à 2
  const picks = candArr.slice(0, 2);
  for (const k of picks) decoys.add(k);
  
  return decoys;
}

/**
 * Partitionne les cellules de bordure en 40% rollback, 40% stun, 20% life-loss
 * @param {Array<{r: number, c: number}>} path - Chemin
 * @returns {{rollback: Set<string>, stun: Set<string>, lifeLoss: Set<string>}}
 */
export function generateBorderHazards(path) {
  const rollback = new Set();
  const stun = new Set();
  const lifeLoss = new Set();
  
  const pathSet = new Set(path.map(p => `${p.r}-${p.c}`));
  const candidates = new Set();
  
  for (const p of path) {
    const neigh = [
      { r: p.r - 1, c: p.c }, 
      { r: p.r + 1, c: p.c },
      { r: p.r, c: p.c - 1 }, 
      { r: p.r, c: p.c + 1 },
    ];
    for (const n of neigh) {
      if (n.r < 0 || n.r >= ROWS || n.c < 0 || n.c >= COLS) continue;
      const key = `${n.r}-${n.c}`;
      if (!pathSet.has(key)) candidates.add(key);
    }
  }
  
  const arr = Array.from(candidates);
  // Mélange
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  const total = arr.length;
  const takeRollback = Math.floor(total * 0.4);
  const takeStun = Math.floor(total * 0.4);
  
  const rollbackSlice = arr.slice(0, takeRollback);
  const stunSlice = arr.slice(takeRollback, takeRollback + takeStun);
  const lifeSlice = arr.slice(takeRollback + takeStun);
  
  for (const k of rollbackSlice) rollback.add(k);
  for (const k of stunSlice) stun.add(k);
  for (const k of lifeSlice) lifeLoss.add(k);
  
  return { rollback, stun, lifeLoss };
}

/**
 * Applique la grille enrichie générée par gridGenerator.js
 * @param {Array<{r: number, c: number}>} path - Chemin
 * @param {number} floorNumber - Numéro de l'étage (commence à 1)
 * @param {Object} runCounters - Compteurs globaux pour maxPerRun
 * @param {number} bonusChanceModifier - Modificateur de chance pour les bonus (champion passive)
 * @returns {{grid: Array, rollback: Set, stun: Set, lifeLoss: Set, newCounters: Object}}
 */
export function applyEnrichedGrid(path, floorNumber = 1, runCounters = { gem: 0, potion: 0 }, bonusChanceModifier = 0) {
  // Générer la grille enrichie
  const { grid, runCounters: newCounters } = generateEnrichedGrid(path, floorNumber, runCounters, bonusChanceModifier);
  
  const rollback = new Set();
  const stun = new Set();
  const lifeLoss = new Set();
  
  // Parcourir la grille et extraire les pièges
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const key = `${r}-${c}`;
      
      if (cell.type === 'trap_life') {
        lifeLoss.add(key);
      } else if (cell.type === 'trap_back2') {
        rollback.add(key);
      } else if (cell.type === 'trap_stun') {
        stun.add(key);
      }
    }
  }
  
  return { grid, rollback, stun, lifeLoss, newCounters };
}
