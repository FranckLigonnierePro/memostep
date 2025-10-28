import xpData from './playerXpSystem.json';

const { xp_rules, solo_xp_rules, levels } = xpData.player_xp_system;

/**
 * Calculate XP gain for a match event
 * @param {string} eventType - 'win', 'lose', 'perfect_run', 'time_record', 'all_bonus_collected'
 * @returns {number} XP amount
 */
export function getMatchXP(eventType) {
  return xp_rules.match[eventType] || 0;
}

/**
 * Calculate XP gain for a multiplayer event
 * @param {string} eventType - 'duel_win', 'top3_battle_royale', 'battle_royale_win'
 * @returns {number} XP amount
 */
export function getMultiplayerXP(eventType) {
  return xp_rules.multiplayer[eventType] || 0;
}

/**
 * Get level data for a specific level
 * @param {number} level - Player level
 * @returns {object|null} Level data with xp_required and reward
 */
export function getLevelData(level) {
  return levels.find(l => l.level === level) || null;
}

/**
 * Calculate current level based on total XP
 * @param {number} totalXp - Total XP accumulated
 * @returns {object} { level, currentLevelXp, xpForNextLevel, progress }
 */
export function calculateLevel(totalXp) {
  let currentLevel = 1;
  let xpUsed = 0;
  
  // Find the highest level reached
  for (const levelData of levels) {
    if (levelData.level === 50) {
      // Max level reached
      if (totalXp >= xpUsed) {
        currentLevel = 50;
      }
      break;
    }
    
    if (totalXp >= xpUsed + levelData.xp_required) {
      xpUsed += levelData.xp_required;
      currentLevel = levelData.level;
    } else {
      break;
    }
  }
  
  // Calculate XP for current level
  const currentLevelXp = totalXp - xpUsed;
  
  // Get XP required for next level
  const nextLevelData = getLevelData(currentLevel + 1);
  const xpForNextLevel = nextLevelData ? nextLevelData.xp_required : 0;
  
  // Calculate progress percentage (0-1)
  const progress = xpForNextLevel > 0 ? currentLevelXp / xpForNextLevel : 1;
  
  return {
    level: currentLevel,
    currentLevelXp,
    xpForNextLevel,
    progress: Math.min(1, Math.max(0, progress))
  };
}

/**
 * Add XP and check for level up
 * @param {number} currentTotalXp - Current total XP
 * @param {number} xpToAdd - XP to add
 * @returns {object} { newTotalXp, oldLevel, newLevel, leveledUp, rewards }
 */
export function addXP(currentTotalXp, xpToAdd) {
  const oldLevelInfo = calculateLevel(currentTotalXp);
  const newTotalXp = currentTotalXp + xpToAdd;
  const newLevelInfo = calculateLevel(newTotalXp);
  
  const leveledUp = newLevelInfo.level > oldLevelInfo.level;
  const rewards = [];
  
  // Collect rewards for all levels gained
  if (leveledUp) {
    for (let lvl = oldLevelInfo.level + 1; lvl <= newLevelInfo.level; lvl++) {
      const levelData = getLevelData(lvl);
      if (levelData && levelData.reward) {
        rewards.push({
          level: lvl,
          reward: levelData.reward
        });
      }
    }
  }
  
  return {
    newTotalXp,
    oldLevel: oldLevelInfo.level,
    newLevel: newLevelInfo.level,
    leveledUp,
    rewards
  };
}

/**
 * Get all levels data
 * @returns {array} All levels
 */
export function getAllLevels() {
  return levels;
}

/**
 * Calculate XP for solo mode based on stage and time
 * @param {number} stage - Current stage number (1-based)
 * @param {number} timeSeconds - Time spent in seconds
 * @param {string} endType - 'abandon', 'no_life_left', or 'completed'
 * @returns {object} { baseXp, timeXp, multiplier, totalXp }
 */
export function calculateSoloXP(stage, timeSeconds, endType = 'completed') {
  const baseXp = stage * solo_xp_rules.xp_per_stage;
  const timeXp = Math.floor(timeSeconds * solo_xp_rules.xp_per_second);
  const multiplier = solo_xp_rules.end_multiplier[endType] || 1.0;
  const totalXp = Math.floor((baseXp + timeXp) * multiplier);
  
  return {
    baseXp,
    timeXp,
    multiplier,
    totalXp
  };
}
