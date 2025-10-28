<template>
  <div class="board-wrap">
    <!-- Snowstorm animation overlay -->
    <div v-if="showSnowstorm" class="snowstorm-overlay">
      <div v-for="i in 50" :key="i" class="snowflake" :style="snowflakeStyle(i)"></div>
    </div>
    <div class="flex w-full h-full" style="justify-content: space-evenly;">
      <div class="w-2/3 flex-col h-full">
        <div class="panel" :style="{ backgroundImage: `url(${bgFirst})` }">
          <div id="board" :class="['board', { shake: shakeActive }]" :aria-label="$t('board.gridAria', { cols: colsCount, rows: rowsCount })" role="grid" :style="boardStyle">
            <div
              v-for="(cell, idx) in cells"
              :key="idx"
              :class="['cell', { 'no-interaction': !revealComplete || !canClickCell(cell.r, cell.c) }]"
              :data-r="cell.r"
              :data-c="cell.c"
              @click="(revealComplete && canClickCell(cell.r, cell.c)) ? emit('cellClick', cell.r, cell.c) : null"
            >
              <div class="cell-inner" :class="{ frozen: frozenGrid }" :style="pathRevealStyle(cell.r, cell.c)">
                <div class="cell-face front" :class="[cellClass(cell.r, cell.c), { 'stun-shadow': isStunCell(cell.r, cell.c) }]">
                  <!-- Indicateurs visuels selon le type de case -->
                  
                  <!-- BONUS (cases valides en violet) -->
                  <div v-if="isBonusCell(cell.r, cell.c)" class="cell-indicator bonus-indicator">
                    <div class="indicator-icon">{{ getBonusIcon(cell.r, cell.c) }}</div>
                    <div class="indicator-label">BONUS</div>
                  </div>
                  
                  <!-- CHEMIN (PATH) -->
                  <div v-else-if="isPathCell(cell.r, cell.c)" class="cell-indicator path-indicator">
                    <div class="indicator-icon">✓</div>
                    <div class="indicator-label">CHEMIN</div>
                  </div>
                  
                  <!-- CORRECT (validé) -->
                  <div v-else-if="isCorrectCell(cell.r, cell.c)" class="cell-indicator correct-indicator">
                    <div class="indicator-icon">✓</div>
                    <div class="indicator-label">VALIDÉ</div>
                  </div>
                  
                  <!-- WRONG (erreur) -->
                  <div v-else-if="isCellWrong(cell.r, cell.c)" class="cell-indicator wrong-indicator">
                    <div class="indicator-icon">✗</div>
                    <div class="indicator-label">ERREUR</div>
                  </div>
                  
                  <!-- PIÈGES -->
                  <div v-else-if="isStunCell(cell.r, cell.c)" class="cell-indicator trap-indicator stun">
                    <div class="indicator-icon">⚡</div>
                    <div class="indicator-label">STUN</div>
                  </div>
                  <div v-else-if="isRollbackCell(cell.r, cell.c)" class="cell-indicator trap-indicator rollback">
                    <div class="indicator-icon">⬅</div>
                    <div class="indicator-label">RECUL -2</div>
                  </div>
                  <div v-else-if="lifeLossKeys.includes(`${cell.r}-${cell.c}`)" class="cell-indicator trap-indicator life">
                    <div class="indicator-icon">💔</div>
                    <div class="indicator-label">-1 VIE</div>
                  </div>
                  
                  <!-- NEUTRE (par défaut) -->
                  <div v-else class="cell-indicator neutral-indicator">
                    <div class="indicator-icon">○</div>
                    <div class="indicator-label">NEUTRE</div>
                  </div>
                  
                  <!-- Heart drop (solo reward) -->
                  <div v-if="showHeart(cell.r, cell.c)" class="heart-drop" title="+1 vie">
                    <Heart />
                  </div>
                </div>
                <div class="cell-face back" :class="cellClass(cell.r, cell.c)">
                  <!-- Back face simple -->
                  <div class="cell-indicator back-indicator">
                    <div class="indicator-icon">?</div>
                  </div>
                </div>
                <!-- Ice overlay for frozen grid -->
                <div v-if="frozenGrid" class="ice-overlay" :class="{ cracking: frozenClicksLeft <= 4 }">
                  <div class="ice-cracks" v-if="frozenClicksLeft <= 4">
                    <div v-for="n in (8 - frozenClicksLeft)" :key="n" class="crack" :style="crackStyle(n)"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Player avatar overlay for solo mode -->
            <div v-if="(mode === 'solo') && selectedAvatar" class="solo-player-overlay">
              <div
                class="player-bubble solo-avatar"
                :style="soloPlayerPosition()"
                :title="selectedAvatar.name || 'Joueur'"
              >
                <div class="bubble-content">
                  <img class="bubble-avatar" :src="selectedAvatar.img" :alt="selectedAvatar.name" />
                  <!-- Circular loader when stunned -->
                  <div v-if="stunActive" class="bubble-loader" aria-hidden="true"></div>
                </div>
              </div>
            </div>
            <!-- Versus player bubbles positioned over the grid (inside board for perfect alignment) -->
            <div v-if="mode === 'versus'" class="versus-players-overlay">
              <div
                v-for="p in (versusPlayers || [])"
                :key="p.id || p.name"
                :class="['player-bubble', { frozen: playerIsFrozen(p), 'just-frozen': isJustFrozen(p) }]"
                :style="playerBubbleStyle(p)"
                :title="`${p.name}`"
              >
                <div class="bubble-content">
                  <img class="bubble-avatar" :src="getAvatar(p)" :alt="p.name" />
                </div>
              </div>
            </div>
          </div>
          <!-- Frozen clicks counter (centered over grid) -->
          <div v-if="frozenGrid" class="frozen-counter">
            <Snowflake :size="32" />
            <div class="frozen-text">{{ frozenClicksLeft }}</div>
          </div>
        </div>
      </div>
      
      <div class="flex flex-col items-center">
        <div class="side-actions">
          <!-- Ressources collectées -->
          <div v-if="mode === 'solo'" class="resources-card">
            <div class="resource-item" title="Or collecté">
              <span class="resource-icon">💰</span>
              <span class="resource-value">{{ playerGold }}</span>
            </div>
            <div class="resource-item" title="Essence collectée">
              <span class="resource-icon">⚡</span>
              <span class="resource-value">{{ playerEssence }}</span>
            </div>
            <div class="resource-item" title="Gemmes collectées">
              <span class="resource-icon">💎</span>
              <span class="resource-value">{{ playerGems }}</span>
            </div>
          </div>
          
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
          <!-- Lives hearts under Home button (solo & versus) -->
          <div
            v-if="mode === 'solo' || mode === 'versus'"
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
          <!-- Freeze power indicator (versus only) -->
          <div
            v-if="mode === 'versus'"
            :class="['power-card', { available: powerAvailable && !revealComplete, used: !powerAvailable || !revealComplete }]"
            :title="!revealComplete ? 'Attendez la fin de la mémorisation' : (powerAvailable ? 'Pouvoir de gel disponible (Espace)' : 'Pouvoir déjà utilisé')"
            style="margin-top: 8px;"
          >
            <Snowflake :size="24" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Home, RotateCcw, Heart, Snowflake } from 'lucide-vue-next';
