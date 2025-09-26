<template>
  <div class="app" ref="appRef">
    <header ref="headerRef">
      <div class="brand">
        <img class="logo" :src="logoSrc" alt="MemoStep logo" />
      </div>
    </header>
    
    <div class="home" v-if="state.showHome">
      <div class="home-card">
        <img class="home-logo" :src="logoSrc" alt="MemoStep logo" />
        <h1 class="home-title">MemoStep</h1>
        <button class="start-btn" @click="newGame">Commencer à jouer</button>
      </div>
    </div>

    <div class="board-wrap" v-else>
      <div class="panel">
        <div
          ref="boardRef"
          id="board"
          class="board"
          aria-label="Plateau 4 par 12"
          role="grid"
          :style="boardStyle"
        >
        <div
          v-for="(cell, idx) in cells"
          :key="idx"
          class="cell"
          :data-r="cell.r"
          :data-c="cell.c"
          :class="cellClass(cell.r, cell.c)"
          @click="onCellClick(cell.r, cell.c)"
        />
        </div>
      </div>
      <div class="side-actions">
        <button class="icon-btn" aria-label="Accueil" @click="goHome">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 10.5L12 3l9 7.5" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.5 10.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-9.5" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 21v-6h4v6" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="icon-btn" aria-label="Recommencer" @click="newGame">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.343-5.657" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 4v6h-6" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <footer ref="footerRef">
      <p id="status">{{ statusText }}</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue';
import CartoonButton from './components/CartoonButton.vue';

// Try to load a real logo from assets if present (supports memostep or memostep-logo)
const logoModules = import.meta.glob('./assets/{memostep,memostep-logo}.{png,jpg,jpeg,webp,svg}', { eager: true });
const realLogoUrl = (() => {
  const first = Object.values(logoModules)[0];
  // Vite returns a module whose default export is the URL string
  return first && (first.default || first);
})();

const logoSrc = computed(() => (typeof realLogoUrl === 'string' && realLogoUrl) ? realLogoUrl : '');

// Constantes
const COLS = 4;
const ROWS = 12;
const TARGET_CELL = 56;  // taille cible confortable
const MIN_CELL = 48;     // taille minimale ergonomique
const MAX_CELL = 72;     // taille max esthétique
const REVEAL_MS = 8000;  // 8s d'exposition
const REVEAL_TICK = 100; // rafraîchissement du timer (ms)

// Refs DOM
const boardRef = ref(null);
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
});

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
  transform: `scale(${state.scale})`,
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
  fitBoard();
  window.addEventListener('resize', fitBoard);
  window.addEventListener('orientationchange', fitBoard);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitBoard);
  window.removeEventListener('orientationchange', fitBoard);
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

* { box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial;
  background: radial-gradient(1200px 800px at 80% -10%, #1d1f38 0%, var(--bg) 55%);
  color: var(--text);
  overflow: hidden; /* empêche le scroll */
}

.app {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
}

header, footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
header h1 { font-size: clamp(16px, 2.2vw, 22px); margin: 0; }

.brand { display: flex; align-items: center; gap: 10px; }
.brand .logo { width: 40px; height: 40px; border-radius: 10px; display: block; }
.brand .title { margin: 0; font-size: clamp(18px, 2.6vw, 24px); letter-spacing: .4px; }
header button { padding: 10px 14px; border-radius: 12px; border: 0; background: linear-gradient(180deg, #7b2cff, var(--accent)); color: #fff; font-weight: 700; cursor: pointer; }

.board-wrap { display: flex; justify-content: center; align-items: flex-start; gap: 20px; overflow: hidden; padding: 16px; }

.home {
  min-height: 60vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.home-card {
  background: #fff;
  border: 1px solid #e5e7ee;
  border-radius: 16px;
  box-shadow: 0 2px 0 #eef0f6;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.home-logo { width: 72px; height: 72px; border-radius: 16px; }
.home-title { margin: 0; font-size: 24px; letter-spacing: .4px; }

.start-btn {
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid #d9ddea;
  background: #fff;
  box-shadow: 0 2px 0 #eef0f6;
  font-weight: 700;
  cursor: pointer;
}

.start-btn:hover { background: #f7f8fc; }
.start-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #eef0f6; }

.panel {
  background: #fff;
  border: 1px solid #e5e7ee;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 0 #eef0f6;
}

.side-actions { display: flex; flex-direction: column; gap: 16px; }

.icon-btn {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  border: 1px solid #e0e2ea;
  background: #fff;
  box-shadow: 0 2px 0 #eef0f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .06s ease, box-shadow .06s ease, background .06s ease;
}

.icon-btn svg { width: 28px; height: 28px; display: block; }

.icon-btn:hover { background: #f7f8fc; }
.icon-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #eef0f6; }

.progress {
  width: 100%;
  height: 10px;
  background: #1b1e34;
  border: 1px solid #2a2e52;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #7b2cff, var(--accent));
  width: 0%;
}

.side-card .hint { color: var(--muted); font-size: 12px; margin: 4px 0 0 0; }

.board {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell));
  grid-template-rows: repeat(var(--rows), var(--cell));
  gap: 10px; /* plus espacé comme le mockup */
  background: transparent;
  border-radius: 12px;
  padding: 8px;
  transform-origin: top center;
  will-change: transform;
}

.cell {
  width: var(--cell);
  height: var(--cell);
  background: #eff1f6;
  border: 2px solid #dde1ea;
  border-radius: 10px;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease, transform .06s ease;
}

.cell:hover { background: #f5f7fb; }
.cell:active { transform: scale(0.98); }

.cell.path { background: #e9ebf3; border-color: #cfd5e3; }
.cell.start { background: #e6f6ef; border-color: #c7e8d9; }
.cell.end { background: #fde8ef; border-color: #f6cad6; }
.cell.correct { background: #b7f6c2; border-color: #8eeaa1; }
.cell.wrong { background: #ffc2c7; border-color: #ffa0a8; }

footer { font-size: 14px; color: var(--muted); }

/* Mobile */
@media (max-width: 640px) {
  header, footer { flex-direction: column; align-items: stretch; }
  header button { width: 100%; }
  body { gap: 8px; padding: 0px; }
  :root { --gap: 6px; --pad: 10px; }
  .side-card { display: none; }
}

@media (max-height: 560px) {
  header h1 { font-size: 16px; }
  :root { --gap: 4px; --pad: 8px; }
}
</style>
