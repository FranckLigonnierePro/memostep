<template>
  <div class="home" style="border: 1px red solid;">
      <div class="flex flex-col mt-4 w-full grow justify-center items-center">
        <div class="header">
          <!-- Compact profile chip: avatar + level badge + progress pill -->
          <div class="profile-chip" role="button" tabindex="0" @click="emit('openProfile')" :aria-label="displayName" :title="displayName">
            <div class="chip-avatar-wrap">
              <img class="chip-avatar" :src="(selectedAvatar && selectedAvatar.img) || fallbackAvatar" alt="avatar" width="44" height="44" />
              <div class="chip-level-badge">{{ playerLevel }}</div>
            </div>
            <div class="progress-pill">
              <div class="progress-fill" :style="{ width: `${Math.round((playerLevelProgress || 0) * 100)}%` }"></div>
              <div class="progress-text">{{ Math.round((playerLevelProgress || 0) * 100) }}%</div>
            </div>
          </div>

          <!-- Resources bar (gold + gems) -->
          <div class="resources-bar">
            <div class="resource-chip">
              <button class="plus-btn" @click="emit('openShop', 'gold')" aria-label="Acheter or">＋</button>
              <span class="res-value">{{ formattedGold }}</span>
              <span class="res-icon gold">🪙</span>
            </div>
            <div class="resource-chip">
              <button class="plus-btn" @click="emit('openShop', 'gems')" aria-label="Acheter gemmes">＋</button>
              <span class="res-value">{{ playerGems }}</span>
              <span class="res-icon gem">💎</span>
            </div>
          </div>

          <div class="gear-wrap">
            <button class="gear-btn" @click="toggleGearMenu" :aria-label="$t('home.settings')" :title="$t('home.settings')">
              <Settings :size="20" />
            </button>
            <div v-if="showGearMenu" class="gear-menu" @mouseleave="closeGearMenu">
              <button class="gear-item" @click="openAccountModal(); closeGearMenu()">Mon Compte</button>
              <button class="gear-item" @click="emit('settings'); closeGearMenu()">{{ $t('home.settings') }}</button>
              <button class="gear-item" @click="emit('help'); closeGearMenu()">{{ $t('home.help') }}</button>
              <button class="gear-item" @click="emit('toggleAudio'); closeGearMenu()">{{ audioMuted ? $t('home.audioOn') : $t('home.audioOff') }}</button>
              <button class="gear-item" @click="emit('openLang'); closeGearMenu()">{{ $t('home.lang') }}</button>
            </div>
          </div>
        </div>
        <div
          v-if="selectedAvatar && selectedAvatar.img"
          class="avatar-card"
          @mousemove="onCardMove"
          @mouseleave="onCardLeave"
          :style="avatarCardStyle"
        >
          <img class="avatar-img" :src="selectedAvatar.img" :alt="selectedAvatar.name || 'Avatar'" />
          
          <!-- Champion Info Overlay -->
          <div class="champion-info" v-if="getChampionInfo()">
            <div class="champion-level">Niv. {{ getChampionInfo().level }}</div>
            <div class="champion-xp-bar">
              <div class="champion-xp-fill" :style="{ width: getChampionXpProgress() + '%' }"></div>
            </div>
            <div class="champion-xp-text">{{ getChampionInfo().xp }} / {{ getChampionNextLevelXp() }} XP</div>
          </div>
          
          <!-- Evolution Button -->
          <div 
            v-if="getChampionInfo()"
            class="evolve-btn"
            :class="{ disabled: !hasEnoughResources() }"
            role="button"
            tabindex="0"
            @click.stop="hasEnoughResources() && handleEvolve()"
            @keydown.enter.stop="hasEnoughResources() && handleEvolve()"
            @keydown.space.prevent.stop="hasEnoughResources() && handleEvolve()"
          >
            <span class="evolve-icon">⬆️</span>
            <span class="evolve-text">Évoluer</span>
            <div class="evolve-cost">
              <span class="cost-item">💰{{ getEvolutionCost().gold }}</span>
              <span class="cost-item">✨{{ getEvolutionCost().essence }}</span>
            </div>
          </div>
        </div>
        <div class="actions">
          
        </div>
        <div class="mode-buttons">
          <div class="btn-wrap" role="button" tabindex="0" aria-label="Jouer maintenant" @click="emit('solo')"
          @keydown.enter="emit('solo')" @keydown.space="emit('solo')">
            <img class="svg-btn" :src="primaryBtn" alt="" width="213" height="93" />
            <span class="btn-label-primary">Solo</span>
          </div>
          <div class="btn-wrap" role="button" tabindex="0" aria-label="Se connecter / Créer un compte"
          @click="emit('versus')" @keydown.enter="emit('versus')" @keydown.space="emit('versus')">
            <img class="svg-btn" :src="primaryBtn" alt="" width="213" height="65" />
            <span class="btn-label-primary">PvP</span>
          </div>
        </div>
        <!-- <button class="menu-btn" @click="emit('stats')">{{ $t('home.stats') }}</button>
        <a
          class="menu-btn donate-btn"
          href="https://ko-fi.com/memostep"
          target="_blank"
          rel="noopener"
          :aria-label="$t('home.support') + ' Ko‑fi'"
        >
          <Heart :size="18" />
          <span>{{ $t('home.support') }}</span>
        </a> -->
      </div>
  </div>
      
  <!-- Account Modal -->
      <AccountModal
        :show="showAccountModal"
        :displayName="displayName"
        :isGuest="isGuest"
        :hasRenamedOnce="hasRenamedOnce"
        :playerLevel="playerLevel"
        :playerGold="playerGold"
        :playerGems="playerGems"
        :playerEssence="playerEssence"
        @close="closeAccountModal"
        @rename="handleRename"
        @linkAccount="handleLinkAccount"
      />
