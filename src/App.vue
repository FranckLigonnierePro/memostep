<template>

      <div class="left-view">
        <KoFiDonors src="/api/Supporters_638967188676245800.csv" />
      </div>
  <div class="content" :style="{ transform: `scale(${rootScale})`}">
    <div :class="'header' + (!state.showHome ? ' small' : '')">
      <div class="logo-container">
        <img :src="logoSrc" alt="Logo" class="logo" :width="state.showHome ? 200 : 125" :height="state.showHome ? 200 : 100">
      </div>
    </div>
    
    <HomeView
      v-if="state.showHome"
      :logoSrc="logoSrc"
      :dailyDone="dailyDone"
      :currentFlag="currentFlag"
      :audioMuted="audioMuted"
      @start="newGame"
      @daily="() => startMode('daily')"
      @solo="() => startMode('solo')"
      @versus="openVersusView"
      @battle="() => startMode('battle')"
      @help="openHelp"
      @settings="openSettings"
      @stats="openStats"
      @openLang="openLang"
      @toggleAudio="toggleAudio"
    />

    <VersusView
      v-else-if="showVersusView"
      :code="versusCode"
      :pauseMainMusic="pauseMainMusic"
      :resumeMainMusic="resumeMainMusic"
      @close="handleCloseVersusView"
      @begin="handleBeginVersusFromLobby"
    />

    <BoardView
      v-else
      :cells="cells"
      :boardStyle="boardStyle"
      :cellClass="cellClass"
      :revealSecondsText="revealSecondsText"
      :revealProgress="revealProgress"
      :flipActive="flipActive"
      :flipBackActive="flipBackActive"
      :rowsCount="ROWS"
      :colsCount="COLS"
      :faceDownActive="faceDownActive"
      :faceColors="faceColors"
      :revealComplete="revealComplete"
      :timeText="chronoText"
      :score="soloLevel"
      :mode="state.mode"
      :versusWins="versusWins"
      :versusProgress="versusProgress"
      :versusPlayers="versusPlayers"
      :livesUsed="livesUsed"
      :justLost="justLost"
      :lastExtinguishedIndex="lastExtinguishedIndex"
      :frozenGrid="state.frozenGrid"
      :frozenClicksLeft="state.frozenClicksLeft"
      :showSnowstorm="state.showSnowstorm"
      :powerAvailable="!state.powerUsed"
      :path="state.path"
      :revealed="state.revealed"
      :shakeActive="shakeActive"
      :wrongCrackTexture="crackTexture"
      @cellClick="onCellClick"
      @goHome="goHome"
      @newGame="newGame"
    />

   
  </div>
    <!-- Hidden audio element for background music -->
    <audio ref="audioRef" :src="themeUrl" preload="auto" style="display:none"></audio>
    <!-- Loses modal -->
    <div v-if="loseActive" class="modal-overlay">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('modals.loseTitle') }}</h2>
        <div class="flex justify-center">
          <img src="./assets/looser.png" alt="lose" class="modal-img" width="200" height="100"/>
        </div>
        <div v-if="state.mode === 'solo'" style="margin-top:6px;">{{ $t('modals.score') }}: {{ soloLevel }}</div>
        <div class="modal-actions">
          <!-- Versus replay returns to room lobby -->
          <button
            v-if="state.mode === 'versus'"
            class="modal-btn"
            @click="handleVersusReplay"
          >{{ $t('modals.replay') }}</button>
          <!-- Non-versus replay keeps existing logic/limits -->
          <button
            v-if="state.mode !== 'versus' && !((state.mode === 'daily' && dailyAttempts >= 3) || (state.mode === 'solo' && soloLivesUsed >= 3))"
            class="modal-btn"
            @click="handleReplay"
          >{{ $t('modals.replay') }}</button>
          <button class="modal-btn" @click="handleQuit">{{ $t('modals.quit') }}</button>
        </div>
      </div>
    </div>
    <!-- Win modal -->
    <div v-if="winActive" class="modal-overlay">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('modals.winTitle') }}</h2>
        <div class="flex justify-center">
          <img src="./assets/winner.png" alt="win" class="modal-img" width="200" height="100"/>
        </div>
        <div v-if="state.mode !== 'versus'">
          {{ $t('modals.time') }}: {{ chronoText }}
        </div>
        <!-- Versus ranking -->
        <div v-if="state.mode === 'versus'" style="margin-top:12px; width:100%;">
          <div style="font-weight:600; margin-bottom:8px;">Classement</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div
              v-for="(p, idx) in versusRanking"
              :key="p.id"
              style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:#1a1c30; border-radius:8px; border:1px solid #2a2e52;"
            >
              <div style="font-weight:700; font-size:16px; min-width:24px;">{{ idx + 1 }}.</div>
              <div
                style="width:20px; height:20px; border-radius:999px; border:2px solid rgba(0,0,0,0.2);"
                :style="{ background: p.color || '#ffffff' }"
              ></div>
              <div style="flex:1; font-weight:600;">{{ p.name }}</div>
              <div style="font-size:14px; color:#12b886;">{{ p.score }}/5</div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <!-- Versus replay returns to room lobby -->
          <button v-if="state.mode === 'versus'" class="modal-btn" @click="handleVersusReplay">{{ $t('modals.replay') }}</button>
          <button class="modal-btn" @click="handleShare">{{ $t('modals.share') }}</button>
          <button class="modal-btn" @click="handleWinReturn">{{ $t('modals.back') }}</button>
        </div>
      </div>
    </div>

    <!-- Help modal -->
    <div v-if="showHelp" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('help.title') }}</h2>
        <div class="modal-body">
          <ol class="rules">
            <li>{{ $t('help.rule1') }}</li>
            <li>{{ $t('help.rule2') }}</li>
            <li>{{ $t('help.rule3') }}</li>
            <li>{{ $t('help.rule4') }}</li>
          </ol>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('help.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Settings modal -->
    <div v-if="showSettings" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('settings.title') }}</h2>
        <div class="modal-body">
          <p>{{ $t('settings.basicSoon') }}</p>
          <ul class="settings-list">
            <li>{{ $t('settings.volume') }}</li>
            <li>{{ $t('settings.theme') }}</li>
            <li>{{ $t('settings.a11y') }}</li>
          </ul>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('settings.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Language modal -->
    <div v-if="showLang" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card w-1/2">
        <h2 class="modal-title">{{ $t('lang.title') }}</h2>
        <div class="modal-body" style="display:flex; gap:22px; justify-content:center; flex-wrap:wrap;">
          <button class="lang-pick modal-btn" @click="selectLang('fr')"><img src="./assets/fr.png" alt="fr" width="48" height="48" /></button>
          <button class="lang-pick modal-btn" @click="selectLang('en')"><img src="./assets/en.png" alt="en" width="48" height="48" /></button>
        </div>
        <div class="modal-body" style="display:flex; gap:22px; justify-content:center; flex-wrap:wrap;">
          <button class="lang-pick modal-btn" @click="selectLang('es')"><img src="./assets/es.png" alt="es" width="48" height="48" /></button>
          <button class="lang-pick modal-btn" @click="selectLang('de')"><img src="./assets/de.png" alt="de" width="48" height="48" /></button>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('settings.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Stats modal -->
    <div v-if="showStats" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('stats.title') }}</h2>
        <div class="modal-body">
          <ul class="settings-list" style="list-style:none; padding:0; margin:0; text-align:left; display:flex; flex-direction:column; gap:6px;">
            <li><strong>{{ $t('stats.totalWins') }}:</strong> {{ stats.totalWins }}</li>
            <li><strong>{{ $t('stats.streak') }}:</strong> {{ stats.streak }}</li>
            <li><strong>{{ $t('stats.bestTime') }}:</strong> {{ stats.bestTimeText }}</li>
            <li><strong>{{ $t('stats.lastAttempts') }}:</strong> {{ stats.lastAttempts ?? '-' }}</li>
            <li><strong>{{ $t('stats.lastTime') }}:</strong> {{ stats.lastTimeText }}</li>
          </ul>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('stats.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Power Wheel for Versus mode (DISABLED) -->
    <!-- <PowerWheel
      :visible="showPowerWheel"
      @powerSelected="handlePowerSelected"
      @close="closePowerWheel"
    /> -->
    
  </template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import HomeView from './components/HomeView.vue';
import BoardView from './components/BoardView.vue';
import KoFiDonors from './components/KoFiDonors.vue';
import VersusView from './components/VersusView.vue';
import PowerWheel from './components/PowerWheel.vue';
// Import flag assets so Vite resolves URLs correctly
import frFlag from './assets/fr.png';
import enFlag from './assets/en.png';
import esFlag from './assets/es.png';
import deFlag from './assets/de.png';
import themeUrl from './assets/memosteptheme.mp3';
import crackTexture from './assets/crack.png';
import {
  ensurePlayerId,
  setCurrentDay,
  isDailyDoneToday as storageIsDailyDoneToday,
  recordDailyWin,
  markDailyAttempt,
  getState,
  getAudioMuted,
  setAudioMuted,
} from './lib/storage.js';
import { initRealtime, createRoom, joinRoom, subscribeRoom, startRoom, finishRoom, getRoom, reportRoundWin, reportRoundResult, reportLifeLoss, setPlayerProgress, resetRoom, usePower, leaveRoom } from './lib/realtime_v2.js';

// Get supabase instance for direct updates
let supabase = null;
function getSupabase() {
  if (!supabase) supabase = initRealtime();
  return supabase;
}

// Try to load a real logo from assets if present (supports memostep or memostep-logo)
const logoModules = import.meta.glob('./assets/{memostep,memostep-logo}.{png,jpg,jpeg,webp,svg}', { eager: true });
const realLogoUrl = (() => {
  const first = Object.values(logoModules)[0];
  // Vite returns a module whose default export is the URL string
  return first && (first.default || first);
})();

const logoSrc = computed(() => (typeof realLogoUrl === 'string' && realLogoUrl) ? realLogoUrl : '');

// Versus auto-publish ticker (100ms) - publish only when progress changes
let progressTicker = null;
let lastPublishedProgress = -1; // Cache de la dernière progression publiée
function startProgressAutoPublish() {
  stopProgressAutoPublish();
  if (state.mode !== 'versus') return;
  lastPublishedProgress = -1; // Reset du cache
  progressTicker = setInterval(() => {
    try {
      if (!versusCode.value) return;
      if (!state.inPlay) return;
      const me = playerId.value || ensurePlayerId();
      const len = state.path.length || 1;
      const prog = Math.max(0, Math.min(1, state.nextIndex / len));
      
      // Ne publier QUE si la progression a changé (arrondi à 2 décimales pour éviter les micro-changements)
      const roundedProg = Math.round(prog * 100) / 100;
      if (roundedProg !== lastPublishedProgress) {
        console.log('[App] Publishing progress:', roundedProg, '(was:', lastPublishedProgress, ')');
        lastPublishedProgress = roundedProg;
        setPlayerProgress(versusCode.value, me, roundedProg).then(updated => { if (updated) versusRoom.value = updated; }).catch(() => {});
      }
    } catch (_) {}
  }, 100);
}
function stopProgressAutoPublish() {
  if (progressTicker) { clearInterval(progressTicker); progressTicker = null; }
  lastPublishedProgress = -1; // Reset du cache
}

// Root scale (scale the whole content like your snippet)
const ROOT_W = 320;   // Et
const ROOT_H = 548;   // Ot
const MAX_H = 750;    // ze (cap height to improve ergonomics)
const rootScale = ref(1);

function fitRootScale() {
  const vw = window.innerWidth;
  const vh = Math.min(MAX_H, window.innerHeight);
  const sW = vw / ROOT_W;
  const sH = vh / ROOT_H;
  rootScale.value = Math.min(sW, sH);
}

// Constantes
const COLS = 4;
const ROWS = 10;
const TARGET_CELL = 56;  // taille cible confortable
const MIN_CELL = 48;     // taille minimale ergonomique
const MAX_CELL = 72;     // taille max esthétique
const REVEAL_MS = 8000;  // 8s d'exposition
const REVEAL_TICK = 100; // rafraîchissement du timer (ms)

// Refs DOM
const appRef = ref(null);
const headerRef = ref(null);
const footerRef = ref(null);

// i18n
const { t, locale } = useI18n();

// Etat
const state = reactive({
  path: [],            // [{r,c}, ...]
  nextIndex: 0,
  inPlay: false,
  revealed: false,     // pendant l'exposition du chemin
  statusText: t('status.newGame'),
  correctSet: new Set(), // 'r-c'
  wrongSet: new Set(),   // 'r-c'
  cellSize: TARGET_CELL, // pixels
  scale: 1,
  timerId: null,
  intervalId: null,
  revealEndAt: 0,
  revealDuration: REVEAL_MS, // Dynamic reveal duration based on path length
  nowMs: Date.now(),
  showHome: true,
  mode: 'solo',
  // Persist current solo path across retries until success
  soloPath: [],
  // Solo decoy cells (adjacent to path), active from level >= 5
  decoys: new Set(), // 'r-c'
  // Freeze power state (versus mode)
  frozenGrid: false,    // whether entire grid is frozen
  frozenClicksLeft: 0,  // how many clicks left to break ice (starts at 8)
  powerUsed: false,     // whether freeze power has been used this round
  showSnowstorm: false, // whether to show snowstorm animation
});

// Flip wave animation control (top -> bottom)
const flipActive = ref(false);
const flipBackActive = ref(false);

// Face-down colors control
const faceDownActive = ref(false);
const faceColors = ref({}); // { 'r-c': 'yellow' | 'green' | 'purple' | 'blue' }

// Shake animation and click blocking on wrong cell
const shakeActive = ref(false);
const clickBlocked = ref(false);

// Reveal bar should remain filled once the memorize phase completes
const revealComplete = ref(false);

// Lose modal
const loseActive = ref(false);
// Win modal
const winActive = ref(false);
// Help/Settings overlays
const showHelp = ref(false);
const showSettings = ref(false);
const showStats = ref(false);
const showLang = ref(false);
// Versus UI state
const showVersus = ref(false); // legacy modal (unused now)
const showVersusView = ref(false); // new dedicated screen
const showPowerWheel = ref(false); // power wheel overlay for versus mode
const selectedPower = ref(null); // currently selected power
const versusCode = ref('');
const joinInput = ref('');
const usernameInput = ref('');
const versusIsHost = ref(false);
const versusError = ref('');
let versusUnsub = null;
const versusSeed = ref(null);
const versusStartAtMs = ref(null);
const versusCurrentRound = ref(0); // Track current round to avoid restart loops
const playerId = ref(null);
const versusRoom = ref(null); // latest room snapshot
const versusLastProgress = ref(0); // Keep last progress to avoid bubble drop between rounds
const defaultPlayers = computed(() => [{ id: playerId.value || ensurePlayerId(), name: (usernameInput.value || 'Player') }]);

// Language state
const currentLang = ref('fr');
const flags = { fr: frFlag, en: enFlag, es: esFlag, de: deFlag };
const currentFlag = computed(() => flags[currentLang.value] || frFlag);

// Stats data for modal
const stats = reactive({
  totalWins: 0,
  streak: 0,
  bestTimeMs: null,
  bestTimeText: '-:-',
  lastAttempts: null,
  lastTimeMs: null,
  lastTimeText: '-:-',
});

// Track today's attempts (failed tries so far before a win) to enforce daily limit
const dailyAttempts = ref(0);
try {
  const s = getState();
  dailyAttempts.value = s.currentDaily?.attemptsBeforeWin || 0;
} catch (_) {
  dailyAttempts.value = 0;
}

// Daily completion tracking (via storage)
function isDailyDoneToday() {
  try {
    return storageIsDailyDoneToday();
  } catch (_) {
    return false;
  }
}
const dailyDone = ref(isDailyDoneToday());

// Background music
const audioMuted = ref(true);
const audioRef = ref(null);

function ensureAudio() {
  const el = audioRef.value;
  if (!el) return;
  el.muted = audioMuted.value;
  el.loop = true;
}

async function tryPlay() {
  const el = audioRef.value;
  if (!el) return;
  try {
    await el.play();
  } catch (_) {
    // Autoplay might be blocked until user gesture
  }
}

function toggleAudio() {
  audioMuted.value = !audioMuted.value;
  setAudioMuted(audioMuted.value);
  ensureAudio();
  if (!audioMuted.value) {
    tryPlay();
  } else {
    const el = audioRef.value; if (el) el.pause();
  }
}

function pauseMainMusic() {
  const el = audioRef.value;
  if (el) {
    try {
      el.pause();
      el.currentTime = 0; // Reset to beginning
    } catch (_) {}
  }
}

function resumeMainMusic() {
  const el = audioRef.value;
  if (el && el.paused && !audioMuted.value) {
    tryPlay();
  }
}

// Hearts state for lose modal
const justLost = ref(false);
const soloLivesUsed = ref(0);
const soloLevel = ref(0);
const versusLivesUsed = computed(() => {
  if (state.mode !== 'versus') return 0;
  const room = versusRoom.value;
  const me = playerId.value || ensurePlayerId();
  const roster = (room && Array.isArray(room.players)) ? room.players : [];
  const meEntry = roster.find(p => p && p.id === me);
  const lives = Number(meEntry && meEntry.lives != null ? meEntry.lives : 3);
  return Math.min(3, Math.max(0, 3 - lives));
});
const versusWins = computed(() => {
  if (state.mode !== 'versus') return 0;
  const room = versusRoom.value;
  const me = playerId.value || ensurePlayerId();
  const roster = (room && Array.isArray(room.players)) ? room.players : [];
  const meEntry = roster.find(p => p && p.id === me);
  return Number(meEntry && meEntry.score != null ? meEntry.score : 0);
});
// Progress within the current path (0..1) for versus
const versusProgress = computed(() => {
  if (state.mode !== 'versus') return versusLastProgress.value;
  // During memorization (revealed=true, inPlay=false), keep last progress to avoid bubble jump
  if (state.revealed && !state.inPlay) return versusLastProgress.value;
  // During active play, calculate live progress
  if (!state.inPlay) return versusLastProgress.value;
  const len = state.path.length || 1;
  const current = Math.max(0, Math.min(1, state.nextIndex / len));
  versusLastProgress.value = current; // Update last known progress
  return current;
});
// Players list with wins and progress (progress only known locally for self)
const versusPlayers = computed(() => {
  if (state.mode !== 'versus') return [];
  const room = versusRoom.value;
  const me = playerId.value || ensurePlayerId();
  const roster = (room && Array.isArray(room.players)) ? room.players : [];
  console.log('[versusPlayers] Room players:', roster.map(p => ({ id: p?.id?.slice(0,6), progress: p?.progress })));
  return roster.map(p => {
    const wins = Number(p && p.score != null ? p.score : 0);
    // Prefer live local progress for self, otherwise use stored progress
    const storedProg = Number(p && p.progress != null ? p.progress : 0);
    const progress = (p && p.id === me) ? (Number(versusProgress.value) || 0) : storedProg;
    const name = (p && p.name) ? String(p.name) : 'Player';
    const color = (p && p.color) ? String(p.color) : '#ffffff';
    console.log('[versusPlayers] Player:', { id: p?.id?.slice(0,6), name, progress, storedProg, isMe: p?.id === me });
    return { id: p.id, name, wins, progress, color };
  });
});

// Update local freeze state from room data
function updateFreezeState() {
  if (state.mode !== 'versus') return;
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
    
    // Check if there's a pending freeze to apply
    if (myPlayer.pending_freeze && state.inPlay && !state.revealed) {
      applyPendingFreeze();
    }
  }
}

