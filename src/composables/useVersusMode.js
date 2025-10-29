/**
 * Composable pour gérer le mode versus (multijoueur)
 */

import { ref, computed } from 'vue';
import { COLS } from '../config/gameConfig.js';
import { 
  initRealtime, 
  createRoom as createRoomAPI, 
  joinRoom as joinRoomAPI, 
  subscribeRoom, 
  startRoom, 
  getRoom,
  reportRoundWin,
  reportLifeLoss,
  setPlayerProgress,
  resetRoom,
  usePower,
  leaveRoom as leaveRoomAPI
} from '../lib/realtime_v2.js';
import { ensurePlayerId } from '../lib/storage.js';
import { seededRng, hashString, randomPathWithRngAndStart } from '../utils/pathGenerator.js';

export function useVersusMode() {
  const versusCode = ref('');
  const versusRoom = ref(null);
  const versusIsHost = ref(false);
  const versusError = ref('');
  const versusSeed = ref(null);
  const versusStartAtMs = ref(null);
  const versusCurrentRound = ref(0);
  const versusLastProgress = ref(0);
  const playerId = ref(null);
  
  let versusUnsub = null;
  let progressTicker = null;
  let lastPublishedProgress = -1;

  // Supabase instance
  let supabase = null;
  function getSupabase() {
    if (!supabase) supabase = initRealtime();
    return supabase;
  }

  /**
   * Computed - Lives utilisées en mode versus
   */
  const versusLivesUsed = computed(() => {
    const room = versusRoom.value;
    const me = playerId.value || ensurePlayerId();
    const roster = (room && Array.isArray(room.players)) ? room.players : [];
    const meEntry = roster.find(p => p && p.id === me);
    const lives = Number(meEntry && meEntry.lives != null ? meEntry.lives : 3);
    return Math.min(3, Math.max(0, 3 - lives));
  });

  /**
   * Computed - Victoires en mode versus
   */
  const versusWins = computed(() => {
    const room = versusRoom.value;
    const me = playerId.value || ensurePlayerId();
    const roster = (room && Array.isArray(room.players)) ? room.players : [];
    const meEntry = roster.find(p => p && p.id === me);
    return Number(meEntry && meEntry.score != null ? meEntry.score : 0);
  });

  /**
   * Computed - Progression dans le chemin actuel (0..1)
   */
  const versusProgress = computed(() => {
    // Sera calculé par le parent en fonction de state.nextIndex
    return versusLastProgress.value;
  });

  /**
   * Computed - Liste des joueurs avec leurs stats
   */
  const versusPlayers = computed(() => {
    const room = versusRoom.value;
    const me = playerId.value || ensurePlayerId();
    const roster = (room && Array.isArray(room.players)) ? room.players : [];
    
    return roster.map(p => {
      const wins = Number(p && p.score != null ? p.score : 0);
      let storedProg = Number(p && p.progress != null ? p.progress : 0);
      
      // Support integer percentage (0..100) or float (0..1)
      if (storedProg > 1) {
        storedProg = Math.min(1, storedProg / 100);
      }
      
      const progress = (p && p.id === me) ? (Number(versusProgress.value) || 0) : storedProg;
      const name = (p && p.name) ? String(p.name) : 'Player';
      const color = (p && p.color) ? String(p.color) : '#ffffff';
      const frozenClicks = Number(p && p.frozen_clicks != null ? p.frozen_clicks : 0);
      const isFrozen = frozenClicks > 0;
      
      return { 
        id: p.id, 
        name, 
        wins, 
        progress, 
        color, 
        frozenClicks, 
        isFrozen, 
        avatar_url: p.avatar_url 
      };
    });
  });

  /**
   * Computed - Chemins uniques par joueur
   */
  const versusPathsByPlayer = computed(() => {
    const room = versusRoom.value;
    const roster = (room && Array.isArray(room.players)) ? room.players.slice(0, COLS) : [];
    if (!versusSeed.value || !versusStartAtMs.value) return {};
    
    const roundSeed = Number(versusSeed.value) || 0;
    const map = {};
    
    roster.forEach((p, idx) => {
      const startCol = idx % COLS;
      const idHash = Math.abs(hashString(String(p.id || p.name || ''))) % 1000000;
      const seed = roundSeed + (idx + 1) * 987654321 + idHash;
      const rng = seededRng(seed >>> 0);
      map[p.id] = randomPathWithRngAndStart(rng, startCol);
    });
    
    return map;
  });

  /**
   * Computed - Classement des joueurs par score
   */
  const versusRanking = computed(() => {
    const room = versusRoom.value;
    const roster = (room && Array.isArray(room.players)) ? room.players : [];
    
    return roster
      .map(p => ({
        id: p.id,
        name: (p && p.name) ? String(p.name) : 'Player',
        score: Number(p && p.score != null ? p.score : 0),
        color: (p && p.color) ? String(p.color) : '#ffffff',
      }))
      .sort((a, b) => b.score - a.score);
  });

  /**
   * Démarre la publication automatique de la progression
   */
  function startProgressAutoPublish(state) {
    stopProgressAutoPublish();
    lastPublishedProgress = -1;
    
    progressTicker = setInterval(() => {
      try {
        if (!versusCode.value) return;
        if (!state.inPlay) return;
        
        const me = playerId.value || ensurePlayerId();
        const len = state.path.length || 1;
        const prog = Math.max(0, Math.min(1, state.nextIndex / len));
        
        const roundedProg = Math.round(prog * 100) / 100;
        if (roundedProg !== lastPublishedProgress) {
          console.log('[Versus] Publishing progress:', roundedProg);
          lastPublishedProgress = roundedProg;
          setPlayerProgress(versusCode.value, me, roundedProg)
            .then(updated => { if (updated) versusRoom.value = updated; })
            .catch(() => {});
        }
      } catch (_) {}
    }, 100);
  }

  /**
   * Arrête la publication automatique
   */
  function stopProgressAutoPublish() {
    if (progressTicker) {
      clearInterval(progressTicker);
      progressTicker = null;
    }
    lastPublishedProgress = -1;
  }

  /**
   * Crée une nouvelle room
   */
  async function createRoom(name, avatarUrl = null) {
    versusError.value = '';
    if (!name) {
      versusError.value = 'Pseudo requis';
      throw new Error('Pseudo requis');
    }
    
    try {
      const pid = playerId.value || ensurePlayerId();
      const code = await createRoomAPI(pid, name, avatarUrl);
      versusCode.value = code;
      versusIsHost.value = true;
      return code;
    } catch (e) {
      versusError.value = String(e && e.message || e);
      throw e;
    }
  }

  /**
   * Rejoint une room existante
   */
  async function joinRoom(code, name, avatarUrl = null) {
    versusError.value = '';
    if (!name) {
      versusError.value = 'Pseudo requis';
      throw new Error('Pseudo requis');
    }
    if (!code) {
      versusError.value = 'Code requis';
      throw new Error('Code requis');
    }
    
    try {
      const pid = playerId.value || ensurePlayerId();
      await joinRoomAPI(code, pid, name, avatarUrl);
      versusCode.value = code;
      versusIsHost.value = false;
    } catch (e) {
      versusError.value = String(e && e.message || e);
      throw e;
    }
  }

  /**
   * Démarre la partie (host seulement)
   */
  async function startVersusGame() {
    const room = versusRoom.value;
    const playersCount = (room && Array.isArray(room.players)) ? room.players.length : 0;
    
    if (!versusIsHost.value) {
      versusError.value = 'Seul l\'hôte peut démarrer';
      throw new Error('Seul l\'hôte peut démarrer');
    }
    if (!versusCode.value) {
      versusError.value = 'Salle inconnue';
      throw new Error('Salle inconnue');
    }
    if (playersCount < 2) {
      versusError.value = 'Au moins 2 joueurs requis';
      throw new Error('Au moins 2 joueurs requis');
    }
    
    const seed = Math.floor(Math.random() * 1e9);
    const startAt = Date.now() + 1500;
    await startRoom(versusCode.value, seed, startAt);
  }

  /**
   * S'abonne aux mises à jour de la room
   */
  function subscribeToRoom(code, onUpdate) {
    if (versusUnsub) {
      try { versusUnsub(); } catch (_) {}
    }
    
    // Charger d'abord la room pour initialiser le cache
    (async () => {
      try {
        console.log('[Versus] Chargement initial de la room:', code);
        const snapshot = await getRoom(code);
        console.log('[Versus] Room chargée avec', snapshot?.players?.length, 'joueurs');
        if (onUpdate) await onUpdate(snapshot);
        
        // Maintenant s'abonner aux updates
        console.log('[Versus] Création de la subscription realtime...');
        versusUnsub = subscribeRoom(code, async (room) => {
          if (onUpdate) await onUpdate(room);
        });
      } catch (err) {
        console.error('[Versus] Erreur lors du chargement initial:', err);
        versusUnsub = subscribeRoom(code, async (room) => {
          if (onUpdate) await onUpdate(room);
        });
      }
    })();
  }

  /**
   * Quitte la room
   */
  async function leaveRoom() {
    if (versusCode.value) {
      try {
        const me = playerId.value || ensurePlayerId();
        await leaveRoomAPI(versusCode.value, me);
      } catch (err) {
        console.error('[Versus] Error leaving room:', err);
      }
    }
    
    // Clear state
    versusCode.value = '';
    versusRoom.value = null;
    versusIsHost.value = false;
    versusCurrentRound.value = 0;
    stopProgressAutoPublish();
  }

  /**
   * Réinitialise la room pour un nouveau match
   */
  async function resetVersusRoom() {
    try {
      if (versusCode.value) {
        const updated = await resetRoom(versusCode.value);
        if (updated) versusRoom.value = updated;
      }
    } catch (_) {}
  }

  /**
   * Utilise un pouvoir (freeze)
   */
  async function useFreezePower() {
    if (!versusCode.value) return;
    
    const me = playerId.value || ensurePlayerId();
    try {
      const updated = await usePower(versusCode.value, me, 'freeze');
      if (updated) versusRoom.value = updated;
      return true;
    } catch (err) {
      console.error('[Versus] Error using freeze power:', err);
      return false;
    }
  }

  /**
   * Met à jour l'état de freeze depuis la room
   */
  function updateFreezeState(state) {
    const room = versusRoom.value;
    const me = playerId.value || ensurePlayerId();
    const myPlayer = (room && Array.isArray(room.players)) ? room.players.find(p => p && p.id === me) : null;
    
    if (myPlayer) {
      const wasFrozen = state.frozenGrid;
      state.frozenGrid = (myPlayer.frozen_clicks ?? 0) > 0;
      state.frozenClicksLeft = myPlayer.frozen_clicks ?? 0;
      
      // Show snowstorm animation when freeze is first applied
      if (!wasFrozen && state.frozenGrid) {
        state.showSnowstorm = true;
        setTimeout(() => {
          state.showSnowstorm = false;
        }, 2000);
      }
    }
  }

  /**
   * Rapporte une victoire de round
   */
  async function reportRoundVictory(timeMs) {
    if (!versusCode.value) return null;
    
    const me = playerId.value || ensurePlayerId();
    try {
      const updated = await reportRoundWin(versusCode.value, me, timeMs);
      if (updated) versusRoom.value = updated;
      return updated;
    } catch (err) {
      console.error('[Versus] Error reporting round win:', err);
      return null;
    }
  }

  /**
   * Rapporte une perte de vie
   */
  async function reportLifeLossEvent(opponentId) {
    if (!versusCode.value) return null;
    
    const me = playerId.value || ensurePlayerId();
    try {
      const updated = await reportLifeLoss(versusCode.value, me, opponentId);
      if (updated) versusRoom.value = updated;
      return updated;
    } catch (err) {
      console.error('[Versus] Error reporting life loss:', err);
      return null;
    }
  }

  /**
   * Cleanup
   */
  function cleanup() {
    if (versusUnsub) {
      try { versusUnsub(); } catch (_) {}
      versusUnsub = null;
    }
    stopProgressAutoPublish();
  }

  return {
    // State
    versusCode,
    versusRoom,
    versusIsHost,
    versusError,
    versusSeed,
    versusStartAtMs,
    versusCurrentRound,
    versusLastProgress,
    playerId,
    
    // Computed
    versusLivesUsed,
    versusWins,
    versusProgress,
    versusPlayers,
    versusPathsByPlayer,
    versusRanking,
    
    // Functions
    startProgressAutoPublish,
    stopProgressAutoPublish,
    createRoom,
    joinRoom,
    startVersusGame,
    subscribeToRoom,
    leaveRoom,
    resetVersusRoom,
    useFreezePower,
    updateFreezeState,
    reportRoundVictory,
    reportLifeLossEvent,
    getSupabase,
    cleanup,
  };
}
