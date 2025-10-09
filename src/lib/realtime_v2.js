/**
 * Supabase Realtime client for Versus mode - Version 2 with separate players table
 * Requires env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js';

// Game constants
const GAME_CONFIG = {
  MAX_SCORE: 5,
  INITIAL_LIVES: 3,
  ROUND_DELAY_MS: 1500,
  CODE_LENGTH: 6,
};

let supabase = null;
let roomSubscription = null;
// Local cache of the last room snapshot by code for optimistic updates
const roomCache = new Map();

/**
 * Initialize Supabase client (singleton pattern)
 * @returns {Object} Supabase client instance
 * @throws {Error} If environment variables are missing
 */
export function initRealtime() {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  }
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

/**
 * Fixed 8-color palette used across the app
 */
export const PLAYER_COLORS = [
  '#e74c3c', // red
  '#e67e22', // orange
  '#f1c40f', // yellow
  '#2ecc71', // green
  '#1abc9c', // teal
  '#3498db', // blue
  '#9b59b6', // purple
  '#fd79a8', // pink
];

/**
 * Pick an available color from the palette, avoiding already used colors
 * @param {string[]} usedColors - Array of colors already in use
 * @returns {string} Available color hex code
 */
function pickAvailableColor(usedColors = []) {
  const used = new Set(
    (usedColors || []).filter(Boolean).map(c => String(c).toLowerCase())
  );
  for (const c of PLAYER_COLORS) {
    if (!used.has(c.toLowerCase())) return c;
  }
  // Fallback: palette exhausted, pick random from palette
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

/**
 * Fetch all players for a given room
 * @param {string} roomCode - Room code
 * @returns {Promise<Array>} Array of player objects
 */
async function getRoomPlayers(roomCode) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', roomCode)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map(p => ({
    id: p.player_id,
    name: p.name,
    color: p.color,
    score: p.score,
    lives: p.lives,
    progress: p.progress,
    current_round: p.current_round || 1,
    frozen_clicks: p.frozen_clicks ?? 0,
    pending_freeze: p.pending_freeze ?? false
  }));
}

/**
 * Fetch a room with all its players and update cache
 * @param {string} roomCode - Room code
 * @returns {Promise<Object>} Room object with players array
 */
async function getRoomWithPlayers(roomCode) {
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .single();
  
  if (roomErr) throw roomErr;
  if (!room) throw new Error('Room not found');
  
  const players = await getRoomPlayers(roomCode);
  const full = { ...room, players };
  roomCache.set(roomCode, full);
  return full;
}

/**
 * Report a round result with both winner and loser
 * Increments winner's score, decrements loser's lives
 * Finishes room if winner reaches max score or loser has no lives
 * Otherwise schedules a new round
 * @param {string} code - Room code
 * @param {string} winnerId - Winner player ID
 * @param {string} loserId - Loser player ID
 * @param {number} timeMs - Time in milliseconds
 * @returns {Promise<Object>} Updated room with players
 */
export async function reportRoundResult(code, winnerId, loserId, timeMs) {
  initRealtime();
  
  const room = await getRoomWithPlayers(code);
  const { players } = room;
  
  const winner = players.find(p => p.id === winnerId);
  const loser = players.find(p => p.id === loserId);
  
  // Update winner's score
  if (winner) {
    const { error: winErr } = await supabase
      .from('players')
      .update({ score: winner.score + 1 })
      .eq('room_code', code)
      .eq('player_id', winnerId);
    if (winErr) throw winErr;
  }
  
  // Update loser's lives
  if (loser) {
    const newLives = Math.max(0, loser.lives - 1);
    const { error: loseErr } = await supabase
      .from('players')
      .update({ lives: newLives })
      .eq('room_code', code)
      .eq('player_id', loserId);
    if (loseErr) throw loseErr;
  }
  
  const winnerReached = winner && winner.score + 1 >= GAME_CONFIG.MAX_SCORE;
  const loserBusted = loser && loser.lives - 1 <= 0;
  
  // Check if game should end
  if (winnerReached || loserBusted) {
    const { error: upErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs })
      .eq('code', code);
    if (upErr) throw upErr;
    return await getRoomWithPlayers(code);
  }
  
  // Schedule next round
  const seed = Math.floor(Math.random() * 1e9);
  const startAtMs = Date.now() + GAME_CONFIG.ROUND_DELAY_MS;
  const { error: upErr } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs })
    .eq('code', code);
  if (upErr) throw upErr;
  
  return await getRoomWithPlayers(code);
}

