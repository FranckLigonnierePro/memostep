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
  } = context;

  /**
   * Gère une victoire de match
   */
  function handleMatchWin() {
    if (state.mode === 'solo') {
      showEndPathModalForSolo('completed');
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
  function showEndPathModalForSolo(status) {
    const stage = soloLevel.value + 1;
    const timeSeconds = Math.floor(chronoMs.value / 1000);
    const livesLeft = 3 - soloLivesUsed.value;

    const xpBreakdown = calculateSoloXP(stage, timeSeconds, status);

    endPathData.value = {
      status,
      stage,
      timeSeconds,
      livesLeft,
      xpBreakdown
    };

    showEndPathModal.value = true;
  }

  /**
   * Gère le clic sur "Continue" dans la modal de fin de chemin
   */
  function handleEndPathContinue(newGame) {
    showEndPathModal.value = false;

    const xpAmount = endPathData.value.xpBreakdown.totalXp;
    grantXP(xpAmount, `Solo Stage ${endPathData.value.stage}`);

    if (endPathData.value.status === 'no_life_left') {
      goHome();
    } else {
      soloLevel.value++;
      newGame();
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

  function goHome() {
    // Sera implémenté dans navigationHandlers
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
  };
}
