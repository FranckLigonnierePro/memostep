<template>
  <div class="app-frame">
    <div class="content" :style="{ transform: `scale(${rootScale})`}">
    <div v-if="route.name === 'Game'" :class="'header small'">
      <button class="profile-card" @click="openProfile" :aria-label="$t('home.settings')" :title="displayName">
        <img class="profile-avatar" :src="(selectedAvatar && selectedAvatar.img) || imgMage" alt="avatar" width="36" height="36" />
        <div class="profile-meta">
          <div class="profile-name">{{ displayName }}</div>
          <div class="profile-res">
            <span class="res-pill gold">🪙 {{ playerGold }}</span>
            <span class="res-pill essence">✨ {{ playerEssence }}</span>
            <span class="res-pill gem">💎 {{ playerGems }}</span>
          </div>
        </div>
      </button>
      <div class="gear-wrap">
        <button class="gear-btn" @click="toggleGearMenuMain" :aria-label="$t('home.settings')" :title="$t('home.settings')">
          <Settings :size="18" />
        </button>
        <div v-if="showGearMenuMain" class="gear-menu" @mouseleave="closeGearMenuMain">
          <button class="gear-item" @click="openSettings(); closeGearMenuMain()">{{ $t('home.settings') }}</button>
          <button class="gear-item" @click="openHelp(); closeGearMenuMain()">{{ $t('home.help') }}</button>
          <button class="gear-item" @click="toggleAudio(); closeGearMenuMain()">{{ audioMuted ? $t('home.audioOn') : $t('home.audioOff') }}</button>
          <button class="gear-item" @click="openLang(); closeGearMenuMain()">{{ $t('home.lang') }}</button>
        </div>
      </div>
    </div>
    
    <UsernameModal
      v-if="route.name === 'Home' && showNameModal"
      :name="nameModalInput"
      :error="nameError"
      @update:name="(v) => nameModalInput = v"
      @continueAsGuest="continueAsGuest"
      @openProfile="openProfileFromNameModal"
    />

    <!-- Router View: renders the current route component with dynamic props -->
    <router-view v-slot="{ Component }">
      <component
        :is="Component"
        v-bind="routeProps"
        @start="newGame"
        @solo="() => startMode('solo')"
        @versus="openVersusView"
        @help="openHelp"
        @settings="openSettings"
        @stats="openStats"
        @openLang="openLang"
        @toggleAudio="toggleAudio"
        @openProfile="openProfile"
        @close="handleCloseView"
        @select="handleProfileSelect"
        @begin="handleBeginVersusFromLobby"
        @cellClick="onCellClick"
        @goHome="goHome"
        @newGame="newGame"
      />
    </router-view>

   
    </div>
    <!-- Pre-game Champion Selector Overlay -->
    <div v-if="showChampionSelector" class="modal-overlay">
      <div class="modal-card" style="max-width:720px; width:90%;">
        <ChampionSelector
          :cards="avatarCards"
          :taken="takenAvatars"
          :secondsLeft="selectSecondsLeft"
          @select="handleChampionPick"
          @close="closeChampionSelector"
        />
      </div>
    </div>
    <!-- Versus Ready Countdown Overlay -->
    <div v-if="versusReadyCountdown > 0" class="modal-overlay">
      <div class="countdown-display">
        <div class="countdown-number">{{ versusReadyCountdown }}</div>
        <div class="countdown-text">{{ $t('versus.starting') || 'Démarrage...' }}</div>
      </div>
    </div>
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
            v-if="state.mode !== 'versus' && !(state.mode === 'solo' && soloLivesUsed >= 3)"
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
    
    <!-- Level Up Modal -->
    <LevelUpModal
      :visible="showLevelUpModal"
      :newLevel="levelUpData.newLevel"
      :rewards="levelUpData.rewards"
      @close="closeLevelUpModal"
    />
    
    <!-- XP Toast Notifications -->
    <XpToast :notifications="xpNotifications" />
    
    <!-- End Path Modal for Solo Mode -->
    <EndPathModal
      :visible="showEndPathModal"
      :status="endPathData.status"
      :stage="endPathData.stage"
      :timeSeconds="endPathData.timeSeconds"
      :livesLeft="endPathData.livesLeft"
      :xpBreakdown="endPathData.xpBreakdown"
      @continue="handleEndPathContinue"
      @abandon="handleEndPathAbandon"
    />
    
    <!-- Auth Modal -->
    <AuthModal
      v-if="showAuthModal"
      :isLinking="isLinkingAccount"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
      @continueAsGuest="handleContinueAsGuest"
    />
    
  </template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import HomeView from './components/HomeView.vue';
import BoardView from './components/BoardView.vue';
import KoFiDonors from './components/KoFiDonors.vue';
import VersusView from './components/VersusView.vue';
import PowerWheel from './components/PowerWheel.vue';
import ProfileView from './components/ProfileView.vue';
import ChampionSelector from './components/ChampionSelector.vue';
import Leaderboard from './components/Leaderboard.vue';
import UsernameModal from './components/UsernameModal.vue';
import LevelUpModal from './components/LevelUpModal.vue';
import XpToast from './components/XpToast.vue';
import EndPathModal from './components/EndPathModal.vue';
import AuthModal from './components/AuthModal.vue';
// Import flag assets so Vite resolves URLs correctly
import frFlag from './assets/fr.png';
import enFlag from './assets/en.png';
import esFlag from './assets/es.png';
import deFlag from './assets/de.png';
import { User, Settings } from 'lucide-vue-next';
import themeUrl from './assets/memosteptheme.mp3';
import crackTexture from './assets/crack.png';
// Avatar assets for champion selection
import imgCasseur from './assets/profils/casseur.png';
import imgDark from './assets/profils/dark.png';
import imgElectrik from './assets/profils/electrik.png';
import imgForest from './assets/profils/forest.jpg';
import imgFrozen from './assets/profils/frozen.png';
import imgGuerriere from './assets/profils/guerriere.png';
import imgMage from './assets/profils/mage.png';
import imgPixel from './assets/profils/pixel.png';
import imgDanseur from './assets/profils/danseur.png';
import imgInventeur from './assets/profils/inventeur.png';
import imgShadow from './assets/profils/shadow.png';
import imgAstre from './assets/profils/astre.png';
import imgColosse from './assets/profils/colosse.png';
import imgChrono from './assets/profils/chrono.png';
import imgHack from './assets/profils/hack.png';
import imgArchie from './assets/profils/archie.png';
import {
  ensurePlayerId,
  getState,
  getAudioMuted,
  setAudioMuted,
} from './lib/storage.js';
import { initRealtime, createRoom, joinRoom, subscribeRoom, startRoom, finishRoom, getRoom, reportRoundWin, reportRoundResult, reportLifeLoss, setPlayerProgress, resetRoom, usePower, leaveRoom } from './lib/realtime_v2.js';
import { generateEnrichedGrid } from './lib/gridGenerator.js';
import { getMatchXP, getMultiplayerXP, calculateLevel, addXP, calculateSoloXP } from './lib/xpSystem.js';
import { 
  onAuthStateChange, 
  isAuthenticated, 
  isGuest as checkIsGuest,
  getCurrentUser,
  getProfile,
  signOut
} from './lib/auth.js';

