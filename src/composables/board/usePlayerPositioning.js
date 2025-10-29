/**
 * Composable pour gérer le positionnement des avatars des joueurs sur la grille
 * Gère à la fois le mode solo et le mode versus
 */

/**
 * Positionne l'avatar du joueur solo/daily sur la dernière case validée
 * @param {Array} path - Le chemin du joueur
 * @param {Number} playerProgress - L'index de progression (nextIndex)
 * @param {Array} collectedBonuses - Les bonus collectés
 * @returns {Object} Style de positionnement CSS Grid
 */
export function soloPlayerPosition(path, playerProgress, collectedBonuses = []) {
  const pathLength = (path || []).length || 1;
  const progress = Number(playerProgress) || 0;
  
  // Position on the last validated cell: nextIndex-1
  // If nextIndex is 0, position on first cell (start)
  const lastIndex = Math.max(0, progress - 1);
  const actualIndex = Math.max(0, Math.min(lastIndex, pathLength - 1));
  
  if (actualIndex >= 0 && actualIndex < path.length) {
    const cell = path[actualIndex];
    if (cell) {
      // If a bonus was collected on this last validated row, place avatar on the bonus cell instead of the path cell
      try {
        const collected = Array.isArray(collectedBonuses) ? collectedBonuses : [];
        // Find a collected bonus that matches this row
        const matchKey = collected.find(key => {
          // key format: "r-c"
          const [kr, kc] = String(key).split('-').map(n => Number(n));
          return Number.isFinite(kr) && Number.isFinite(kc) && kr === cell.r;
        });
        if (matchKey) {
          const [br, bc] = String(matchKey).split('-').map(n => Number(n));
          return {
            gridRow: String((br + 1)),
            gridColumn: String((bc + 1)),
            justifySelf: 'center',
            alignSelf: 'center',
          };
        }
      } catch (_) {
        // fall back to path cell
      }
      // Default to path cell for this index
      return {
        gridRow: String((cell.r + 1)),
        gridColumn: String((cell.c + 1)),
        justifySelf: 'center',
        alignSelf: 'center',
      };
    }
  }
  // Default to first cell if no valid position
  if (path.length > 0) {
    const firstCell = path[0];
    return {
      gridRow: String((firstCell.r + 1)),
      gridColumn: String((firstCell.c + 1)),
      justifySelf: 'center',
      alignSelf: 'center',
    };
  }
  return { gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' };
}

/**
 * Positionne la bulle d'un joueur en mode versus basé sur sa progression
 * Chaque joueur a un chemin différent et progresse indépendamment
 * @param {Object} player - Le joueur
 * @param {Object} versusPathsByPlayer - Map des chemins par joueur
 * @param {Array} fallbackPath - Chemin de fallback
 * @returns {Object} Style de positionnement CSS Grid
 */
export function playerBubblePosition(player, versusPathsByPlayer, fallbackPath) {
  const prog = Math.max(0, Math.min(1, Number(player.progress) || 0));
  const map = versusPathsByPlayer || {};
  const playerPath = Array.isArray(map[player?.id]) && map[player.id].length ? map[player.id] : fallbackPath;
  const pathLength = playerPath.length || 1;
  
  // Calculate which cell the player is currently on based on their progress
  // progress is nextIndex/pathLength, so nextIndex = progress * pathLength
  // Position on the last validated cell: nextIndex - 1
  const nextIndex = Math.round(prog * pathLength);
  const lastIndex = Math.max(0, nextIndex - 1);
  const actualIndex = Math.max(0, Math.min(lastIndex, pathLength - 1));
  
  if (actualIndex >= 0 && actualIndex < playerPath.length) {
    const cell = playerPath[actualIndex];
    if (cell) {
      return {
        gridRow: String((cell.r + 1)),
        gridColumn: String((cell.c + 1)),
        justifySelf: 'center',
        alignSelf: 'center',
      };
    }
  }
  
  // Default to first cell if no valid position
  if (playerPath.length > 0) {
    const firstCell = playerPath[0];
    return {
      gridRow: String((firstCell.r + 1)),
      gridColumn: String((firstCell.c + 1)),
      justifySelf: 'center',
      alignSelf: 'center',
    };
  }
  
  return { gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' };
}

/**
 * Merge position avec z-index pour que la bulle du joueur local s'affiche au-dessus
 * @param {Object} player - Le joueur
 * @param {String} selfId - ID du joueur local
 * @param {Object} versusPathsByPlayer - Map des chemins par joueur
 * @param {Array} fallbackPath - Chemin de fallback
 * @returns {Object} Style complet avec z-index
 */
export function playerBubbleStyle(player, selfId, versusPathsByPlayer, fallbackPath) {
  const base = playerBubblePosition(player, versusPathsByPlayer, fallbackPath);
  const isSelf = !!(player && String(player.id || '') === String(selfId || ''));
  const z = isSelf ? 100 : 10;
  return { ...base, zIndex: String(z) };
}