</template>

<script setup>
import { ref, computed } from 'vue';
import { HelpCircle, Settings, Heart, VolumeX, Volume2 } from 'lucide-vue-next';
import primaryBtn from '../assets/buttons/primary_btn.svg';
import secondaryBtn from '../assets/buttons/secondary_btn.svg';
import AccountModal from './AccountModal.vue';

const props = defineProps({
  logoSrc: { type: String, default: '' },
  selectedAvatar: { type: Object, default: null },
  displayName: { type: String, default: 'Player' },
  playerGold: { type: [Number, String], default: 0 },
  playerEssence: { type: [Number, String], default: 0 },
  playerGems: { type: [Number, String], default: 0 },
  playerLevel: { type: Number, default: 1 },
  playerLevelProgress: { type: Number, default: 0 },
  currentFlag: { type: String, default: '@/assets/fr.png' },
  audioMuted: { type: Boolean, default: true },
  championsState: { type: Object, default: () => ({}) },
  isGuest: { type: Boolean, default: true },
  hasRenamedOnce: { type: Boolean, default: false },
});
const emit = defineEmits(['start', 'solo', 'versus', 'openLang', 'help', 'settings', 'stats', 'toggleAudio', 'openProfile', 'openShop', 'evolveChampion', 'renamePlayer', 'linkAccount']);

// Formatters
const formattedGold = computed(() => {
  const n = Number(props.playerGold || 0);
  return new Intl.NumberFormat('fr-FR').format(n);
});

// 3D tilt state for avatar card
const rx = ref(0); // rotateX
const ry = ref(0); // rotateY
const isHovering = ref(false);

// Gear menu state
const showGearMenu = ref(false);
function toggleGearMenu() { showGearMenu.value = !showGearMenu.value; }
function closeGearMenu() { showGearMenu.value = false; }

// Account modal state
const showAccountModal = ref(false);
function openAccountModal() { showAccountModal.value = true; }
function closeAccountModal() { showAccountModal.value = false; }

function handleRename(newName) {
  emit('renamePlayer', newName);
  closeAccountModal();
}

function handleLinkAccount() {
  closeAccountModal(); // Fermer d'abord AccountModal
  emit('linkAccount'); // Puis ouvrir AuthModal
}

function onCardMove(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / (rect.width / 2);   // -1 .. 1
  const dy = (e.clientY - cy) / (rect.height / 2);  // -1 .. 1
  // Opposite corner approaches: rotate toward opposite of pointer
  ry.value = -dx * 14; // tilt horizontally
  rx.value = dy * 14;  // tilt vertically
  isHovering.value = true;
}

