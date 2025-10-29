/**
 * Configuration des avatars/champions disponibles
 */

// Import des assets d'avatars
import imgCasseur from '../assets/profils/casseur.png';
import imgDark from '../assets/profils/dark.png';
import imgElectrik from '../assets/profils/electrik.png';
import imgForest from '../assets/profils/forest.jpg';
import imgFrozen from '../assets/profils/frozen.png';
import imgGuerriere from '../assets/profils/guerriere.png';
import imgMage from '../assets/profils/mage.png';
import imgPixel from '../assets/profils/pixel.png';
import imgDanseur from '../assets/profils/danseur.png';
import imgInventeur from '../assets/profils/inventeur.png';
import imgShadow from '../assets/profils/shadow.png';
import imgAstre from '../assets/profils/astre.png';
import imgColosse from '../assets/profils/colosse.png';
import imgChrono from '../assets/profils/chrono.png';
import imgHack from '../assets/profils/hack.png';
import imgArchie from '../assets/profils/archie.png';

/**
 * Liste des avatars disponibles pour la sélection
 */
export const avatarCards = [
  { id: 'guerriere', name: 'Guerrière', img: imgGuerriere, color: '#ff5a8a', glow: 'rgba(255,90,138,0.45)' },
  { id: 'mage', name: 'Mage', img: imgMage, color: '#8b5cf6', glow: 'rgba(139,92,246,0.45)' },
  { id: 'casseur', name: 'Casseur', img: imgCasseur, color: '#fb923c', glow: 'rgba(251,146,60,0.45)' },
  { id: 'dark', name: 'Dark', img: imgDark, color: '#7c3aed', glow: 'rgba(124,58,237,0.45)' },
  { id: 'electrik', name: 'Electrik', img: imgElectrik, color: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
  { id: 'frozen', name: 'Frozen', img: imgFrozen, color: '#60a5fa', glow: 'rgba(96,165,250,0.45)' },
  { id: 'forest', name: 'Forest', img: imgForest, color: '#34d399', glow: 'rgba(52,211,153,0.45)' },
  { id: 'pixel', name: 'Pixel', img: imgPixel, color: '#facc15', glow: 'rgba(250,204,21,0.45)' },
  { id: 'danseur', name: 'Danseur', img: imgDanseur, color: '#f43f5e', glow: 'rgba(244,63,94,0.45)' },
  { id: 'inventeur', name: 'Inventeur', img: imgInventeur, color: '#14b8a6', glow: 'rgba(20,184,166,0.45)' },
  { id: 'shadow', name: 'Shadow', img: imgShadow, color: '#0ea5e9', glow: 'rgba(14,165,233,0.45)' },
  { id: 'astre', name: 'Astre', img: imgAstre, color: '#a3e635', glow: 'rgba(163,230,53,0.45)' },
  { id: 'colosse', name: 'Colosse', img: imgColosse, color: '#ef4444', glow: 'rgba(239,68,68,0.45)' },
  { id: 'chrono', name: 'Chrono', img: imgChrono, color: '#06b6d4', glow: 'rgba(6,182,212,0.45)' },
  { id: 'hack', name: 'Hack', img: imgHack, color: '#6366f1', glow: 'rgba(99,102,241,0.45)' },
  { id: 'archie', name: 'Archie', img: imgArchie, color: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
];

/**
 * Avatar par défaut (Mage)
 */
export { imgMage };
