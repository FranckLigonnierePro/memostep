/**
 * Champion System - Gestion des champions, XP, niveaux et évolution
 */

import championsData from './champions.json';

// Règles de gain d'XP pour les champions
export const CHAMPION_XP_RULES = {
  FINISH_STAGE: 1,
  FINISH_WITH_3_HEARTS: 2,
  PERFECT_STAGE: 3,
  MULTIPLAYER_WIN: 5
};

/**
 * Structure d'un champion dans le state
 * {
 *   id: string,
 *   xp: number,
 *   level: number (1-10),
 *   isUnlocked: boolean
 * }
 */

/**
 * Initialise les données d'un champion
 */
export function initChampion(championId) {
  return {
    id: championId,
    xp: 0,
    level: 1,
    isUnlocked: false
  };
}

/**
 * Charge les données des champions depuis localStorage
 */
export function loadChampionsData() {
  try {
    const saved = localStorage.getItem('memostep_champions');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading champions data:', e);
  }
  
  // Initialiser avec le mage débloqué par défaut
  return {
    mage_lumineux: {
      id: 'mage_lumineux',
      xp: 0,
      level: 1,
      isUnlocked: true
    }
  };
}

/**
 * Sauvegarde les données des champions dans localStorage
 */
export function saveChampionsData(championsState) {
  try {
    localStorage.setItem('memostep_champions', JSON.stringify(championsState));
  } catch (e) {
    console.error('Error saving champions data:', e);
  }
}

/**
 * Récupère les stats d'un champion à un niveau donné
 */
export function getChampionStats(championId, level) {
  const champion = championsData.champion;
  if (champion.id !== championId) return null;
  
  const abilityLevel = champion.ability.levels.find(l => l.level === level);
  const passiveLevel = champion.passive.levels.find(l => l.level === level);
  
  return {
    ability: abilityLevel,
    passive: passiveLevel,
    info: {
      name: champion.name,
      description: champion.description,
      abilityNameSolo: champion.ability.name_solo,
      abilityNameMulti: champion.ability.name_multi,
      abilityDescSolo: champion.ability.description_solo,
      abilityDescMulti: champion.ability.description_multi,
      passiveName: champion.passive.name,
      passiveDesc: champion.passive.description
    }
  };
}

/**
 * Calcule l'XP requis pour passer au niveau suivant
 */
export function getXpRequiredForNextLevel(championId, currentLevel) {
  if (currentLevel >= 10) return null; // Max level
  
  const champion = championsData.champion;
  if (champion.id !== championId) return null;
  
  const nextLevel = champion.ability.levels.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.xpRequired : null;
}

/**
 * Calcule les ressources requises pour évoluer au niveau suivant
 */
export function getEvolutionRequirements(championId, currentLevel) {
  if (currentLevel >= 10) return null; // Max level
  
  const champion = championsData.champion;
  if (champion.id !== championId) return null;
  
  const nextLevel = champion.ability.levels.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return null;
  
  return {
    xp: nextLevel.xpRequired,
    gold: nextLevel.orRequired,
    essence: nextLevel.essenceRequired
  };
}

/**
 * Vérifie si un champion peut évoluer
 */
export function canEvolve(championState, playerGold, playerEssence) {
  if (championState.level >= 10) return false;
  
  const requirements = getEvolutionRequirements(championState.id, championState.level);
  if (!requirements) return false;
  
  return (
    championState.xp >= requirements.xp &&
    playerGold >= requirements.gold &&
    playerEssence >= requirements.essence
  );
}

/**
 * Fait évoluer un champion (retourne le nouvel état et les coûts)
 */
export function evolveChampion(championState) {
  if (championState.level >= 10) return null;
  
  const requirements = getEvolutionRequirements(championState.id, championState.level);
  if (!requirements) return null;
  
  return {
    newState: {
      ...championState,
      level: championState.level + 1,
      xp: championState.xp - requirements.xp // Retire l'XP utilisé
    },
    costs: {
      gold: requirements.gold,
      essence: requirements.essence
    }
  };
}

/**
 * Ajoute de l'XP à un champion
 */
export function addChampionXp(championState, amount) {
  return {
    ...championState,
    xp: championState.xp + amount
  };
}

/**
 * Calcule la progression XP vers le niveau suivant (0-1)
 */
export function getChampionLevelProgress(championState) {
  if (championState.level >= 10) return 1;
  
  const requirements = getEvolutionRequirements(championState.id, championState.level);
  if (!requirements) return 1;
  
  return Math.min(1, championState.xp / requirements.xp);
}

/**
 * Applique le pouvoir passif Vision Sacrée
 * Retourne true si un bonus doit être ajouté sur le chemin
 */
export function applyVisionSacree(championState, rng) {
  const stats = getChampionStats(championState.id, championState.level);
  if (!stats || !stats.passive) return false;
  
  const chance = stats.passive.bonusOnPathChance || 0;
  return rng() < chance;
}

/**
 * Vérifie si le champion a le bouclier sacré actif
 */
export function hasShieldActive(championAbilityState) {
  return championAbilityState && championAbilityState.shieldActive > 0;
}

/**
 * Active le bouclier sacré
 */
export function activateShield(championState) {
  const stats = getChampionStats(championState.id, championState.level);
  if (!stats || !stats.ability) return null;
  
  return {
    shieldActive: stats.ability.shield || 1,
    activatedAt: Date.now()
  };
}

/**
 * Consomme un bouclier (retourne le nouvel état)
 */
export function consumeShield(championAbilityState) {
  if (!championAbilityState || championAbilityState.shieldActive <= 0) {
    return championAbilityState;
  }
  
  return {
    ...championAbilityState,
    shieldActive: championAbilityState.shieldActive - 1
  };
}

/**
 * Active la lumière étourdissante (multi)
 * Retourne la durée du stun et la zone d'effet
 */
export function activateStun(championState) {
  const stats = getChampionStats(championState.id, championState.level);
  if (!stats || !stats.ability) return null;
  
  return {
    duration: stats.ability.stunDuration || 1.0,
    area: stats.ability.area || 1,
    activatedAt: Date.now()
  };
}
