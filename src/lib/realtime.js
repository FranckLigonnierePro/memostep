// Supabase Realtime client for Versus mode
// Requires env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
import { createClient } from '@supabase/supabase-js';

let supabase = null;
let roomSubscription = null;

export function initRealtime() {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

// Fixed 8-color palette used across the app
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

function pickAvailableColor(usedColors = []) {
  const used = new Set((usedColors || []).filter(Boolean).map(c => String(c).toLowerCase()));
  for (const c of PLAYER_COLORS) {
    if (!used.has(c.toLowerCase())) return c;
  }
  // Fallback: palette exhausted, pick random from palette
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

// Report a round result with both winner and loser. This increments the winner's
// score, decrements the loser's lives. If winner reaches 5 or loser hits 0 lives,
// the room finishes. Otherwise a new round is scheduled and returned.
export async function reportRoundResult(code, winnerId, loserId, timeMs) {
  initRealtime();
  const { data: room, error: getErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  if (getErr) throw getErr;
  if (!room) throw new Error('Room not found');

  const players = Array.isArray(room.players) ? room.players.slice() : [];
  // winner
  let wi = players.findIndex(p => p && p.id === winnerId);
  if (wi === -1) { players.push({ id: winnerId, name: 'Player', score: 0, lives: 3 }); wi = players.length - 1; }
  const wc = players[wi] || {};
  const usedColors = players.map(p => p && p.color).filter(Boolean);
  const wcolor = wc.color || pickAvailableColor(usedColors);
  const wscore = Number(wc.score || 0) + 1;
  players[wi] = { ...wc, score: wscore, color: wcolor };
  // loser
  let li = players.findIndex(p => p && p.id === loserId);
  if (li === -1) { players.push({ id: loserId, name: 'Player', score: 0, lives: 3 }); li = players.length - 1; }
  const lc = players[li] || {};
  const lcolor = lc.color || pickAvailableColor(usedColors);
  const llives = Math.max(0, Number(lc.lives ?? 3) - 1);
  players[li] = { ...lc, lives: llives, color: lcolor };

  const winnerReached = players[wi].score >= 5;
  const loserBusted = players[li].lives <= 0;

  if (winnerReached || loserBusted) {
    const { data, error: upErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs, players })
      .eq('code', code)
      .select('*')
      .single();
    if (upErr) throw upErr;
    return data;
  }

  const seed = Math.floor(Math.random() * 1e9);
  const startAtMs = Date.now() + 1500;
  const { data, error: upErr } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs, players })
    .eq('code', code)
    .select('*')
    .single();
  if (upErr) throw upErr;
  return data;
}

// Update a player's per-round progress (0..1) inside players[] without changing
// seed/start/status. This enables realtime UI for bubbles.
export async function setPlayerProgress(code, playerId, progress) {
  initRealtime();
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const { data: room, error: getErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  if (getErr) throw getErr;
  if (!room) throw new Error('Room not found');
  const players = Array.isArray(room.players) ? room.players.slice() : [];
  let idx = players.findIndex(p => p && p.id === playerId);
  if (idx !== -1) {
    const used = players.map(p => p && p.color).filter(Boolean);
    const existing = players[idx] || {};
    const color = existing.color || pickAvailableColor(used);
    players[idx] = { ...existing, name: existing.name || 'Player', score: existing.score || 0, lives: existing.lives || 3, color, progress: p };
  } else {
    const used = players.map(p => p && p.color).filter(Boolean);
    const color = pickAvailableColor(used);
    players.push({ id: playerId, name: 'Player', score: 0, lives: 3, color, progress: p });
  }
  const { data, error: upErr } = await supabase
    .from('rooms')
    .update({ players })
    .eq('code', code)
    .select('*')
    .single();
  if (upErr) throw upErr;
  return data;
}

export async function joinRoom(code, playerId, name) {
  initRealtime();
  const { data: room, error } = await supabase.from('rooms').select('*').eq('code', code).single();
  if (error) throw error;
  if (!room) throw new Error('Room not found');
  const players = Array.isArray(room.players) ? room.players.slice() : [];
  const idx = players.findIndex(p => p && p.id === playerId);
  if (idx !== -1) {
    const used = players.map(p => p && p.color).filter(Boolean);
    const existing = players[idx] || {};
    const color = existing.color || pickAvailableColor(used);
    players[idx] = { ...existing, name: name || existing.name || 'Player', color };
  } else {
    const used = players.map(p => p && p.color).filter(Boolean);
    const color = pickAvailableColor(used);
    players.push({ id: playerId, name: name || 'Player', score: 0, lives: 3, color });
  }
  const { error: upErr } = await supabase
    .from('rooms')
    .update({ players })
    .eq('code', code);
  if (upErr) throw upErr;
  return true;
}

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function createRoom(hostId, hostName) {
  initRealtime();
  const code = randomCode(6);
  const hostColor = pickAvailableColor([]);
  const { error } = await supabase
    .from('rooms')
    .insert([{ code, status: 'waiting', host_id: hostId, players: [{ id: hostId, name: hostName || 'Player', score: 0, lives: 3, color: hostColor }] }]);
  if (error) throw error;
  return code;
}

// (joinRoom above already assigns colors; keep single definition)

export async function startRoom(code, seed, startAtMs) {
  initRealtime();
  // Fetch current players to reset per-round progress
  const { data: room, error: getErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  if (getErr) throw getErr;
  const players = Array.isArray(room?.players) ? room.players.map(p => ({ ...p, progress: 0 })) : [];
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs, players })
    .eq('code', code);
  if (error) throw error;
}