// Get supabase instance for direct updates
let supabase = null;
function getSupabase() {
  if (!supabase) supabase = initRealtime();
  return supabase;
}

// Upsert global solo leaderboard entry into Supabase
async function upsertSoloScore({ playerId: pid, name, bestLevel, timeMs }) {
  try {
    const sb = getSupabase();
    // Fetch existing
    const { data: existing, error: getErr } = await sb
      .from('solo_scores')
      .select('*')
      .eq('player_id', pid)
      .maybeSingle();
    if (getErr) throw getErr;
    if (existing) {
      const newBestLevel = Math.max(Number(existing.best_level || 0), Number(bestLevel || 0));
      const newBestTime = (existing.best_time_ms == null)
        ? Number(timeMs || 0)
        : Math.min(Number(existing.best_time_ms || 0), Number(timeMs || 0));
      const newTotal = Number(existing.total_levels || 0) + 1;
      await sb
        .from('solo_scores')
        .update({
          name: name || existing.name || 'Player',
          best_level: newBestLevel,
          best_time_ms: newBestTime,
          total_levels: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('player_id', pid);
    } else {
      await sb
        .from('solo_scores')
        .insert([{ 
          player_id: pid,
          name: name || 'Player',
          best_level: Number(bestLevel || 0),
          best_time_ms: Number(timeMs || 0),
          total_levels: 1,
          updated_at: new Date().toISOString(),
        }]);
    }
  } catch (_) { /* ignore leaderboard errors */ }
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

// Router
const router = useRouter();
const route = useRoute();

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
  mode: 'solo',
  // Persist current solo path across retries until success
  soloPath: [],
  // Heart placement: prepared for the NEXT solo path (after a win), and active for the current round
  preparedHeart: null,   // { r, c } or null, assigned when preparing the next solo path
  heartCell: null,       // { r, c } or null, active heart on current path
  // Solo decoy cells (adjacent to path), active from level >= 5
  decoys: new Set(), // 'r-c'
  // Rollback cells (adjacent to path) that cause -2 steps instead of losing a life (solo/daily)
  rollback: new Set(), // 'r-c'
  // Trap cells (adjacent to path) that stun for 1s (solo/daily)
  stun: new Set(), // 'r-c'
  // Life-loss cells on border (solo/daily) — explicit 20%
  lifeLoss: new Set(), // 'r-c'
  // Freeze power state (versus mode)
  frozenGrid: false,    // whether entire grid is frozen
  frozenClicksLeft: 0,  // how many clicks left to break ice (starts at 8)
  powerUsed: false,     // whether freeze power has been used this round
  showSnowstorm: false, // whether to show snowstorm animation
  // Grille enrichie avec bonus et pièges (générée par gridGenerator.js)
  gridContent: null,    // grid[r][c] = { type, value?, gold?, essence? }
  // Bonus collectés (cases cliquées après validation du chemin adjacent)
  collectedBonuses: new Set(), // 'r-c'
});

// Flip wave animation control (top -> bottom)
const flipActive = ref(false);
const flipBackActive = ref(false);
// Stun visual indicator for solo
const stunActive = ref(false);

// Face-down colors control
const faceDownActive = ref(false);
const faceColors = ref({}); // { 'r-c': 'yellow' | 'green' | 'purple' | 'blue' }

// Shake animation and click blocking on wrong cell
const shakeActive = ref(false);
const clickBlocked = ref(false);

// Detect and handle potential horizontal mirroring between visual grid and path indices
const mirrorColumns = ref(false);

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
// Gear menu states for headers
const showGearMenuLeft = ref(false);
const showGearMenuMain = ref(false);
const showGearMenuRight = ref(false);
// Selected avatar
const selectedAvatar = ref(null); // { id, name, emoji } or similar
// Versus UI state
const showVersus = ref(false); // legacy modal (unused now)
const showPowerWheel = ref(false); // power wheel overlay for versus mode
const selectedPower = ref(null); // currently selected power
const versusCode = ref('');
const joinInput = ref('');
const usernameInput = ref('');
// Display name for Home header (falls back to saved username or 'Player')
const displayName = computed(() => {
  const direct = String(usernameInput.value || '').trim();
  if (direct) return direct;
  try {
    const saved = String(localStorage.getItem('memostep_username') || '').trim();
    if (saved) return saved;
  } catch (_) {}
  return 'Player';
});
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

// Champion selection overlay state
const showChampionSelector = ref(false);
const selectSecondsLeft = ref(0);
let selectTimerId = null;
// Versus ready countdown state
const versusReadyCountdown = ref(0);
let versusReadyTimerId = null;
// List of champions available
const avatarCards = [
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
const takenAvatars = computed(() => {
  if (state.mode !== 'versus') return [];
  const room = versusRoom.value;
  const roster = (room && Array.isArray(room.players)) ? room.players : [];
  return roster.map(p => p?.avatar_url).filter(u => !!u);
});

// Watch for all players ready in versus mode
watch(versusRoom, (room) => {
  if (state.mode !== 'versus' || !showChampionSelector.value || versusReadyCountdown.value > 0) return;
  if (!room || !Array.isArray(room.players)) return;
  
  const allReady = room.players.every(p => p && p.champion_ready === true);
  if (allReady && room.players.length >= 1) {
    // All players have chosen - start 3s countdown
    console.log('[App] All players ready, starting countdown');
    closeChampionSelector();
    versusReadyCountdown.value = 3;
    if (versusReadyTimerId) clearInterval(versusReadyTimerId);
    versusReadyTimerId = setInterval(() => {
      versusReadyCountdown.value = Math.max(0, versusReadyCountdown.value - 1);
      if (versusReadyCountdown.value <= 0) {
        clearInterval(versusReadyTimerId);
        versusReadyTimerId = null;
        console.log('[App] Countdown finished');
        // Countdown finished - showPath will be called by the scheduled timer in beginVersus
      }
    }, 1000);
  }
}, { deep: true });

function pickRandomAvailableAvatar() {
  const taken = new Set(takenAvatars.value);
  const candidates = avatarCards.filter(c => !taken.has(c.img));
  if (!candidates.length) return avatarCards[Math.floor(Math.random() * avatarCards.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

async function updatePlayerAvatarUrl(url) {
  if (state.mode !== 'versus' || !versusCode.value) return;
  const me = playerId.value || ensurePlayerId();
  try {
    const sb = getSupabase();
    // Try to update with champion_ready, but fallback to just avatar_url if column doesn't exist
    const { error } = await sb.from('players').update({ avatar_url: url, champion_ready: true }).eq('room_code', versusCode.value).eq('player_id', me);
    if (error && error.message?.includes('champion_ready')) {
      // Column doesn't exist, just update avatar_url and close selector immediately
      await sb.from('players').update({ avatar_url: url }).eq('room_code', versusCode.value).eq('player_id', me);
      closeChampionSelector();
      return false; // Indicate feature not available
    }
    return true; // Feature available
  } catch (_) {
    return false;
  }
}

function closeChampionSelector() {
  if (selectTimerId) { clearInterval(selectTimerId); selectTimerId = null; }
  showChampionSelector.value = false;
}

async function handleChampionPick(card) {
  selectedAvatar.value = card;
  try { localStorage.setItem('selectedAvatar', JSON.stringify(card)); } catch (_) {}
  if (state.mode === 'versus') {
    const hasFeature = await updatePlayerAvatarUrl(card.img);
    // If champion_ready feature not available, selector is already closed by updatePlayerAvatarUrl
    // Don't close selector yet if feature is available - wait for all players
  } else {
    closeChampionSelector();
    // If a deferred start was waiting (solo), call showPath now if not already revealing
    if (!state.revealed && !state.inPlay && (state.mode === 'solo')) {
      showPath();
    }
  }
}

function startChampionSelection({ mode = state.mode, delayStart = false } = {}) {
  // In versus, do not delay the synchronized start; in solo we can delay
  showChampionSelector.value = true;
  selectSecondsLeft.value = 10;
  if (selectTimerId) { clearInterval(selectTimerId); selectTimerId = null; }
  selectTimerId = setInterval(() => {
    selectSecondsLeft.value = Math.max(0, (selectSecondsLeft.value || 0) - 1);
    if (selectSecondsLeft.value <= 0) {
      clearInterval(selectTimerId); selectTimerId = null;
      if (!selectedAvatar.value) {
        const pick = pickRandomAvailableAvatar();
        handleChampionPick(pick);
      } else {
        // Player already has an avatar - use it
        if (mode === 'versus') {
          // In versus, need to mark as ready
          handleChampionPick(selectedAvatar.value);
        } else {
          closeChampionSelector();
        }
      }
      // If solo and we wanted to delay the start, ensure it starts now
      if (delayStart && mode === 'solo' && !state.revealed && !state.inPlay) {
        showPath();
      }
    }
  }, 1000);
}

// Username modal state and helpers
const showNameModal = ref(false);
const nameModalInput = ref('');
const nameError = ref('');

function openNameModalIfNeeded() {
  try {
    const raw = localStorage.getItem('memostep_username');
    const saved = (raw == null ? '' : String(raw)).trim();
    if (!saved && route.name === 'Home') {
      nameModalInput.value = '';
      nameError.value = '';
      showNameModal.value = true;
    }
  } catch (_) {
    if (route.name === 'Home') {
      nameModalInput.value = '';
      nameError.value = '';
      showNameModal.value = true;
    }
  }
}

function saveNameFromModal() {
  const v = String(nameModalInput.value || '').trim();
  if (!v) return;
  try { localStorage.setItem('memostep_username', v); } catch(_) {}
  usernameInput.value = v;
  showNameModal.value = false;
}

function closeNameModal() { showNameModal.value = false; }

function generateGuestName() {
  const n = Math.floor(Math.random() * 10000);
  const suffix = String(n).padStart(4, '0');
  return `Memoguest${suffix}`;
}

function continueAsGuest() {
  let v = String(nameModalInput.value || '').trim();
  if (!v) {
    v = generateGuestName();
  }
  nameError.value = '';
  try { localStorage.setItem('memostep_username', v); } catch(_) {}
  usernameInput.value = v;
  showNameModal.value = false;
}

function openProfileFromNameModal() {
  showNameModal.value = false;
  router.push('/login');
}

// ============================================
// FONCTIONS D'AUTHENTIFICATION
// ============================================

/**
 * Ouvre le modal d'authentification
 */
function openAuthModal(linking = false) {
  isLinkingAccount.value = linking;
  showAuthModal.value = true;
}

/**
 * Ferme le modal d'authentification
 */
function closeAuthModal() {
  showAuthModal.value = false;
  isLinkingAccount.value = false;
}

/**
 * Gère le succès de l'authentification
 */
async function handleAuthSuccess() {
  console.log('[App] Auth success');
  closeAuthModal();
  
  // Recharger le profil
  await loadUserProfile();
}

/**
 * Gère le clic sur "Continuer en guest"
 */
function handleContinueAsGuest() {
  closeAuthModal();
  continueAsGuest();
}

/**
 * Charge le profil utilisateur depuis Supabase
 */
async function loadUserProfile() {
  try {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      const user = await getCurrentUser();
      currentUser.value = user;
      
      // Charger le profil complet
      const profile = await getProfile(user.id);
      currentProfile.value = profile;
      
      // Mettre à jour les stats depuis player_stats
      if (profile.player_stats) {
        playerLevel.value = profile.player_stats.current_level || 1;
        playerGold.value = profile.player_stats.gold || 0;
        playerEssence.value = profile.player_stats.essence || 0;
        playerGems.value = profile.player_stats.gems || 0;
        playerTotalXp.value = profile.player_stats.total_xp || 0;
      }
      
      isGuestUser.value = false;
      console.log('[App] Profile loaded:', profile);
    } else {
      // Pas authentifié, charger depuis localStorage
      loadLocalStats();
      isGuestUser.value = checkIsGuest();
    }
  } catch (error) {
    console.error('[App] Error loading profile:', error);
    // Fallback sur localStorage
    loadLocalStats();
    isGuestUser.value = true;
  }
}

/**
 * Charge les stats depuis localStorage (fallback)
 */
function loadLocalStats() {
  try {
    // Charger XP
    const xpData = localStorage.getItem('memostep_player_xp');
    if (xpData) {
      const parsed = JSON.parse(xpData);
      playerTotalXp.value = parsed.totalXp || 0;
      updateLevelFromXP();
    }
    
    // Charger ressources
    const resources = localStorage.getItem('memostep_resources');
    if (resources) {
      const parsed = JSON.parse(resources);
      playerGold.value = parsed.gold || 0;
      playerEssence.value = parsed.essence || 0;
      playerGems.value = parsed.gems || 0;
    }
  } catch (error) {
    console.error('[App] Error loading local stats:', error);
  }
}

// Language state
const currentLang = ref('fr');
const flags = { fr: frFlag, en: enFlag, es: esFlag, de: deFlag };
const currentFlag = computed(() => flags[currentLang.value] || frFlag);

// Router props: pass appropriate props to each view based on current route
const routeProps = computed(() => {
  const routeName = route.name;
  
  // Common props for all views
  const common = {
    logoSrc: logoSrc.value,
    selectedAvatar: selectedAvatar.value,
    displayName: displayName.value,
    currentFlag: currentFlag.value,
    audioMuted: audioMuted.value,
  };
  
  // HomeView props
  if (routeName === 'Home') {
    return {
      ...common,
      playerGold: playerGold.value,
      playerEssence: playerEssence.value,
      playerGems: playerGems.value,
      playerLevel: playerLevel.value,
      playerLevelProgress: playerLevelProgress.value,
    };
  }
  
  // VersusView props
  if (routeName === 'Versus') {
    return {
      code: versusCode.value,
      selectedAvatar: selectedAvatar.value,
      pauseMainMusic,
      resumeMainMusic,
    };
  }
  
  // BoardView props
  if (routeName === 'Game') {
    return {
      cells: cells.value,
      boardStyle: boardStyle.value,
      cellClass,
      revealSecondsText: revealSecondsText.value,
      revealProgress: revealProgress.value,
      flipActive: flipActive.value,
      flipBackActive: flipBackActive.value,
      rowsCount: ROWS,
      colsCount: COLS,
      faceDownActive: faceDownActive.value,
      faceColors: faceColors.value,
      revealComplete: revealComplete.value,
      timeText: chronoText.value,
      score: soloLevel.value,
      mode: state.mode,
      versusWins: versusWins.value,
      versusProgress: versusProgress.value,
      versusPlayers: versusPlayers.value,
      livesUsed: livesUsed.value,
      justLost: justLost.value,
      lastExtinguishedIndex: lastExtinguishedIndex.value,
      frozenGrid: state.frozenGrid,
      frozenClicksLeft: state.frozenClicksLeft,
      showSnowstorm: state.showSnowstorm,
      powerAvailable: !state.powerUsed,
      path: state.path,
      versusPathsByPlayer: versusPathsByPlayer.value,
      revealed: state.revealed,
      heartCell: state.heartCell,
      shakeActive: shakeActive.value,
      wrongCrackTexture: crackTexture,
      selfId: playerId.value,
      selectedAvatar: selectedAvatar.value,
      playerProgress: state.nextIndex,
      rollbackKeys: Array.from(state.rollback || []),
      lifeLossKeys: Array.from(state.lifeLoss || []),
      stunKeys: Array.from(state.stun || []),
      stunActive: stunActive.value,
      gridContent: state.gridContent,
      collectedBonuses: Array.from(state.collectedBonuses || []),
      playerGold: playerGold.value,
      playerEssence: playerEssence.value,
      playerGems: playerGems.value,
    };
  }
  
  // ProfileView has no props
  return {};
});

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

// Daily mode removed

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
// Compteurs globaux pour maxPerRun (gemmes, potions) - réinitialisés à chaque session solo
const runCounters = ref({ gem: 0, potion: 0 });
// Ressources collectées par le joueur
const playerGold = ref(0);
const playerEssence = ref(0);
const playerGems = ref(0);
// XP and Level system
const playerTotalXp = ref(0);
const playerLevel = ref(1);
const playerLevelProgress = ref(0); // 0-1 for progress bar
const showLevelUpModal = ref(false);
const levelUpData = ref({ newLevel: 1, rewards: [] });
const xpNotifications = ref([]);
// End Path Modal for solo mode
const showEndPathModal = ref(false);
const endPathData = ref({
  status: 'completed', // 'completed', 'no_life_left', 'abandon'
  stage: 1,
  timeSeconds: 0,
  livesLeft: 3,
  xpBreakdown: { baseXp: 0, timeXp: 0, multiplier: 1.0, totalXp: 0 }
});
// Auth Modal state
const showAuthModal = ref(false);
const isLinkingAccount = ref(false);
const currentUser = ref(null);
const currentProfile = ref(null);
const isGuestUser = ref(true);
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
  return roster.map(p => {
    const wins = Number(p && p.score != null ? p.score : 0);
    // Prefer live local progress for self, otherwise use stored progress
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
    // Include avatar_url so BoardView can render the correct image
    return { id: p.id, name, wins, progress, color, frozenClicks, isFrozen, avatar_url: p.avatar_url };
  });
});

// Map each player to a deterministic path and a fixed starting column (0..3)
const versusPathsByPlayer = computed(() => {
  if (state.mode !== 'versus') return {};
  const room = versusRoom.value;
  const roster = (room && Array.isArray(room.players)) ? room.players.slice(0, COLS) : [];
  if (!versusSeed.value || !versusStartAtMs.value) return {};
  const roundSeed = Number(versusSeed.value) || 0;
  const map = {};
  roster.forEach((p, idx) => {
    const startCol = idx % COLS; // fixed column assignment per join order
    // Derive a stable seed per player to vary paths while staying in sync across clients
    const idHash = Math.abs(hashString(String(p.id || p.name || ''))) % 1000000;
    // Use a much larger multiplier to ensure very different seeds per player
    const seed = roundSeed + (idx + 1) * 987654321 + idHash;
    const rng = seededRng(seed >>> 0);
    map[p.id] = randomPathWithRngAndStart(rng, startCol);
  });
  return map;
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
  if (state.mode === 'solo') return Math.min(3, soloLivesUsed.value);
  if (state.mode === 'versus') return versusLivesUsed.value;
  return 0;
});
const lastExtinguishedIndex = computed(() => {
  if (state.mode === 'solo' || state.mode === 'versus') return Math.min(2, livesUsed.value - 1);
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

// Simple deterministic string hash
function hashString(s) {
  let hash = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
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

// Variant that forces a given starting column at the bottom row
function randomPathWithRngAndStart(rng, startCol) {
  const arr = [];
  let c = Math.max(0, Math.min(COLS - 1, startCol));
  for (let r = ROWS - 1; r >= 0; r--) {
    if (r < ROWS - 1) {
      const moves = [-1, 0, 1].map(d => c + d).filter(nc => nc >= 0 && nc < COLS);
      c = moves[Math.floor(rng() * moves.length)];
    }
    arr.push({ r, c });
  }
  return arr;
}

// Pick a random heart cell on a given path, avoiding start/end when possible
function pickHeartForPath(pathArr) {
  try {
    if (!Array.isArray(pathArr) || pathArr.length === 0) return null;
    const n = pathArr.length;
    // Prefer indices [1, n-2] to avoid start/end; if too small, allow any index
    const start = n >= 3 ? 1 : 0;
    const end = n >= 3 ? (n - 2) : (n - 1);
    const idx = start + Math.floor(Math.random() * (end - start + 1));
    const p = pathArr[idx];
    if (!p || typeof p.r !== 'number' || typeof p.c !== 'number') return null;
    return { r: p.r, c: p.c };
  } catch (_) {
    return null;
  }
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

function generateRollbackCells() {
  state.rollback.clear();
  // Only for solo
  if (state.mode !== 'solo') return;
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
  // Shuffle and pick ~60% of border cells
  for (let i = candArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candArr[i], candArr[j]] = [candArr[j], candArr[i]];
  }
  const take = Math.floor(candArr.length * 0.6);
  const picks = candArr.slice(0, take);
  for (const k of picks) state.rollback.add(k);
}

// Partition border cells into 40% rollback, 40% stun, 20% life-loss (solo/daily/versus)
function generateBorderHazards() {
  state.rollback.clear();
  state.stun.clear();
  state.lifeLoss.clear();
  if (state.mode !== 'solo' && state.mode !== 'versus') return;
  const pathSet = new Set(state.path.map(p => `${p.r}-${p.c}`));
  const candidates = new Set();
  for (const p of state.path) {
    const neigh = [
      { r: p.r - 1, c: p.c }, { r: p.r + 1, c: p.c },
      { r: p.r, c: p.c - 1 }, { r: p.r, c: p.c + 1 },
    ];
    for (const n of neigh) {
      if (n.r < 0 || n.r >= ROWS || n.c < 0 || n.c >= COLS) continue;
      const key = `${n.r}-${n.c}`;
      if (!pathSet.has(key)) candidates.add(key);
    }
  }
  const arr = Array.from(candidates);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const total = arr.length;
  const takeRollback = Math.floor(total * 0.4);
  const takeStun = Math.floor(total * 0.4);
  const rollbackSlice = arr.slice(0, takeRollback);
  const stunSlice = arr.slice(takeRollback, takeRollback + takeStun);
  const lifeSlice = arr.slice(takeRollback + takeStun);
  for (const k of rollbackSlice) state.rollback.add(k);
  for (const k of stunSlice) state.stun.add(k);
  for (const k of lifeSlice) state.lifeLoss.add(k);
}

/**
 * Nouvelle fonction : Applique la grille enrichie générée par gridGenerator.js
 * Lit gridContent.json et applique les probabilités dynamiques selon l'étage
 * @param {number} floorNumber - Numéro de l'étage (commence à 1)
 * @param {Object} runCounters - Compteurs globaux pour maxPerRun
 */
function applyEnrichedGrid(floorNumber = 1, runCounters = { gem: 0, potion: 0 }) {
  // Générer la grille enrichie basée sur gridContent.json
  const { grid, runCounters: newCounters } = generateEnrichedGrid(state.path, floorNumber, runCounters);
  
  // Stocker la grille enrichie dans le state pour affichage visuel
  state.gridContent = grid;
  
  let bonusCount = { gold: 0, gem: 0, essence: 0, potion: 0 };
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.type === 'gold' || (cell.type === 'path' && cell.gold)) bonusCount.gold++;
      if (cell.type === 'gem') bonusCount.gem++;
      if (cell.type === 'essence' || (cell.type === 'path' && cell.essence)) bonusCount.essence++;
      if (cell.type === 'potion') bonusCount.potion++;
    }
  }
  
  // Réinitialiser les sets existants
  state.rollback.clear();
  state.stun.clear();
  state.lifeLoss.clear();
  state.decoys.clear();
  
  // Parcourir la grille et appliquer les éléments au state
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      const key = `${r}-${c}`;
      
      // Appliquer les pièges
      if (cell.type === 'trap_life') {
        state.lifeLoss.add(key);
      } else if (cell.type === 'trap_back2') {
        state.rollback.add(key);
      } else if (cell.type === 'trap_stun') {
        state.stun.add(key);
      }
      
      // Les bonus (or, gemme, essence, potion) sont maintenant stockés
      // dans state.gridContent et seront affichés par BoardView
    }
  }
  
  return newCounters;
}