// Apply pending freeze when memorization ends
async function applyPendingFreeze() {
  if (!versusCode.value) return;
  const me = playerId.value || ensurePlayerId();
  
  console.log('[applyPendingFreeze] Applying pending freeze to entire grid');
  
  try {
    const sb = getSupabase();
    await sb.from('players')
      .update({ 
        frozen_clicks: 8, // 8 clicks to break the ice
        pending_freeze: false
      })
      .eq('room_code', versusCode.value)
      .eq('player_id', me);
    
    console.log('[applyPendingFreeze] ❄️ Pending freeze applied to entire grid!');
  } catch (err) {
    console.error('[applyPendingFreeze] Error:', err);
  }
}
// Versus ranking sorted by score (descending)
const versusRanking = computed(() => {
  if (state.mode !== 'versus') return [];
  const room = versusRoom.value;
  const roster = (room && Array.isArray(room.players)) ? room.players : [];
  return roster
    .map(p => ({
      id: p.id,
      name: (p && p.name) ? String(p.name) : 'Player',
      score: Number(p && p.score != null ? p.score : 0),
      color: (p && p.color) ? String(p.color) : '#ffffff',
    }))
    .sort((a, b) => b.score - a.score); // Sort by score descending
});
const livesUsed = computed(() => {
  if (state.mode === 'daily') return Math.min(3, dailyAttempts.value);
  if (state.mode === 'solo') return Math.min(3, soloLivesUsed.value);
  if (state.mode === 'versus') return versusLivesUsed.value;
  return 0;
});
const lastExtinguishedIndex = computed(() => {
  if (state.mode === 'daily' || state.mode === 'solo' || state.mode === 'versus') return Math.min(2, livesUsed.value - 1);
  return -1;
});

