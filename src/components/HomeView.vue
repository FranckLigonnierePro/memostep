<template>
  <div class="home">
      <div class="flex flex-col mt-4 w-full grow justify-center items-center">
        <div class="header">
          <button class="profile-card" @click="emit('openProfile')" :aria-label="$t('home.settings')" :title="displayName">
            <img class="profile-avatar" :src="(selectedAvatar && selectedAvatar.img) || fallbackAvatar" alt="avatar" width="48" height="48" />
            <div class="profile-meta">
              <div class="profile-name">{{ displayName }}</div>
              <div class="profile-res">
                <span class="res-pill gold">🪙 {{ playerGold }}</span>
                <span class="res-pill essence">✨ {{ playerEssence }}</span>
                <span class="res-pill gem">💎 {{ playerGems }}</span>
              </div>
            </div>
          </button>
          
          <!-- XP Progress Bar -->
          <div class="xp-progress-container">
            <div class="xp-level-badge">{{ playerLevel }}</div>
            <div class="xp-progress-wrapper">
              <div class="xp-progress-bar">
                <div class="xp-progress-fill" :style="{ width: `${playerLevelProgress * 100}%` }"></div>
              </div>
              <div class="xp-text">Level {{ playerLevel }}</div>
            </div>
          </div>
          
          <div class="gear-wrap">
            <button class="gear-btn" @click="toggleGearMenu" :aria-label="$t('home.settings')" :title="$t('home.settings')">
              <Settings :size="20" />
            </button>
            <div v-if="showGearMenu" class="gear-menu" @mouseleave="closeGearMenu">
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
        </div>
        <div class="mode-buttons">
          <button class="mode-btn" @click="emit('solo')">{{ $t('home.solo') }}</button>
          <button class="mode-btn" @click="emit('versus')">{{ $t('home.versus') }}</button>
        </div>
        <button class="menu-btn" @click="emit('stats')">{{ $t('home.stats') }}</button>
        <a
          class="menu-btn donate-btn"
          href="https://ko-fi.com/memostep"
          target="_blank"
          rel="noopener"
          :aria-label="$t('home.support') + ' Ko‑fi'"
        >
          <Heart :size="18" />
          <span>{{ $t('home.support') }}</span>
        </a>
        <div class="w-full h-12 mt-4 flex justify-center align-center relative">
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('help')" :aria-label="$t('home.help')" :title="$t('home.help')">
            <HelpCircle :size="20" />
          </button>
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('settings')" :aria-label="$t('home.settings')" :title="$t('home.settings')">
            <Settings :size="20" />
          </button>
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('toggleAudio')" :aria-label="audioMuted ? $t('home.audioOn') : $t('home.audioOff')" :title="audioMuted ? $t('home.audioOn') : $t('home.audioOff')">
            <VolumeX v-if="audioMuted" :size="20" />
            <Volume2 v-else :size="20" />
          </button>
          <!-- Language button opens modal in parent -->
          <button class="menu-btn w-11 h-11" @click="emit('openLang')" :aria-label="$t('home.lang')" :title="$t('home.lang')">
            <img :src="currentFlag" alt="flag" width="20" height="20" />
          </button>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { HelpCircle, Settings, Heart, VolumeX, Volume2 } from 'lucide-vue-next';

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
});
const emit = defineEmits(['start', 'solo', 'versus', 'openLang', 'help', 'settings', 'stats', 'toggleAudio', 'openProfile']);

// 3D tilt state for avatar card
const rx = ref(0); // rotateX
const ry = ref(0); // rotateY
const isHovering = ref(false);

// Gear menu state
const showGearMenu = ref(false);
function toggleGearMenu() { showGearMenu.value = !showGearMenu.value; }
function closeGearMenu() { showGearMenu.value = false; }

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

/* Header profile card */
.header { width: 100%; display:flex; align-items:center; justify-content:center; margin-bottom: 10px; }
.header { gap: 10px; }
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

/* Mode buttons: yellow 3D cartoon */
.mode-buttons { display:flex; gap:12px; margin: 10px 0 6px; }
.mode-btn {
  appearance: none;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 18px;
  min-width: 120px;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 900;
  color: #1a1c30;
  background: linear-gradient(180deg, #ffe066 0%, #ffd43b 60%, #fcc419 100%);
  box-shadow:
    0 6px 0 #b88911,
    0 10px 18px rgba(0,0,0,0.25),
    inset 0 2px 0 rgba(255,255,255,0.6);
  transition: transform .08s ease, box-shadow .08s ease, filter .12s ease;
}
.mode-btn:hover { filter: brightness(1.05) saturate(1.1); }
.mode-btn:active { transform: translateY(3px); box-shadow: 0 3px 0 #b88911, 0 6px 12px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.6); }
.mode-btn:focus-visible { box-shadow: 0 6px 0 #b88911, 0 0 0 3px #4c6ef5, 0 10px 18px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.6); }

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

</style>