/**
 * Reset room to fresh lobby state
 * Resets all players' lives/scores/progress and clears seed
 * @param {string} code - Room code
 * @returns {Promise<Object>} Updated room with players
 */
export async function resetRoom(code) {
  initRealtime();
  
  // Reset all players
  const { error: playersErr } = await supabase
    .from('players')
    .update({ 
      lives: GAME_CONFIG.INITIAL_LIVES, 
      score: 0, 
      progress: 0, 
      current_round: 1 
    })
    .eq('room_code', code);
  if (playersErr) throw playersErr;

  // Reset room status
  const { error: roomErr } = await supabase
    .from('rooms')
    .update({ 
      status: 'waiting', 
      seed: null, 
      start_at_ms: null, 
      winner_id: null, 
      winner_time_ms: null 
    })
    .eq('code', code);
  if (roomErr) throw roomErr;

  return await getRoomWithPlayers(code);
}

/**
 * Use a power-up (currently only freeze is supported)
 * Applies freeze to entire grid of all opponents via PostgreSQL function
 * @param {string} code - Room code
 * @param {string} playerId - Player ID using the power
 * @param {string} powerType - Type of power ('freeze')
 * @returns {Promise<Object>} Updated room with players
 */
export async function usePower(code, playerId, powerType) {
  initRealtime();
  
  if (powerType !== 'freeze') {
    throw new Error('Unknown power type');
  }
  
  // Call PostgreSQL function to apply freeze power server-side
  // This ensures all players have permission to freeze opponents
  const { error } = await supabase.rpc('apply_freeze_power', {
    p_room_code: code,
    p_player_id: playerId
  });
  
  if (error) throw error;
  
  return await getRoomWithPlayers(code);
}

/**
 * Update a player's per-round progress (0..1) without changing seed/start/status
 * Enables realtime UI for bubbles. Each player is updated independently.
 * @param {string} code - Room code
 * @param {string} playerId - Player ID
 * @param {number} progress - Progress value (0..1)
 * @returns {Promise<null>} Returns null to avoid costly query (realtime handles UI)
 */
export async function setPlayerProgress(code, playerId, progress) {
  initRealtime();
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  
  // Try update first (more performant than read-then-write)
  const { data: updated, error: upErr } = await supabase
    .from('players')
    .update({ progress: p })
    .eq('room_code', code)
    .eq('player_id', playerId)
    .select();
  
  if (upErr) throw upErr;
  
  // If no rows updated, player doesn't exist yet - create it
  if (!updated || updated.length === 0) {
    const players = await getRoomPlayers(code);
    const usedColors = players.map(pl => pl.color);
    const color = pickAvailableColor(usedColors);
    
    const { error: insErr } = await supabase
      .from('players')
      .insert([{
        room_code: code,
        player_id: playerId,
        name: 'Player',
        color,
        score: 0,
        lives: GAME_CONFIG.INITIAL_LIVES,
        progress: p,
        current_round: 1
      }]);
    if (insErr) throw insErr;
  }
  
  // Return null to avoid costly query - realtime subscription updates UI
  return null;
}

/**
 * Join a room as a player
 * Creates player if new, updates name if existing
 * @param {string} code - Room code
 * @param {string} playerId - Player ID
 * @param {string} name - Player name
 * @returns {Promise<Object>} Updated room with players
 */
export async function joinRoom(code, playerId, name) {
  initRealtime();
  
  // Verify room exists
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error) throw error;
  if (!room) throw new Error('Room not found');
  
  // Check if player already exists
  const { data: existing, error: getErr } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', code)
    .eq('player_id', playerId)
    .maybeSingle();
  
  if (getErr) throw getErr;
  
  if (existing) {
    // Update existing player's name
    const { error: upErr } = await supabase
      .from('players')
      .update({ name: name || existing.name || 'Player' })
      .eq('room_code', code)
      .eq('player_id', playerId);
    if (upErr) throw upErr;
  } else {
    // Create new player
    const players = await getRoomPlayers(code);
    const usedColors = players.map(p => p.color);
    const color = pickAvailableColor(usedColors);
    
    const { error: insErr } = await supabase
      .from('players')
      .insert([{
        room_code: code,
        player_id: playerId,
        name: name || 'Player',
        color,
        score: 0,
        lives: GAME_CONFIG.INITIAL_LIVES,
        progress: 0,
        current_round: 1
      }]);
    if (insErr) throw insErr;
  }
  
  return await getRoomWithPlayers(code);
}