// Chrono (starts when revealComplete is true, stops on win)
const chronoMs = ref(0);
let chronoIntervalId = null;
function formatMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
const chronoText = computed(() => formatMs(chronoMs.value));
function startChrono() {
  if (chronoIntervalId) clearInterval(chronoIntervalId);
  // In versus, share a common chrono anchored to the agreed start time + reveal duration
  if (state.mode === 'versus' && typeof versusStartAtMs.value === 'number') {
    const baseStart = versusStartAtMs.value + state.revealDuration;
    chronoIntervalId = setInterval(() => {
      chronoMs.value = Math.max(0, Date.now() - baseStart);
    }, 250);
  } else {
    const startAt = Date.now();
    const base = chronoMs.value;
    chronoIntervalId = setInterval(() => {
      chronoMs.value = base + (Date.now() - startAt);
    }, 250);
  }
}
function stopChrono() {
  if (chronoIntervalId) {
    clearInterval(chronoIntervalId);
    chronoIntervalId = null;
  }
}

function genFaceColors() {
  const choices = ['yellow', 'green', 'purple', 'blue'];
  const map = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const pick = choices[Math.floor(Math.random() * choices.length)];
      map[`${r}-${c}`] = pick;
    }
  }
  return map;
}

// Expose statusText for template binding
const statusText = computed(() => state.statusText);

