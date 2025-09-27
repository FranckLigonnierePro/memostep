<template>
  <div class="home">
      <div class="flex flex-col mt-4 w-full grow justify-center">
        <button class="menu-btn" @click="emit('daily')">Parcours du jour</button>
        <button class="menu-btn" @click="emit('solo')">Mode solo</button>
        <button class="menu-btn" @click="emit('versus')">Mode versus</button>
        <button class="menu-btn" @click="emit('battle')">Mode battle royale</button>
        <div class="w-full h-12 mt-6 flex justify-center relative">
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('daily')" aria-label="Aide" title="Aide">
            <HelpCircle :size="20" />
          </button>
          <button class="menu-btn mr-2 w-11 h-11" @click="emit('solo')" aria-label="Paramètres" title="Paramètres">
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
import { HelpCircle, Settings } from 'lucide-vue-next';

const props = defineProps({
  logoSrc: { type: String, default: '' },
});
const emit = defineEmits(['start', 'daily', 'solo', 'versus', 'battle', 'lang']);

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
.lang-item:hover { background: #1f2238; }
</style>