// Daily mode removed

function startMode(mode) {
  state.mode = mode;
  router.push('/game');
  if (mode === 'solo') {
    // Solo: start with a fresh random path
    state.path = randomPath();
    // For solo runs, we keep the same path across retries until win
    state.soloPath = state.path.slice();
    // Generate hazards for borders
    generateBorderHazards();
    // Réinitialiser les compteurs globaux pour une nouvelle session
    runCounters.value = { gem: 0, potion: 0 };
    // starting solo from home should create a new path
    state.soloPath = randomPath();
    state.path = state.soloPath;
    // First level: no heart yet; future heart will be prepared after this level is passed
    state.heartCell = null;
    state.preparedHeart = null;
    // Utiliser le nouveau système de génération basé sur gridContent.json
    // L'étage commence à 1
    runCounters.value = applyEnrichedGrid(1, runCounters.value);
  } else if (mode === 'versus') {
    // Placeholder: start like solo for now
    state.path = randomPath();
    // You can extend with networking/matchmaking later
  } else {
    state.path = randomPath();
  }
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.collectedBonuses.clear();
  if (mode === 'solo') {
    // Show champion selector and start after selection or timeout
    startChampionSelection({ mode: 'solo', delayStart: true });
  } else {
    showPath();
  }
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
    if (versusCode.value && !versusUnsub) { subscribeToRoom(versusCode.value); }
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
  // Effective column used to compare with path; we keep visual marks on the clicked cell (r,c)
  const effectiveC = mirrorColumns.value ? (COLS - 1 - c) : c;
  
  // Check if this is a bonus cell - treat as valid path cell (violet)
  if (state.gridContent && state.gridContent[r] && state.gridContent[r][c]) {
    const cell = state.gridContent[r][c];
    const isBonusCell = (cell.type === 'gold' || cell.type === 'gem' || cell.type === 'essence' || cell.type === 'potion');
    
    if (isBonusCell && !state.collectedBonuses.has(keyAlready)) {
      // Vérifier que le bonus est sur la même ligne que la prochaine case attendue
      const expect = state.path[state.nextIndex];
      if (expect && expect.r === r) {
        // Bonus sur la bonne ligne - traiter comme case valide
        state.correctSet.add(keyAlready);
        state.collectedBonuses.add(keyAlready);
        state.nextIndex++; // Avancer à la ligne suivante
        
        // Appliquer les effets des bonus
        if (cell.type === 'gold') {
          const goldValue = cell.value || 5;
          playerGold.value += goldValue;
        } else if (cell.type === 'gem') {
          playerGems.value += 1;
        } else if (cell.type === 'essence') {
          playerEssence.value += 1;
        } else if (cell.type === 'potion') {
          // Restaurer 1 vie
          soloLivesUsed.value = Math.max(0, soloLivesUsed.value - 1);
        }
        
        // Vérifier si c'est la fin du chemin
        if (state.nextIndex === state.path.length) {
          state.statusText = t('status.bravo');
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
            handleMatchWin();
          }, backTotal);
        }
        
        return; // Treated as correct cell
      }
    }
  }
  
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
  // Auto-detect mirroring on first mismatch: if row matches and mirrored column would match expected, enable mirroring
  if (expect && expect.r === r && expect.c !== c && expect.c === (COLS - 1 - c) && !mirrorColumns.value) {
    mirrorColumns.value = true;
  }
  if (expect && expect.r === r && expect.c === effectiveC) {
    state.correctSet.add(`${r}-${c}`);
    state.nextIndex++;
    // Heart pickup on correct click (solo mode only)
    if (state.mode === 'solo' && state.heartCell && state.heartCell.r === r && state.heartCell.c === effectiveC) {
      // Grant back one life (down to a minimum of 0 used)
      soloLivesUsed.value = Math.max(0, (soloLivesUsed.value || 0) - 1);
      state.heartCell = null; // consume the heart
    }
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
        if (state.mode === 'solo') {
          // Solo: increment level, prepare next path, auto-advance without win modal
          soloLevel.value = (soloLevel.value || 0) + 1;
          // Record/update global solo leaderboard
          try {
            const me = playerId.value || ensurePlayerId();
            const name = (usernameInput.value || 'Player');
            await upsertSoloScore({ playerId: me, name, bestLevel: soloLevel.value, timeMs: chronoMs.value });
          } catch (_) {}
          // Prepare next solo path and place a heart on it only if not at full lives
          const nextPath = randomPath();
          state.soloPath = nextPath;
          state.preparedHeart = (soloLivesUsed.value > 0) ? pickHeartForPath(nextPath) : null;
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
                handleMultiplayerWin();
              } else {
                handleMultiplayerLose();
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
                  handleMultiplayerWin();
                } else {
                  handleMultiplayerLose();
                }
              } else if (myScore >= 5) {
                // I finished, wait for others
                state.inPlay = false;
                stopChrono();
                stopProgressAutoPublish();
              } else {
                // Do NOT locally reseed. Wait for server-driven beginVersus using room.seed + current_round.
              }
            } catch (__) {
              // Final fallback: show modal
              handleMatchWin();
            }
          }
        } else {
          // Other modes: show win modal
          handleMatchWin();
        }
      }, backTotal);
    }
    // Otherwise, continue playing with the wrong cell marked
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

    // If this is a stun cell (solo), handle stun effect and skip shake/heart animations
    const isStunCell = state.stun.has(key);
    if (isStunCell && state.mode !== 'versus') {
      clickBlocked.value = true;
      stunActive.value = true;
      setTimeout(() => { clickBlocked.value = false; stunActive.value = false; }, 1000);
      return;
    }
    
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
      // Check stun first: if stun cell, block input 1s without life loss or server report
      const isStunCell = state.stun.has(key);
      if (isStunCell) {
        clickBlocked.value = true;
        stunActive.value = true;
        setTimeout(() => { clickBlocked.value = false; stunActive.value = false; }, 1000);
        return;
      }
      // Check rollback: if rollback cell, move back 2 steps without life loss or server report
      if (state.rollback.has(key)) {
        const prevIndex = state.nextIndex;
        const newIndex = Math.max(0, prevIndex - 2);
        for (let i = prevIndex - 1; i >= newIndex; i--) {
          const p = state.path[i];
          if (!p) break;
          state.correctSet.delete(`${p.r}-${p.c}`);
        }
        state.nextIndex = newIndex;
        // Update server progress
        const prog = state.path.length > 0 ? state.nextIndex / state.path.length : 0;
        if (versusCode.value) {
          const me = playerId.value || ensurePlayerId();
          updatePlayerProgress(versusCode.value, me, prog).catch(err => {
            console.error('[App] Error updating progress after rollback:', err);
          });
        }
        return;
      }
      // Report wrong click to server (async, non-blocking)
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
              handleMultiplayerWin();
            } else {
              handleMultiplayerLose();
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
      // Daily/Solo modes: check type of cell clicked
      
      // 1. Rollback cell (trap_back2): move back 2 steps, no life loss
      if (state.rollback.has(key)) {
        const prevIndex = state.nextIndex;
        const newIndex = Math.max(0, prevIndex - 2);
        for (let i = prevIndex - 1; i >= newIndex; i--) {
          const p = state.path[i];
          if (!p) break;
          state.correctSet.delete(`${p.r}-${p.c}`);
        }
        state.nextIndex = newIndex;
        return; // no life loss
      }
      
      // 2. Neutral cell: stay in place, no life loss, no effect
      const isNeutralCell = state.gridContent && 
                           state.gridContent[r] && 
                           state.gridContent[r][c] && 
                           state.gridContent[r][c].type === 'neutral';
      
      if (isNeutralCell) {
        // Just mark as wrong, but stay at current position (no life loss, no reset)
        state.statusText = t('status.miss');
        return; // no life loss, no position change
      }
      
      // Check if out of hearts - if so, end game
      let outOfHearts = false;
      if (state.mode === 'solo' && (soloLivesUsed.value || 0) >= 3) {
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
  router.push('/versus');
}

function closeOverlays() {
  showHelp.value = false;
  showSettings.value = false;
  showStats.value = false;
  showLang.value = false;
}

// Gear menu handlers
function toggleGearMenuLeft() { showGearMenuLeft.value = !showGearMenuLeft.value; }
function closeGearMenuLeft() { showGearMenuLeft.value = false; }
function toggleGearMenuMain() { showGearMenuMain.value = !showGearMenuMain.value; }
function closeGearMenuMain() { showGearMenuMain.value = false; }
function toggleGearMenuRight() { showGearMenuRight.value = !showGearMenuRight.value; }
function closeGearMenuRight() { showGearMenuRight.value = false; }

function openHelp() {
  showHelp.value = true;
}
function openSettings() {
  showSettings.value = true;
}
function openProfile() {
  router.push('/profile');
}
// Generic close handler for views (Profile, Versus)
function handleCloseView() {
  router.push('/');
}
function handleCloseProfileView() {
  router.push('/');
}
function handleProfileSelect(card) {
  selectedAvatar.value = card;
  try { localStorage.setItem('selectedAvatar', JSON.stringify(card)); } catch(_){}
  router.push('/');
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
// Match Win/Lose handlers with XP
function handleMatchWin() {
  // For solo mode, show EndPathModal instead of direct win modal
  if (state.mode === 'solo') {
    showEndPathModalForSolo('completed');
  } else {
    winActive.value = true;
    
    // Grant XP for win
    const xpAmount = getMatchXP('win');
    grantXP(xpAmount, 'Match Win');
  }
  
  // TODO: Check for perfect_run, time_record, all_bonus_collected bonuses
}

function handleMatchLose() {
  // For solo mode, show EndPathModal instead of direct lose modal
  if (state.mode === 'solo') {
    showEndPathModalForSolo('no_life_left');
  } else {
    loseActive.value = true;
    
    // Grant XP for lose (consolation XP)
    const xpAmount = getMatchXP('lose');
    grantXP(xpAmount, 'Match Lose');
  }
}

function handleMultiplayerWin() {
  winActive.value = true;
  
  // Grant XP for multiplayer win (duel_win for now)
  const xpAmount = getMultiplayerXP('duel_win');
  grantXP(xpAmount, 'Multiplayer Win');
}

function handleMultiplayerLose() {
  loseActive.value = true;
  
  // Grant XP for lose (same as match lose)
  const xpAmount = getMatchXP('lose');
  grantXP(xpAmount, 'Multiplayer Lose');
}

// XP System functions
function loadPlayerXP() {
  try {
    const saved = localStorage.getItem('memostep_player_xp');
    if (saved) {
      const data = JSON.parse(saved);
      playerTotalXp.value = Number(data.totalXp || 0);
      updateLevelFromXP();
    }
  } catch (_) {
    playerTotalXp.value = 0;
    playerLevel.value = 1;
    playerLevelProgress.value = 0;
  }
}

function savePlayerXP() {
  try {
    localStorage.setItem('memostep_player_xp', JSON.stringify({
      totalXp: playerTotalXp.value
    }));
  } catch (_) {}
}

function updateLevelFromXP() {
  const levelInfo = calculateLevel(playerTotalXp.value);
  playerLevel.value = levelInfo.level;
  playerLevelProgress.value = levelInfo.progress;
}

function grantXP(amount, reason = '') {
  if (amount <= 0) return;
  
  const result = addXP(playerTotalXp.value, amount);
  playerTotalXp.value = result.newTotalXp;
  updateLevelFromXP();
  savePlayerXP();
  
  console.log(`[XP] +${amount} XP (${reason}). Total: ${result.newTotalXp}, Level: ${result.newLevel}`);
  
  // Show XP gain notification
  showXpNotification(amount, reason, result.leveledUp);
  
  // Handle level up
  if (result.leveledUp) {
    handleLevelUp(result);
  }
}

function handleLevelUp(levelUpResult) {
  console.log(`[XP] LEVEL UP! ${levelUpResult.oldLevel} → ${levelUpResult.newLevel}`);
  
  // Process rewards
  for (const rewardData of levelUpResult.rewards) {
    const { level, reward } = rewardData;
    console.log(`[XP] Level ${level} rewards:`, reward);
    
    // Grant rewards
    if (reward.coins) {
      playerGold.value += reward.coins;
      saveResources();
    }
    if (reward.gemmes) {
      playerGems.value += reward.gemmes;
      saveResources();
    }
    // TODO: Handle other reward types (coffre, personnage, skin_exclusif)
  }
  
  // Show level up modal
  levelUpData.value = {
    newLevel: levelUpResult.newLevel,
    rewards: levelUpResult.rewards
  };
  showLevelUpModal.value = true;
}

function closeLevelUpModal() {
  showLevelUpModal.value = false;
}

function showXpNotification(amount, reason, isLevelUp = false) {
  const notification = {
    xp: amount,
    title: isLevelUp ? 'Level Up!' : 'XP Gained',
    message: reason,
    isLevelUp
  };
  
  // Add to notifications array (XpToast will handle display and auto-remove)
  xpNotifications.value = [...xpNotifications.value, notification];
  
  // Clear the array after a short delay to allow the toast component to process
  setTimeout(() => {
    xpNotifications.value = [];
  }, 100);
}

// End Path Modal handlers for solo mode
function showEndPathModalForSolo(status) {
  const stage = soloLevel.value + 1; // Current stage (1-based)
  const timeSeconds = Math.floor(chronoMs.value / 1000);
  const livesLeft = 3 - soloLivesUsed.value;
  
  // Calculate XP breakdown
  const xpBreakdown = calculateSoloXP(stage, timeSeconds, status);
  
  endPathData.value = {
    status,
    stage,
    timeSeconds,
    livesLeft,
    xpBreakdown
  };
  
  showEndPathModal.value = true;
}

function handleEndPathContinue() {
  showEndPathModal.value = false;
  
  // Grant XP
  const xpAmount = endPathData.value.xpBreakdown.totalXp;
  grantXP(xpAmount, `Solo Stage ${endPathData.value.stage}`);
  
  if (endPathData.value.status === 'no_life_left') {
    // Game over - go home
    goHome();
  } else {
    // Continue to next stage
    soloLevel.value++;
    newGame();
  }
}

function handleEndPathAbandon() {
  showEndPathModal.value = false;
  
  // Calculate XP with abandon multiplier
  const stage = endPathData.value.stage;
  const timeSeconds = endPathData.value.timeSeconds;
  const xpBreakdown = calculateSoloXP(stage, timeSeconds, 'abandon');
  
  // Grant XP
  grantXP(xpBreakdown.totalXp, `Solo Stage ${stage} (Abandoned)`);
  
  // Go home
  goHome();
}

function loadStats() {
  // Daily stats removed; keep placeholders
  stats.totalWins = 0;
  stats.streak = 0;
  stats.bestTimeMs = null;
  stats.bestTimeText = '-:-';
  stats.lastAttempts = null;
  stats.lastTimeMs = null;
  stats.lastTimeText = '-:-';
}
function openStats() {
  loadStats();
  showStats.value = true;
}

function openVersus() { /* legacy */ openVersusView(); }
function openVersusView() {
  router.push('/versus');
}

function closeVersus() { /* legacy */ handleCloseVersusView(); }
function handleCloseVersusView() {
  // VersusView already handles leaveRoom in closeLobby
  // Just clear local state and return home
  versusCode.value = '';
  versusRoom.value = null;
  versusIsHost.value = false;
  versusCurrentRound.value = 0;
  router.push('/');
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
      if (versusCode.value) { if (versusUnsub) { try { versusUnsub(); } catch (_) {} } subscribeToRoom(versusCode.value); }
    }
  } finally {
    router.push('/versus');
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
      
      // Ne redémarrer que si on a changé de round OU si on n'est pas en train de jouer
      // Comparer le round actuel avec le round précédent
      const needsRestart = versusCurrentRound.value !== myRound || !state.inPlay;
      
      if (needsRestart) {
        console.log('[App] Démarrage du round', myRound, 'pour le joueur', me, '(précédent round:', versusCurrentRound.value, ', inPlay:', state.inPlay, ')');
        versusCurrentRound.value = myRound;
        beginVersus(room.seed, room.start_at_ms, myRound);
        // Do not toggle back to home; just hide the VersusView so BoardView shows
        router.push('/game');
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
        handleMultiplayerWin();
      } else {
        handleMultiplayerLose();
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
  // Reset champion ready state for new round
  versusReadyCountdown.value = 0;
  if (versusReadyTimerId) {
    clearInterval(versusReadyTimerId);
    versusReadyTimerId = null;
  }
  
  // Reset champion_ready flag in database for this player (if column exists)
  if (versusCode.value) {
    const me = playerId.value || ensurePlayerId();
    try {
      const sb = getSupabase();
      sb.from('players').update({ champion_ready: false }).eq('room_code', versusCode.value).eq('player_id', me).then(() => {}).catch(() => {});
    } catch (_) {}
  }
  
  // Calculer le seed pour ce round spécifique
  const seed = baseSeed + (currentRound - 1) * 1000000;
  
  versusSeed.value = seed;
  versusStartAtMs.value = startAtMs;
  state.mode = 'versus';
  // Reset local cached progress so the bubble starts on the first cell
  versusLastProgress.value = 0;
  
  // Generate the local player's unique path based on their position in the roster
  const me = playerId.value || ensurePlayerId();
  const room = versusRoom.value;
  const roster = (room && Array.isArray(room.players)) ? room.players.slice(0, COLS) : [];
  console.log('[beginVersus] Roster order:', roster.map((p, i) => ({ idx: i, id: p.id?.slice(0,6), name: p.name })));
  console.log('[beginVersus] My ID:', me?.slice(0,6));
  const myIndex = roster.findIndex(p => p && p.id === me);
  
  if (myIndex >= 0) {
    const startCol = myIndex % COLS;
    const idHash = Math.abs(hashString(String(me))) % 1000000;
    const mySeed = seed + (myIndex + 1) * 987654321 + idHash;
    const rng = seededRng(mySeed >>> 0);
    state.path = randomPathWithRngAndStart(rng, startCol);
    console.log('[beginVersus] Joueur index:', myIndex, 'colonne:', startCol, 'seed:', mySeed, 'path first cell:', state.path[0]);
  } else {
    // Fallback: generate a random path if player not found in roster
    const rng = seededRng(seed);
    state.path = randomPathWithRng(rng);
    console.log('[beginVersus] ⚠️ Joueur non trouvé dans le roster, chemin par défaut');
  }
  
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  generateBorderHazards();
  faceDownActive.value = false;
  stopChrono();
  chronoMs.value = 0;
  
  console.log('[beginVersus] Round', currentRound, 'avec seed de base', seed, '(base:', baseSeed, ')');
  
  // Show power wheel overlay first (DISABLED)
  // showPowerWheel.value = true;

  // Show champion selector without delaying the synced start
  startChampionSelection({ mode: 'versus', delayStart: false });
  
  // Schedule reveal to start exactly at startAtMs
  const delay = Math.max(0, startAtMs - Date.now());
  console.log('[beginVersus] Scheduling showPath in', delay, 'ms (at', new Date(startAtMs).toISOString(), ')');
  if (state.timerId) clearTimeout(state.timerId);
  state.timerId = setTimeout(() => {
    console.log('[beginVersus] Calling showPath now');
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
  const text = `bravo ! Temps: ${chronoText.value}`;
  const url = typeof location !== 'undefined' ? location.href : '';
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    alert(t('alerts.shareCopied'));
  } catch (e) {
    alert(t('alerts.shareFailed'));
  }
}

function newGame() {
  if (state.mode === 'solo') {
    // Reset/prepare solo path if needed
    if (!Array.isArray(state.soloPath) || state.soloPath.length === 0) {
      state.soloPath = randomPath();
    }
    // Activate prepared heart for this new path (if any), then clear preparation
    state.heartCell = state.preparedHeart || null;
    state.preparedHeart = null;
    // Utiliser le nouveau système de génération basé sur gridContent.json
    // L'étage est soloLevel + 1 (car on vient de l'incrémenter avant d'appeler newGame)
    const currentFloor = Math.max(1, (soloLevel.value || 0) + 1);
    runCounters.value = applyEnrichedGrid(currentFloor, runCounters.value);
  } else if (state.mode === 'versus') {
    // Placeholder: same as solo for now
    state.path = randomPath();
  } else {
    state.path = randomPath();
  }
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.collectedBonuses.clear();
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
  faceDownActive.value = false;
  stopChrono();
  chronoMs.value = 0;
  // reset modals
  winActive.value = false;
  loseActive.value = false;
  // reset solo lives when returning home
  soloLivesUsed.value = 0;
  // Navigate to home
  router.push('/');
  // Prompt for username if missing when back on Home
  openNameModalIfNeeded();
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
    if (state.mode === 'versus' && state.inPlay && !state.revealed) {
      e.preventDefault();
      handleFreezePower();
    }
  }
}

async function handleFreezePower() {
  // Only allow power during active gameplay (not during memorization)
  if (!state.inPlay || state.revealed) return;
  if (!versusCode.value) return;
  if (state.powerUsed) return;
  
  const me = playerId.value || ensurePlayerId();
  try {
    const updated = await usePower(versusCode.value, me, 'freeze');
    if (updated) versusRoom.value = updated;
    state.powerUsed = true; // Mark power as used
  } catch (err) {
    console.error('[handleFreezePower] Error:', err);
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

  // Load selected avatar if previously chosen
  try {
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar) {
      selectedAvatar.value = JSON.parse(savedAvatar);
    }
  } catch (_) {}
  
  // Load player XP and level
  loadPlayerXP();
  
  // Load player resources
  loadResources();
  
  // Load user profile (auth or guest)
  loadUserProfile();
  
  // Listen to auth state changes
  const authSubscription = onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      await loadUserProfile();
    } else if (event === 'SIGNED_OUT') {
      currentUser.value = null;
      currentProfile.value = null;
      isGuestUser.value = true;
      loadLocalStats();
    }
  });
  
  // Store subscription for cleanup
  window._authSubscription = authSubscription;
  
  // If starting on Home, prompt for username if missing
  openNameModalIfNeeded();
});