import bgFirst from '../assets/bg-first.png';
import stone from '../assets/stone.png';
import stone2 from '../assets/stone2.png';
import stone3 from '../assets/stone3.png';
import stoneGood from '../assets/stone_good.png';
import stoneGreen from '../assets/stone_green.png';
import mageAvatar from '../assets/mage/content.png';
import warriorAvatar from '../assets/guerriere/fcontent.png';
import mageFrost from '../assets/mage/givré.png';
import warriorFrost from '../assets/guerriere/fgivré.png';
import genAvatar1 from '../assets/Generated Image October 22, 2025 - 12_20AM.png';
import genAvatar2 from '../assets/Generated Image October 22, 2025 - 12_25AM.png';

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
  versusPathsByPlayer: { type: Object, default: () => ({}) },
  livesUsed: { type: Number, default: 0 },
  justLost: { type: Boolean, default: false },
  lastExtinguishedIndex: { type: Number, default: -1 },
  frozenGrid: { type: Boolean, default: false },
  frozenClicksLeft: { type: Number, default: 0 },
  powerAvailable: { type: Boolean, default: true },
  showSnowstorm: { type: Boolean, default: false },
  path: { type: Array, default: () => [] },
  revealed: { type: Boolean, default: false },
  shakeActive: { type: Boolean, default: false },
  wrongCrackTexture: { type: String, default: '' },
  selfId: { type: [String, Object], default: '' },
  heartCell: { type: Object, default: null }, // { r, c } when a heart is present on this path
  selectedAvatar: { type: Object, default: null }, // Avatar selected by player
  playerProgress: { type: Number, default: 0 }, // Current nextIndex for solo/daily player position
  rollbackKeys: { type: Array, default: () => [] }, // ['r-c'] cells that cause rollback
  lifeLossKeys: { type: Array, default: () => [] }, // ['r-c'] cells that cause life loss
  stunKeys: { type: Array, default: () => [] }, // ['r-c'] cells that stun
  stunActive: { type: Boolean, default: false }, // show loader on solo avatar when stunned
  gridContent: { type: [Array, Object], default: null }, // grid[r][c] with bonus/trap info
  collectedBonuses: { type: Array, default: () => [] }, // ['r-c'] collected bonus cells
  playerGold: { type: Number, default: 0 }, // Or collecté
  playerEssence: { type: Number, default: 0 }, // Essence collectée
  playerGems: { type: Number, default: 0 }, // Gemmes collectées
});
const emit = defineEmits(['cellClick', 'goHome']);

