/**
 * Composable pour gérer les avatars des joueurs et leur état (frozen, etc.)
 */
import { ref, computed } from 'vue';

// Import des avatars
import mageAvatar from '../../assets/mage/content.png';
import warriorAvatar from '../../assets/guerriere/fcontent.png';
import mageFrost from '../../assets/mage/givré.png';
import warriorFrost from '../../assets/guerriere/fgivré.png';
import genAvatar1 from '../../assets/Generated Image October 22, 2025 - 12_20AM.png';
import genAvatar2 from '../../assets/Generated Image October 22, 2025 - 12_25AM.png';

const AVATARS = [mageAvatar, warriorAvatar, genAvatar1, genAvatar2];

/**
 * Hash simple d'une chaîne de caractères
 */
function hashString(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Génère une clé unique pour un joueur
 */
function playerKey(player) {
  return String(player?.id || player?.name || '');
}

/**
 * Composable pour gérer les avatars des joueurs
 */
export function usePlayerAvatars(props) {
  // Build a stable avatar assignment without duplicates among current players
  const avatarByKey = computed(() => {
    const players = (props.versusPlayers || []);
    const keys = players.map(p => playerKey(p)).filter(Boolean);
    const uniqueKeys = [...new Set(keys)];
    const seed = uniqueKeys.join('|');
    const base = Math.abs(hashString(seed)) % AVATARS.length;
    const mapping = {};
    uniqueKeys.forEach((k, i) => {
      mapping[k] = AVATARS[(base + i) % AVATARS.length];
    });
    return mapping;
  });

  /**
   * Détermine si un joueur est actuellement frozen
   */
  function playerIsFrozen(player) {
    const isSelf = !!(player && props && String(player.id || '') === String(props.selfId || ''));
    const localFrozen = !!(isSelf && props && props.frozenGrid);
    return !!(player && (player.isFrozen || (player.frozenClicks || player.frozen_clicks || 0) > 0 || localFrozen));
  }

  /**
   * Récupère l'avatar d'un joueur avec gestion du freeze
   */
  function getAvatar(player) {
    const key = playerKey(player);
    if (!key) return AVATARS[0];

    // Determine frozen state
    const isSelf = !!(player && props && String(player.id || '') === String(props.selfId || ''));
    const localFrozen = !!(isSelf && props && props.frozenGrid);
    const isFrozen = !!(player && (player.isFrozen || (player.frozenClicks || player.frozen_clicks || 0) > 0 || localFrozen));

    // 1) Self-selected avatar takes priority
    if (isSelf && props.selectedAvatar && props.selectedAvatar.img) {
      const base = props.selectedAvatar.img;
      // For custom avatars, keep the same image when frozen (visual effect comes from CSS)
      return base;
    }

    // 2) Player-provided avatar from backend
    if (player && player.avatar_url) {
      const base = player.avatar_url;
      return base;
    }

    // 3) Fallback to mapped built-in avatars without duplicates among current players
    const mapped = avatarByKey.value[key];
    if (mapped) {
      if (isFrozen) {
        if (mapped === warriorAvatar) return warriorFrost;
        if (mapped === mageAvatar) return mageFrost;
        return mapped; // keep generated/custom mapped image as-is
      }
      return mapped;
    }

    // 4) Last-resort: hash-based pick
    const idx = Math.abs(hashString(key)) % AVATARS.length;
    const base = AVATARS[idx];
    if (isFrozen) {
      if (base === warriorAvatar) return warriorFrost;
      if (base === mageAvatar) return mageFrost;
      return base;
    }
    return base;
  }

  return {
    avatarByKey,
    playerIsFrozen,
    getAvatar
  };
}

/**
 * Composable pour détecter les transitions de freeze
 */
export function useFreezeDetection(props) {
  // Track players who just transitioned to frozen to trigger one-time animation
  const justFrozen = ref(new Set());
  const prevFrozenById = ref(new Map());

  /**
   * Vérifie si un joueur vient juste d'être frozen
   */
  function isJustFrozen(player) {
    const id = String(player?.id || player?.name || '');
    return justFrozen.value.has(id);
  }

  /**
   * Met à jour l'état de freeze des joueurs
   * À appeler dans un watcher
   */
  function updateFreezeState(players, playerIsFrozenFn) {
    const now = players.map(p => ({ 
      id: p?.id || p?.name || '', 
      frozen: playerIsFrozenFn(p) 
    }));
    
    const prev = prevFrozenById.value;
    const nextMap = new Map();
    
    for (const entry of now) {
      const was = prev.get(entry.id) || false;
      nextMap.set(entry.id, entry.frozen);
      if (entry.frozen && !was) {
        // mark just-frozen and clear after short delay
        justFrozen.value.add(entry.id);
        setTimeout(() => {
          const set = justFrozen.value; 
          set.delete(entry.id);
        }, 700);
      }
    }
    prevFrozenById.value = nextMap;
  }

  return {
    justFrozen,
    prevFrozenById,
    isJustFrozen,
    updateFreezeState
  };
}