/**
 * Generate a random room code
 * @param {number} len - Length of code (default: 6)
 * @returns {string} Random code
 */
function randomCode(len = GAME_CONFIG.CODE_LENGTH) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Create a new room with host player
 * @param {string} hostId - Host player ID
 * @param {string} hostName - Host player name
 * @returns {Promise<string>} Generated room code
 */
export async function createRoom(hostId, hostName) {
  initRealtime();
  const code = randomCode();
  const hostColor = pickAvailableColor([]);
  
  // Create room
  const { error: roomErr } = await supabase
    .from('rooms')
    .insert([{ 
      code, 
      status: 'waiting', 
      host_id: hostId,
      guest_id: null
    }]);
  
  if (roomErr) throw roomErr;
  
  // Create host player
  const { error: playerErr } = await supabase
    .from('players')
    .insert([{
      room_code: code,
      player_id: hostId,
      name: hostName || 'Player',
      color: hostColor,
      score: 0,
      lives: GAME_CONFIG.INITIAL_LIVES,
      progress: 0
    }]);
  
  if (playerErr) throw playerErr;
  
  return code;
}

/**
 * Start a room game
 * Resets all players' progress and updates room status
 * @param {string} code - Room code
 * @param {number} seed - Random seed for game
 * @param {number} startAtMs - Start timestamp in milliseconds
 */
export async function startRoom(code, seed, startAtMs) {
  initRealtime();
  
  // Reset all players' progress
  const { error: resetErr } = await supabase
    .from('players')
    .update({ progress: 0 })
    .eq('room_code', code);
  
  if (resetErr) throw resetErr;
  
  // Update room status
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs })
    .eq('code', code);
  
  if (error) throw error;
}

/**
 * Finish a room game
 * @param {string} code - Room code
 * @param {string} winnerId - Winner player ID
 * @param {number} timeMs - Completion time in milliseconds
 */
export async function finishRoom(code, winnerId, timeMs) {
  initRealtime();
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs })
    .eq('code', code);
  if (error) throw error;
}

/**
 * Report a round win in versus mode
 * Increments winner's score and advances their round
 * Finishes room if winner reaches max score or only one player has lives
 * Each player advances at their own pace
 * @param {string} code - Room code
 * @param {string} winnerId - Winner player ID
 * @param {number} timeMs - Completion time in milliseconds
 * @returns {Promise<Object>} Updated room with players
 */
export async function reportRoundWin(code, winnerId, timeMs) {
  initRealtime();
  
  const room = await getRoomWithPlayers(code);
  const { players } = room;
  
  const winner = players.find(p => p.id === winnerId);
  if (!winner) return room;
  
  const nextScore = winner.score + 1;
  
  // Update winner's score
  const { error: scoreErr } = await supabase
    .from('players')
    .update({ score: nextScore })
    .eq('room_code', code)
    .eq('player_id', winnerId);
  
  if (scoreErr) throw scoreErr;
  
  // Refresh players after update
  const updatedPlayers = await getRoomPlayers(code);
  
  // Check if match should end:
  // 1. All players finished (score >= MAX_SCORE)
  // 2. OR only one player has lives remaining
  const allFinished = updatedPlayers.every(p => p.score >= GAME_CONFIG.MAX_SCORE);
  const playersWithLives = updatedPlayers.filter(p => p.lives > 0);
  const onlyOneAlive = playersWithLives.length <= 1;
  
  if (allFinished || onlyOneAlive) {
    // Determine winner: highest score, or last one alive
    const sortedByScore = [...updatedPlayers].sort((a, b) => b.score - a.score);
    const finalWinner = sortedByScore[0];
    
    const { error: upErr } = await supabase
      .from('rooms')
      .update({ 
        status: 'finished', 
        winner_id: finalWinner?.id || winnerId, 
        winner_time_ms: timeMs 
      })
      .eq('code', code);
    
    if (upErr) throw upErr;
    return await getRoomWithPlayers(code);
  }
  
  // Each player advances at their own pace
  // Increment winner's current_round and reset their progress
  const { error: roundErr } = await supabase
    .from('players')
    .update({ 
      current_round: (winner.current_round || 1) + 1,
      progress: 0 
    })
    .eq('room_code', code)
    .eq('player_id', winnerId);
  
  if (roundErr) throw roundErr;
  
  return await getRoomWithPlayers(code);
}