const AVATARS = [mageAvatar, warriorAvatar, genAvatar1, genAvatar2];

function playerKey(player) {
  return String(player?.id || player?.name || '');
}

// Merge position with z-index so the local player's bubble renders above others when overlapping
function playerBubbleStyle(player) {
  const base = playerBubblePosition(player);
  const isSelf = !!(player && String(player.id || '') === String(props.selfId || ''));
  const z = isSelf ? 100 : 10;
  return { ...base, zIndex: String(z) };
}

// Determines if the given player is currently frozen (includes local self freeze)
function playerIsFrozen(player) {
  const isSelf = !!(player && props && String(player.id || '') === String(props.selfId || ''));
  const localFrozen = !!(isSelf && props && props.frozenGrid);
  return !!(player && (player.isFrozen || (player.frozenClicks || player.frozen_clicks || 0) > 0 || localFrozen));
}

// Track players who just transitioned to frozen to trigger one-time animation
const justFrozen = ref(new Set());
const prevFrozenById = ref(new Map());

watch(
  () => (props.versusPlayers || []).map(p => ({ id: p?.id || p?.name || '', frozen: playerIsFrozen(p) })),
  (now) => {
    const prev = prevFrozenById.value;
    const nextMap = new Map();
    for (const entry of now) {
      const was = prev.get(entry.id) || false;
      nextMap.set(entry.id, entry.frozen);
      if (entry.frozen && !was) {
        // mark just-frozen and clear after short delay
        justFrozen.value.add(entry.id);
        setTimeout(() => {
          const set = justFrozen.value; set.delete(entry.id);
        }, 700);
      }
    }
    prevFrozenById.value = nextMap;
  },
  { immediate: true, deep: false }
);

function isJustFrozen(player) {
  const id = String(player?.id || player?.name || '');
  return justFrozen.value.has(id);
}

