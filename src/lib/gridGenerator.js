/**
 * gridGenerator.js
 * 
 * Génère des grilles de jeu dynamiques basées sur gridContent.json
 * Respecte les probabilités, limites et règles de placement définies dans le JSON
 */

import gridConfig from './gridContent.json';

const COLS = 4;
const ROWS = 10;

/**
 * Calcule la probabilité dynamique selon l'étage
 * @param {number} baseChance - Probabilité de base
 * @param {number} perFloorBonus - Bonus par étage
 * @param {number} maxChance - Probabilité maximale
 * @param {number} floorNumber - Numéro de l'étage
 * @returns {number} Probabilité calculée
 */
function calculateChance(baseChance, perFloorBonus, maxChance, floorNumber) {
  return Math.min(baseChance + (floorNumber * perFloorBonus), maxChance);
}

/**
 * Vérifie si une case est adjacente au chemin
 * @param {number} r - Ligne
 * @param {number} c - Colonne
 * @param {Set} pathSet - Set des clés 'r-c' du chemin
 * @returns {boolean}
 */
function isAdjacentToPath(r, c, pathSet) {
  const neighbors = [
    `${r-1}-${c}`, `${r+1}-${c}`,
    `${r}-${c-1}`, `${r}-${c+1}`
  ];
  return neighbors.some(key => pathSet.has(key));
}

/**
 * Génère une grille enrichie avec pièges et bonus selon gridContent.json
 * @param {Array} path - Chemin [{r, c}, ...]
 * @param {number} floorNumber - Numéro de l'étage (commence à 1)
 * @param {Object} runCounters - Compteurs pour maxPerRun {gem: 0, potion: 0}
 * @returns {Object} { grid, runCounters } - grid[row][col] = {type, value?, ...}
 */