// Générer les cellules (r,c) pour rendu
const cells = computed(() => {
  const arr = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      arr.push({ r, c });
    }
  }
  return arr;
});

// Style du board (CSS var + transform)
const boardStyle = computed(() => ({
  '--cell': `${state.cellSize}px`,
  // avoid double-scaling: root scales the whole content
  transform: 'none',
}));

// Timer: temps restant et progression pendant l'exposition
const revealMsLeft = computed(() => {
  if (!state.revealed || !state.revealEndAt) return 0;
  return Math.max(0, state.revealEndAt - state.nowMs);
});

const revealProgress = computed(() => {
  if (!state.revealed || !state.revealEndAt) return 0;
  const elapsed = Math.min(state.revealDuration, state.revealDuration - revealMsLeft.value);
  return Math.min(1, Math.max(0, elapsed / state.revealDuration));
});

const revealSecondsText = computed(() => {
  if (!state.revealed) return (state.revealDuration / 1000).toFixed(1) + ' s';
  const s = revealMsLeft.value / 1000;
  return s.toFixed(1) + ' s';
});

function numberVar(name, fallback = 0) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isNaN(v) ? fallback : v;
}

function measureAvailable() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const el = appRef.value || document.body;
  const styles = getComputedStyle(el);
  const padV = parseFloat(styles.getPropertyValue('padding-top')) + parseFloat(styles.getPropertyValue('padding-bottom'));
  const padH = parseFloat(styles.getPropertyValue('padding-left')) + parseFloat(styles.getPropertyValue('padding-right'));
  const headerH = headerRef.value ? headerRef.value.offsetHeight : 0;
  const footerH = footerRef.value ? footerRef.value.offsetHeight : 0;
  return { availW: vw - padH, availH: vh - headerH - footerH - padV };
}

function fitBoard() {
  const gap = numberVar('--gap', 8);
  const pad = numberVar('--pad', 12);

  // fixe la taille de case dans la borne [MIN_CELL, MAX_CELL] en visant TARGET_CELL
  const cell = Math.max(MIN_CELL, Math.min(TARGET_CELL, MAX_CELL));
  state.cellSize = cell;

  // Taille intrinsèque du board
  const neededW = COLS * cell + (COLS - 1) * gap + 2 * pad;
  const neededH = ROWS * cell + (ROWS - 1) * gap + 2 * pad;

  const { availW, availH } = measureAvailable();

  state.scale = Math.min(availW / neededW, availH / neededH, 1);
}

function randomPath() {
  const arr = [];
  let c = Math.floor(Math.random() * COLS);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      const moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      c = moves[Math.floor(Math.random() * moves.length)];
    }
    arr.push({ r, c });
  }
  return arr;
}

// RNG deterministe (Mulberry32)
function seededRng(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

function randomPathWithRng(rng) {
  const arr = [];
  let c = Math.floor(rng() * COLS);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      const moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      c = moves[Math.floor(rng() * moves.length)];
    }
    arr.push({ r, c });
  }
  return arr;
}

// Generate up to 2 decoy cells adjacent (orthogonal) to the path, not overlapping path cells
function generateSoloDecoys() {
  state.decoys.clear();
  // Only for solo and level >= 5
  if (state.mode !== 'solo' || (soloLevel.value || 0) < 5) return;
  const pathSet = new Set(state.path.map(p => `${p.r}-${p.c}`));
  const candidates = new Set();
  for (const p of state.path) {
    const neigh = [
      { r: p.r - 1, c: p.c },
      { r: p.r + 1, c: p.c },
      { r: p.r, c: p.c - 1 },
      { r: p.r, c: p.c + 1 },
    ];
    for (const n of neigh) {
      if (n.r < 0 || n.r >= ROWS || n.c < 0 || n.c >= COLS) continue;
      const key = `${n.r}-${n.c}`;
      if (!pathSet.has(key)) candidates.add(key);
    }
  }
  const candArr = Array.from(candidates);
  // Shuffle and pick up to 2
  for (let i = candArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candArr[i], candArr[j]] = [candArr[j], candArr[i]];
  }
  const picks = candArr.slice(0, 2);
  for (const k of picks) state.decoys.add(k);
}

function dailySeed() {
  const d = new Date();
  // Use UTC date so the daily seed is identical worldwide (YYYYMMDD)
  const key = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  return key;
}

function startMode(mode) {
  state.mode = mode;
  state.showHome = false;
  if (mode === 'daily') {
    // If today's daily is already done, jump directly to the win popup
    if (isDailyDoneToday()) {
      try {
        const s = getState();
        // Display the stored time in the win modal
        chronoMs.value = s.currentDaily.timeMs ?? 0;
      } catch (_) {
        chronoMs.value = 0;
      }
      // Ensure a clean non-playing board state
      state.inPlay = false;
      state.revealed = false;
      faceDownActive.value = false;
      stopChrono();
      // Mark the daily flag and show win modal immediately
      dailyDone.value = true;
      winActive.value = true;
      return; // Do not start a new game sequence
    }
    // set current day in storage for daily mode session
    try { setCurrentDay(); } catch (_) {}
    // If already reached the daily attempt limit, show lose modal immediately
    try {
      const s = getState();
      const attempts = s.currentDaily?.attemptsBeforeWin || 0;
      dailyAttempts.value = attempts;
      if (attempts >= 3) {
        // Ensure a clean non-playing board state
        state.inPlay = false;
        state.revealed = false;
        faceDownActive.value = false;
        stopChrono();
        loseActive.value = true;
        return;
      }
    } catch (_) {}
    // start normal daily
    const rng = seededRng(dailySeed());
    state.path = randomPathWithRng(rng);
  } else if (mode === 'solo') {
    // reset solo lives at the start of a solo session
    soloLivesUsed.value = 0;
    // reset solo level at the start of a solo session
    soloLevel.value = 0;
    // starting solo from home should create a new path
    state.soloPath = randomPath();
    state.path = state.soloPath;
    generateSoloDecoys();
  } else if (mode === 'versus' || mode === 'battle') {
    // Placeholder: start like solo for now
    state.path = randomPath();
    // You can extend with networking/matchmaking later
  } else {
    state.path = randomPath();
  }
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  showPath();
}

function showPath() {
  state.revealed = true;
  state.inPlay = false;
  state.statusText = t('status.memorize');
  // In versus mode, pause chrono during memorization (don't reset to 0)
  // In other modes, reset chrono to 0 at the start
  if (state.mode !== 'versus') {
    chronoMs.value = 0;
  } else {
    // Pause chrono during versus memorization
    stopChrono();
  }
  if (state.timerId) clearTimeout(state.timerId);
  
  // Calculate dynamic reveal time based on path length
  // 200ms per cell + 500ms extra delay after last cell
  const pathRevealTime = (state.path.length * 200) + 500;
  state.revealDuration = Math.max(pathRevealTime, 2000); // Minimum 2 seconds
  
  // programme la fin d'exposition et démarre le compteur visuel
  state.revealEndAt = Date.now() + state.revealDuration;
  startRevealTicker();
  state.timerId = setTimeout(hidePath, state.revealDuration);
  // while revealing, ensure face is up (no face-down colors)
  faceDownActive.value = false;
  // reset bar fill state at start
  revealComplete.value = false;
  // Reset power availability for new round
  state.powerUsed = false;
}