function hashString(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Build a stable avatar assignment without duplicates among current players
const avatarByKey = computed(() => {
  const players = (props.versusPlayers || []);
  const keys = players.map(p => playerKey(p)).filter(Boolean);
  const uniqueKeys = [...new Set(keys)];
  const seed = uniqueKeys.join('|');
  const base = Math.abs(hashString(seed)) % AVATARS.length;
  const mapping = {};
  uniqueKeys.forEach((k, i) => {
    mapping[k] = AVATARS[(base + i) % AVATARS.length];
  });
  return mapping;
});

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

// Generate random snowflake animation styles
function snowflakeStyle(index) {
  const left = Math.random() * 100;
  const animationDelay = Math.random() * 2;
  const animationDuration = 2 + Math.random() * 3;
  const size = 4 + Math.random() * 8;
  return {
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${animationDuration}s`,
    width: `${size}px`,
    height: `${size}px`,
  };
}

// Generate crack patterns
function crackStyle(crackIndex) {
  const patterns = [
    { top: '20%', left: '10%', width: '80%', height: '2px', transform: 'rotate(45deg)' },
    { top: '50%', left: '5%', width: '90%', height: '2px', transform: 'rotate(-30deg)' },
    { top: '70%', left: '15%', width: '70%', height: '2px', transform: 'rotate(60deg)' },
    { top: '30%', left: '20%', width: '60%', height: '2px', transform: 'rotate(-45deg)' },
    { top: '60%', left: '30%', width: '50%', height: '2px', transform: 'rotate(20deg)' },
    { top: '40%', left: '25%', width: '55%', height: '2px', transform: 'rotate(-60deg)' },
    { top: '80%', left: '10%', width: '75%', height: '2px', transform: 'rotate(35deg)' },
    { top: '15%', left: '35%', width: '45%', height: '2px', transform: 'rotate(-20deg)' },
  ];
  return patterns[(crackIndex - 1) % patterns.length];
}

function initial(name) {
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() : '?';
}

// Position solo/daily player avatar on the last validated cell
function soloPlayerPosition() {
  const pathLength = (props.path || []).length || 1;
  const progress = Number(props.playerProgress) || 0;
  
  // Position on the last validated cell: nextIndex-1
  // If nextIndex is 0, position on first cell (start)
  const lastIndex = Math.max(0, progress - 1);
  const actualIndex = Math.max(0, Math.min(lastIndex, pathLength - 1));
  
  if (actualIndex >= 0 && actualIndex < props.path.length) {
    const cell = props.path[actualIndex];
    if (cell) {
      // If a bonus was collected on this last validated row, place avatar on the bonus cell instead of the path cell
      try {
        const collected = Array.isArray(props.collectedBonuses) ? props.collectedBonuses : [];
        // Find a collected bonus that matches this row
        const matchKey = collected.find(key => {
          // key format: "r-c"
          const [kr, kc] = String(key).split('-').map(n => Number(n));
          return Number.isFinite(kr) && Number.isFinite(kc) && kr === cell.r;
        });
        if (matchKey) {
          const [br, bc] = String(matchKey).split('-').map(n => Number(n));
          return {
            gridRow: String((br + 1)),
            gridColumn: String((bc + 1)),
            justifySelf: 'center',
            alignSelf: 'center',
          };
        }
      } catch (_) {
        // fall back to path cell
      }
      // Default to path cell for this index
      return {
        gridRow: String((cell.r + 1)),
        gridColumn: String((cell.c + 1)),
        justifySelf: 'center',
        alignSelf: 'center',
      };
    }
  }
  // Default to first cell if no valid position
  if (props.path.length > 0) {
    const firstCell = props.path[0];
    return {
      gridRow: String((firstCell.r + 1)),
      gridColumn: String((firstCell.c + 1)),
      justifySelf: 'center',
      alignSelf: 'center',
    };
  }
  return { gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' };
}

// Position player bubble based on their progress through their own path
// Each player has a different path and progresses independently
function playerBubblePosition(player) {
  const prog = Math.max(0, Math.min(1, Number(player.progress) || 0));
  const map = props.versusPathsByPlayer || {};
  const fallback = props.path || [];
  const playerPath = Array.isArray(map[player?.id]) && map[player.id].length ? map[player.id] : fallback;
  const pathLength = playerPath.length || 1;
  
  // Calculate which cell the player is currently on based on their progress
  // progress is nextIndex/pathLength, so nextIndex = progress * pathLength
  // Position on the last validated cell: nextIndex - 1
  const nextIndex = Math.round(prog * pathLength);
  const lastIndex = Math.max(0, nextIndex - 1);
  const actualIndex = Math.max(0, Math.min(lastIndex, pathLength - 1));
  
  if (actualIndex >= 0 && actualIndex < playerPath.length) {
    const cell = playerPath[actualIndex];
    if (cell) {
      return {
        gridRow: String((cell.r + 1)),
        gridColumn: String((cell.c + 1)),
        justifySelf: 'center',
        alignSelf: 'center',
      };
    }
  }
  
  // Default to first cell if no valid position
  if (playerPath.length > 0) {
    const firstCell = playerPath[0];
    return {
      gridRow: String((firstCell.r + 1)),
      gridColumn: String((firstCell.c + 1)),
      justifySelf: 'center',
      alignSelf: 'center',
    };
  }
  
  return { gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' };
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

// Get avatar for a player: prefer real avatar (self selectedAvatar or player.avatar_url),
// then fallback to no-duplicate mapping. Apply frost variant only for built-in avatars.
function getAvatar(player) {
  const key = playerKey(player);
  if (!key) return AVATARS[0];

  // Determine frozen state
  const isSelf = !!(player && props && String(player.id || '') === String(props.selfId || ''));
  const localFrozen = !!(isSelf && props && props.frozenGrid);
  const isFrozen = !!(player && (player.isFrozen || (player.frozenClicks || player.frozen_clicks || 0) > 0 || localFrozen));

  // 1) Self-selected avatar takes priority
  if (isSelf && props.selectedAvatar && props.selectedAvatar.img) {
    const base = props.selectedAvatar.img;
    // For custom avatars, keep the same image when frozen (visual effect comes from CSS)
    return base;
  }

  // 2) Player-provided avatar from backend
  if (player && player.avatar_url) {
    const base = player.avatar_url;
    return base;
  }

  // 3) Fallback to mapped built-in avatars without duplicates among current players
  const mapped = avatarByKey.value[key];
  if (mapped) {
    if (isFrozen) {
      if (mapped === warriorAvatar) return warriorFrost;
      if (mapped === mageAvatar) return mageFrost;
      return mapped; // keep generated/custom mapped image as-is
    }
    return mapped;
  }

  // 4) Last-resort: hash-based pick
  const idx = Math.abs(hashString(key)) % AVATARS.length;
  const base = AVATARS[idx];
  if (isFrozen) {
    if (base === warriorAvatar) return warriorFrost;
    if (base === mageAvatar) return mageFrost;
    return base;
  }
  return base;
}

// Style for progressive path reveal during memorization
function pathRevealStyle(r, c) {
  if (!props.revealed || props.revealComplete) return {};
  
  const pathIndex = props.path.findIndex(p => p.r === r && p.c === c);
  if (pathIndex === -1) return {};
  
  // Delay each path cell by 200ms
  const delay = pathIndex * 200;
  return {
    '--path-delay': `${delay}ms`,
  };
}

// Check if a cell is marked as wrong
function isCellWrong(r, c) {
  const classes = props.cellClass(r, c);
  return classes.includes('wrong');
}

function isRollbackCell(r, c) {
  try {
    const key = `${r}-${c}`;
    return Array.isArray(props.rollbackKeys) && props.rollbackKeys.includes(key);
  } catch (_) { return false; }
}

function isNonPathCell(r, c) {
  // Non-path means not currently part of path or correct cells
  const onPath = isPathCell(r, c) || isCorrectCell(r, c);
  return !onPath;
}

function isStunCell(r, c) {
  try {
    const key = `${r}-${c}`;
    return Array.isArray(props.stunKeys) && props.stunKeys.includes(key);
  } catch (_) { return false; }
}

function hasDecor(r, c) {
  const classes = props.cellClass(r, c) || [];
  if (Array.isArray(classes)) {
    return classes.includes('path') || classes.includes('start') || classes.includes('end') || classes.includes('correct') || classes.includes('wrong');
  }
  return false;
}

function isPathCell(r, c) {
  const classes = props.cellClass(r, c) || [];
  return Array.isArray(classes) ? classes.includes('path') : String(classes || '').includes('path');
}

function isCorrectCell(r, c) {
  const classes = props.cellClass(r, c) || [];
  return Array.isArray(classes) ? classes.includes('correct') : String(classes || '').includes('correct');
}

// Show heart only during input phase (revealComplete true and not revealed), on the exact cell
function showHeart(r, c) {
  if (!props.heartCell) return false;
  if (!props.revealComplete || props.revealed) return false;
  return props.heartCell.r === r && props.heartCell.c === c;
}

// Compute the next playable row from the local player's path and nextIndex (playerProgress)
function nextPlayableRow() {
  try {
    const path = Array.isArray(props.path) ? props.path : [];
    const nextIndex = Math.max(0, Math.min(Number(props.playerProgress) || 0, path.length));
    if (nextIndex >= path.length) return null; // no more moves
    const nextCell = path[nextIndex];
    return (nextCell && typeof nextCell.r === 'number') ? Number(nextCell.r) : null;
  } catch (_) {
    return null;
  }
}

// Allow click only on cells that are on the next playable row
function canClickCell(r, c) {
  // Only during input phase (revealComplete true) — class/click already guard this, but be explicit
  if (!props.revealComplete) return false;
  const row = nextPlayableRow();
  if (row == null) return false;
  return Number(r) === Number(row);
}

// Generate broken crack patterns
function brokenCrackStyle(crackIndex) {
  const patterns = [
    { top: '15%', left: '5%', width: '90%', height: '2px', transform: 'rotate(25deg)' },
    { top: '40%', left: '10%', width: '80%', height: '2px', transform: 'rotate(-35deg)' },
    { top: '65%', left: '8%', width: '85%', height: '2px', transform: 'rotate(45deg)' },
    { top: '30%', left: '20%', width: '60%', height: '2px', transform: 'rotate(-60deg)' },
    { top: '55%', left: '15%', width: '70%', height: '2px', transform: 'rotate(15deg)' },
    { top: '80%', left: '12%', width: '75%', height: '2px', transform: 'rotate(-25deg)' },
  ];
  return patterns[(crackIndex - 1) % patterns.length];
}

// Get cell content from gridContent
function getCellContent(r, c) {
  if (!props.gridContent || !Array.isArray(props.gridContent)) {
    if (r === 0 && c === 0) {
      console.log('[getCellContent] gridContent non disponible:', props.gridContent);
    }
    return null;
  }
  if (r < 0 || r >= props.gridContent.length) return null;
  if (c < 0 || !props.gridContent[r] || c >= props.gridContent[r].length) return null;
  return props.gridContent[r][c];
}

// Check if bonus is already collected
function isBonusCollected(r, c) {
  const key = `${r}-${c}`;
  return props.collectedBonuses && props.collectedBonuses.includes(key);
}

// Check if cell is a bonus cell (gold, gem, essence, potion)
function isBonusCell(r, c) {
  if (isBonusCollected(r, c)) return false;
  const cell = getCellContent(r, c);
  if (!cell) return false;
  return cell.type === 'gold' || cell.type === 'gem' || 
         cell.type === 'essence' || cell.type === 'potion';
}

// Get bonus icon for display
function getBonusIcon(r, c) {
  const cell = getCellContent(r, c);
  if (!cell) return '?';
  const icons = {
    'gold': '💰',
    'gem': '💎',
    'essence': '⚡',
    'potion': '🧪'
  };
  return icons[cell.type] || '?';
}

// Check if cell has gold bonus (on path or adjacent)
function hasGoldBonus(r, c) {
  if (isBonusCollected(r, c)) return false;
  const cell = getCellContent(r, c);
  if (!cell) return false;
  // Gold on path
  if (cell.type === 'path' && cell.gold) {
    console.log(`[hasGoldBonus] Or trouvé sur chemin (${r},${c}):`, cell.gold);
    return { value: cell.gold, onPath: true };
  }
  // Gold adjacent to path
  if (cell.type === 'gold' && cell.value) {
    console.log(`[hasGoldBonus] Or trouvé adjacent (${r},${c}):`, cell.value);
    return { value: cell.value, onPath: false };
  }
  return false;
}

// Check if cell has gem bonus
function hasGemBonus(r, c) {
  if (isBonusCollected(r, c)) return false;
  const cell = getCellContent(r, c);
  return cell && cell.type === 'gem';
}

// Check if cell has essence bonus
function hasEssenceBonus(r, c) {
  if (isBonusCollected(r, c)) return false;
  const cell = getCellContent(r, c);
  if (!cell) return false;
  // Essence on path
  if (cell.type === 'path' && cell.essence) return { value: cell.essence, onPath: true };
  // Essence adjacent to path
  if (cell.type === 'essence') return { value: 1, onPath: false };
  return false;
}

// Check if cell has potion bonus
function hasPotionBonus(r, c) {
  if (isBonusCollected(r, c)) return false;
  const cell = getCellContent(r, c);
  return cell && cell.type === 'potion';
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
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 2px 0 #1a1c30;
  height: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

/* Solo player avatar overlay */
.solo-player-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: -2px;
  pointer-events: none;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 5px;
}

/* Versus player bubbles overlay */
.versus-players-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: -2px;
  pointer-events: none;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 5px;
}

.player-bubble {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease-out;
  pointer-events: none;
  animation: bubbleBounce 0.5s ease-out;
  position: relative; /* enable z-index stacking within grid cell */
  z-index: 1;
}

/* When frozen: keep a subtle scale up and blue glow */
.player-bubble.frozen .bubble-content {
  transform: scale(1.12);
  box-shadow:
    0 0 14px rgba(58, 141, 204, 0.7),
    0 0 0 2px rgba(58, 141, 204, 0.5),
    inset 0 2px 4px rgba(255, 255, 255, 0.35);
  border-color: rgba(170, 221, 255, 0.6);
  animation: frozenWiggle 1.2s ease-in-out infinite;
}

/* On freeze transition: quick pop + shake without breaking vertical centering */
.player-bubble.just-frozen {
  animation: frozenShake 0.6s ease-in-out;
}

@keyframes frozenShake {
  0%   { transform: translateX(0) scale(1); }
  20%  { transform: translateX(-6px) scale(1.18); }
  40%  { transform: translateX(6px)  scale(1.18); }
  60%  { transform: translateX(-3px) scale(1.1); }
  80%  { transform: translateX(3px)  scale(1.05); }
  100% { transform: translateX(0)  scale(1); }
}

/* Subtle continuous wiggle for frozen bubble content (keeps base scale) */
@keyframes frozenWiggle {
  0%   { transform: scale(1.12) rotate(0deg) translateX(0); }
  25%  { transform: scale(1.12) rotate(2deg) translateX(1px); }
  50%  { transform: scale(1.12) rotate(0deg) translateX(0); }
  75%  { transform: scale(1.12) rotate(-2deg) translateX(-1px); }
  100% { transform: scale(1.12) rotate(0deg) translateX(0); }
}

.bubble-content {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #0e1328;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 0 2px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
}

.bubble-avatar {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
  display: block;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.mark-circle {
  width: 68%;
  height: 68%;
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  box-shadow: 0 0 8px rgba(255,255,255,0.35);
}

.mark-triangle {
  width: 0;
  height: 0;
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-bottom: 28px solid rgba(255, 210, 64, 0.95);
  filter: drop-shadow(0 0 6px rgba(255, 210, 64, 0.5));
}

/* Yellow glow for stun cells */
.cell-face.front.stun-shadow::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  box-shadow:
    0 0 14px rgba(255, 210, 64, 0.8),
    0 0 28px rgba(255, 210, 64, 0.55);
  pointer-events: none;
}

/* Circular loader on solo avatar when stunned */
.bubble-loader {
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: rgba(255, 210, 64, 0.95);
  animation: bubbleSpin 0.9s linear infinite;
  z-index: 2;
}
@keyframes bubbleSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bubbleBounce {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.side-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Resources card */
.resources-card {
  background: linear-gradient(145deg, #2a2e52, #1f2238);
  border-radius: 14px;
  border: 1px solid #3a3f5d;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 
    0 2px 0 #1a1c30,
    0 4px 10px rgba(0, 0, 0, 0.3);
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.resource-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.resource-icon {
  font-size: 20px;
  line-height: 1;
}

.resource-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  min-width: 24px;
  text-align: right;
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
  position: relative; /* positioning context for player overlay */
}

.board.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.cell {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  position: relative;
}

.cell.no-interaction {
  cursor: default;
  pointer-events: none;
}

.cell:hover .cell-face.front:not(.wrong) { 
  filter: brightness(1.1);
}
.cell:active .cell-face.front { 
  transform: translateY(2px);
}

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
  border: 2px solid rgba(255, 255, 255, 0.1);
  backface-visibility: hidden;
  transition: all .12s ease;
  will-change: transform, background, border-color, box-shadow;
  box-shadow: 
    0 4px 0 #3d3f3d,
    0 6px 10px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Indicateurs visuels */
.cell-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  gap: 4px;
}

.indicator-icon {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.indicator-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

/* BONUS - Cases bonus valides (violet) */
.bonus-indicator {
  background: linear-gradient(145deg, #9b59b6, #8e44ad);
  color: white;
}

/* PATH - Chemin (bleu) */
.path-indicator {
  background: linear-gradient(145deg, #1e90ff, #0b61d0);
  color: white;
}

/* CORRECT - Validé (vert) */
.correct-indicator {
  background: linear-gradient(145deg, #24a95b, #27ae60);
  color: white;
}

/* WRONG - Erreur (rouge) */
.wrong-indicator {
  background: linear-gradient(145deg, #e74c3c, #c0392b);
  color: white;
  animation: wrongPulse 0.6s ease-out;
}

/* TRAP - Pièges (orange/jaune) */
.trap-indicator {
  color: white;
}

.trap-indicator.stun {
  background: linear-gradient(145deg, #f1c40f, #f39c12);
  color: #333;
}

.trap-indicator.rollback {
  background: linear-gradient(145deg, #f39c12, #e67e22);
}

.trap-indicator.life {
  background: linear-gradient(145deg, #e74c3c, #c0392b);
}

/* NEUTRAL - Neutre (gris) */
.neutral-indicator {
  background: linear-gradient(145deg, #5a5f6d, #3a3f3d);
  color: rgba(255, 255, 255, 0.7);
}

/* BACK - Face arrière */
.back-indicator {
  background: linear-gradient(145deg, #2a2e52, #1a1c30);
  color: rgba(255, 255, 255, 0.5);
}

.back-indicator .indicator-icon {
  font-size: 32px;
}

/* Front visuals (path/start/end/correct/wrong) */
.cell-face.front { 
  background: transparent;
}
.cell-face.front.path { 
  background: linear-gradient(145deg, #1e90ff, #0b61d0);
  box-shadow: 
    0 4px 0 #2276ed,
    0 0 18px rgba(30, 144, 255, 0.9),
    0 0 36px rgba(30, 144, 255, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35);
  animation: pathReveal 0.4s ease-out forwards;
  animation-delay: var(--path-delay, 0ms);
  opacity: 0;
  transform: scale(0.8);
}

@keyframes pathReveal {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.cell-face.front.start { 
  background: linear-gradient(145deg, #1e90ff, #0b61d0);
  box-shadow: 
    0 4px 0 #2276ed,
    0 0 18px rgba(30, 144, 255, 0.9),
    0 0 36px rgba(30, 144, 255, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35);
}
.cell-face.front.end { 
  background: linear-gradient(145deg, #1e90ff, #0b61d0);
  box-shadow: 
    0 4px 0 #2276ed,
    0 0 18px rgba(30, 144, 255, 0.9),
    0 0 36px rgba(30, 144, 255, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35);
}
.cell-face.front.correct { 
  background: linear-gradient(145deg, #24a95b, #27ae60);
  box-shadow: 
    0 4px 0 var(--ok),
    0 6px 20px rgba(18, 184, 134, 0.8),
    0 0 30px rgba(18, 184, 134, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  filter: brightness(1.3);
  animation: correctPulse 0.6s ease-out;
}
.cell-face.front.wrong { 
  background: radial-gradient(circle at center center, #ff0000 , #e63d1f , #4400ff00 , #4400ff00);
  box-shadow: 
    0 4px 0 #3d3f3d,
    0 6px 10px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(189, 182, 182, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  filter: brightness(0.9);
  animation: wrongPulse 0.6s ease-out;
}

/* Heart drop overlay */
.heart-drop {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5577;
  filter: drop-shadow(0 0 6px rgba(255, 85, 119, 0.5));
  z-index: 6;
  animation: heartFloat 1.4s ease-in-out infinite;
}

@keyframes heartFloat {
  0%, 100% { transform: translateY(0); opacity: 0.95; }
  50% { transform: translateY(-2px); opacity: 1; }
}

/* Bonus icons overlay */
.bonus-icon {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 16px;
  z-index: 7;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  animation: bonusFloat 2s ease-in-out infinite;
  pointer-events: none;
}

.gold-icon {
  animation-delay: 0s;
}

.gem-icon {
  animation-delay: 0.2s;
  font-size: 18px;
}

.essence-icon {
  animation-delay: 0.4s;
  bottom: 4px;
  left: 4px;
  right: auto;
}

.potion-icon {
  animation-delay: 0.6s;
  font-size: 18px;
}

@keyframes bonusFloat {
  0%, 100% { 
    transform: translateY(0) scale(1); 
    opacity: 0.9; 
  }
  50% { 
    transform: translateY(-3px) scale(1.1); 
    opacity: 1; 
  }
}

/* Outline the path on the back face */
.cell-face.back.path  { background: linear-gradient(145deg, #1e90ff, #0b61d0); }
.cell-face.back.start { background: linear-gradient(145deg, #1e90ff, #0b61d0); }
.cell-face.back.end   { background: linear-gradient(145deg, #1e90ff, #0b61d0); }

/* Styles obsolètes supprimés - remplacés par les indicateurs visuels */


/* Heart blink animation for power card */
.heart.blink {
  animation: heartBlink 0.9s ease-in-out;
}

/* Power card (freeze indicator) */
.power-card {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  border: 2px solid #2a2e52;
  background: #1a1c30;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.power-card.available {
  background: linear-gradient(135deg, #1a3d5c 0%, #2a5d8c 100%);
  border-color: #3a8dcc;
  color: #aaddff;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(58, 141, 204, 0.4);
  animation: powerPulse 2s ease-in-out infinite;
}

.power-card.used {
  background: #1a1c30;
  border-color: #2a2e52;
  color: #4a4e72;
  opacity: 0.5;
}

@keyframes powerPulse {
  0%, 100% {
    box-shadow: 0 0 12px rgba(58, 141, 204, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(58, 141, 204, 0.7);
  }
}

@keyframes heartBlink {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes correctPulse {
  0% {
    box-shadow: 
      0 4px 0 var(--ok),
      0 6px 20px rgba(18, 184, 134, 0.8),
      0 0 30px rgba(18, 184, 134, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    filter: brightness(1.3);
  }
  50% {
    box-shadow: 
      0 4px 0 var(--ok),
      0 6px 30px rgba(18, 184, 134, 1),
      0 0 50px rgba(18, 184, 134, 0.9),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    filter: brightness(1.5);
  }
  100% {
    box-shadow: 
      0 4px 0 var(--ok),
      0 6px 20px rgba(18, 184, 134, 0.8),
      0 0 30px rgba(18, 184, 134, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    filter: brightness(1.3);
  }
}

@keyframes wrongPulse {
  0% {
    box-shadow: 
      0 4px 0 var(--bad),
      0 6px 20px rgba(239, 68, 68, 0.8),
      0 0 30px rgba(239, 68, 68, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    filter: brightness(1.3);
  }
  50% {
    box-shadow: 
      0 4px 0 var(--bad),
      0 6px 30px rgb(249, 35, 35),
      0 0 50px rgba(239, 68, 68, 0.9),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    filter: brightness(1.5);
  }
  100% {
    box-shadow: 
      0 4px 0 var(--bad),
      0 6px 20px rgba(239, 68, 68, 0.8),
      0 0 30px rgba(239, 68, 68, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    filter: brightness(1.3);
  }
}


/* Back face */
.cell-face.back { transform: rotateX(180deg); }


/* Override when the cell is marked correct/wrong during play */
.cell-face.back.correct { 
  background: linear-gradient(145deg, #2ecc4b, #27ae44);
  box-shadow: 
    0 4px 0 var(--ok),
    0 6px 20px rgba(18, 184, 134, 0.8),
    0 0 30px rgba(18, 184, 134, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  filter: brightness(1.3);
  animation: correctPulse 0.6s ease-out;
}
/* .cell-face.back.wrong { 
  background: linear-gradient(145deg, #e74c3c, #c0392b);
  box-shadow: 
    0 4px 0 var(--bad),
    0 6px 20px rgba(239, 68, 68, 0.8),
    0 0 30px rgba(239, 68, 68, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  filter: brightness(1.3);
  animation: wrongPulse 0.6s ease-out;
} */

/* Ice overlay for frozen grid */
.ice-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(173, 216, 230, 0.85) 0%, rgba(135, 206, 250, 0.75) 50%, rgba(173, 216, 230, 0.85) 100%);
  border-radius: 10px;
  pointer-events: none;
  backdrop-filter: blur(3px);
  animation: iceShimmer 2s ease-in-out infinite;
  z-index: 10;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5);
}

.ice-overlay.cracking {
  background: linear-gradient(135deg, rgba(173, 216, 230, 0.6) 0%, rgba(135, 206, 250, 0.5) 50%, rgba(173, 216, 230, 0.6) 100%);
}

.ice-cracks {
  position: absolute;
  inset: 0;
  overflow: hidden;
}


@keyframes crackAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cell-inner.frozen {
  cursor: pointer;
}

@keyframes iceShimmer {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

/* Frozen counter overlay */
.frozen-counter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 20;
  pointer-events: none;
  color: #0a4d6e;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(173, 216, 230, 0.8);
  animation: pulse 1.5s ease-in-out infinite;
}

.frozen-text {
  font-size: 48px;
  font-weight: 900;
  color: #0a4d6e;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(173, 216, 230, 0.8);
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

/* Snowstorm overlay */
.snowstorm-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}

.snowflake {
  position: absolute;
  top: -10px;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  animation: snowfall linear infinite;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

@keyframes snowfall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

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
