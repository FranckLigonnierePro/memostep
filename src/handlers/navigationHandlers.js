/**
 * Handlers pour la navigation entre les vues
 */

export function createNavigationHandlers(context) {
  const {
    router,
    state,
    stopChrono,
    chronoMs,
    stopRevealTicker,
    winActive,
    loseActive,
    faceDownActive,
    soloLivesUsed,
    versusMode,
    t,
  } = context;

  /**
   * Ouvre la vue profil
   */
  function openProfile() {
    router.push('/profile');
  }

  /**
   * Ouvre la vue versus
   */
  function openVersusView() {
    router.push('/versus');
  }

  /**
   * Gère la fermeture d'une vue générique
   */
  function handleCloseView() {
    router.push('/');
  }

  /**
   * Gère la fermeture de la vue profil
   */
  function handleCloseProfileView() {
    router.push('/');
  }

  /**
   * Gère la sélection d'un profil/avatar
   */
  function handleProfileSelect(card, selectedAvatar) {
    selectedAvatar.value = card;
    try {
      localStorage.setItem('selectedAvatar', JSON.stringify(card));
    } catch (_) {}
    router.push('/');
  }

  /**
   * Gère la fermeture de la vue versus
   */
  function handleCloseVersusView(versusCode, versusRoom, versusIsHost, versusCurrentRound) {
    versusCode.value = '';
    versusRoom.value = null;
    versusIsHost.value = false;
    versusCurrentRound.value = 0;
    router.push('/');
  }

  /**
   * Retourne à l'accueil
   */
  async function goHome(leaveRoom, openNameModalIfNeeded) {
    // Leave versus room if in one
    if (state.mode === 'versus' && versusMode) {
      try {
        await leaveRoom();
      } catch (err) {
        console.error('[App] Error leaving room on goHome:', err);
      }
    }

    // Reset state
    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
    stopRevealTicker();
    state.path = [];
    state.nextIndex = 0;
    state.revealed = false;
    state.inPlay = false;
    state.correctSet.clear();
    state.wrongSet.clear();
    state.statusText = t('status.newGame');
    faceDownActive.value = false;
    stopChrono();
    chronoMs.value = 0;

    // Reset modals
    winActive.value = false;
    loseActive.value = false;

    // Reset solo lives
    soloLivesUsed.value = 0;

    // Navigate to home
    router.push('/');

    // Prompt for username if missing
    if (openNameModalIfNeeded) {
      openNameModalIfNeeded();
    }
  }

  return {
    openProfile,
    openVersusView,
    handleCloseView,
    handleCloseProfileView,
    handleProfileSelect,
    handleCloseVersusView,
    goHome,
  };
}
