/**
 * Utilitaires pour les cellules du board
 */

/**
 * Hash simple d'une chaîne de caractères
 * @param {String} s - Chaîne à hasher
 * @returns {Number} Hash
 */
export function hashString(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Récupère la première lettre d'un nom en majuscule
 * @param {String} name - Nom
 * @returns {String} Initiale en majuscule
 */
export function initial(name) {
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

/**
 * Calcule la couleur de texte optimale pour un fond donné
 * Utilise la luminance pour déterminer si le texte doit être clair ou foncé
 * @param {String} bg - Couleur de fond (format hex)
 * @returns {String} Couleur de texte (#0f1020 ou #ffffff)
 */
export function bubbleTextColor(bg) {
  const c = String(bg || '').replace('#', '');
  if (c.length === 6) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#0f1020' : '#ffffff';
  }
  return '#0f1020';
}
