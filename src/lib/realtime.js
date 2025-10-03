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
