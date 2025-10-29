/**
 * Configuration centralisée pour le BoardView
 * Toutes les constantes et valeurs magiques sont ici
 */

export const BOARD_CONFIG = {
  // Snowstorm
  SNOWFLAKE_COUNT: 50,
  
  // Animations
  FREEZE_ANIMATION_DURATION: 700, // ms
  PATH_REVEAL_DELAY: 200, // ms par cellule
  
  // Tailles
  AVATAR_SIZE: 32, // px
  BUBBLE_SIZE: 32, // px
  
  // Icônes
  ICON_SIZES: {
    bonus: 16,
    heart: 18,
    indicator: 24,
    backIndicator: 32,
  },
  
  // Délais
  JUST_FROZEN_TIMEOUT: 700, // ms
  
  // Grille
  DEFAULT_ROWS: 12,
  DEFAULT_COLS: 4,
};

export default BOARD_CONFIG;