function hidePath() {
  // Keep revealed=true during the flip so the path remains visible on the front face
  state.inPlay = true;
  // Reset nextIndex to 0 for new path, but versusLastProgress keeps previous value during transition
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.statusText = t('status.yourTurn');
  stopRevealTicker();

  // Assign random face-down colors first so they are visible during the flip
  faceColors.value = genFaceColors();
  faceDownActive.value = true;
  // In versus mode, resume chrono (don't reset)
  // In other modes, reset and start chrono
  if (state.mode !== 'versus') {
    chronoMs.value = 0;
  }
  startChrono();

  // Versus: start auto-publish ticker (don't reset progress to 0, keep it at previous value)
  if (state.mode === 'versus') {
    // Start auto-publish ticker
    startProgressAutoPublish();
  }

  // Trigger flip wave animation briefly
  const FLIP_STEP = 70;   // must match BoardView's per-row delay
  const FLIP_DUR = 420;   // ms for a single cell flip
  const total = ROWS * FLIP_STEP + FLIP_DUR;
  flipActive.value = true;
  setTimeout(() => { flipActive.value = false; }, total);
  // When the wave finishes, hide the path completely and allow clicks
  setTimeout(() => { 
    state.revealed = false;
    revealComplete.value = true; // Allow clicks only after flip animation completes
  }, total);
}

function onCellClick(r, c) {
  if (!state.inPlay) return;
  if (clickBlocked.value) return; // Block clicks during shake animation
  const keyAlready = `${r}-${c}`;
  // Ignore repeated clicks on cells already validated as correct or marked as wrong
  if (state.correctSet.has(keyAlready)) return;
  if (state.wrongSet.has(keyAlready)) return;
  
  // Check if grid is frozen (versus mode) - any click breaks ice progressively
  if (state.mode === 'versus' && state.frozenGrid && state.frozenClicksLeft > 0) {
    // Decrement frozen clicks locally and update server
    state.frozenClicksLeft = Math.max(0, state.frozenClicksLeft - 1);
    if (versusCode.value) {
      const me = playerId.value || ensurePlayerId();
      const sb = getSupabase();
      sb.from('players')
        .update({ frozen_clicks: state.frozenClicksLeft })
        .eq('room_code', versusCode.value)
        .eq('player_id', me)
        .then(() => {});
    }
    // If ice broken, clear frozen state
    if (state.frozenClicksLeft === 0) {
      state.frozenGrid = false;
    }
    return; // Don't process as normal cell click while frozen
  }
  
  // Block all clicks if grid is frozen
  if (state.mode === 'versus' && state.frozenGrid) {
    return; // Can't click any cells while frozen
  }
  
  const expect = state.path[state.nextIndex];
  if (expect && expect.r === r && expect.c === c) {
    state.correctSet.add(`${r}-${c}`);
    state.nextIndex++;
    // Versus: publish progress after each correct step
    if (state.mode === 'versus') {
      try {
        const me = playerId.value || ensurePlayerId();
        const len = state.path.length || 1;
        const prog = Math.max(0, Math.min(1, state.nextIndex / len));
        if (versusCode.value) setPlayerProgress(versusCode.value, me, prog).then(updated => { if (updated) versusRoom.value = updated; }).catch(() => {});
      } catch (_) {}
    }
    if (state.nextIndex === state.path.length) {
      state.statusText = t('status.bravo');
      state.inPlay = false;
      // Stop auto publish at end of round
      stopProgressAutoPublish();
      // Stop chrono, reveal path now so it's visible during reverse flip,
      // then play reverse flip animation (keep facedown colors during the flip)
      stopChrono();
      state.revealed = true;
      const FLIP_BACK_STEP = 70;  // must match BoardView
      const FLIP_BACK_DUR = 420;  // must match BoardView
      const backTotal = ROWS * FLIP_BACK_STEP + FLIP_BACK_DUR;
      flipBackActive.value = true;
      setTimeout(async () => {
        flipBackActive.value = false;
        faceDownActive.value = false; // show front faces (remove random colors)
        // Record daily win in storage
        if (state.mode === 'daily') {
          try {
            recordDailyWin({ timeMs: chronoMs.value });
          } catch (_) {}
          dailyDone.value = true;
          // Show the win modal after recording a successful daily
          winActive.value = true;
        } else if (state.mode === 'solo') {
          // Solo: increment level, prepare next path, auto-advance without win modal
          soloLevel.value = (soloLevel.value || 0) + 1;
          state.soloPath = randomPath();
          // Immediately start next game
          newGame();
          return;
        } else if (state.mode === 'versus') {
          // Versus: increment score, check if reached 5, otherwise continue to next path
          try {
            const me = playerId.value || ensurePlayerId();
            // Identify an opponent. Prefer an alive opponent (lives > 0) when available.
            const snapshot = await getRoom(versusCode.value).catch(() => versusRoom.value);
            const room = snapshot || versusRoom.value;
            let opponent = null;
            if (room) {
              const roster = Array.isArray(room.players) ? room.players : [];
              const candidates = roster.filter(p => p && p.id && p.id !== me);
              // Prefer someone with remaining lives
              const alive = candidates.find(p => (p.lives ?? 3) > 0);
              opponent = (alive || candidates[0])?.id || null;
              // Legacy fallback to host/guest ids
              if (!opponent) {
                if (room.host_id && room.host_id !== me) opponent = room.host_id;
                else if (room.guest_id && room.guest_id !== me) opponent = room.guest_id;
              }
            }
            // Report round win to increment score
            const updated = await reportRoundWin(versusCode.value, me, chronoMs.value);
            if (updated) { versusRoom.value = updated; }
            
            // Check my current score
            const myPlayer = updated?.players?.find(p => p && p.id === me);
            const myScore = Number(myPlayer?.score || 0);
            
            // If room finished (all finished or only one alive), show win/lose modal
            if (updated && updated.status === 'finished') {
              if (updated.winner_id === me) {
                winActive.value = true;
              } else {
                loseActive.value = true;
              }
            } else if (myScore >= 5) {
              // I finished my 5 rounds, but match continues for others
              // Stop playing and wait for match to finish
              state.inPlay = false;
              stopChrono();
              stopProgressAutoPublish();
              // Show a waiting message or just idle state
            } else {
              // Do NOT locally reseed. Wait for server-driven beginVersus using room.seed + current_round.
              // Reset local playing state and auto-publish; subscription will trigger the next round.
              versusLastProgress.value = 0;
              state.inPlay = false;
              stopChrono();
              stopProgressAutoPublish();
              // Keep board idle until subscribeRoom(handleRoomUpdate) starts the next round.
            }
          } catch (_) {
            // If network/db error occurs, try a minimal fallback to advance.
            try {
              const me = playerId.value || ensurePlayerId();
              const updated = await reportRoundWin(versusCode.value, me, chronoMs.value);
              if (updated) { versusRoom.value = updated; }
              
              const myPlayer = updated?.players?.find(p => p && p.id === me);
              const myScore = Number(myPlayer?.score || 0);
              
              if (updated && updated.status === 'finished') {
                if (updated.winner_id === me) {
                  winActive.value = true;
                } else {
                  loseActive.value = true;
                }
              } else if (myScore >= 5) {
                // I finished, wait for others
                state.inPlay = false;
                stopChrono();
                stopProgressAutoPublish();
              } else {
                // Do NOT locally reseed. Wait for server-driven beginVersus using room.seed + current_round.
                versusLastProgress.value = 0;
                state.inPlay = false;
                stopChrono();
                stopProgressAutoPublish();
              }
            } catch (__){
              // Final fallback: show modal
              winActive.value = true;
            }
          }
        } else {
          // Other modes: show win modal
          winActive.value = true;
        }
      }, backTotal);
    }
  } else {
    // Wrong cell clicked - mark it with X and lose a heart, but continue playing
    const key = `${r}-${c}`;
    
    // Solo decoy handling: clicking a decoy does not cost a life but penalizes progress (-3 steps)
    if (state.mode === 'solo' && state.decoys.has(key)) {
      // Move back 3 steps
      const prevIndex = state.nextIndex;
      const newIndex = Math.max(0, prevIndex - 3);
      // Remove last correct marks accordingly
      for (let i = prevIndex - 1; i >= newIndex; i--) {
        const p = state.path[i];
        if (!p) break;
        state.correctSet.delete(`${p.r}-${p.c}`);
      }
      state.nextIndex = newIndex;
      state.statusText = t('status.miss');
      return; // do not trigger loss flow
    }
    
    // Mark the wrong cell with X
    state.wrongSet.add(key);
    state.statusText = t('status.miss');
    
    // Trigger shake animation and block clicks for 1.5 seconds
    shakeActive.value = true;
    clickBlocked.value = true;
    setTimeout(() => { shakeActive.value = false; }, 500); // Shake for 500ms
    setTimeout(() => { clickBlocked.value = false; }, 500); // Block for 1.5s
    
    // Trigger heart extinguish animation
    justLost.value = true;
    setTimeout(() => { justLost.value = false; }, 900);
    
    // Handle versus mode separately
    if (state.mode === 'versus') {
      // Versus mode: report life loss to server
      (async () => {
        try {
          const snapshot = await getRoom(versusCode.value).catch(() => versusRoom.value);
          const room = snapshot || versusRoom.value;
          const me = playerId.value || ensurePlayerId();
          let opponent = null;
          if (room) {
            const roster = Array.isArray(room.players) ? room.players : [];
            const other = roster.find(p => p && p.id && p.id !== me);
            opponent = other?.id || null;
            if (!opponent) {
              if (room.host_id && room.host_id !== me) opponent = room.host_id;
              else if (room.guest_id && room.guest_id !== me) opponent = room.guest_id;
            }
          }
          
          const updated = await reportLifeLoss(versusCode.value, me, opponent);
          if (updated) { versusRoom.value = updated; }
          
          // Check if the room is finished
          if (updated && updated.status === 'finished') {
            state.inPlay = false;
            stopChrono();
            const winnerId = updated.winner_id;
            if (winnerId === me) {
              winActive.value = true;
            } else {
              loseActive.value = true;
            }
          } else {
            // Check if I still have lives
            const myPlayer = updated?.players?.find(p => p.id === me);
            const myLives = myPlayer?.lives ?? 3;
            
            if (myLives <= 0) {
              // Player is eliminated
              state.inPlay = false;
              stopChrono();
              loseActive.value = true;
            }
            // Otherwise, continue playing with the wrong cell marked
          }
        } catch (_) {
          // On error, just continue playing
        }
      })();
    } else {
      // Daily/Solo modes: lose a heart
      if (state.mode === 'daily') {
        try {
          const attempts = markDailyAttempt();
          dailyAttempts.value = attempts;
        } catch (_) {}
      } else if (state.mode === 'solo') {
        soloLivesUsed.value = Math.min(3, (soloLivesUsed.value || 0) + 1);
      }
      
      // Check if out of hearts - if so, end game
      let outOfHearts = false;
      if (state.mode === 'daily' && (dailyAttempts.value || 0) >= 3) {
        outOfHearts = true;
      } else if (state.mode === 'solo' && (soloLivesUsed.value || 0) >= 3) {
        outOfHearts = true;
      }
      
      if (outOfHearts) {
        // Game over - stop playing and show lose modal
        state.inPlay = false;
        stopChrono();
        state.revealed = true;
        const FLIP_BACK_STEP = 70;
        const FLIP_BACK_DUR = 420;
        const backTotal = ROWS * FLIP_BACK_STEP + FLIP_BACK_DUR;
        flipBackActive.value = true;
        setTimeout(() => {
          flipBackActive.value = false;
          faceDownActive.value = false;
          loseActive.value = true;
        }, backTotal);
      }
      // Otherwise, continue playing with the wrong cell marked
    }
  }
}