export function generateEnrichedGrid(path, floorNumber = 1, runCounters = { gem: 0, potion: 0 }) {
  // Initialiser la grille vide
  const grid = Array.from({ length: ROWS }, () => 
    Array.from({ length: COLS }, () => null)
  );
  
  // Créer un Set du chemin pour recherche rapide
  const pathSet = new Set(path.map(p => `${p.r}-${p.c}`));
  
  // Marquer les cases du chemin
  path.forEach(p => {
    grid[p.r][p.c] = { type: 'path' };
  });
  
  // Compteurs pour les limites par étage
  const floorCounters = {
    gold: 0,
    essence: 0,
    traps: 0 // 1 piège max par ligne
  };
  
  // === PHASE 1: Placer les bonus et pièges sur les cases NON-CHEMIN ===
  
  // Collecter toutes les cases adjacentes au chemin (non-chemin)
  const adjacentCells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r}-${c}`;
      if (!pathSet.has(key) && isAdjacentToPath(r, c, pathSet)) {
        adjacentCells.push({ r, c });
      }
    }
  }
  
  // Mélanger les cases adjacentes pour placement aléatoire
  shuffleArray(adjacentCells);
  
  // Placer les éléments ligne par ligne pour respecter maxPerLine
  for (let r = 0; r < ROWS; r++) {
    let trapsThisLine = 0;
    
    // Filtrer les cases adjacentes de cette ligne
    const lineCells = adjacentCells.filter(cell => cell.r === r);
    
    for (const cell of lineCells) {
      const { r, c } = cell;
      
      // Si déjà occupé, passer
      if (grid[r][c] !== null) continue;
      
      // === PIÈGES (adjacent_to_path uniquement, max 1 par ligne) ===
      if (trapsThisLine === 0) {
        // Piège: perte de vie
        const trapLife = gridConfig.traps.life_loss;
        if (floorNumber >= trapLife.limits.noTrapBeforeFloor) {
          const chanceLife = calculateChance(
            trapLife.baseChancePerLine,
            trapLife.perFloorBonus,
            trapLife.maxChance,
            floorNumber
          );
          if (Math.random() < chanceLife) {
            grid[r][c] = { type: trapLife.type };
            trapsThisLine++;
            continue;
          }
        }
        
        // Piège: recul de 2
        const trapBack = gridConfig.traps.back_two;
        if (floorNumber >= trapBack.limits.noTrapBeforeFloor) {
          const chanceBack = calculateChance(
            trapBack.baseChancePerLine,
            trapBack.perFloorBonus,
            trapBack.maxChance,
            floorNumber
          );
          if (Math.random() < chanceBack) {
            grid[r][c] = { type: trapBack.type };
            trapsThisLine++;
            continue;
          }
        }
        
        // Piège: stun
        const trapStun = gridConfig.traps.stun;
        if (floorNumber >= trapStun.limits.noTrapBeforeFloor) {
          const chanceStun = calculateChance(
            trapStun.baseChancePerLine,
            trapStun.perFloorBonus,
            trapStun.maxChance,
            floorNumber
          );
          if (Math.random() < chanceStun) {
            grid[r][c] = { type: trapStun.type };
            trapsThisLine++;
            continue;
          }
        }
      }
      
      // === BONUS (adjacent_to_path) ===
      
      // Or (maxPerFloor: 2)
      const bonusGold = gridConfig.bonuses.gold;
      if (floorCounters.gold < bonusGold.maxPerFloor) {
        const chanceGold = calculateChance(
          bonusGold.baseChancePerFloor / ROWS, // Diviser par lignes pour avoir une chance par case
          bonusGold.perFloorBonus / ROWS,
          bonusGold.maxChance / ROWS,
          floorNumber
        );
        if (Math.random() < chanceGold) {
          const value = randomInt(bonusGold.valueMin, bonusGold.valueMax);
          grid[r][c] = { type: bonusGold.type, value };
          floorCounters.gold++;
          continue;
        }
      }
      
      // Gemme (maxPerRun: 1)
      const bonusGem = gridConfig.bonuses.gem;
      if (runCounters.gem < bonusGem.maxPerRun) {
        const chanceGem = calculateChance(
          bonusGem.baseChancePerFloor / ROWS,
          bonusGem.perFloorBonus / ROWS,
          bonusGem.maxChance / ROWS,
          floorNumber
        );
        if (Math.random() < chanceGem) {
          grid[r][c] = { type: bonusGem.type };
          runCounters.gem++;
          continue;
        }
      }
      
      // Potion (maxPerRun: 1, pas sur première ligne)
      const bonusPotion = gridConfig.bonuses.potion;
      if (r > 0 && runCounters.potion < bonusPotion.maxPerRun) {
        const chancePotion = calculateChance(
          bonusPotion.baseChancePerFloor / ROWS,
          bonusPotion.perFloorBonus / ROWS,
          bonusPotion.maxChance / ROWS,
          floorNumber
        );
        if (Math.random() < chancePotion) {
          grid[r][c] = { type: bonusPotion.type };
          runCounters.potion++;
          continue;
        }
      }
      
      // Essence (adjacent, maxPerFloor: 1) - NE PAS placer sur le chemin ici
      const bonusEssence = gridConfig.bonuses.essence;
      if (floorCounters.essence < bonusEssence.maxPerFloor) {
        const chanceEssence = calculateChance(
          bonusEssence.baseChancePerFloor / ROWS,
          bonusEssence.perFloorBonus / ROWS,
          bonusEssence.maxChance / ROWS,
          floorNumber
        );
        if (Math.random() < chanceEssence) {
          grid[r][c] = { type: bonusEssence.type };
          floorCounters.essence++;
          continue;
        }
      }
    }
  }
  
  // === PHASE 2: Enrichir les cases du CHEMIN avec or/essence ===
  
  for (const p of path) {
    const { r, c } = p;
    
    // Or sur le chemin
    const pathGold = gridConfig.cells.path.canContain.gold;
    const chancePathGold = calculateChance(
      pathGold.baseChance,
      pathGold.perFloorBonus,
      pathGold.maxChance,
      floorNumber
    );
    if (Math.random() < chancePathGold) {
      const value = randomInt(pathGold.valueMin, pathGold.valueMax);
      grid[r][c] = { type: 'path', gold: value };
      continue;
    }
    
    // Essence sur le chemin (si pas déjà atteint maxPerFloor)
    if (floorCounters.essence < gridConfig.bonuses.essence.maxPerFloor) {
      const pathEssence = gridConfig.cells.path.canContain.essence;
      const chancePathEssence = calculateChance(
        pathEssence.baseChance,
        pathEssence.perFloorBonus,
        pathEssence.maxChance,
        floorNumber
      );
      if (Math.random() < chancePathEssence) {
        grid[r][c] = { type: 'path', essence: pathEssence.value };
        floorCounters.essence++;
        continue;
      }
    }
  }
  
  // === PHASE 3: Remplir les cases vides avec "neutral" ===
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = { type: 'neutral' };
      }
    }
  }
  
  return { grid, runCounters };
}

/**
 * Génère un entier aléatoire entre min et max (inclus)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mélange un tableau en place (Fisher-Yates)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Génère un chemin aléatoire (compatible avec le code existant)
 * @returns {Array} [{r, c}, ...]
 */
export function generateRandomPath() {
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
 * Affiche une grille dans la console pour débogage
 */
export function debugGrid(grid, floorNumber) {
  console.log(`\n=== GRILLE ÉTAGE ${floorNumber} ===`);
  
  const stats = {
    path: 0,
    neutral: 0,
    trap_life: 0,
    trap_back2: 0,
    trap_stun: 0,
    gold: 0,
    gem: 0,
    essence: 0,
    potion: 0,
    pathWithGold: 0,
    pathWithEssence: 0
  };
  
  for (let r = 0; r < ROWS; r++) {
    const line = [];
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      
      if (cell.type === 'path') {
        stats.path++;
        if (cell.gold) {
          line.push(`P+${cell.gold}💰`);
          stats.pathWithGold++;
        } else if (cell.essence) {
          line.push(`P+${cell.essence}⚡`);
          stats.pathWithEssence++;
        } else {
          line.push('PATH');
        }
      } else if (cell.type === 'neutral') {
        line.push('.....');
        stats.neutral++;
      } else if (cell.type === 'trap_life') {
        line.push('💔TRP');
        stats.trap_life++;
      } else if (cell.type === 'trap_back2') {
        line.push('⬅️TRP');
        stats.trap_back2++;
      } else if (cell.type === 'trap_stun') {
        line.push('⚡TRP');
        stats.trap_stun++;
      } else if (cell.type === 'gold') {
        line.push(`${cell.value}💰`);
        stats.gold++;
      } else if (cell.type === 'gem') {
        line.push('💎GEM');
        stats.gem++;
      } else if (cell.type === 'essence') {
        line.push('⚡ESS');
        stats.essence++;
      } else if (cell.type === 'potion') {
        line.push('🧪POT');
        stats.potion++;
      } else {
        line.push('?????');
      }
    }
    console.log(`Ligne ${r}: ${line.join(' | ')}`);
  }
  
  console.log('\n--- Statistiques ---');
  console.log(`Cases chemin: ${stats.path}`);
  console.log(`Cases neutres: ${stats.neutral}`);
  console.log(`Pièges vie: ${stats.trap_life}`);
  console.log(`Pièges recul: ${stats.trap_back2}`);
  console.log(`Pièges stun: ${stats.trap_stun}`);
  console.log(`Or (hors chemin): ${stats.gold}`);
  console.log(`Or sur chemin: ${stats.pathWithGold}`);
  console.log(`Gemmes: ${stats.gem}`);
  console.log(`Essence (hors chemin): ${stats.essence}`);
  console.log(`Essence sur chemin: ${stats.pathWithEssence}`);
  console.log(`Potions: ${stats.potion}`);
  console.log('========================\n');
}

/**
 * Fonction de test pour générer et afficher des grilles
 */
export function testGridGeneration() {
  console.log('🎮 TEST DE GÉNÉRATION DE GRILLES 🎮\n');
  
  const runCounters = { gem: 0, potion: 0 };
  
  // Test étage 1
  const path1 = generateRandomPath();
  const { grid: grid1, runCounters: counters1 } = generateEnrichedGrid(path1, 1, { ...runCounters });
  debugGrid(grid1, 1);
  
  // Test étage 10
  const path10 = generateRandomPath();
  const { grid: grid10, runCounters: counters10 } = generateEnrichedGrid(path10, 10, counters1);
  debugGrid(grid10, 10);
  
  // Test étage 25
  const path25 = generateRandomPath();
  const { grid: grid25 } = generateEnrichedGrid(path25, 25, counters10);
  debugGrid(grid25, 25);
  
  console.log('✅ Test terminé !');
}
