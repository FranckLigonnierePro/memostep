<template>
  <div class="content" :style="{ transform: `scale(${rootScale})`}">
    <div :class="'header' + (!state.showHome ? ' small' : '')">
      <div class="logo-container">
        <img :src="logoSrc" alt="Logo" class="logo" width="73" height="73">
      </div>
    </div>
    
    <HomeView
      v-if="state.showHome"
      :logoSrc="logoSrc"
      @start="newGame"
      @daily="() => startMode('daily')"
      @solo="() => startMode('solo')"
      @versus="() => startMode('versus')"
      @battle="() => startMode('battle')"
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
      @cellClick="onCellClick"
      @goHome="goHome"
      @newGame="newGame"
    />

   
  </div>
   <!-- Loses modal -->
    <div v-if="loseActive" class="modal-overlay">
      <div class="modal-card">
        <h2 class="modal-title">Perdu</h2>
        <div class="modal-actions">
          <button class="modal-btn" @click="handleReplay">Rejouer</button>
          <button class="modal-btn" @click="handleQuit">Quitter</button>
        </div>
      </div>
    </div>
    <!-- Win modal -->
    <div v-if="winActive" class="modal-overlay">
      <div class="modal-card">
        <h2 class="modal-title">bravo !</h2>
        <div>
          Temps: {{ chronoText }}
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="handleShare">Partager</button>
          <button class="modal-btn" @click="handleWinReturn">Retour</button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue';
import HomeView from './components/HomeView.vue';
import BoardView from './components/BoardView.vue';

// Try to load a real logo from assets if present (supports memostep or memostep-logo)
const logoModules = import.meta.glob('./assets/{memostep,memostep-logo}.{png,jpg,jpeg,webp,svg}', { eager: true });
const realLogoUrl = (() => {
  const first = Object.values(logoModules)[0];
  // Vite returns a module whose default export is the URL string
  return first && (first.default || first);
})();

const logoSrc = computed(() => (typeof realLogoUrl === 'string' && realLogoUrl) ? realLogoUrl : '');

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
const ROWS = 12;
const TARGET_CELL = 56;  // taille cible confortable
const MIN_CELL = 48;     // taille minimale ergonomique
const MAX_CELL = 72;     // taille max esthétique
const REVEAL_MS = 8000;  // 8s d'exposition
const REVEAL_TICK = 100; // rafraîchissement du timer (ms)

// Refs DOM
const appRef = ref(null);
const headerRef = ref(null);
const footerRef = ref(null);

// Etat
const state = reactive({
  path: [],            // [{r,c}, ...]
  nextIndex: 0,
  inPlay: false,
  revealed: false,     // pendant l'exposition du chemin
  statusText: 'Cliquez « Nouvelle partie » pour commencer',
  correctSet: new Set(), // 'r-c'
  wrongSet: new Set(),   // 'r-c'
  cellSize: TARGET_CELL, // pixels
  scale: 1,
  timerId: null,
  intervalId: null,
  revealEndAt: 0,
  nowMs: Date.now(),
  showHome: true,
  mode: 'solo',
});

// Flip wave animation control (top -> bottom)
const flipActive = ref(false);
const flipBackActive = ref(false);

// Face-down colors control
const faceDownActive = ref(false);
const faceColors = ref({}); // { 'r-c': 'yellow' | 'green' | 'purple' | 'blue' }

// Reveal bar should remain filled once the memorize phase completes
const revealComplete = ref(false);

// Lose modal
const loseActive = ref(false);
// Win modal
const winActive = ref(false);

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
  const startAt = Date.now();
  const base = chronoMs.value;
  chronoIntervalId = setInterval(() => {
    chronoMs.value = base + (Date.now() - startAt);
  }, 250);
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
  const elapsed = Math.min(REVEAL_MS, REVEAL_MS - revealMsLeft.value);
  return Math.min(1, Math.max(0, elapsed / REVEAL_MS));
});

