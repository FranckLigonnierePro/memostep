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

// Report a round result with both winner and loser. This increments the winner's
// score and decrements the loser's lives (starting from 3 if absent). If the
// winner reaches 5 OR the loser reaches 0 lives, the room is finished with
// winner_id. Otherwise, it schedules a next round like reportRoundWin.
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
  const ensureEntry = (id) => {
    let i = players.findIndex(p => p && p.id === id);
    if (i === -1) { players.push({ id, name: 'Player', score: 0, lives: 3 }); i = players.length - 1; }
    const cur = players[i] || {};
    const normalized = { id: cur.id || id, name: cur.name || 'Player', score: Number(cur.score || 0), lives: Number(cur.lives ?? 3) };
    players[i] = normalized;
    return i;
  };
  const wi = ensureEntry(winnerId);
  const li = ensureEntry(loserId);

  // Update stats
  players[wi] = { ...players[wi], score: players[wi].score + 1 };
  players[li] = { ...players[li], lives: Math.max(0, players[li].lives - 1) };

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

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function createRoom(hostId, hostName) {
  initRealtime();
  const code = randomCode(6);
  const players = [{ id: hostId, name: hostName || 'Player' }];
  const { error } = await supabase.from('rooms').insert({
    code,
    // keep legacy columns for compatibility, but primary roster is in players
    host_id: hostId,
    guest_id: null,
    status: 'waiting',
    seed: null,
    start_at_ms: null,
    players,
  });
  if (error) throw error;
  return code;
}

export async function joinRoom(code, playerId, playerName) {
  initRealtime();
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  if (error) throw error;
  if (!data) throw new Error('Room not found');
  if (data.status !== 'waiting') throw new Error('Room not joinable');
  const players = Array.isArray(data.players) ? data.players.slice() : [];
  // Already in room
  if (players.find(p => p && p.id === playerId)) return true;
  if (players.length >= 8) throw new Error('Room full');
  players.push({ id: playerId, name: playerName || 'Player' });
  const update = { players };
  // keep legacy guest_id for 2-player compatibility if empty
  if (!data.guest_id) update.guest_id = playerId;
  const { error: upErr } = await supabase
    .from('rooms')
    .update(update)
    .eq('code', code);
  if (upErr) throw upErr;
  return true;
}

export async function startRoom(code, seed, startAtMs) {
  initRealtime();
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs })
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

  // If winner reaches 5, finish the room
  if (nextScore >= 5) {
    const { data, error: upErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs, players })
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
