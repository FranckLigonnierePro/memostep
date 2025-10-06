<template>
  <div class="board-wrap">
    <div class="flex w-full h-full" style="justify-content: center;">
      <div class="w-2/3 flex-col h-full">
        <div class="panel">
          <div id="board" class="board" :aria-label="$t('board.gridAria', { cols: colsCount, rows: rowsCount })" role="grid" :style="boardStyle">
            <div
              v-for="(cell, idx) in cells"
              :key="idx"
              class="cell"
              :data-r="cell.r"
              :data-c="cell.c"
              @click="emit('cellClick', cell.r, cell.c)"
            >
              <div class="cell-inner" :class="{ flipping: flipActive, revealing: flipBackActive, facedown: faceDownActive }" :style="cellStyle(cell.r, cell.c)">
                <div class="cell-face front" :class="cellClass(cell.r, cell.c)" />
                <div class="cell-face back" :class="[ faceDownActive ? faceColorClass(cell.r, cell.c) : null, cellClass(cell.r, cell.c) ]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="reveal-bar" aria-hidden="true">
        <div class="reveal-fill" :style="{ transform: `scaleY(${revealComplete ? 1 : revealProgress})` }"></div>
      </div>
      <!-- Versus wins bar (5 segments) -->
      <div v-if="mode === 'versus'" class="wins-bar" :title="`Victoires: ${Number(versusWins)}/5 – Parcours en cours: ${(Number(versusProgress)*100).toFixed(0)}%`">
        <div v-for="i in 5" :key="i" class="wins-segment">
          <div class="wins-fill" :style="{ transform: `scaleY(${segmentFill(i)})` }"></div>
        </div>
        <!-- Player bubbles -->
        <div class="wins-bubbles">
          <div
            v-for="p in (versusPlayers || [])"
            :key="p.id || p.name"
            class="wins-bubble"
            :style="{ bottom: bubbleBottom(p), background: p.color || '#ffffff', color: bubbleTextColor(p.color) }"
            :title="p.name"
          >
            {{ initial(p.name) }}
          </div>
        </div>
      </div>
      <div class="flex flex-col items-center">
        <div class="side-actions">
          <div v-if="mode === 'solo'" class="card">
            <div class="card-body">
              <div class="score-text">{{ score }}</div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <div class="time-text">{{ timeText }}</div>
            </div>
          </div>
          <button class="icon-btn" :aria-label="$t('board.home')" @click="emit('goHome')">
            <Home :size="28" aria-hidden="true" />
          </button>
          <!-- Lives hearts under Home button (daily, solo & versus) -->
          <div
            v-if="mode === 'daily' || mode === 'solo' || mode === 'versus'"
            class="hearts"
            aria-label="Vies restantes"
            role="group"
            style="margin-top: 6px; display:flex; flex-direction: column; gap: 8px;"
          >
            <div
              v-for="i in 3"
              :key="i"
              :class="['heart', { off: (i-1) < livesUsed, blink: justLost && (i-1) === lastExtinguishedIndex }]"
              :title="`${Math.max(0, 3 - (Number(livesUsed) || 0))} vies restantes`"
            >
            <Heart />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Home, RotateCcw, Heart } from 'lucide-vue-next';
const props = defineProps({
  cells: { type: Array, required: true },
  boardStyle: { type: Object, required: true },
  cellClass: { type: Function, required: true },
  revealSecondsText: { type: String, default: '' },
  revealProgress: { type: Number, default: 0 },
  flipActive: { type: Boolean, default: false },
  rowsCount: { type: Number, default: 12 },
  colsCount: { type: Number, default: 4 },
  faceDownActive: { type: Boolean, default: false },
  faceColors: { type: Object, default: () => ({}) },
  revealComplete: { type: Boolean, default: false },
  flipBackActive: { type: Boolean, default: false },
  timeText: { type: String, default: '00:00' },
  score: { type: Number, default: 0 },
  mode: { type: String, default: 'solo' },
  versusWins: { type: Number, default: 0 },
  versusProgress: { type: Number, default: 0 },
  versusPlayers: { type: Array, default: () => [] },
  livesUsed: { type: Number, default: 0 },
  justLost: { type: Boolean, default: false },
  lastExtinguishedIndex: { type: Number, default: -1 },
});
const emit = defineEmits(['cellClick', 'goHome']);