/**
 * Subscribe to room changes via Supabase realtime
 * Listens to both room and player table changes
 * @param {string} code - Room code
 * @param {Function} callback - Callback function to receive room updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeRoom(code, callback) {
  initRealtime();
  if (roomSubscription) {
    supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  }
  
  // Subscribe to room and player changes
  roomSubscription = supabase
    .channel(`room:${code}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'rooms', 
      filter: `code=eq.${code}` 
    }, async (payload) => {
      // When room changes, fetch players and send complete room
      const room = await getRoomWithPlayers(code).catch((err) => {
        console.error('[subscribeRoom] Error fetching room:', err);
        const cached = roomCache.get(code);
        return cached || payload.new || payload.old || null;
      });
      callback(room);
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'players', 
      filter: `room_code=eq.${code}` 
    }, async (payload) => {
      // Optimistic update from payload
      try {
        const cached = roomCache.get(code);
        if (cached && (payload?.new || payload?.old)) {
          const row = payload.new || payload.old;
          const pid = row.player_id;
          const idx = Array.isArray(cached.players) 
            ? cached.players.findIndex(p => p && p.id === pid) 
            : -1;
          
          const updatedPlayer = {
            id: row.player_id,
            name: row.name ?? (cached.players?.[idx]?.name || 'Player'),
            color: row.color ?? (cached.players?.[idx]?.color || '#ffffff'),
            score: row.score ?? (cached.players?.[idx]?.score || 0),
            lives: row.lives ?? (cached.players?.[idx]?.lives || GAME_CONFIG.INITIAL_LIVES),
            progress: row.progress ?? (cached.players?.[idx]?.progress || 0),
            current_round: row.current_round ?? (cached.players?.[idx]?.current_round || 1),
            frozen_clicks: row.frozen_clicks ?? (cached.players?.[idx]?.frozen_clicks ?? 0),
            pending_freeze: row.pending_freeze ?? (cached.players?.[idx]?.pending_freeze ?? false),
          };
          
          const nextPlayers = Array.isArray(cached.players) ? [...cached.players] : [];
          if (idx >= 0) {
            nextPlayers[idx] = updatedPlayer;
          } else {
            nextPlayers.push(updatedPlayer);
          }
          
          const optimistic = { ...cached, players: nextPlayers };
          roomCache.set(code, optimistic);
          callback(optimistic);
        }
      } catch (e) {
        console.error('[subscribeRoom] Optimistic merge error:', e);
      }

      // Background refresh to ensure consistency
      const fresh = await getRoomWithPlayers(code).catch(() => null);
      if (fresh) callback(fresh);
    })
    .subscribe();
  
  return () => {
    if (roomSubscription) supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  };
}

/**
 * Get a room by code
 * @param {string} code - Room code
 * @returns {Promise<Object>} Room with players
 */
export async function getRoom(code) {
  initRealtime();
  return await getRoomWithPlayers(code);
}

/**
 * Decrement lives for a given loser without awarding a round win
 * Does not change current round seed/start time
 * Finishes room if lives reach 0
 * @param {string} code - Room code
 * @param {string} loserId - Loser player ID
 * @param {string} winnerIdIfBusted - Winner ID if loser is eliminated
 * @returns {Promise<Object>} Updated room with players
 */
export async function reportLifeLoss(code, loserId, winnerIdIfBusted) {
  initRealtime();
  
  // Fetch player
  const { data: player, error: getErr } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', code)
    .eq('player_id', loserId)
    .maybeSingle();
  
  if (getErr) throw getErr;
  
  const currentLives = player ? player.lives : GAME_CONFIG.INITIAL_LIVES;
  const newLives = Math.max(0, currentLives - 1);
  
  if (player) {
    // Update lives
    const { error: upErr } = await supabase
      .from('players')
      .update({ lives: newLives })
      .eq('room_code', code)
      .eq('player_id', loserId);
    
    if (upErr) throw upErr;
  } else {
    // Create player if doesn't exist
    const players = await getRoomPlayers(code);
    const usedColors = players.map(p => p.color);
    const color = pickAvailableColor(usedColors);
    
    const { error: insErr } = await supabase
      .from('players')
      .insert([{
        room_code: code,
        player_id: loserId,
        name: 'Player',
        color,
        score: 0,
        lives: newLives,
        progress: 0
      }]);
    
    if (insErr) throw insErr;
  }
  
  // Finish room if player is eliminated
  if (newLives <= 0 && winnerIdIfBusted) {
    const { error: finishErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerIdIfBusted })
      .eq('code', code);
    
    if (finishErr) throw finishErr;
  }
  
  return await getRoomWithPlayers(code);
}
