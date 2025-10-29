/**
 * Handlers pour les modales (help, settings, stats, lang)
 */

export function createModalHandlers(context) {
  const {
    showHelp,
    showSettings,
    showStats,
    showLang,
    currentLang,
    locale,
  } = context;

  /**
   * Ouvre la modal d'aide
   */
  function openHelp() {
    showHelp.value = true;
  }

  /**
   * Ouvre la modal de paramètres
   */
  function openSettings() {
    showSettings.value = true;
  }

  /**
   * Ouvre la modal de statistiques
   */
  function openStats() {
    showStats.value = true;
  }

  /**
   * Ouvre la modal de sélection de langue
   */
  function openLang() {
    showLang.value = true;
  }

  /**
   * Ferme toutes les modales overlay
   */
  function closeOverlays() {
    showHelp.value = false;
    showSettings.value = false;
    showStats.value = false;
    showLang.value = false;
  }

  /**
   * Sélectionne une langue
   */
  function selectLang(code) {
    currentLang.value = code;
    try {
      locale.value = code;
    } catch (_) {}
    try {
      localStorage.setItem('locale', code);
    } catch (_) {}
    closeOverlays();
  }

  // Gear menu handlers
  const showGearMenuLeft = context.showGearMenuLeft || { value: false };
  const showGearMenuMain = context.showGearMenuMain || { value: false };
  const showGearMenuRight = context.showGearMenuRight || { value: false };

  function toggleGearMenuLeft() {
    showGearMenuLeft.value = !showGearMenuLeft.value;
  }

  function closeGearMenuLeft() {
    showGearMenuLeft.value = false;
  }

  function toggleGearMenuMain() {
    showGearMenuMain.value = !showGearMenuMain.value;
  }

  function closeGearMenuMain() {
    showGearMenuMain.value = false;
  }

  function toggleGearMenuRight() {
    showGearMenuRight.value = !showGearMenuRight.value;
  }

  function closeGearMenuRight() {
    showGearMenuRight.value = false;
  }

  return {
    openHelp,
    openSettings,
    openStats,
    openLang,
    closeOverlays,
    selectLang,
    toggleGearMenuLeft,
    closeGearMenuLeft,
    toggleGearMenuMain,
    closeGearMenuMain,
    toggleGearMenuRight,
    closeGearMenuRight,
  };
}