function handleReplay() {
  loseActive.value = false;
  stopChrono();
  newGame();
}

function handleQuit() {
  loseActive.value = false;
  stopChrono();
  goHome();
}

function handleWinReturn() {
  winActive.value = false;
  stopChrono();
  goHome();
}

// Return to versus room lobby to allow starting a new match
async function handleVersusReplay() {
  // Close any modal
  loseActive.value = false;
  winActive.value = false;
  // Stop timers/publishing and leave gameplay state idle
  stopChrono();
  stopProgressAutoPublish();
  state.inPlay = false;
  faceDownActive.value = false;
  // Reset per-round local markers
  versusLastProgress.value = 0;
  versusStartAtMs.value = null;
  versusSeed.value = null;
  versusCurrentRound.value = 0;
  // Reset server-side room (hearts, scores, progress, round, seed) if available
  try {
    if (versusCode.value) {
      const updated = await resetRoom(versusCode.value);
      if (updated) versusRoom.value = updated;
    }
  } catch (_) {}
  // Show the Versus lobby view (keep current versusCode and subscription)
  showVersusView.value = true;
  state.showHome = false;
}

function closeOverlays() {
  showHelp.value = false;
  showSettings.value = false;
  showStats.value = false;
  showLang.value = false;
}

function openHelp() {
  showHelp.value = true;
}
function openSettings() {
  showSettings.value = true;
}
function openLang() {
  showLang.value = true;
}
function selectLang(code) {
  currentLang.value = code;
  try { locale.value = code; } catch (_) {}
  try { localStorage.setItem('locale', code); } catch (_) {}
  closeOverlays();
}
function loadStats() {
  try {
    const s = getState();
    stats.totalWins = s.dailyStats.totalWins || 0;
    stats.streak = s.dailyStats.streak || 0;
    stats.bestTimeMs = s.dailyStats.bestTimeMs ?? null;
    stats.bestTimeText = (stats.bestTimeMs == null) ? '-:-' : formatMs(stats.bestTimeMs);
    stats.lastAttempts = s.currentDaily.attemptsBeforeWin ?? null;
    stats.lastTimeMs = s.currentDaily.timeMs ?? null;
    stats.lastTimeText = (stats.lastTimeMs == null) ? '-:-' : formatMs(stats.lastTimeMs);
  } catch (_) {
    // ignore
  }
}
function openStats() {
  loadStats();
  showStats.value = true;
}

function openVersus() { /* legacy */ openVersusView(); }
function openVersusView() {
  showVersusView.value = true;
  state.showHome = false;
}

function closeVersus() { /* legacy */ handleCloseVersusView(); }
function handleCloseVersusView() {
  // VersusView already handles leaveRoom in closeLobby
  // Just clear local state and return home
  versusCode.value = '';
  versusRoom.value = null;
  versusIsHost.value = false;
  versusCurrentRound.value = 0;
  showVersusView.value = false;
  state.showHome = true;
}