function onCardLeave() {
  rx.value = 0;
  ry.value = 0;
  isHovering.value = false;
}

const avatarCardStyle = computed(() => {
  const base = `perspective(700px) rotateX(${rx.value.toFixed(2)}deg) rotateY(${ry.value.toFixed(2)}deg) scale(${isHovering.value ? 1.03 : 1.0})`;
  const shadow = isHovering.value
    ? '0 14px 24px rgba(0,0,0,0.45), 0 0 24px rgba(123,44,255,0.25)'
    : '0 10px 20px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.04)';
  return {
    transform: base,
    boxShadow: shadow,
    filter: isHovering.value ? 'saturate(1.06)' : 'none',
  };
});

// Champion info helpers
function getChampionInfo() {
  if (!props.selectedAvatar?.id || !props.championsState) return null;
  return props.championsState[props.selectedAvatar.id];
}

function getChampionXpProgress() {
  const info = getChampionInfo();
  if (!info) return 0;
  const nextLevelXp = getChampionNextLevelXp();
  if (!nextLevelXp) return 100;
  return Math.min(100, (info.xp / nextLevelXp) * 100);
}

function getChampionNextLevelXp() {
  const info = getChampionInfo();
  if (!info || info.level >= 10) return null;
  // XP required increases with level: level * 100
  return (info.level + 1) * 100;
}

function canEvolve() {
  const info = getChampionInfo();
  if (!info || info.level >= 10) return false;
  const nextLevelXp = getChampionNextLevelXp();
  return info.xp >= nextLevelXp;
}

function hasEnoughResources() {
  const info = getChampionInfo();
  if (!info) return false;
  const cost = getEvolutionCost();
  return props.playerGold >= cost.gold && props.playerEssence >= cost.essence;
}

function getEvolutionCost() {
  const info = getChampionInfo();
  if (!info) return { gold: 0, essence: 0 };
  const nextLevel = info.level + 1;
  return {
    gold: nextLevel * 50,
    essence: Math.floor(nextLevel / 2)
  };
}

function handleEvolve() {
  if (!props.selectedAvatar?.id) return;
  emit('evolveChampion', props.selectedAvatar.id);
}
</script>

<style scoped>
.home {
  margin-bottom: .5rem;
  justify-content: space-between;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
}

.menu {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
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
.menu-btn.w-11 { width: 44px; }
.menu-btn.h-11 { height: 44px; }

/* Normalize icon rendering */
.menu-btn.w-11.h-11 svg { display: block; }

/* Normalize flag text rendering */
.lang-wrap .menu-btn.w-11.h-11 { font-size: 18px; }

/* Removed Daily button styles */

/* Disabled state */
.menu-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 0 #1a1c30;
}

/* Language dropdown */
/* removed dropdown styles now that language opens in modal */

