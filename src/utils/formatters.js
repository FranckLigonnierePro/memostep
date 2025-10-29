/**
 * Fonctions de formatage
 */

/**
 * Formate un temps en millisecondes en format MM:SS
 * @param {number} ms - Temps en millisecondes
 * @returns {string} Temps formaté (ex: "02:45")
 */
export function formatMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Génère un nom de guest aléatoire
 * @returns {string} Nom du guest (ex: "Memoguest0042")
 */
export function generateGuestName() {
  const n = Math.floor(Math.random() * 10000);
  const suffix = String(n).padStart(4, '0');
  return `Memoguest${suffix}`;
}