function handleBeginVersusFromLobby(payload) {
  try {
    if (payload && typeof payload === 'object') {
      if (payload.code) versusCode.value = payload.code;
      if (payload.room) versusRoom.value = payload.room;
      if (typeof payload.seed === 'number' && typeof payload.startAtMs === 'number') {
        beginVersus(payload.seed, payload.startAtMs);
      }
      // VersusView keeps its subscription alive; App.vue will also subscribe to ensure updates during gameplay
      if (versusCode.value && !versusUnsub) subscribeToRoom(versusCode.value);
    }
  } finally {
    showVersusView.value = false;
  }
}

async function handleCreateRoom() {
  versusError.value = '';
  const name = (usernameInput.value || '').trim();
  if (!name) { versusError.value = 'Pseudo requis'; return; }
  try {
    const pid = playerId.value || ensurePlayerId();
    const code = await createRoom(pid, name);
    versusCode.value = code;
    versusIsHost.value = true;
    subscribeToRoom(code);
  } catch (e) {
    versusError.value = String(e && e.message || e);
  }
}

async function handleJoinRoom() {
  versusError.value = '';
  const code = (joinInput.value || '').trim().toUpperCase();
  const name = (usernameInput.value || '').trim();
  if (!name) { versusError.value = 'Pseudo requis'; return; }
  if (!code) { versusError.value = 'Code requis'; return; }
  try {
    const pid = playerId.value || ensurePlayerId();
    await joinRoom(code, pid, name);
    versusCode.value = code;
    versusIsHost.value = false;
    subscribeToRoom(code);
  } catch (e) {
    versusError.value = String(e && e.message || e);
  }
}

function subscribeToRoom(code) {
  if (versusUnsub) { try { versusUnsub(); } catch (_) {} }
  // Shared handler to process any room snapshot (from realtime or initial fetch)
  async function handleRoomUpdate(room) {
    if (!room) return;
    console.log('[App] Room update received:', room.status, room.players?.map(p => ({ id: p.id?.slice(0,4), progress: p.progress, round: p.current_round })));
    versusRoom.value = room;
    updateFreezeState();
    // When playing, check if we need to start/restart based on our current_round
    if (room.status === 'playing' && typeof room.seed === 'number' && typeof room.start_at_ms === 'number') {
      const me = playerId.value || ensurePlayerId();
      const myPlayer = room.players?.find(p => p && p.id === me);
      const myRound = myPlayer?.current_round || 1;
      
      // Ne redémarrer que si on a changé de round
      // Comparer le round actuel avec le round précédent
      const needsRestart = versusCurrentRound.value !== myRound;
      
      if (needsRestart) {
        console.log('[App] Démarrage du round', myRound, 'pour le joueur', me, '(précédent round:', versusCurrentRound.value, ')');
        versusCurrentRound.value = myRound;
        beginVersus(room.seed, room.start_at_ms, myRound);
        // Do not toggle back to home; just hide the VersusView so BoardView shows
        showVersusView.value = false;
        state.showHome = false;
      } else {
        console.log('[App] Round', myRound, 'déjà en cours, skip');
      }
      return;
    }
    // If finished, decide win/lose locally based on winner_id
    if (room.status === 'finished' && room.winner_id) {
      stopChrono();
      state.inPlay = false;
      faceDownActive.value = false;
      const me = playerId.value || ensurePlayerId();
      if (room.winner_id === me) {
        winActive.value = true;
      } else {
        loseActive.value = true;
      }
      return;
    }
  }

  // Charger d'abord la room pour initialiser le cache, PUIS s'abonner aux updates
  (async () => {
    try {
      console.log('[App] Chargement initial de la room pour le cache:', code);
      const snapshot = await getRoom(code);
      console.log('[App] Room chargée, cache initialisé avec', snapshot?.players?.length, 'joueurs');
      await handleRoomUpdate(snapshot);
      // Maintenant que le cache est prêt, on peut s'abonner
      console.log('[App] Création de la subscription realtime...');
      versusUnsub = subscribeRoom(code, async (room) => {
        await handleRoomUpdate(room);
      });
    } catch (err) {
      console.error('[App] Erreur lors du chargement initial:', err);
      // En cas d'erreur, on s'abonne quand même
      versusUnsub = subscribeRoom(code, async (room) => {
        await handleRoomUpdate(room);
      });
    }
  })();
}

async function handleStartVersus() {
  try {
    const room = versusRoom.value;
    const playersCount = (room && Array.isArray(room.players)) ? room.players.length : (defaultPlayers.value.length);
    if (!versusIsHost.value) { versusError.value = 'Seul l\'hôte peut démarrer'; return; }
    if (!versusCode.value) { versusError.value = 'Salle inconnue'; return; }
    if (playersCount < 2) { versusError.value = 'Au moins 2 joueurs requis'; return; }
    const seed = Math.floor(Math.random() * 1e9);
    const startAt = Date.now() + 1500; // petite latence pour synchroniser
    await startRoom(versusCode.value, seed, startAt);
  } catch (e) {
    versusError.value = String(e && e.message || e);
  }
}

function beginVersus(baseSeed, startAtMs, currentRound = 1) {
  // Calculer le seed pour ce round spécifique
  // Tous les joueurs au même round auront le même parcours
  const seed = baseSeed + (currentRound - 1) * 1000000;
  
  versusSeed.value = seed;
  versusStartAtMs.value = startAtMs;
  state.mode = 'versus';
  state.showHome = false;
  // Prepare deterministic path
  const rng = seededRng(seed);
  state.path = randomPathWithRng(rng);
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  faceDownActive.value = false;
  stopChrono();
  chronoMs.value = 0;
  
  console.log('[beginVersus] Round', currentRound, 'avec seed', seed, '(base:', baseSeed, ')');
  
  // Show power wheel overlay first (DISABLED)
  // showPowerWheel.value = true;
  
  // Schedule reveal to start exactly at startAtMs
  const delay = Math.max(0, startAtMs - Date.now());
  if (state.timerId) clearTimeout(state.timerId);
  state.timerId = setTimeout(() => {
    showPath();
  }, delay);
}

function handlePowerSelected(power) {
  selectedPower.value = power;
  console.log('Power selected:', power);
  // Pour l'instant, on ne fait rien avec le pouvoir
}

function closePowerWheel() {
  showPowerWheel.value = false;
}

async function handleShare() {
  const modeTag = state.mode ? ` – Mode: ${state.mode}` : '';
  const dailyTag = state.mode === 'daily' ? ' – #Daily' : '';
  const text = `bravo ! Temps: ${chronoText.value}${modeTag}${dailyTag}`;
  const url = typeof location !== 'undefined' ? location.href : '';
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    alert(t('alerts.shareCopied'));
  } catch (e) {
    alert(t('alerts.shareFailed'));
  }
}

function newGame() {
  state.showHome = false;
  if (state.mode === 'daily') {
    // Block starting a new daily game if limit reached
    try {
      const s = getState();
      const attempts = s.currentDaily?.attemptsBeforeWin || 0;
      dailyAttempts.value = attempts;
      if (attempts >= 3) {
        stopChrono();
        state.inPlay = false;
        state.revealed = false;
        faceDownActive.value = false;
        loseActive.value = true;
        return;
      }
    } catch (_) {}
    const rng = seededRng(dailySeed());
    state.path = randomPathWithRng(rng); // deterministic for the day
  } else if (state.mode === 'solo') {
    // In solo: keep the same path after a loss; use the prepared next path after a win
    state.path = (state.soloPath && state.soloPath.length) ? state.soloPath : randomPath();
    generateSoloDecoys();
  } else if (state.mode === 'versus' || state.mode === 'battle') {
    // Placeholder: same as solo for now
    state.path = randomPath();
  } else {
    state.path = randomPath();
  }
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  faceDownActive.value = false;
  stopChrono();
  // ensure timeText resets immediately
  chronoMs.value = 0;
  showPath();
}

