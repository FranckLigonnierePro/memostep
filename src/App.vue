<template>
  <div class="content" :style="{ transform: `scale(${rootScale})`, transformOrigin: 'top center' }">
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
      @cellClick="onCellClick"
      @goHome="goHome"
      @newGame="newGame"
    />
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
  if (state.timerId) clearTimeout(state.timerId);
  // programme la fin d'exposition et démarre le compteur visuel
  state.revealEndAt = Date.now() + REVEAL_MS;
  startRevealTicker();
  state.timerId = setTimeout(hidePath, REVEAL_MS);
}

function hidePath() {
  state.revealed = false;
  state.inPlay = true;
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.statusText = 'À vous de jouer !';
  window.alert(state.statusText);
  stopRevealTicker();
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
    }
  } else {
    state.wrongSet.add(`${r}-${c}`);
    state.statusText = 'Raté !';
    window.alert(state.statusText);
    state.inPlay = false;
  }
}

function newGame() {
  state.showHome = false;
  state.path = randomPath();
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
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

</style>
