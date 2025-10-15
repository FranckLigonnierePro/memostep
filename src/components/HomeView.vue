<template>
  <div class="home">
      <div class="flex flex-col mt-4 w-full grow justify-center">
        <button class="menu-btn daily-btn" @click="emit('daily')">
          <span>{{ $t('home.daily') }}</span>
          <input type="checkbox" class="daily-check" :checked="!!dailyDone" disabled :aria-label="$t('home.doneToday')" />
          <span class="daily-checkmark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>
        <button class="menu-btn" @click="emit('solo')">{{ $t('home.solo') }}</button>
        <button class="menu-btn" @click="emit('versus')">{{ $t('home.versus') }}</button>
        <button class="menu-btn" disabled aria-disabled="true" :title="$t('home.soon')">{{ $t('home.battle') }}</button>
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
        <div class="w-full h-12 mt-6 flex justify-center relative">
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
import { HelpCircle, Settings, Heart, VolumeX, Volume2 } from 'lucide-vue-next';

const props = defineProps({
  logoSrc: { type: String, default: '' },
  dailyDone: { type: Boolean, default: false },
  currentFlag: { type: String, default: '@/assets/fr.png' },
  audioMuted: { type: Boolean, default: true },
});
const emit = defineEmits(['start', 'daily', 'solo', 'versus', 'battle', 'openLang', 'help', 'settings', 'stats', 'toggleAudio']);
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

/* Daily button layout with checkbox */
.daily-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center; /* keep label centered */
}
.daily-check {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  pointer-events: none;
  /* Cartoon purple styling */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border-radius: 6px;
  border: 2px solid #7b2cff; /* purple border */
  background: #2a1f4d; /* deep purple */
  box-shadow: 0 2px 0 #1a1c30, inset 0 -2px 0 rgba(0,0,0,0.25);
  transition: transform .08s ease, box-shadow .08s ease, background .12s ease, border-color .12s ease;
}

.daily-check:hover { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30, inset 0 -1px 0 rgba(0,0,0,0.25); }
.daily-check:focus { outline: 2px solid rgba(123,44,255,0.5); outline-offset: 2px; }

/* Checked state: brighten purple */
.daily-check:checked {
  background: #7b2cff; /* accent purple */
  border-color: #9b6cff;
}

/* SVG checkmark visibility and placement */
.daily-checkmark {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.9);
  transition: opacity .12s ease, transform .12s ease;
}
.daily-check:checked + .daily-checkmark {
  opacity: 1;
  transform: scale(1);
}

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

</style>
