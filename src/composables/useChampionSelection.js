/**
 * Composable pour gérer la sélection de champion/avatar
 */

import { ref, computed } from 'vue';
import { avatarCards } from '../config/avatarConfig.js';

export function useChampionSelection() {
  const selectedAvatar = ref(null);
  const showChampionSelector = ref(false);
  const selectSecondsLeft = ref(0);
  let selectTimerId = null;
  
  // Versus ready countdown
  const versusReadyCountdown = ref(0);
  let versusReadyTimerId = null;

  /**
   * Avatars déjà pris par d'autres joueurs (pour mode versus)
   */
  const takenAvatars = computed(() => {
    // Sera rempli par le parent avec les avatars des autres joueurs
    return [];
  });

  /**
   * Choisit un avatar aléatoire parmi ceux disponibles
   */
  function pickRandomAvailableAvatar(taken = []) {
    const takenSet = new Set(taken);
    const candidates = avatarCards.filter(c => !takenSet.has(c.img));
    if (!candidates.length) return avatarCards[Math.floor(Math.random() * avatarCards.length)];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * Démarre la sélection de champion avec timer
   */
  function startChampionSelection({ mode = 'solo', delayStart = false, onSelect, onTimeout } = {}) {
    showChampionSelector.value = true;
    selectSecondsLeft.value = 10;
    
    if (selectTimerId) {
      clearInterval(selectTimerId);
      selectTimerId = null;
    }
    
    selectTimerId = setInterval(() => {
      selectSecondsLeft.value = Math.max(0, (selectSecondsLeft.value || 0) - 1);
      
      if (selectSecondsLeft.value <= 0) {
        clearInterval(selectTimerId);
        selectTimerId = null;
        
        if (!selectedAvatar.value) {
          const pick = pickRandomAvailableAvatar();
          selectedAvatar.value = pick;
          if (onSelect) onSelect(pick);
        }
        
        if (onTimeout) onTimeout();
      }
    }, 1000);
  }

  /**
   * Ferme le sélecteur de champion
   */
  function closeChampionSelector() {
    if (selectTimerId) {
      clearInterval(selectTimerId);
      selectTimerId = null;
    }
    showChampionSelector.value = false;
  }

  /**
   * Gère la sélection d'un champion
   */
  function handleChampionPick(card, onPick) {
    selectedAvatar.value = card;
    try {
      localStorage.setItem('selectedAvatar', JSON.stringify(card));
    } catch (_) {}
    
    if (onPick) onPick(card);
  }

  /**
   * Démarre le compte à rebours avant le début de la partie (versus)
   */
  function startReadyCountdown(onComplete) {
    versusReadyCountdown.value = 3;
    
    if (versusReadyTimerId) {
      clearInterval(versusReadyTimerId);
    }
    
    versusReadyTimerId = setInterval(() => {
      versusReadyCountdown.value = Math.max(0, versusReadyCountdown.value - 1);
      
      if (versusReadyCountdown.value <= 0) {
        clearInterval(versusReadyTimerId);
        versusReadyTimerId = null;
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  /**
   * Arrête le compte à rebours
   */
  function stopReadyCountdown() {
    if (versusReadyTimerId) {
      clearInterval(versusReadyTimerId);
      versusReadyTimerId = null;
    }
    versusReadyCountdown.value = 0;
  }

  /**
   * Charge l'avatar sélectionné depuis localStorage
   */
  function loadSelectedAvatar() {
    try {
      const saved = localStorage.getItem('selectedAvatar');
      if (saved) {
        const avatar = JSON.parse(saved);
        
        // Migration: ancien ID 'mage' vers nouveau 'mage_lumineux'
        if (avatar.id === 'mage') {
          avatar.id = 'mage_lumineux';
          avatar.name = 'Mage Lumineux';
          // Sauvegarder la version migrée
          localStorage.setItem('selectedAvatar', JSON.stringify(avatar));
          console.log('[Migration] Avatar ID migré de "mage" vers "mage_lumineux"');
        }
        
        selectedAvatar.value = avatar;
      } else {
        // Première visite : présélectionner le mage lumineux
        const mageLumineux = avatarCards.find(card => card.id === 'mage_lumineux');
        if (mageLumineux) {
          selectedAvatar.value = mageLumineux;
          localStorage.setItem('selectedAvatar', JSON.stringify(mageLumineux));
          console.log('[First Visit] Mage Lumineux présélectionné par défaut');
        }
      }
    } catch (_) {}
  }

  /**
   * Cleanup
   */
  function cleanup() {
    closeChampionSelector();
    stopReadyCountdown();
  }

  return {
    selectedAvatar,
    showChampionSelector,
    selectSecondsLeft,
    versusReadyCountdown,
    takenAvatars,
    
    pickRandomAvailableAvatar,
    startChampionSelection,
    closeChampionSelector,
    handleChampionPick,
    startReadyCountdown,
    stopReadyCountdown,
    loadSelectedAvatar,
    cleanup,
  };
}
