/**
 * Composable pour gérer les champions (XP, niveau, pouvoirs)
 */

import { ref, computed } from 'vue';
import {
  loadChampionsData,
  saveChampionsData,
  getChampionStats,
  getEvolutionRequirements,
  canEvolve,
  evolveChampion,
  addChampionXp,
  getChampionLevelProgress,
  CHAMPION_XP_RULES,
  activateShield,
  consumeShield,
  activateStun,
  applyVisionSacree
} from '../lib/championSystem.js';

export function useChampions() {
  // État des champions
  const championsState = ref({});
  
  // Champion actuellement sélectionné
  const currentChampionId = ref('mage_lumineux');
  
  // État des pouvoirs actifs
  const championAbilityState = ref({
    shieldActive: 0,
    stunActive: false,
    stunDuration: 0,
    stunActivatedAt: 0
  });
  
  // Modal d'évolution
  const showEvolutionModal = ref(false);
  const evolutionModalData = ref({
    championId: '',
    currentLevel: 1,
    nextLevel: 2,
    requirements: { xp: 0, gold: 0, essence: 0 },
    stats: null
  });
  
  // Computed: champion actuel
  const currentChampion = computed(() => {
    return championsState.value[currentChampionId.value] || null;
  });
  
  // Computed: stats du champion actuel
  const currentChampionStats = computed(() => {
    if (!currentChampion.value) return null;
    return getChampionStats(currentChampion.value.id, currentChampion.value.level);
  });
  
  // Computed: progression XP du champion actuel
  const currentChampionProgress = computed(() => {
    if (!currentChampion.value) return 0;
    return getChampionLevelProgress(currentChampion.value);
  });
  
  // Computed: peut évoluer
  const canCurrentChampionEvolve = computed(() => {
    return (playerGold, playerEssence) => {
      if (!currentChampion.value) return false;
      return canEvolve(currentChampion.value, playerGold, playerEssence);
    };
  });
  
  /**
   * Charge les données des champions depuis localStorage
   */
  function loadChampions() {
    championsState.value = loadChampionsData();
    console.log('[Champions] Loaded:', championsState.value);
  }
  
  /**
   * Sauvegarde les données des champions
   */
  function saveChampions() {
    saveChampionsData(championsState.value);
  }
  
  /**
   * Sélectionne un champion
   */
  function selectChampion(championId) {
    if (championsState.value[championId] && championsState.value[championId].isUnlocked) {
      currentChampionId.value = championId;
      localStorage.setItem('memostep_current_champion', championId);
      console.log('[Champions] Selected:', championId);
    }
  }
  
  /**
   * Ajoute de l'XP à un champion
   */
  function grantChampionXp(championId, amount, reason = '') {
    if (!championsState.value[championId]) return;
    
    const oldXp = championsState.value[championId].xp;
    championsState.value[championId] = addChampionXp(championsState.value[championId], amount);
    saveChampions();
    
    console.log(`[Champions] ${championId} +${amount} XP (${reason}). Total: ${championsState.value[championId].xp}`);
  }
  
  /**
   * Ajoute de l'XP au champion actuellement sélectionné
   */
  function grantCurrentChampionXp(amount, reason = '') {
    if (currentChampionId.value) {
      grantChampionXp(currentChampionId.value, amount, reason);
    }
  }
  
  /**
   * Ouvre la modal d'évolution
   */
  function openEvolutionModal(championId) {
    const champion = championsState.value[championId];
    if (!champion || champion.level >= 10) return;
    
    const requirements = getEvolutionRequirements(championId, champion.level);
    const stats = getChampionStats(championId, champion.level + 1);
    
    evolutionModalData.value = {
      championId,
      currentLevel: champion.level,
      nextLevel: champion.level + 1,
      requirements,
      stats
    };
    
    showEvolutionModal.value = true;
  }
  
  /**
   * Ferme la modal d'évolution
   */
  function closeEvolutionModal() {
    showEvolutionModal.value = false;
  }
  
  /**
   * Fait évoluer un champion
   */
  function performEvolution(championId, playerGold, playerEssence, updateResources) {
    const champion = championsState.value[championId];
    if (!champion) return false;
    
    const result = evolveChampion(champion);
    if (!result) return false;
    
    // Vérifie les ressources
    if (playerGold < result.costs.gold || playerEssence < result.costs.essence) {
      return false;
    }
    
    // Met à jour le champion
    championsState.value[championId] = result.newState;
    saveChampions();
    
    // Déduit les ressources
    updateResources(-result.costs.gold, -result.costs.essence, 0);
    
    console.log(`[Champions] ${championId} evolved to level ${result.newState.level}`);
    closeEvolutionModal();
    
    return true;
  }
  
  /**
   * Active le bouclier sacré (solo)
   */
  function activateShieldAbility() {
    if (!currentChampion.value) return false;
    
    const result = activateShield(currentChampion.value);
    if (!result) return false;
    
    championAbilityState.value = {
      ...championAbilityState.value,
      shieldActive: result.shieldActive,
      activatedAt: result.activatedAt
    };
    
    console.log(`[Champions] Shield activated: ${result.shieldActive} charges`);
    return true;
  }
  
  /**
   * Consomme un bouclier
   */
  function consumeShieldCharge() {
    championAbilityState.value = consumeShield(championAbilityState.value);
    console.log(`[Champions] Shield consumed. Remaining: ${championAbilityState.value.shieldActive}`);
    return championAbilityState.value.shieldActive;
  }
  
  /**
   * Active la lumière étourdissante (multi)
   */
  function activateStunAbility() {
    if (!currentChampion.value) return null;
    
    const result = activateStun(currentChampion.value);
    if (!result) return null;
    
    championAbilityState.value = {
      ...championAbilityState.value,
      stunActive: true,
      stunDuration: result.duration,
      stunActivatedAt: result.activatedAt,
      stunArea: result.area
    };
    
    console.log(`[Champions] Stun activated: ${result.duration}s, area: ${result.area}`);
    return result;
  }
  
  /**
   * Désactive le stun
   */
  function deactivateStun() {
    championAbilityState.value = {
      ...championAbilityState.value,
      stunActive: false,
      stunDuration: 0,
      stunActivatedAt: 0
    };
  }
  
  /**
   * Réinitialise l'état des pouvoirs
   */
  function resetAbilityState() {
    championAbilityState.value = {
      shieldActive: 0,
      stunActive: false,
      stunDuration: 0,
      stunActivatedAt: 0
    };
  }
  
  /**
   * Applique le pouvoir passif Vision Sacrée
   */
  function applyPassiveVisionSacree(rng) {
    if (!currentChampion.value) return false;
    return applyVisionSacree(currentChampion.value, rng);
  }
  
  /**
   * Vérifie si le bouclier est actif
   */
  const hasActiveShield = computed(() => {
    return championAbilityState.value.shieldActive > 0;
  });
  
  /**
   * Nombre de charges de bouclier restantes
   */
  const shieldCharges = computed(() => {
    return championAbilityState.value.shieldActive || 0;
  });
  
  /**
   * Vérifie si le stun est actif
   */
  const hasActiveStun = computed(() => {
    return championAbilityState.value.stunActive;
  });
  
  /**
   * Durée restante du stun
   */
  const stunDuration = computed(() => {
    return championAbilityState.value.stunDuration || 0;
  });
  
  return {
    // État
    championsState,
    currentChampionId,
    currentChampion,
    currentChampionStats,
    currentChampionProgress,
    championAbilityState,
    
    // Modales
    showEvolutionModal,
    evolutionModalData,
    
    // Computed
    canCurrentChampionEvolve,
    hasActiveShield,
    shieldCharges,
    hasActiveStun,
    stunDuration,
    
    // Fonctions
    loadChampions,
    saveChampions,
    selectChampion,
    grantChampionXp,
    grantCurrentChampionXp,
    openEvolutionModal,
    closeEvolutionModal,
    performEvolution,
    activateShieldAbility,
    consumeShieldCharge,
    activateStunAbility,
    deactivateStun,
    resetAbilityState,
    applyPassiveVisionSacree,
    
    // Constantes
    CHAMPION_XP_RULES
  };
}