async function goHome() {
  // Leave versus room if in one
  if (state.mode === 'versus' && versusCode.value) {
    try {
      const me = playerId.value || ensurePlayerId();
      await leaveRoom(versusCode.value, me);
    } catch (err) {
      console.error('[App] Error leaving room on goHome:', err);
    }
    // Clear versus state
    versusCode.value = '';
    versusRoom.value = null;
    versusIsHost.value = false;
    versusCurrentRound.value = 0;
    stopProgressAutoPublish();
  }
  
  // Réinitialise l'état comme au démarrage
  if (state.timerId) {
    clearTimeout(state.timerId);
    state.timerId = null;
  }
  stopRevealTicker();
  state.path = [];
  state.nextIndex = 0;
  state.revealed = false;
  state.inPlay = false;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.statusText = t('status.newGame');
  state.showHome = true;
  faceDownActive.value = false;
  stopChrono();
  chronoMs.value = 0;
  // reset modals
  winActive.value = false;
  loseActive.value = false;
  // refresh daily completion flag
  dailyDone.value = isDailyDoneToday();
  // refresh attempts for the day
  try {
    const s = getState();
    dailyAttempts.value = s.currentDaily?.attemptsBeforeWin || 0;
  } catch (_) { dailyAttempts.value = 0; }
  // reset solo lives when returning home
  soloLivesUsed.value = 0;
}

function startRevealTicker() {
  stopRevealTicker();
  state.intervalId = setInterval(() => {
    state.nowMs = Date.now();
  }, REVEAL_TICK);
}

function stopRevealTicker() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function cellClass(r, c) {
  const classes = [];
  const key = `${r}-${c}`;

  if (state.revealed) {
    const idx = state.path.findIndex(p => p.r === r && p.c === c);
    if (idx !== -1) {
      classes.push('path');
      if (idx === 0) classes.push('start');
      if (idx === state.path.length - 1) classes.push('end');
    }
  }

  if (state.correctSet.has(key)) classes.push('correct');
  if (state.wrongSet.has(key)) classes.push('wrong');

  return classes;
}

// Handle spacebar for freeze power in versus mode
function handleKeyDown(e) {
  if (e.code === 'Space') {
    console.log('[handleKeyDown] Space pressed:', {
      mode: state.mode,
      inPlay: state.inPlay,
      revealed: state.revealed,
      powerUsed: state.powerUsed,
      versusCode: !!versusCode.value
    });
    
    if (state.mode === 'versus' && state.inPlay && !state.revealed) {
      e.preventDefault();
      handleFreezePower();
    }
  }
}

async function handleFreezePower() {
  console.log('[handleFreezePower] Called with state:', {
    inPlay: state.inPlay,
    revealed: state.revealed,
    powerUsed: state.powerUsed,
    versusCode: versusCode.value
  });
  
  // Only allow power during active gameplay (not during memorization)
  if (!state.inPlay || state.revealed) {
    console.log('[handleFreezePower] ❌ Blocked: not in play or revealed');
    return;
  }
  if (!versusCode.value) {
    console.log('[handleFreezePower] ❌ Blocked: no versus code');
    return;
  }
  if (state.powerUsed) {
    console.log('[handleFreezePower] ❌ Blocked: power already used');
    return;
  }
  
  console.log('[handleFreezePower] ✅ Activating freeze power...');
  const me = playerId.value || ensurePlayerId();
  try {
    const updated = await usePower(versusCode.value, me, 'freeze');
    if (updated) versusRoom.value = updated;
    state.powerUsed = true; // Mark power as used
    console.log('[handleFreezePower] ✅ Freeze power activated!');
  } catch (err) {
    console.error('[handleFreezePower] ❌ Error:', err);
  }
}

onMounted(() => {
  // Sync flag with current i18n locale
  try { currentLang.value = String(locale.value || 'fr'); } catch (_) {}
  fitRootScale();
  fitBoard();
  window.addEventListener('resize', fitBoard);
  window.addEventListener('orientationchange', fitBoard);
  window.addEventListener('resize', fitRootScale);
  window.addEventListener('orientationchange', fitRootScale);
  window.addEventListener('keydown', handleKeyDown);
  // Ensure a player id exists for tracking
  try { ensurePlayerId(); } catch (_) {}
  
  // Initialize audio
  audioMuted.value = getAudioMuted();
  ensureAudio();
  // Try to play if unmuted (may still require a user gesture)
  if (!audioMuted.value) tryPlay();
  // Fallback: start playback on first user interaction if unmuted
  function onFirstInteract() {
    if (!audioMuted.value) tryPlay();
    window.removeEventListener('pointerdown', onFirstInteract, { capture: true });
    window.removeEventListener('keydown', onFirstInteract, { capture: true });
  }
  window.addEventListener('pointerdown', onFirstInteract, { capture: true, once: true });
  window.addEventListener('keydown', onFirstInteract, { capture: true, once: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitBoard);
  window.removeEventListener('orientationchange', fitBoard);
  window.removeEventListener('resize', fitRootScale);
  window.removeEventListener('orientationchange', fitRootScale);
  window.removeEventListener('keydown', handleKeyDown);
  if (state.timerId) clearTimeout(state.timerId);
  stopRevealTicker();
});
</script>

<style>
:root {
  --cols: 4;
  --rows: 10;
  --cell: 56px;          /* taille cible des cases */
  --gap: 8px;            /* espace entre cases */
  --pad: 12px;           /* padding du board */
  --accent: #6F08EF;
  --ok: #12b886;
  --bad: #ff2e5f;
  --bg: #0f1020;
  --panel: #17192c;
  --text: #e7e7ee;
  --muted: #9aa0b4;
}

html, body, #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--bg);
  display: flex;
  flex-direction: column;
  font-weight: 700;
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.content {
  width: 320px;
  height: 548px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: .5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal-card {
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 4px 0 #1a1c30;
  padding: 16px;
  min-width: 220px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Bounce-in animation when the modal appears */
  animation: modalBounce 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: center;
}
.modal-title { margin: 0; font-size: 20px; color: var(--text); }
.modal-actions { display: flex; gap: 8px; justify-content: center; }

.header {
  width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 4rem;
}

.header.small {
  height: 2.5rem;
}

.logo-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #2a2e52;
  margin-top: .75rem;
  background: #1a1c30;
  color: var(--text);
  box-shadow: 0 2px 0 #1a1c30;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.modal-btn:hover { background: #1f2238; }
.modal-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }

/* Hearts (lives) shown in lose modal */
.hearts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.heart {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ff5a8a; /* active heart color */
  opacity: 1;
  transition: color 220ms ease, opacity 220ms ease, transform 160ms ease;
}
.heart svg { display: block; }
.heart svg path { fill: currentColor; }
.heart.off {
  color: #3a3f6b;   /* muted gray for off hearts */
  opacity: 0.45;
}
.heart.blink {
  animation: heartExtinguish 640ms ease-in-out both;
}
@keyframes heartExtinguish {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.2); }
  55%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@keyframes modalBounce {
  0%   { transform: scale(0.9); opacity: 0; }
  60%  { transform: scale(1.04); opacity: 1; }
  80%  { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.left-view {
    display: flex;
    height: 100%;
    flex: 1 1 0%;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
}
</style>
