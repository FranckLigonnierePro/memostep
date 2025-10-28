// LocalStorage management for Memostep (simplified, no daily mode)
// Single key schema to keep things consistent and evolvable

const KEY = 'memostep';

function defaults() {
  return {
    playerId: null,
    audioMuted: false, // sound on by default
    _v: 2,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    const def = defaults();
    return { ...def, ...parsed };
  } catch (_) {
    return defaults();
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Public API
export function getState() {
  return load();
}

export function saveState(next) {
  save(next);
}

export function ensurePlayerId() {
  const state = load();
  if (!state.playerId) {
    state.playerId = uuid();
    save(state);
  }
  return state.playerId;
}

export function setPlayerId(id) {
  const state = load();
  state.playerId = id;
  save(state);
}

export function getAudioMuted() {
  const s = load();
  return !!s.audioMuted;
}

export function setAudioMuted(muted) {
  const s = load();
  s.audioMuted = !!muted;
  save(s);
}
