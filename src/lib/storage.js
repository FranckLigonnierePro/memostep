// LocalStorage management for Memostep
// Single key schema to keep things consistent and evolvable

const KEY = 'memostep';

function todayStr(d = new Date()) {
  // Use UTC so the "day" is the same worldwide
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isYesterday(prev, curr) {
  if (!prev || !curr) return false;
  // Parse as UTC midnight
  const prevD = new Date(`${prev}T00:00:00Z`);
  const currD = new Date(`${curr}T00:00:00Z`);
  const diff = (currD - prevD) / (1000 * 60 * 60 * 24);
  return Math.round(diff) === 1;
}

function defaults() {
  return {
    playerId: null,
    currentDay: null,
    currentDaily: {
      attemptsBeforeWin: null, // we'll increment this as attempts happen; final value is attempts to win
      timeMs: null,
    },
    dailyStats: {
      totalWins: 0,
      streak: 0,
      bestTimeMs: null,
      lastWinDate: null,
    },
    audioMuted: false, // sound on by default
    _v: 1,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    const def = defaults();
    return {
      ...def,
      ...parsed,
      currentDaily: { ...def.currentDaily, ...(parsed.currentDaily || {}) },
      dailyStats: { ...def.dailyStats, ...(parsed.dailyStats || {}) },
    };
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

export function setCurrentDay(day = todayStr()) {
  const state = load();
  // If day changes, reset currentDaily session data
  if (state.currentDay !== day) {
    state.currentDay = day;
    state.currentDaily = { attemptsBeforeWin: null, timeMs: null };
    save(state);
  } else {
    state.currentDay = day;
    save(state);
  }
}

export function isDailyDoneToday(day = todayStr()) {
  const s = load();
  return s.dailyStats.lastWinDate === day;
}

export function markDailyAttempt(day = todayStr()) {
  const state = load();
  // ensure day is set
  if (state.currentDay !== day) {
    state.currentDay = day;
    state.currentDaily = { attemptsBeforeWin: null, timeMs: null };
  }
  // increment attempts counter (counts failed attempts so far)
  const prev = state.currentDaily.attemptsBeforeWin || 0;
  state.currentDaily.attemptsBeforeWin = prev + 1;
  save(state);
  return state.currentDaily.attemptsBeforeWin;
}

export function recordDailyWin({ day = todayStr(), timeMs }) {
  const state = load();
  if (state.currentDay !== day) {
    state.currentDay = day;
    state.currentDaily = { attemptsBeforeWin: null, timeMs: null };
  }
  // attemptsBeforeWin should reflect the final attempt that won
  const attempts = (state.currentDaily.attemptsBeforeWin || 0) + 1;
  state.currentDaily.attemptsBeforeWin = attempts;
  state.currentDaily.timeMs = timeMs;

  // Stats
  state.dailyStats.totalWins += 1;
  if (isYesterday(state.dailyStats.lastWinDate, day)) {
    state.dailyStats.streak += 1;
  } else if (state.dailyStats.lastWinDate === day) {
    // already counted for today; do not double count
  } else {
    state.dailyStats.streak = 1;
  }
  if (state.dailyStats.bestTimeMs == null || (typeof timeMs === 'number' && timeMs < state.dailyStats.bestTimeMs)) {
    state.dailyStats.bestTimeMs = timeMs;
  }
  state.dailyStats.lastWinDate = day;

  save(state);
  return {
    attemptsBeforeWin: attempts,
    timeMs,
    totalWins: state.dailyStats.totalWins,
    streak: state.dailyStats.streak,
    bestTimeMs: state.dailyStats.bestTimeMs,
  };
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