function cellStyle(row, col) {
  const STEP = 70; // ms per diagonal delay
  // Diagonal index for bottom-left -> top-right wave across anti-diagonals
  // bottom-left (row=rows-1, col=0) => 0, then increases toward top-right
  const diag = (props.rowsCount - 1 - row) + col;
  return { '--delay': `${Math.max(0, diag) * STEP}ms` };
}

function faceColorClass(r, c) {
  const key = `${r}-${c}`;
  const v = props.faceColors && props.faceColors[key];
  if (!v) return null;
  return `face-${v}`;
}

// Each segment = one parcours
// - Segments <= versusWins are fully filled
// - Remaining segments are empty
function segmentFill(index) {
  const wins = Math.max(0, Math.min(5, Number(props.versusWins) || 0));
  if (index <= wins) return 1;
  if (index === wins + 1) {
    const raw = Number(props.versusProgress) || 0;
    const p = Math.max(0, Math.min(1, raw));
    return p;
  }
  return 0;
}

function initial(name) {
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

function bubbleBottom(p) {
  const wins = Math.max(0, Math.min(5, Number(p && p.wins || 0)));
  const prog = Math.max(0, Math.min(1, Number(p && p.progress || 0)));
  const total = Math.max(0, Math.min(5, wins + prog));
  const pct = (total / 5) * 100;
  return `calc(${pct}% - 10px)`; // center bubble (approx height 20px)
}

function bubbleTextColor(bg) {
  const c = String(bg || '').replace('#', '');
  if (c.length === 6) {
    const r = parseInt(c.slice(0,2), 16);
    const g = parseInt(c.slice(2,4), 16);
    const b = parseInt(c.slice(4,6), 16);
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.6 ? '#0f1020' : '#ffffff';
  }
  return '#0f1020';
}
</script>

<style scoped>
.board-wrap {
  display: flex;
  flex-grow: 1;
  height: 100%;
  overflow: hidden;
}

.panel {
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 2px 0 #1a1c30;
  height: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  position: relative; /* for vertical progress bar positioning */
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

/* Vertical reveal progress bar on the side of panel */
.reveal-bar {
  position: relative;
  margin: 12px 0px;
  margin-right: 8px;
  width: 8px;
  border-bottom-right-radius: 999px;
  border-top-right-radius: 999px;
  background: #1b1e34;
  border: 1px solid #2a2e52;
  border-left: none;
  overflow: hidden;
  pointer-events: none;
}
.reveal-fill {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(180deg, var(--accent), #7b2cff);
  transform-origin: bottom center;
  will-change: transform;
  transition: transform 100ms linear;
}

/* Wins bar next to reveal bar */
.wins-bar {
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
  margin-right: 8px;
  align-self: center; /* take full available height in the flex row */
  height: 95%;
  position: relative; /* for bubbles absolute positioning */
}
.wins-segment {
  width: 10px;
  /* Distribute segments to fill the full height */
  flex: 1 1 0;
  border-radius: 4px;
  background: #1b1e34;
  border: 1px solid #2a2e52;
  overflow: hidden;
}
.wins-fill {
  position: relative;
  width: 100%;
  height: 100%;
  background: #12b886; /* ok green */
  transform-origin: bottom center;
  transform: scaleY(0);
  transition: transform 100ms linear;
}

.wins-bubbles {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  bottom: 0;
  width: 0; /* collapse width so bubbles center over bar */
  pointer-events: none; /* bubbles non-interactives */
}
.wins-bubble {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
  color: #0f1020;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0,0,0,0.2);
  box-shadow: 0 1px 0 #1a1c30;
  pointer-events: none;
}

.side-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-btn {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid #2a2e52;
  background: var(--panel);
  box-shadow: 0 2px 0 #1a1c30;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .06s ease, box-shadow .06s ease, background .06s ease;
}

.icon-btn svg {
  width: 28px;
  height: 28px;
  display: block;
}

.icon-btn:hover {
  background: #1f2238;
}

.icon-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 0 #1a1c30;
}

.card {
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 2px 0 #1a1c30;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  transition: transform .06s ease, box-shadow .06s ease, background .06s ease;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card:hover {
  background: #1f2238;
}

.card:active {
  transform: translateY(1px);
  box-shadow: 0 1px 0 #1a1c30;
}

.board {
  display: grid;
  /* Use fractional units so the grid fills the panel height */
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 5px;
  border-radius: 12px;
  transform-origin: center center;
  will-change: transform;
  max-height: 100%;
  max-width: 100%;
  aspect-ratio: var(--cols) / var(--rows);
  perspective: 800px; /* enable 3D flip effect */
}

.cell {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  position: relative;
}

.cell:hover .cell-face.front { background: #1f2238; }
.cell:active .cell-face.front { transform: scale(0.98); }

/* 3D container */
.cell-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
  transform: translateZ(0); /* promote to its own layer */
}

.cell-face {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  border: 2px solid #2a2e52;
  backface-visibility: hidden;
  transition: background .12s ease, border-color .12s ease, transform .06s ease;
  will-change: transform, background, border-color;
}

/* Front visuals (path/start/end/correct/wrong) */
.cell-face.front { background: #1a1c30; }
.cell-face.front.path { background: #2a2e52; border-color: #3a3f6b; }
.cell-face.front.start { background: #1a3d2e; border-color: #2a5d4e; }
.cell-face.front.end { background: #3d1a2e; border-color: #5d2a4e; }
.cell-face.front.correct { background: #1a3d2e; border-color: var(--ok); }
.cell-face.front.wrong { background: #3a1c2e; border-color: var(--bad); }

/* Outline the path on the back face during reverse flip (keep background as random color) */
.cell-face.back.path  { border-color: #3a3f6b; }
.cell-face.back.start { border-color: #2a5d4e; }
.cell-face.back.end   { border-color: #5d2a4e; }

/* Flip wave animation applies to inner wrapper */
.cell-inner.flipping {
  animation: cellFlip 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: var(--delay, 0ms);
}

/* Reverse flip (face-down -> face-up) */
.cell-inner.revealing {
  animation: cellFlipBack 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes cellFlip {
  0% { transform: rotateX(0deg); }
  100% { transform: rotateX(180deg); }
}

@keyframes cellFlipBack {
  0% { transform: rotateX(180deg); }
  100% { transform: rotateX(0deg); }
}

/* Back face and facedown state */
.cell-face.back { transform: rotateX(180deg); }
/* Keep back colors visible until each cell's animation starts; the keyframe animation
   will override this transform once it begins (even during 'revealing' with delay). */
.cell-inner.facedown:not(.flipping) { transform: rotateX(180deg); }

/* Face colors for hidden side — harmonized with theme (muted/dark tones) */
.cell-face.back.face-yellow { background: #3a2d14; border-color: #6a5a1a; }
.cell-face.back.face-green  { background: #1a3d2e; border-color: #2a5d4e; }
.cell-face.back.face-purple { background: #2a1f4d; border-color: #4a2f8a; }
.cell-face.back.face-blue   { background: #2a2e52; border-color: #3a3f6b; }

/* Override random color when the cell is marked correct/wrong during play */
.cell-face.back.correct { background: #1a3d2e; border-color: var(--ok); }
.cell-face.back.wrong   { background: #3a1c2e; border-color: var(--bad); }

.progress {
  width: 100%;
  height: 10px;
  background: #1b1e34;
  border: 1px solid #2a2e52;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #7b2cff, var(--accent));
  width: 0%;
}

.time-text {
  font-size: 12px;
  color: var(--text);
}

.time-text.muted {
  color: var(--muted);
}

@media (max-width: 640px) {
  .board-wrap {
    padding: 0px;
  }
}
</style>
