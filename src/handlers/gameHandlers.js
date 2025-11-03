/**
 * Handlers pour les événements de jeu (victoire, défaite, replay, etc.)
 */

import { getMatchXP, getMultiplayerXP, calculateSoloXP } from '../lib/xpSystem.js';

/**
 * Crée les handlers de jeu
 */
export function createGameHandlers(context) {
  const {
    state,
    winActive,
    loseActive,
    showEndPathModal,
    endPathData,
    soloLevel,
    chronoMs,
    soloLivesUsed,
    grantXP,
    stopChrono,
    router,
    t,
    grantCurrentChampionXp,
    CHAMPION_XP_RULES,
    prepareNextSoloLevel,
    runCounters,
    baseDifficulty,
  } = context;

  // Callback à exécuter après la fermeture de la modal de level up
  let pendingContinueAction = null;

  /**
   * Gère une victoire de match
   */
  function handleMatchWin(isPerfect = false) {
    if (state.mode === 'solo') {
      showEndPathModalForSolo('completed', isPerfect);
    } else {
      winActive.value = true;
      const xpAmount = getMatchXP('win');
      grantXP(xpAmount, 'Match Win');
    }
  }

  /**
   * Gère une défaite de match
   */
  function handleMatchLose() {
    if (state.mode === 'solo') {
      showEndPathModalForSolo('no_life_left');
    } else {
      loseActive.value = true;
      const xpAmount = getMatchXP('lose');
      grantXP(xpAmount, 'Match Lose');
    }
  }

  /**
   * Gère une victoire multijoueur
   */
  function handleMultiplayerWin() {
    winActive.value = true;
    const xpAmount = getMultiplayerXP('duel_win');
    grantXP(xpAmount, 'Multiplayer Win');
    
    // Grant champion XP for multiplayer win
    grantCurrentChampionXp(CHAMPION_XP_RULES.MULTIPLAYER_WIN, 'Multiplayer Win');
  }

  /**
   * Gère une défaite multijoueur
   */
  function handleMultiplayerLose() {
    loseActive.value = true;
    const xpAmount = getMatchXP('lose');
    grantXP(xpAmount, 'Multiplayer Lose');
  }

  /**
   * Affiche la modal de fin de chemin (solo)
   */
  function showEndPathModalForSolo(status, isPerfect = false) {
    const stage = soloLevel.value + 1;
    const timeSeconds = Math.floor(chronoMs.value / 1000);
    const livesLeft = 3 - soloLivesUsed.value;

    const xpBreakdown = calculateSoloXP(stage, timeSeconds, status);

    endPathData.value = {
      status,
      stage,
      timeSeconds,
      livesLeft,
      xpBreakdown,
      isPerfect
    };

    showEndPathModal.value = true;
  }

  /**
   * Gère le clic sur "Continue" dans la modal de fin de chemin
   */
  function handleEndPathContinue(newGame, goHomeCallback) {
    showEndPathModal.value = false;

    const xpAmount = endPathData.value.xpBreakdown.totalXp;
    const status = endPathData.value.status;
    
    // Grant champion XP based on conditions
    const livesLeft = endPathData.value.livesLeft;
    const isPerfect = endPathData.value.isPerfect;
    
    let championXp = CHAMPION_XP_RULES.FINISH_STAGE; // +1 for finishing
    
    if (livesLeft === 3) {
      championXp = CHAMPION_XP_RULES.FINISH_WITH_3_HEARTS; // +2 for 3 hearts
    }
    
    if (isPerfect) {
      championXp = CHAMPION_XP_RULES.PERFECT_STAGE; // +3 for perfect
    }
    
    grantCurrentChampionXp(championXp, `Stage ${endPathData.value.stage}`);

    if (status === 'no_life_left') {
      if (goHomeCallback) goHomeCallback();
    } else {
      soloLevel.value++;
      
      // Stocker l'action de continuation à exécuter après la modal de level up (si elle apparaît)
      pendingContinueAction = () => {
        // Préparer le prochain niveau APRÈS validation de toutes les modals
        if (prepareNextSoloLevel && status === 'completed') {
          prepareNextSoloLevel(state, soloLevel, soloLivesUsed, runCounters, baseDifficulty.value);
        }
        newGame();
        pendingContinueAction = null;
      };
      
      // Donner l'XP (peut déclencher une modal de level up)
      grantXP(xpAmount, `Solo Stage ${endPathData.value.stage}`);
      
      // Si pas de level up, exécuter immédiatement
      // Sinon, ce sera exécuté quand la modal de level up sera fermée
      setTimeout(() => {
        if (pendingContinueAction) {
          pendingContinueAction();
        }
      }, 200);
    }
  }

  /**
   * Gère le clic sur "Abandon" dans la modal de fin de chemin
   */
  function handleEndPathAbandon(goHome) {
    showEndPathModal.value = false;

    const stage = endPathData.value.stage;
    const timeSeconds = endPathData.value.timeSeconds;
    const xpBreakdown = calculateSoloXP(stage, timeSeconds, 'abandon');

    grantXP(xpBreakdown.totalXp, `Solo Stage ${stage} (Abandoned)`);
    goHome();
  }

  /**
   * Gère le replay
   */
  function handleReplay(newGame) {
    loseActive.value = false;
    stopChrono();
    newGame();
  }

  /**
   * Gère le quit
   */
  function handleQuit(goHome) {
    loseActive.value = false;
    stopChrono();
    goHome();
  }

  /**
   * Gère le retour depuis la victoire
   */
  function handleWinReturn(goHome) {
    winActive.value = false;
    stopChrono();
    goHome();
  }

  /**
   * Gère le partage
   */
  async function handleShare(chronoText) {
    const text = `bravo ! Temps: ${chronoText}`;
    const url = typeof location !== 'undefined' ? location.href : '';
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert(t('alerts.shareCopied'));
    } catch (e) {
      alert(t('alerts.shareFailed'));
    }
  }

  /**
   * Gère le replay en mode versus (retour au lobby)
   */
  async function handleVersusReplay(resetVersusRoom, versusLastProgress, versusSeed, versusStartAtMs, versusCurrentRound, faceDownActive) {
    loseActive.value = false;
    winActive.value = false;
    stopChrono();
    state.inPlay = false;
    faceDownActive.value = false;

    versusLastProgress.value = 0;
    versusSeed.value = null;
    versusStartAtMs.value = null;
    versusCurrentRound.value = 0;

    try {
      await resetVersusRoom();
    } catch (_) {}

    router.push('/versus');
  }

  /**
   * Exécute l'action de continuation en attente (après fermeture de la modal de level up)
   */
  function executePendingContinue() {
    if (pendingContinueAction) {
      const action = pendingContinueAction;
      pendingContinueAction = null;
      action();
    }
  }

  return {
    handleMatchWin,
    handleMatchLose,
    handleMultiplayerWin,
    handleMultiplayerLose,
    showEndPathModalForSolo,
    handleEndPathContinue,
    handleEndPathAbandon,
    handleReplay,
    handleQuit,
    handleWinReturn,
    handleShare,
    handleVersusReplay,
    executePendingContinue,
  };
}
