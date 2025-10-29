/**
 * Utilitaires pour générer des styles d'animation
 */

/**
 * Génère un style aléatoire pour un flocon de neige
 * @param {Number} index - Index du flocon
 * @returns {Object} Style CSS
 */
export function snowflakeStyle(index) {
  const left = Math.random() * 100;
  const animationDelay = Math.random() * 2;
  const animationDuration = 2 + Math.random() * 3;
  const size = 4 + Math.random() * 8;
  return {
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${animationDuration}s`,
    width: `${size}px`,
    height: `${size}px`,
  };
}

/**
 * Patterns de fissures pour la glace
 */
const CRACK_PATTERNS = [
  { top: '20%', left: '10%', width: '80%', height: '2px', transform: 'rotate(45deg)' },
  { top: '50%', left: '5%', width: '90%', height: '2px', transform: 'rotate(-30deg)' },
  { top: '70%', left: '15%', width: '70%', height: '2px', transform: 'rotate(60deg)' },
  { top: '30%', left: '20%', width: '60%', height: '2px', transform: 'rotate(-45deg)' },
  { top: '60%', left: '30%', width: '50%', height: '2px', transform: 'rotate(20deg)' },
  { top: '40%', left: '25%', width: '55%', height: '2px', transform: 'rotate(-60deg)' },
  { top: '80%', left: '10%', width: '75%', height: '2px', transform: 'rotate(35deg)' },
  { top: '15%', left: '35%', width: '45%', height: '2px', transform: 'rotate(-20deg)' },
];

/**
 * Génère un style de fissure
 * @param {Number} crackIndex - Index de la fissure (1-based)
 * @returns {Object} Style CSS
 */
export function crackStyle(crackIndex) {
  return CRACK_PATTERNS[(crackIndex - 1) % CRACK_PATTERNS.length];
}

/**
 * Patterns de fissures cassées
 */
const BROKEN_CRACK_PATTERNS = [
  { top: '15%', left: '5%', width: '90%', height: '2px', transform: 'rotate(25deg)' },
  { top: '40%', left: '10%', width: '80%', height: '2px', transform: 'rotate(-35deg)' },
  { top: '65%', left: '8%', width: '85%', height: '2px', transform: 'rotate(45deg)' },
  { top: '30%', left: '20%', width: '60%', height: '2px', transform: 'rotate(-60deg)' },
  { top: '55%', left: '15%', width: '70%', height: '2px', transform: 'rotate(15deg)' },
  { top: '80%', left: '12%', width: '75%', height: '2px', transform: 'rotate(-25deg)' },
];

/**
 * Génère un style de fissure cassée
 * @param {Number} crackIndex - Index de la fissure (1-based)
 * @returns {Object} Style CSS
 */
export function brokenCrackStyle(crackIndex) {
  return BROKEN_CRACK_PATTERNS[(crackIndex - 1) % BROKEN_CRACK_PATTERNS.length];
}

/**
 * Génère le style pour l'animation de révélation progressive du chemin
 * @param {Number} r - Ligne de la cellule
 * @param {Number} c - Colonne de la cellule
 * @param {Array} path - Chemin complet
 * @param {Boolean} revealed - Si le chemin est révélé
 * @param {Boolean} revealComplete - Si la révélation est terminée
 * @returns {Object} Style CSS avec délai d'animation
 */
export function pathRevealStyle(r, c, path, revealed, revealComplete) {
  if (!revealed || revealComplete) return {};
  
  const pathIndex = path.findIndex(p => p.r === r && p.c === c);
  if (pathIndex === -1) return {};
  
  // Delay each path cell by 200ms
  const delay = pathIndex * 200;
  return {
    '--path-delay': `${delay}ms`,
  };
}
