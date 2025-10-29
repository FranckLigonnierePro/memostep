/**
 * Composable pour gérer l'état et la détection des cellules du board
 * Centralise toute la logique de détection de type de cellule
 */

/**
 * Vérifie si une cellule est marquée comme "wrong"
 */
export function isCellWrong(cellClass, r, c) {
  const classes = cellClass(r, c);
  return classes.includes('wrong');
}

/**
 * Vérifie si une cellule est une cellule de rollback
 */
export function isRollbackCell(rollbackKeys, r, c) {
  try {
    const key = `${r}-${c}`;
    return Array.isArray(rollbackKeys) && rollbackKeys.includes(key);
  } catch (_) {
    return false;
  }
}

/**
 * Vérifie si une cellule est une cellule de stun
 */
export function isStunCell(stunKeys, r, c) {
  try {
    const key = `${r}-${c}`;
    return Array.isArray(stunKeys) && stunKeys.includes(key);
  } catch (_) {
    return false;
  }
}

/**
 * Vérifie si une cellule fait partie du chemin
 */
export function isPathCell(cellClass, r, c) {
  const classes = cellClass(r, c) || [];
  return Array.isArray(classes) ? classes.includes('path') : String(classes || '').includes('path');
}

/**
 * Vérifie si une cellule est marquée comme correcte
 */
export function isCorrectCell(cellClass, r, c) {
  const classes = cellClass(r, c) || [];
  return Array.isArray(classes) ? classes.includes('correct') : String(classes || '').includes('correct');
}

/**
 * Récupère le contenu d'une cellule depuis gridContent
 */
export function getCellContent(gridContent, r, c) {
  if (!gridContent || !Array.isArray(gridContent)) return null;
  if (r < 0 || r >= gridContent.length) return null;
  if (c < 0 || !gridContent[r] || c >= gridContent[r].length) return null;
  return gridContent[r][c];
}

/**
 * Vérifie si un bonus a déjà été collecté
 */
export function isBonusCollected(collectedBonuses, r, c) {
  const key = `${r}-${c}`;
  return collectedBonuses && collectedBonuses.includes(key);
}

/**
 * Vérifie si une cellule est une cellule bonus (gold, gem, essence, potion)
 */
export function isBonusCell(gridContent, collectedBonuses, r, c) {
  if (isBonusCollected(collectedBonuses, r, c)) return false;
  const cell = getCellContent(gridContent, r, c);
  if (!cell) return false;
  return cell.type === 'gold' || cell.type === 'gem' || 
         cell.type === 'essence' || cell.type === 'potion';
}

/**
 * Récupère l'icône d'un bonus pour affichage
 */
export function getBonusIcon(gridContent, r, c) {
  const cell = getCellContent(gridContent, r, c);
  if (!cell) return '?';
  const icons = {
    'gold': '💰',
    'gem': '💎',
    'essence': '⚡',
    'potion': '🧪'
  };
  return icons[cell.type] || '?';
}

/**
 * Affiche le cœur uniquement pendant la phase input sur la cellule exacte
 */
export function showHeart(heartCell, revealComplete, revealed, r, c) {
  if (!heartCell) return false;
  if (!revealComplete || revealed) return false;
  return heartCell.r === r && heartCell.c === c;
}

/**
 * Calcule la prochaine ligne jouable depuis le chemin et nextIndex
 */
export function nextPlayableRow(path, playerProgress) {
  try {
    const pathArray = Array.isArray(path) ? path : [];
    const nextIndex = Math.max(0, Math.min(Number(playerProgress) || 0, pathArray.length));
    if (nextIndex >= pathArray.length) return null; // no more moves
    const nextCell = pathArray[nextIndex];
    return (nextCell && typeof nextCell.r === 'number') ? Number(nextCell.r) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Autorise le clic uniquement sur les cellules de la prochaine ligne jouable
 */
export function canClickCell(revealComplete, path, playerProgress, r, c) {
  // Only during input phase (revealComplete true)
  if (!revealComplete) return false;
  const row = nextPlayableRow(path, playerProgress);
  if (row == null) return false;
  return Number(r) === Number(row);
}
