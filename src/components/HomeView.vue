<template>
  <div class="home">
      <div class="flex flex-col mt-4 w-full grow justify-center">
        <button class="menu-btn daily-btn" @click="emit('daily')">
          <span>Parcours du jour</span>
          <input type="checkbox" class="daily-check" :checked="!!dailyDone" disabled aria-label="Terminé aujourd'hui" />
          <span class="daily-checkmark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>
        <button class="menu-btn" @click="emit('solo')">Mode solo</button>
        <button class="menu-btn" disabled aria-disabled="true" title="Bientôt">Mode versus</button>
        <button class="menu-btn" disabled aria-disabled="true" title="Bientôt">Mode battle royale</button>
        <a
          class="menu-btn donate-btn"
          href="https://ko-fi.com/memostep"
          target="_blank"
          rel="noopener"
          aria-label="Soutenir le projet sur Ko‑fi"
        >
          <Heart :size="18" />
          <span>Soutenir le projet</span>
        </a>
        <div class="w-full h-12 mt-6 flex justify-center relative">
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('help')" aria-label="Aide" title="Aide">
            <HelpCircle :size="20" />
          </button>
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('settings')" aria-label="Paramètres" title="Paramètres">
            <Settings :size="20" />
          </button>
          <!-- Language selector -->
          <div class="lang-wrap">
            <button class="menu-btn w-11 h-11" @click="toggleLangMenu" aria-haspopup="menu" :aria-expanded="showLangMenu ? 'true' : 'false'">
              {{ currentFlag }}
            </button>
            <div v-if="showLangMenu" class="lang-menu" role="menu">
              <button class="lang-item" role="menuitem" @click="selectLang('fr')">🇫🇷 </button>
              <button class="lang-item" role="menuitem" @click="selectLang('en')">🇬🇧</button>
              <button class="lang-item" role="menuitem" @click="selectLang('es')">🇪🇸</button>
              <button class="lang-item" role="menuitem" @click="selectLang('de')">🇩🇪</button>
            </div>
          </div>
        </div>
      </div>
      
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { HelpCircle, Settings, Heart } from 'lucide-vue-next';

const props = defineProps({
  logoSrc: { type: String, default: '' },
  dailyDone: { type: Boolean, default: false },
});
const emit = defineEmits(['start', 'daily', 'solo', 'versus', 'battle', 'lang', 'help', 'settings']);

const showLangMenu = ref(false);
const currentLang = ref('fr');
const flags = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪' };
const currentFlag = computed(() => flags[currentLang.value] || '🇫🇷');

function toggleLangMenu() {
  showLangMenu.value = !showLangMenu.value;
}
function selectLang(code) {
  currentLang.value = code;
  emit('lang', code);
  showLangMenu.value = false;
}

// help/settings handled by parent via emits

// close menu on outside click
function onDocClick(e) {
  const wrap = document.querySelector('.lang-wrap');
  if (wrap && !wrap.contains(e.target)) showLangMenu.value = false;
}
onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
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
.lang-wrap { position: relative; }
.lang-menu {
  position: absolute;
  top: 130%;
  right: 0;
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 10px;
  box-shadow: 0 4px 0 #1a1c30;
  padding: 6px 8px;
  display: flex;
  flex-direction: row;
  gap: 6px;
  z-index: 20;
}
.lang-item {
  padding: 6px 10px;
  background: #1a1c30;
  color: var(--text);
  border: 1px solid #2a2e52;
  border-radius: 8px;
  text-align: left;
}

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
