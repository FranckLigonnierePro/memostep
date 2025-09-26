<template>
  <div class="board-wrap">
    <div class="flex flex-row w-full">
      <div class="flex flex-col flex-2">
      <div class="panel">

<div
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
      @click="emit('cellClick', cell.r, cell.c)"
    /> 
  </div>
</div>
      </div>

      <div class="flex flex-col flex-1">
        <div class="side-actions">
          <button class="icon-btn" aria-label="Accueil" @click="emit('goHome')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 10.5L12 3l9 7.5" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5.5 10.5V20a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1v-9.5" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 21v-6h4v6" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="icon-btn" aria-label="Recommencer" @click="emit('newGame')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.343-5.657" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 4v6h-6" stroke="var(--text)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
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
});
const emit = defineEmits(['cellClick', 'goHome', 'newGame']);
</script>

<style scoped>
.board-wrap {   
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: stretch; /* make children match the container height */
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
}

.side-actions { display: flex; flex-direction: column; gap: 16px; }

.icon-btn {
  width: 64px;
  height: 64px;
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

.icon-btn svg { width: 28px; height: 28px; display: block; }

.icon-btn:hover { background: #1f2238; }
.icon-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }

.board {
  display: grid;
  /* Use fractional units so the grid fills the panel height */
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 10px;
  background: transparent;
  border-radius: 12px;
  padding: 8px;
  transform-origin: top center;
  will-change: transform;
  height: 100%; /* fill panel height */
}

.cell {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1; /* keep squares that scale with the grid */
  background: #1a1c30;
  border: 2px solid #2a2e52;
  border-radius: 10px;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease, transform .06s ease;
}

.cell:hover { background: #1f2238; }
.cell:active { transform: scale(0.98); }

.cell.path { background: #2a2e52; border-color: #3a3f6b; }
.cell.start { background: #1a3d2e; border-color: #2a5d4e; }
.cell.end { background: #3d1a2e; border-color: #5d2a4e; }
.cell.correct { background: #1a3d2e; border-color: var(--ok); }
.cell.wrong { background: #3d1a2e; border-color: var(--bad); }

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

@media (max-width: 640px) {
  .board-wrap { padding: 16px; }
}
</style>
