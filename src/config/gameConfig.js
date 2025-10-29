/**
 * Configuration globale du jeu
 */

// Dimensions de la grille
export const COLS = 4;
export const ROWS = 10;

// Tailles des cellules
export const TARGET_CELL = 56;  // taille cible confortable
export const MIN_CELL = 48;     // taille minimale ergonomique
export const MAX_CELL = 72;     // taille max esthétique

// Timings
export const REVEAL_MS = 8000;  // 8s d'exposition
export const REVEAL_TICK = 100; // rafraîchissement du timer (ms)
export const FLIP_STEP = 70;    // délai entre chaque ligne pour l'animation flip
export const FLIP_DUR = 420;    // durée d'une animation flip de cellule
export const FLIP_BACK_STEP = 70;
export const FLIP_BACK_DUR = 420;

// Dimensions du root
export const ROOT_W = 320;
export const ROOT_H = 548;
export const MAX_H = 750;  // cap height pour améliorer l'ergonomie

// Gameplay
export const BPM = 110;
export const BEAT_MS = Math.floor(60000 / BPM);

// Couleurs pour les faces cachées
export const FACE_COLORS = ['yellow', 'green', 'purple', 'blue'];

// Couleurs des joueurs en mode versus
export const PLAYER_COLORS = [
  '#ff5a8a', // rose
  '#60a5fa', // bleu
  '#34d399', // vert
  '#facc15', // jaune
];
