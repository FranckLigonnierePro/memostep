<template>
  <div class="board-wrap">
    <div class="flex flex-row w-full">
      <div class="flex flex-col flex-shrink">
        <div class="panel">
          <div id="board" class="board" aria-label="Plateau 4 par 12" role="grid" :style="boardStyle">
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
      <div class="flex flex-col flex-1 items-center">
        <div class="side-actions">
          <div class="card">
            <div class="card-body">
              <div class="time-text">{{ timeText }}</div>
            </div>
          </div>
          <button class="icon-btn" aria-label="Accueil" @click="emit('goHome')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 10.5L12 3l9 7.5" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M5.5 10.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-9.5" stroke="var(--text)" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round" />
              <path d="M10 21v-6h4v6" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
          <button class="icon-btn" aria-label="Recommencer" @click="emit('newGame')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.343-5.657" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M20 4v6h-6" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
});
const emit = defineEmits(['cellClick', 'goHome', 'newGame']);

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
</script>

<style scoped>
.board-wrap {
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: stretch;
  /* make children match the container height */
}

.panel {
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 2px 0 #1a1c30;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative; /* for vertical progress bar positioning */
}

/* Vertical reveal progress bar on the side of panel */
.reveal-bar {
  position: relative;
  margin: 12px 6px;
  width: 10px;
  border-radius: 999px;
  background: #1b1e34;
  border: 1px solid #2a2e52;
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
  padding: 8px;
  transform-origin: top center;
  will-change: transform;
  height: 100%;
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
    padding: 16px;
  }
}
</style>