const revealSecondsText = computed(() => {
  if (!state.revealed) return (REVEAL_MS / 1000).toFixed(1) + ' s';
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

function dailySeed() {
  const d = new Date();
  // YYYYMMDD as number
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return key;
}

function startMode(mode) {
  state.mode = mode;
  state.showHome = false;
  if (mode === 'daily') {
    const rng = seededRng(dailySeed());
    state.path = randomPathWithRng(rng);
  } else if (mode === 'solo') {
    state.path = randomPath();
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
  state.statusText = 'Mémorisez le chemin';
  // reset chrono display during reveal so timeText shows 00:00 immediately
  chronoMs.value = 0;
  if (state.timerId) clearTimeout(state.timerId);
  // programme la fin d'exposition et démarre le compteur visuel
  state.revealEndAt = Date.now() + REVEAL_MS;
  startRevealTicker();
  state.timerId = setTimeout(hidePath, REVEAL_MS);
  // while revealing, ensure face is up (no face-down colors)
  faceDownActive.value = false;
  // reset bar fill state at start
  revealComplete.value = false;
}

function hidePath() {
  // Keep revealed=true during the flip so the path remains visible on the front face
  state.inPlay = true;
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.statusText = 'À vous de jouer !';
  stopRevealTicker();

  // Assign random face-down colors first so they are visible during the flip
  faceColors.value = genFaceColors();
  faceDownActive.value = true;
  // mark bar as fully filled
  revealComplete.value = true;
  // reset and start chrono
  chronoMs.value = 0;
  startChrono();

  // Trigger flip wave animation briefly
  const FLIP_STEP = 70;   // must match BoardView's per-row delay
  const FLIP_DUR = 420;   // ms for a single cell flip
  const total = ROWS * FLIP_STEP + FLIP_DUR;
  flipActive.value = true;
  setTimeout(() => { flipActive.value = false; }, total);
  // When the wave finishes, hide the path completely
  setTimeout(() => { state.revealed = false; }, total);
}

function onCellClick(r, c) {
  if (!state.inPlay) return;
  const expect = state.path[state.nextIndex];
  if (expect && expect.r === r && expect.c === c) {
    state.correctSet.add(`${r}-${c}`);
    state.nextIndex++;
    if (state.nextIndex === state.path.length) {
      state.statusText = 'Bravo !';
      state.inPlay = false;
      // Stop chrono, reveal path now so it's visible during reverse flip,
      // then play reverse flip animation (keep facedown colors during the flip)
      stopChrono();
      state.revealed = true;
      const FLIP_BACK_STEP = 70;  // must match BoardView
      const FLIP_BACK_DUR = 420;  // must match BoardView
      const backTotal = ROWS * FLIP_BACK_STEP + FLIP_BACK_DUR;
      flipBackActive.value = true;
      setTimeout(() => {
        flipBackActive.value = false;
        faceDownActive.value = false; // show front faces (remove random colors)
        winActive.value = true;       // show modal after animation
      }, backTotal);
    }
  } else {
    state.wrongSet.add(`${r}-${c}`);
    state.statusText = 'Raté !';
    state.inPlay = false;
    // Stop chrono immediately on mistake
    stopChrono();
    // Reveal the path now so it's visible during reverse flip (bottom-left -> top-right wave)
    // During reverse flip, show front faces at the end
    state.revealed = true;
    const FLIP_BACK_STEP = 70;  // must match BoardView
    const FLIP_BACK_DUR = 420;  // must match BoardView
    const backTotal = ROWS * FLIP_BACK_STEP + FLIP_BACK_DUR;
    flipBackActive.value = true;
    // Ensure facedown stays during animation, then reveal faces up
    setTimeout(() => {
      flipBackActive.value = false;
      faceDownActive.value = false; // keep faces up revealing the path
      loseActive.value = true;      // show modal
    }, backTotal);
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

async function handleShare() {
  const modeTag = state.mode ? ` – Mode: ${state.mode}` : '';
  const dailyTag = state.mode === 'daily' ? ' – #Daily' : '';
  const text = `bravo ! Temps: ${chronoText.value}${modeTag}${dailyTag}`;
  const url = typeof location !== 'undefined' ? location.href : '';
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    alert('Résultat copié dans le presse-papiers !');
  } catch (e) {
    alert('Impossible de copier automatiquement. Vous pouvez copier manuellement votre résultat.');
  }
}

function newGame() {
  state.showHome = false;
  if (state.mode === 'daily') {
    const rng = seededRng(dailySeed());
    state.path = randomPathWithRng(rng); // deterministic for the day
  } else if (state.mode === 'solo') {
    state.path = randomPath();
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

function goHome() {
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
  state.statusText = 'Cliquez « Nouvelle partie » pour commencer';
  state.showHome = true;
  faceDownActive.value = false;
  stopChrono();
  chronoMs.value = 0;
  // reset modals
  winActive.value = false;
  loseActive.value = false;
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

onMounted(() => {
  fitRootScale();
  fitBoard();
  window.addEventListener('resize', fitBoard);
  window.addEventListener('orientationchange', fitBoard);
  window.addEventListener('resize', fitRootScale);
  window.addEventListener('orientationchange', fitRootScale);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitBoard);
  window.removeEventListener('orientationchange', fitBoard);
  window.removeEventListener('resize', fitRootScale);
  window.removeEventListener('orientationchange', fitRootScale);
  if (state.timerId) clearTimeout(state.timerId);
  stopRevealTicker();
});
</script>

<style>
:root {
  --cols: 4;
  --rows: 12;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
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

</style>