onBeforeUnmount(() => {
  cleanupSub();
  stopWaitingMusic();
  
  // Cleanup auth subscription
  if (window._authSubscription) {
    window._authSubscription.unsubscribe();
  }
  
  window.removeEventListener('resize', fitBoard);
  window.removeEventListener('orientationchange', fitBoard);
  window.removeEventListener('resize', fitRootScale);
  window.removeEventListener('orientationchange', fitRootScale);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keydown', handleGlobalKeydown);
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
  --ok: #12b847;
  --bad: #fd1919;
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
  height: 568px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: .5rem;
}

/* Frame that keeps the main content perfectly centered */
.app-frame {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  overflow: hidden;
  background-image: url('./assets/home-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Hide donors sidebar on narrow screens to preserve space */
@media (max-width: 900px) {
  .left-view { display: none; }
}

@media (max-width: 900px) {
  .right-view { display: none; }
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

/* Versus Ready Countdown */
.countdown-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.countdown-number {
  font-size: 120px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 0.8),
    0 0 40px rgba(59, 130, 246, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.5);
  animation: countdownPulse 1s ease-in-out;
}
.countdown-text {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
@keyframes countdownPulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

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

.menu-btn {
  padding: 12px;
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

.menu-btn:hover { background: #1f2238; }
.menu-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }

/* Center icons in small square buttons (help, settings, flag) */
.menu-btn.w-11.h-11 {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;        /* remove extra padding for perfect centering */
  line-height: 1;    /* avoid vertical offset from line height */
}

/* Define the size for the w-11/h-11 utility classes if not provided elsewhere */
.menu-btn.w-11 { width: 50px; }
.menu-btn.h-11 { height: 44px; }

/* Normalize icon rendering */
.menu-btn.w-11.h-11 svg { display: block; }

/* Profile card header */
.profile-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid #2a2e52;
  background: #1a1c30;
  box-shadow: 0 2px 0 #1a1c30;
  color: var(--text);
  cursor: pointer;
}
.profile-avatar { border-radius: 10px; display:block; position: relative; }
.profile-level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1c30;
  font-weight: 900;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 2px solid #1a1c30;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1;
  min-width: 20px;
  text-align: center;
}
.profile-meta { display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
.profile-name { font-weight: 800; font-size: 14px; line-height: 1; }
.profile-res { display:flex; gap:6px; }
.res-pill { font-size: 12px; padding: 2px 6px; border-radius: 999px; background:#101226; border:1px solid #2a2e52; }
.res-pill.gold { color:#ffd166; }
.res-pill.essence { color:#a78bfa; }
.res-pill.gem { color:#76e4f7; }
</style>