.donate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-color: #7b2cff; /* purple accent */
}
.donate-btn svg { color: #7b2cff; }
.donate-btn:hover { background: #22183f; }

.lang-item:hover { background: #1f2238; }

/* Center avatar card */
.avatar-card {
  position: relative;
  width: 180px;
  height: 240px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(123,44,255,0.35), rgba(34,197,94,0.25));
  border: 1px solid #2a2e52;
  margin-bottom: 12px;
  transform: translateZ(0);
  transition: transform .14s ease, box-shadow .14s ease, filter .14s ease;
}
.avatar-card::before {
  content: '';
  position: absolute;
  inset: -40%;
  background: conic-gradient(from 0deg, rgba(255,255,255,0.0), rgba(255,255,255,0.25), rgba(255,255,255,0.0) 60%);
  animation: shine 2.8s linear infinite;
  pointer-events: none;
}
.avatar-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@keyframes shine {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Header layout */
.header { width: 100%; display:flex; align-items:center; justify-content: space-between; margin-bottom: 10px; gap: 10px; }

/* Compact profile chip */
.profile-chip {
  display: inline-flex;
  align-items: center;
  gap: 0; /* no space between avatar and progress */
  padding: 0; /* remove inner padding */
  border: none; /* no card border */
  background: transparent; /* no card background */
  box-shadow: none; /* remove shadow */
  color: var(--text);
  cursor: pointer;
}
.profile-chip:focus-visible { outline: 2px solid #4c6ef5; outline-offset: 2px; }

.chip-avatar-wrap { position: relative; width: 36px; height: 36px; flex-shrink: 0; }
.chip-avatar { width: 36px; height: 36px; border-radius: 12px; display:block; }
.chip-level-badge {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display:flex; align-items:center; justify-content:center;
  font-size: 12px; font-weight: 900;
  color: #fff;
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
  border: 2px solid #0f1124;
  box-shadow: 0 2px 6px rgba(0,0,0,0.35);
}

.progress-pill {
  position: relative;
  width: 50px; /* smaller width */
  height: 16px; /* smaller height */
  border-radius: 5px;
  background: linear-gradient(180deg, #1f2a44 0%, #19233b 100%);
  overflow: hidden;
  border: 1px solid #2a2e52;
  border-left: none; /* attach to avatar without seam */
  margin-left: -2px; /* overlap slightly to look attached */
}
.progress-fill {
  position: absolute;
  inset: 0 0 0 auto;
  width: 0%;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 60%, #60a5fa 100%);
  border-radius: 12px;
  transition: width .35s ease;
  box-shadow: inset 0 0 10px rgba(255,255,255,0.2);
}
.progress-text {
  position: relative;
  z-index: 1;
  height: 100%;
  display:flex; align-items:center; justify-content:center;
  font-weight: 900;
  color: #e7eeff;
  text-shadow: 0 1px 0 rgba(0,0,0,0.35);
  font-size: 12px; /* smaller text */
}
.progress-trophy {
  position: absolute;
  right: -6px; /* tighter */
  bottom: -6px;
  transform: rotate(-10deg);
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.35));
  font-size: 14px; /* smaller */
}
.gear-wrap { position: relative; }
.gear-btn {
  display:inline-flex; align-items:center; justify-content:center;
  width: 44px; height: 44px; border-radius: 10px;
  background:#1a1c30; border:1px solid #2a2e52; color:#aeb3ff;
}
.gear-btn:hover { background:#202340; }
.gear-menu {
  position:absolute; top: 52px; right: 0;
  background:#0f1124; border:1px solid #2a2e52; border-radius:12px;
  box-shadow: 0 10px 20px rgba(0,0,0,.35);
  display:flex; flex-direction:column; min-width: 180px; padding:6px;
  z-index: 20;
}
.gear-item {
  display:block; text-align:left; padding:10px 12px; border-radius:8px;
  background:transparent; border:none; color: var(--text); cursor:pointer;
}
.gear-item:hover { background:#1a1c30; }
.profile-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid #2a2e52;
  background: #1a1c30;
  box-shadow: 0 2px 0 #1a1c30;
  color: var(--text);
  cursor: pointer;
}
.profile-avatar { border-radius: 12px; display:block; }
.profile-meta { display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
.profile-name { font-weight: 900; font-size: 16px; line-height: 1; }
.profile-res { display:flex; gap:8px; }
.res-pill { font-size: 12px; padding: 2px 8px; border-radius: 999px; background:#101226; border:1px solid #2a2e52; }
.res-pill.gold { color:#ffd166; }
.res-pill.essence { color:#a78bfa; }
.res-pill.gem { color:#76e4f7; }

/* Resources bar */
.resources-bar { display:flex; align-items:center; gap: 10px; }
.resource-chip {
  display:inline-flex; align-items:center; gap:8px;
  background: #0a0e1a;
  border: 1px solid #2a2e52;
  border-radius: 12px;
  height: 28px;
  padding: 0 10px 0 4px;
  box-shadow: 0 2px 0 #0b0e18, inset 0 1px 0 rgba(255,255,255,0.06);
}
.plus-btn {
  width: 22px; height: 22px;
  display:flex; align-items:center; justify-content:center;
  border-radius: 6px;
  border: 1px solid #b45309;
  background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
  color: #fff; font-weight: 900; line-height: 1;
  box-shadow: 0 1px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35);
  cursor: pointer;
}
.plus-btn:active { transform: translateY(1px); }
.res-value { color:#ffffff; font-weight: 900; text-shadow: 0 1px 0 rgba(0,0,0,0.35); font-size: 14px; }
.res-icon { font-size: 16px; line-height: 1; }
.res-icon.gold { color: #ffd166; }
.res-icon.gem { color: #76e4f7; }

/* Mode buttons: yellow 3D cartoon */
.mode-buttons { display:flex; gap:12px; margin: 10px 0 6px; }

/* New pill buttons */
.pill-btn {
  appearance: none;
  border: none;
  outline: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  min-width: 120px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 900;
  color: #ffffff;
  box-shadow:
    0 6px 0 rgba(0,0,0,0.25),
    0 12px 20px rgba(0,0,0,0.25),
    inset 0 2px 0 rgba(255,255,255,0.25);
  transition: transform .08s ease, box-shadow .08s ease, filter .12s ease;
}
.pill-btn:hover { filter: brightness(1.06) saturate(1.08); }
.pill-btn:active { transform: translateY(3px); box-shadow: 0 3px 0 rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.25); }
.pill-btn:focus-visible { box-shadow: 0 0 0 3px rgba(76,110,245,0.6), 0 12px 20px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.25); }

.pill-icon { font-size: 20px; filter: drop-shadow(0 1px 0 rgba(0,0,0,0.3)); }
.pill-text { text-shadow: 0 2px 0 rgba(0,0,0,0.35); }

/* Blue Solo */
.solo-btn {
  background: linear-gradient(180deg, #4c6ef5 0%, #3b82f6 60%, #2563eb 100%);
}
.solo-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(120% 120% at 80% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%);
  pointer-events: none;
}

/* Red PVP */
.pvp-btn {
  background: linear-gradient(180deg, #ef4444 0%, #f43f5e 60%, #e11d48 100%);
}
.pvp-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(120% 120% at 80% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%);
  pointer-events: none;
}

/* XP Progress Bar */
.xp-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #1a1c30;
  border: 1px solid #2a2e52;
  box-shadow: 0 2px 0 #1a1c30;
  min-width: 200px;
}

.xp-level-badge {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1c30;
  font-weight: 900;
  font-size: 16px;
  border-radius: 10px;
  border: 2px solid #2a2e52;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5);
}

.xp-progress-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xp-progress-bar {
  height: 8px;
  background: #101226;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #2a2e52;
  position: relative;
}

.xp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7b2cff 0%, #a78bfa 50%, #c4b5fd 100%);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(123, 44, 255, 0.5);
  position: relative;
}

.xp-progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 4px 4px 0 0;
}

.xp-text {
  font-size: 11px;
  font-weight: 700;
  color: #a0a5c8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.btn-wrap {
  position: relative;
}

.svg-btn {
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
  display: block;
  margin: 0 auto;
}

.btn-wrap:hover {
  cursor: pointer;
  transform: scale(.95);
  transition: 0.05s ease-in-out;
}

.btn-label-primary {
  z-index: 2;
  font-size: 36px;
  position: absolute;
  top: 41%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 3px 0px black, 0 4px 0px rgba(0, 0, 0, 0.2);
  /* Bordure (contour) du texte */
  -webkit-text-stroke: 2px rgba(0, 0, 0, 0.9);
  paint-order: stroke fill;
  color: white;
}

.btn-wrap:active {
  transform: scale(0.95);
  transition: 0.05s;
}

/* Champion Info Overlay on Avatar Card */
.avatar-card .champion-info {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.avatar-card .champion-level {
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
  text-align: center;
}

.avatar-card .champion-xp-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.avatar-card .champion-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
}

.avatar-card .champion-xp-text {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

/* Evolution Button on Avatar Card */
.avatar-card .evolve-btn {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: 2px solid #fbbf24;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.avatar-card .evolve-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.6);
}

.avatar-card .evolve-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #6b7280, #4b5563);
  border-color: #6b7280;
  box-shadow: none;
}

.avatar-card .evolve-btn.disabled:hover {
  transform: none;
}

.avatar-card .evolve-icon {
  font-size: 16px;
  line-height: 1;
}

.avatar-card .evolve-text {
  font-size: 11px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.avatar-card .evolve-cost {
  display: flex;
  gap: 8px;
  font-size: 10px;
  font-weight: 600;
  color: #000;
}

.avatar-card .cost-item {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