export async function finishRoom(code, winnerId, timeMs) {
  initRealtime();
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs })
    .eq('code', code);
  if (error) throw error;
}

// Report a round win in versus mode. Increments the winner's score inside the
// players array. If the winner reaches 5, finishes the room. Otherwise, schedules
// a new round by updating a fresh seed and synchronized start_at_ms while keeping
// status to 'playing'. Returns the updated room snapshot.
export async function reportRoundWin(code, winnerId, timeMs) {
  initRealtime();
  // Fetch current room state
  const { data: room, error: getErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  if (getErr) throw getErr;
  if (!room) throw new Error('Room not found');

  const players = Array.isArray(room.players) ? room.players.slice() : [];
  let idx = players.findIndex(p => p && p.id === winnerId);
  if (idx === -1) {
    players.push({ id: winnerId, name: 'Player', score: 0 });
    idx = players.length - 1;
  }
  const current = players[idx] || {};
  const nextScore = Number(current.score || 0) + 1;
  players[idx] = { ...current, score: nextScore };

  // Check if match should end:
  // 1. All players finished (score >= 5)
  // 2. OR only one player has lives remaining
  const allFinished = players.every(p => Number(p.score || 0) >= 5);
  const playersWithLives = players.filter(p => Number(p.lives ?? 3) > 0);
  const onlyOneAlive = playersWithLives.length <= 1;

  if (allFinished || onlyOneAlive) {
    // Determine winner: highest score, or last one alive
    const sortedByScore = players.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    const winner = sortedByScore[0];
    const { data, error: upErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winner?.id || winnerId, winner_time_ms: timeMs, players })
      .eq('code', code)
      .select('*')
      .single();
    if (upErr) throw upErr;
    return data;
  }

  // Otherwise schedule next round with a new deterministic seed and start time
  const seed = Math.floor(Math.random() * 1e9);
  const startAtMs = Date.now() + 1500;
  const { data, error: upErr } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs, players })
    .eq('code', code)
    .select('*')
    .single();
  if (upErr) throw upErr;
  return data;
}

export function subscribeRoom(code, callback) {
  initRealtime();
  if (roomSubscription) {
    supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  }
  roomSubscription = supabase
    .channel(`room:${code}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, payload => {
      callback(payload.new || payload.old || null);
    })
    .subscribe();
  return () => {
    if (roomSubscription) supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  };
}

export async function getRoom(code) {
  initRealtime();
  const { data, error } = await supabase.from('rooms').select('*').eq('code', code).single();
  if (error) throw error;
  return data;
}

// Decrement lives for a given loser without awarding a round win or changing the
// current round seed/start time. If lives reach 0, finish the room and set winner_id.
export async function reportLifeLoss(code, loserId, winnerIdIfBusted) {
  initRealtime();
  const { data: room, error: getErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  if (getErr) throw getErr;
  if (!room) throw new Error('Room not found');

  const players = Array.isArray(room.players) ? room.players.slice() : [];
  let i = players.findIndex(p => p && p.id === loserId);
  if (i === -1) {
    players.push({ id: loserId, name: 'Player', score: 0, lives: 3 });
    i = players.length - 1;
  }
  const cur = players[i] || {};
  const lives = Math.max(0, Number(cur.lives ?? 3) - 1);
  players[i] = { ...cur, lives };

  if (lives <= 0 && winnerIdIfBusted) {
    const { data, error: upErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerIdIfBusted, players })
      .eq('code', code)
      .select('*')
      .single();
    if (upErr) throw upErr;
    return data;
  }

  // Keep status/seed/start_at_ms unchanged to continue the same round/path
  const { data, error: upErr } = await supabase
    .from('rooms')
    .update({ players })
    .eq('code', code)
    .select('*')
    .single();
  if (upErr) throw upErr;
  return data;
}
