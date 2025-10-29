/**
 * Composable pour gérer les stats du joueur (XP, niveau, ressources)
 */

import { ref, computed } from 'vue';
import { calculateLevel, addXP } from '../lib/xpSystem.js';
import { 
  isAuthenticated, 
  getCurrentUser,
  getProfile,
  isGuest as checkIsGuest 
} from '../lib/auth.js';

export function usePlayerStats() {
  // Ressources
  const playerGold = ref(0);
  const playerEssence = ref(0);
  const playerGems = ref(0);
  
  // XP et niveau
  const playerTotalXp = ref(0);
  const playerLevel = ref(1);
  const playerLevelProgress = ref(0); // 0-1 pour barre de progression
  
  // Modales et notifications
  const showLevelUpModal = ref(false);
  const levelUpData = ref({ newLevel: 1, rewards: [] });
  const xpNotifications = ref([]);
  
  // End Path Modal (solo)
  const showEndPathModal = ref(false);
  const endPathData = ref({
    status: 'completed',
    stage: 1,
    timeSeconds: 0,
    livesLeft: 3,
    xpBreakdown: { baseXp: 0, timeXp: 0, multiplier: 1.0, totalXp: 0 }
  });
  
  // Auth
  const showAuthModal = ref(false);
  const isLinkingAccount = ref(false);
  const currentUser = ref(null);
  const currentProfile = ref(null);
  const isGuestUser = ref(true);

  // Fonctions de gestion des ressources
  function loadResources() {
    try {
      const saved = localStorage.getItem('memostep_resources');
      if (saved) {
        const data = JSON.parse(saved);
        playerGold.value = data.gold || 0;
        playerEssence.value = data.essence || 0;
        playerGems.value = data.gems || 0;
      }
    } catch (_) {}
  }

  function saveResources() {
    try {
      localStorage.setItem('memostep_resources', JSON.stringify({
        gold: playerGold.value,
        essence: playerEssence.value,
        gems: playerGems.value
      }));
    } catch (_) {}
  }

  // Fonctions XP
  function loadPlayerXP() {
    try {
      const saved = localStorage.getItem('memostep_player_xp');
      if (saved) {
        const data = JSON.parse(saved);
        playerTotalXp.value = Number(data.totalXp || 0);
        updateLevelFromXP();
      }
    } catch (_) {
      playerTotalXp.value = 0;
      playerLevel.value = 1;
      playerLevelProgress.value = 0;
    }
  }

  function savePlayerXP() {
    try {
      localStorage.setItem('memostep_player_xp', JSON.stringify({
        totalXp: playerTotalXp.value
      }));
    } catch (_) {}
  }

  function updateLevelFromXP() {
    const levelInfo = calculateLevel(playerTotalXp.value);
    playerLevel.value = levelInfo.level;
    playerLevelProgress.value = levelInfo.progress;
  }

  function grantXP(amount, reason = '') {
    if (amount <= 0) return;
    
    const result = addXP(playerTotalXp.value, amount);
    playerTotalXp.value = result.newTotalXp;
    updateLevelFromXP();
    savePlayerXP();
    
    console.log(`[XP] +${amount} XP (${reason}). Total: ${result.newTotalXp}, Level: ${result.newLevel}`);
    
    // Show XP gain notification
    showXpNotification(amount, reason, result.leveledUp);
    
    // Handle level up
    if (result.leveledUp) {
      handleLevelUp(result);
    }
  }

  function handleLevelUp(levelUpResult) {
    console.log(`[XP] LEVEL UP! ${levelUpResult.oldLevel} → ${levelUpResult.newLevel}`);
    
    // Process rewards
    for (const rewardData of levelUpResult.rewards) {
      const { level, reward } = rewardData;
      console.log(`[XP] Level ${level} rewards:`, reward);
      
      // Grant rewards
      if (reward.coins) {
        playerGold.value += reward.coins;
        saveResources();
      }
      if (reward.gemmes) {
        playerGems.value += reward.gemmes;
        saveResources();
      }
    }
    
    // Show level up modal
    levelUpData.value = {
      newLevel: levelUpResult.newLevel,
      rewards: levelUpResult.rewards
    };
    showLevelUpModal.value = true;
  }

  function closeLevelUpModal() {
    showLevelUpModal.value = false;
  }

  function showXpNotification(amount, reason, isLevelUp = false) {
    const notification = {
      xp: amount,
      title: isLevelUp ? 'Level Up!' : 'XP Gained',
      message: reason,
      isLevelUp
    };
    
    xpNotifications.value = [...xpNotifications.value, notification];
    
    setTimeout(() => {
      xpNotifications.value = [];
    }, 100);
  }

  // Fonctions de profil
  async function loadUserProfile() {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const user = await getCurrentUser();
        currentUser.value = user;
        
        const profile = await getProfile(user.id);
        currentProfile.value = profile;
        
        if (profile.player_stats) {
          playerLevel.value = profile.player_stats.current_level || 1;
          playerGold.value = profile.player_stats.gold || 0;
          playerEssence.value = profile.player_stats.essence || 0;
          playerGems.value = profile.player_stats.gems || 0;
          playerTotalXp.value = profile.player_stats.total_xp || 0;
        }
        
        isGuestUser.value = false;
        console.log('[App] Profile loaded:', profile);
      } else {
        loadLocalStats();
        isGuestUser.value = checkIsGuest();
      }
    } catch (error) {
      console.error('[App] Error loading profile:', error);
      loadLocalStats();
      isGuestUser.value = true;
    }
  }

  function loadLocalStats() {
    try {
      loadPlayerXP();
      loadResources();
    } catch (error) {
      console.error('[App] Error loading local stats:', error);
    }
  }

  return {
    // Ressources
    playerGold,
    playerEssence,
    playerGems,
    loadResources,
    saveResources,
    
    // XP et niveau
    playerTotalXp,
    playerLevel,
    playerLevelProgress,
    loadPlayerXP,
    savePlayerXP,
    grantXP,
    handleLevelUp,
    closeLevelUpModal,
    showXpNotification,
    
    // Modales
    showLevelUpModal,
    levelUpData,
    xpNotifications,
    showEndPathModal,
    endPathData,
    
    // Auth
    showAuthModal,
    isLinkingAccount,
    currentUser,
    currentProfile,
    isGuestUser,
    loadUserProfile,
    loadLocalStats,
  };
}
