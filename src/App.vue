<template>
  <div class="app-frame">
    <div class="content" :style="{ transform: `scale(${rootScale})`}">    
    <UsernameModal
      v-if="route.name === 'Home' && showNameModal"
      :name="nameModalInput"
      :error="nameError"
      @update:name="(v) => nameModalInput = v"
      @continueAsGuest="continueAsGuest"
      @openProfile="openProfileFromNameModal"
    />

    <!-- Router View: renders the current route component with dynamic props -->
    <router-view v-slot="{ Component }">
      <component
        :is="Component"
        v-bind="routeProps"
        @start="newGame"
        @solo="() => startMode('solo')"
        @versus="openVersusView"
        @help="openHelp"
        @settings="openSettings"
        @stats="openStats"
        @openLang="openLang"
        @toggleAudio="toggleAudio"
        @openProfile="openProfile"
        @close="handleCloseView"
        @select="onProfileSelect"
        @evolveChampion="handleEvolveChampion"
        @renamePlayer="handleRenamePlayer"
        @linkAccount="handleLinkAccount"
        @begin="handleBeginVersusFromLobby"
        @cellClick="onCellClick"
        @goHome="goHome"
        @newGame="newGame"
      />
    </router-view>
    <!-- <nav v-if="route.name !== 'Game'" class="bottom-bar">
      <button
        class="bottom-btn"
        :class="{ active: activeTab === 'home' }"
        @click="router.push('/')"
        aria-label="Home"
        title="Home"
      >
        <Home :size="18" />
        <span>Home</span>
      </button>
      <button
        class="bottom-btn"
        :class="{ active: activeTab === 'league' }"
        @click="router.push('/versus')"
        aria-label="Ligue"
        title="Ligue"
      >
        <Trophy :size="18" />
        <span>Ligue</span>
      </button>
      <button
        class="bottom-btn"
        :class="{ active: activeTab === 'shop' }"
        @click="router.push('/profile')"
        aria-label="Boutique"
        title="Boutique"
      >
        <ShoppingBag :size="18" />
        <span>Boutique</span>
      </button>
    </nav> -->

   
    </div>
    <!-- Pre-game Champion Selector Overlay -->
    <div v-if="showChampionSelector" class="modal-overlay">
      <div class="modal-card" style="max-width:720px; width:90%;">
        <ChampionSelector
          :cards="avatarCards"
          :taken="takenAvatars"
          :secondsLeft="selectSecondsLeft"
          @select="handleChampionPick"
          @close="closeChampionSelector"
        />
      </div>
    </div>
    <!-- Versus Ready Countdown Overlay -->
    <div v-if="versusReadyCountdown > 0" class="modal-overlay">
      <div class="countdown-display">
        <div class="countdown-number">{{ versusReadyCountdown }}</div>
        <div class="countdown-text">{{ $t('versus.starting') || 'Démarrage...' }}</div>
      </div>
    </div>
  </div>

    <!-- Hidden audio element for background music -->
    <audio ref="audioRef" :src="themeUrl" preload="auto" volume="0.2" style="display:none"></audio>
    <!-- Loses modal -->
    <div v-if="loseActive" class="modal-overlay">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('modals.loseTitle') }}</h2>
        <div class="flex justify-center">
          <img src="./assets/looser.png" alt="lose" class="modal-img" width="200" height="100"/>
        </div>
        <div v-if="state.mode === 'solo'" style="margin-top:6px;">{{ $t('modals.score') }}: {{ soloLevel }}</div>
        <div class="modal-actions">
          <!-- Versus replay returns to room lobby -->
          <button
            v-if="state.mode === 'versus'"
            class="modal-btn"
            @click="handleVersusReplay"
          >{{ $t('modals.replay') }}</button>
          <!-- Non-versus replay keeps existing logic/limits -->
          <button
            v-if="state.mode !== 'versus' && !(state.mode === 'solo' && soloLivesUsed >= 3)"
            class="modal-btn"
            @click="handleReplay"
          >{{ $t('modals.replay') }}</button>
          <button class="modal-btn" @click="handleQuit">{{ $t('modals.quit') }}</button>
        </div>
      </div>
    </div>
    <!-- Win modal -->
    <div v-if="winActive" class="modal-overlay">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('modals.winTitle') }}</h2>
        <div class="flex justify-center">
          <img src="./assets/winner.png" alt="win" class="modal-img" width="200" height="100"/>
        </div>
        <div v-if="state.mode !== 'versus'">
          {{ $t('modals.time') }}: {{ chronoText }}
        </div>
        <!-- Versus ranking -->
        <div v-if="state.mode === 'versus'" style="margin-top:12px; width:100%;">
          <div style="font-weight:600; margin-bottom:8px;">Classement</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div
              v-for="(p, idx) in versusRanking"
              :key="p.id"
              style="display:flex; align-items:center; gap:8px; padding:6px 8px; background:#1a1c30; border-radius:8px; border:1px solid #2a2e52;"
            >
              <div style="font-weight:700; font-size:16px; min-width:24px;">{{ idx + 1 }}.</div>
              <div
                style="width:20px; height:20px; border-radius:999px; border:2px solid rgba(0,0,0,0.2);"
                :style="{ background: p.color || '#ffffff' }"
              ></div>
              <div style="flex:1; font-weight:600;">{{ p.name }}</div>
              <div style="font-size:14px; color:#12b886;">{{ p.score }}/5</div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <!-- Versus replay returns to room lobby -->
          <button v-if="state.mode === 'versus'" class="modal-btn" @click="handleVersusReplay">{{ $t('modals.replay') }}</button>
          <button class="modal-btn" @click="handleShare">{{ $t('modals.share') }}</button>
          <button class="modal-btn" @click="handleWinReturn">{{ $t('modals.back') }}</button>
        </div>
      </div>
    </div>

    <!-- Help modal -->
    <div v-if="showHelp" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('help.title') }}</h2>
        <div class="modal-body">
          <ol class="rules">
            <li>{{ $t('help.rule1') }}</li>
            <li>{{ $t('help.rule2') }}</li>
            <li>{{ $t('help.rule3') }}</li>
            <li>{{ $t('help.rule4') }}</li>
          </ol>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('help.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Settings modal -->
    <div v-if="showSettings" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('settings.title') }}</h2>
        <div class="modal-body">
          <div class="setting-item">
            <label class="setting-label">
              <span>Afficher les indicateurs de cases</span>
              <input type="checkbox" v-model="showCellIndicators" @change="saveSettings" class="setting-toggle" />
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('settings.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Language modal -->
    <div v-if="showLang" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card w-1/2">
        <h2 class="modal-title">{{ $t('lang.title') }}</h2>
        <div class="modal-body" style="display:flex; gap:22px; justify-content:center; flex-wrap:wrap;">
          <button class="lang-pick modal-btn" @click="selectLang('fr')"><img src="./assets/fr.png" alt="fr" width="48" height="48" /></button>
          <button class="lang-pick modal-btn" @click="selectLang('en')"><img src="./assets/en.png" alt="en" width="48" height="48" /></button>
        </div>
        <div class="modal-body" style="display:flex; gap:22px; justify-content:center; flex-wrap:wrap;">
          <button class="lang-pick modal-btn" @click="selectLang('es')"><img src="./assets/es.png" alt="es" width="48" height="48" /></button>
          <button class="lang-pick modal-btn" @click="selectLang('de')"><img src="./assets/de.png" alt="de" width="48" height="48" /></button>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('settings.close') }}</button>
        </div>
      </div>
    </div>

    <!-- Stats modal -->
    <div v-if="showStats" class="modal-overlay" @click.self="closeOverlays">
      <div class="modal-card">
        <h2 class="modal-title">{{ $t('stats.title') }}</h2>
        <div class="modal-body">
          <ul class="settings-list" style="list-style:none; padding:0; margin:0; text-align:left; display:flex; flex-direction:column; gap:6px;">
            <li><strong>{{ $t('stats.totalWins') }}:</strong> {{ stats.totalWins }}</li>
            <li><strong>{{ $t('stats.streak') }}:</strong> {{ stats.streak }}</li>
            <li><strong>{{ $t('stats.bestTime') }}:</strong> {{ stats.bestTimeText }}</li>
            <li><strong>{{ $t('stats.lastAttempts') }}:</strong> {{ stats.lastAttempts ?? '-' }}</li>
            <li><strong>{{ $t('stats.lastTime') }}:</strong> {{ stats.lastTimeText }}</li>
          </ul>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" @click="closeOverlays">{{ $t('stats.close') }}</button>
        </div>
      </div>
    </div>
    
    <!-- Level Up Modal -->
    <LevelUpModal
      :visible="showLevelUpModal"
      :newLevel="levelUpData.newLevel"
      :rewards="levelUpData.rewards"
      @close="handleCloseLevelUpModal"
    />
    
    <!-- XP Toast Notifications -->
    <XpToast :notifications="xpNotifications" />
    
    <!-- End Path Modal for Solo Mode -->
    <EndPathModal
      :visible="showEndPathModal"
      :status="endPathData.status"
      :stage="endPathData.stage"
      :timeSeconds="endPathData.timeSeconds"
      :livesLeft="endPathData.livesLeft"
      :xpBreakdown="endPathData.xpBreakdown"
      @continue="handleEndPathContinue"
      @abandon="handleEndPathAbandon"
    />
    
    <!-- Auth Modal -->
    <AuthModal
      v-if="showAuthModal"
      :isLinking="isLinkingAccount"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
      @continueAsGuest="handleContinueAsGuest"
    />
    
    <!-- Champion Evolution Modal -->
    <ChampionEvolutionModal
      :show="showChampionEvolutionModal"
      :championData="evolutionModalChampionData"
      :currentLevel="evolutionModalCurrentLevel"
      :nextLevel="evolutionModalNextLevel"
      :currentStats="evolutionModalCurrentStats"
      :nextStats="evolutionModalNextStats"
      :cost="evolutionModalCost"
      :playerGold="playerGold"
      :playerEssence="playerEssence"
      :newAbilities="evolutionModalNewAbilities"
      @close="closeChampionEvolutionModal"
      @evolve="confirmChampionEvolution"
    />
    
  </template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';

// Components
import HomeView from './components/HomeView.vue';
import BoardView from './components/BoardView.vue';
import VersusView from './components/VersusView.vue';
import ProfileView from './components/ProfileView.vue';
import ChampionSelector from './components/ChampionSelector.vue';
import UsernameModal from './components/UsernameModal.vue';
import LevelUpModal from './components/LevelUpModal.vue';
import XpToast from './components/XpToast.vue';
import EndPathModal from './components/EndPathModal.vue';
import AuthModal from './components/AuthModal.vue';
import ChampionEvolutionModal from './components/ChampionEvolutionModal.vue';
import { Settings, Home, Trophy, ShoppingBag } from 'lucide-vue-next';

// Assets
import themeUrl from './assets/memosteptheme2.mp3';
import crackTexture from './assets/crack.png';
import frFlag from './assets/fr.png';
import enFlag from './assets/en.png';
import esFlag from './assets/es.png';
import deFlag from './assets/de.png';

// Config
import { avatarCards, imgMage } from './config/avatarConfig.js';
import { ROOT_W, ROOT_H, MAX_H, COLS, ROWS } from './config/gameConfig.js';

// Composables
import { useGameState } from './composables/useGameState.js';
import { useAudio } from './composables/useAudio.js';
import { usePlayerStats } from './composables/usePlayerStats.js';
import { useChampionSelection } from './composables/useChampionSelection.js';
import { useVersusMode } from './composables/useVersusMode.js';
import { useGameLogic } from './composables/useGameLogic.js';
import { useChampions } from './composables/useChampions.js';

// Champion System
import { getChampionStats, evolveChampion } from './lib/championSystem.js';

// Handlers
import { createGameHandlers } from './handlers/gameHandlers.js';
import { createModalHandlers } from './handlers/modalHandlers.js';
import { createNavigationHandlers } from './handlers/navigationHandlers.js';

// Utils
import { randomPath, seededRng, hashString, randomPathWithRngAndStart } from './utils/pathGenerator.js';
import { pickHeartForPath, generateBorderHazards, applyEnrichedGrid } from './utils/gridHelpers.js';
import { formatMs, generateGuestName } from './utils/formatters.js';
import { ensurePlayerId } from './lib/storage.js';
import { onAuthStateChange } from './lib/auth.js';

// i18n et router
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

// Refs DOM
const audioRef = ref(null);

// Composables initialization
const gameState = useGameState();
const audio = useAudio(audioRef);
const playerStats = usePlayerStats();
const championSelection = useChampionSelection();
const versusMode = useVersusMode();
const gameLogic = useGameLogic();
const champions = useChampions();

// Destructure composables
const { state, flipActive, flipBackActive, stunActive, faceDownActive, faceColors, shakeActive, clickBlocked, mirrorColumns, revealComplete, highlightIdx, soloLivesUsed, soloLevel, runCounters, soloErrorCount, cells, boardStyle, revealMsLeft, revealProgress, revealSecondsText, nextCell, livesUsed, lastExtinguishedIndex, cellClass, startRevealTicker, stopRevealTicker, resetGameState } = gameState;

const { audioMuted, toggleAudio, pauseMainMusic, resumeMainMusic, initAudio } = audio;

const { playerGold, playerEssence, playerGems, playerTotalXp, playerLevel, playerLevelProgress, showLevelUpModal, levelUpData, xpNotifications, showEndPathModal, endPathData, showAuthModal, isLinkingAccount, currentUser, currentProfile, isGuestUser, loadResources, saveResources, loadPlayerXP, grantXP, closeLevelUpModal, loadUserProfile } = playerStats;

const { selectedAvatar, showChampionSelector, selectSecondsLeft, versusReadyCountdown, pickRandomAvailableAvatar, startChampionSelection, closeChampionSelector, handleChampionPick: championPick, startReadyCountdown, stopReadyCountdown, loadSelectedAvatar } = championSelection;

const { versusCode, versusRoom, versusIsHost, versusError, versusSeed, versusStartAtMs, versusCurrentRound, versusLastProgress, playerId, versusLivesUsed, versusWins, versusProgress, versusPlayers, versusPathsByPlayer, versusRanking, startProgressAutoPublish, stopProgressAutoPublish, createRoom, joinRoom, startVersusGame, subscribeToRoom, leaveRoom, resetVersusRoom, useFreezePower, updateFreezeState, reportRoundVictory, reportLifeLossEvent, getSupabase } = versusMode;

const { chronoMs, startChrono, stopChrono, onCellClick: gameOnCellClick, prepareNextSoloLevel } = gameLogic;

const { championsState, currentChampionId, currentChampion, currentChampionStats, currentChampionProgress, championAbilityState, showEvolutionModal, evolutionModalData, canCurrentChampionEvolve, hasActiveShield, shieldCharges, hasActiveStun, stunDuration, loadChampions, saveChampions, selectChampion, grantChampionXp, grantCurrentChampionXp, openEvolutionModal, closeEvolutionModal, performEvolution, activateShieldAbility, consumeShieldCharge, activateStunAbility, deactivateStun, resetAbilityState, applyPassiveVisionSacree, CHAMPION_XP_RULES } = champions;

// Additional state
const rootScale = ref(1);
const showHelp = ref(false);
const showSettings = ref(false);
const showStats = ref(false);
const showLang = ref(false);
const showGearMenuLeft = ref(false);
const showGearMenuMain = ref(false);
const showCellIndicators = ref(true);
const showGearMenuRight = ref(false);
const winActive = ref(false);
const loseActive = ref(false);
const justLost = ref(false);
const showNameModal = ref(false);
const baseDifficulty = ref(1); // Niveau de difficulté de base calculé depuis l'XP

// Champion Evolution Modal State
const showChampionEvolutionModal = ref(false);
const evolutionModalChampionData = ref({});
const evolutionModalCurrentLevel = ref(1);
const evolutionModalNextLevel = ref(2);
const evolutionModalCurrentStats = ref({});
const evolutionModalNextStats = ref({});
const evolutionModalCost = ref({ gold: 0, essence: 0 });
const evolutionModalNewAbilities = ref([]);
const nameModalInput = ref('');
const nameError = ref('');
const usernameInput = ref('');
const currentLang = ref('fr');

// Account management state
const hasRenamedOnce = ref(false);
const isGuest = ref(true);

// Computed
const displayName = computed(() => {
  const direct = String(usernameInput.value || '').trim();
  if (direct) return direct;
  try {
    const saved = String(localStorage.getItem('memostep_username') || '').trim();
    if (saved) return saved;
  } catch (_) {}
  return 'Player';
});

const chronoText = computed(() => formatMs(chronoMs.value));

const flags = { fr: frFlag, en: enFlag, es: esFlag, de: deFlag };
const currentFlag = computed(() => flags[currentLang.value] || frFlag);

const activeTab = computed(() => {
  const n = String(route.name || '');
  if (n === 'Home') return 'home';
  if (n === 'Versus') return 'league';
  if (n === 'Profile' || n === 'Login') return 'shop';
  return '';
});

const takenAvatars = computed(() => {
  if (state.mode !== 'versus') return [];
  const room = versusRoom.value;
  const roster = (room && Array.isArray(room.players)) ? room.players : [];
  return roster.map(p => p?.avatar_url).filter(u => !!u);
});

const stats = reactive({
  totalWins: 0,
  streak: 0,
  bestTimeMs: null,
  bestTimeText: '-:-',
  lastAttempts: null,
  lastTimeMs: null,
  lastTimeText: '-:-',
});

// Router props
const routeProps = computed(() => {
  const routeName = route.name;
  const common = {
    logoSrc: '',
    selectedAvatar: selectedAvatar.value,
    displayName: displayName.value,
    currentFlag: currentFlag.value,
    audioMuted: audioMuted.value,
  };
  
  if (routeName === 'Home') {
    return {
      ...common,
      playerGold: playerGold.value,
      playerEssence: playerEssence.value,
      playerGems: playerGems.value,
      playerLevel: playerLevel.value,
      playerLevelProgress: playerLevelProgress.value,
      championsState: championsState.value,
      isGuest: isGuest.value,
      hasRenamedOnce: hasRenamedOnce.value,
    };
  }
  
  if (routeName === 'Profile') {
    return {
      ...common,
      playerLevel: playerLevel.value,
      playerTotalXp: playerTotalXp.value,
      playerLevelProgress: playerLevelProgress.value,
      championsState: championsState.value,
      playerGold: playerGold.value,
      playerEssence: playerEssence.value,
    };
  }
  
  if (routeName === 'Versus') {
    return {
      code: versusCode.value,
      selectedAvatar: selectedAvatar.value,
      pauseMainMusic,
      resumeMainMusic,
    };
  }
  
  if (routeName === 'Game') {
    return {
      cells: cells.value,
      boardStyle: boardStyle.value,
      cellClass,
      revealSecondsText: revealSecondsText.value,
      revealProgress: revealProgress.value,
      flipActive: flipActive.value,
      flipBackActive: flipBackActive.value,
      rowsCount: ROWS,
      colsCount: COLS,
      faceDownActive: faceDownActive.value,
      faceColors: faceColors.value,
      revealComplete: revealComplete.value,
      timeText: chronoText.value,
      score: soloLevel.value,
      mode: state.mode,
      versusWins: versusWins.value,
      versusProgress: versusProgress.value,
      versusPlayers: versusPlayers.value,
      livesUsed: livesUsed.value,
      justLost: justLost.value,
      lastExtinguishedIndex: lastExtinguishedIndex.value,
      frozenGrid: state.frozenGrid,
      frozenClicksLeft: state.frozenClicksLeft,
      showSnowstorm: state.showSnowstorm,
      powerAvailable: !state.powerUsed,
      path: state.path,
      versusPathsByPlayer: versusPathsByPlayer.value,
      revealed: state.revealed,
      heartCell: state.heartCell,
      shakeActive: shakeActive.value,
      wrongCrackTexture: crackTexture,
      selfId: playerId.value,
      selectedAvatar: selectedAvatar.value,
      playerProgress: state.nextIndex,
      rollbackKeys: Array.from(state.rollback || []),
      lifeLossKeys: Array.from(state.lifeLoss || []),
      stunKeys: Array.from(state.stun || []),
      stunActive: stunActive.value,
      gridContent: state.gridContent,
      collectedBonuses: Array.from(state.collectedBonuses || []),
      playerGold: playerGold.value,
      playerEssence: playerEssence.value,
      playerGems: playerGems.value,
      hasActiveShield: hasActiveShield.value,
      shieldCharges: shieldCharges.value,
      hasActiveStun: hasActiveStun.value,
      stunDuration: stunDuration.value,
      showCellIndicators: showCellIndicators.value,
    };
  }
  
  return {};
});

// Create handlers
const gameHandlers = createGameHandlers({
  state, winActive, loseActive, showEndPathModal, endPathData, soloLevel, chronoMs, soloLivesUsed,
  grantXP, stopChrono, router, t, grantCurrentChampionXp, CHAMPION_XP_RULES, prepareNextSoloLevel,
  runCounters, baseDifficulty
});

const modalHandlers = createModalHandlers({
  showHelp, showSettings, showStats, showLang, currentLang, locale,
  showGearMenuLeft, showGearMenuMain, showGearMenuRight
});

const navigationHandlers = createNavigationHandlers({
  router, state, stopChrono, chronoMs, stopRevealTicker, winActive, loseActive, faceDownActive,
  soloLivesUsed, soloLevel, versusMode: versusMode, t
});

// Destructure handlers
const { handleMatchWin, handleMatchLose, handleMultiplayerWin, handleMultiplayerLose, showEndPathModalForSolo, handleEndPathContinue: endPathContinue, handleEndPathAbandon: endPathAbandon, handleReplay, handleQuit, handleWinReturn, handleShare, handleVersusReplay, executePendingContinue } = gameHandlers;

const { openHelp, openSettings, openStats, openLang, closeOverlays, selectLang, toggleGearMenuLeft, closeGearMenuLeft, toggleGearMenuMain, closeGearMenuMain, toggleGearMenuRight, closeGearMenuRight } = modalHandlers;

const { openProfile, openVersusView, handleCloseView, handleCloseProfileView, handleProfileSelect, handleCloseVersusView, goHome: navGoHome } = navigationHandlers;

// Username modal functions
function openNameModalIfNeeded() {
  try {
    const raw = localStorage.getItem('memostep_username');
    const saved = (raw == null ? '' : String(raw)).trim();
    if (!saved && route.name === 'Home') {
      nameModalInput.value = '';
      nameError.value = '';
      showNameModal.value = true;
    }
  } catch (_) {
    if (route.name === 'Home') {
      nameModalInput.value = '';
      nameError.value = '';
      showNameModal.value = true;
    }
  }
}

function continueAsGuest() {
  let v = String(nameModalInput.value || '').trim();
  if (!v) {
    v = generateGuestName();
  }
  nameError.value = '';
  try { localStorage.setItem('memostep_username', v); } catch(_) {}
  usernameInput.value = v;
  showNameModal.value = false;
}

function openProfileFromNameModal() {
  showNameModal.value = false;
  router.push('/login');
}

// Auth functions
function closeAuthModal() {
  showAuthModal.value = false;
  isLinkingAccount.value = false;
}

async function handleAuthSuccess() {
  console.log('[App] Auth success');
  
  // If this was a linking operation, update isGuest
  if (isLinkingAccount.value) {
    isGuest.value = false;
    console.log('[Account] Account linked successfully - no longer a guest');
  }
  
  closeAuthModal();
  await loadUserProfile();
}

function handleContinueAsGuest() {
  closeAuthModal();
  continueAsGuest();
}

// Root scale
function fitRootScale() {
  const vw = window.innerWidth;
  const vh = Math.min(MAX_H, window.innerHeight);
  const sW = vw / ROOT_W;
  const sH = vh / ROOT_H;
  rootScale.value = Math.min(sW, sH);
}

// Game functions
function startMode(mode) {
  state.mode = mode;
  router.push('/game');
  
  if (mode === 'solo') {
    state.path = randomPath();
    state.soloPath = state.path.slice();
    const hazards = generateBorderHazards(state.path);
    state.rollback = hazards.rollback;
    state.stun = hazards.stun;
    state.lifeLoss = hazards.lifeLoss;
    
    runCounters.value = { gem: 0, potion: 0 };
    state.heartCell = null;
    state.preparedHeart = null;
    
    // Apply champion passive bonus (Vision Sacrée)
    const bonusModifier = currentChampionStats.value?.passive?.bonusOnPathChance || 0;
    
    const result = applyEnrichedGrid(state.path, 1, runCounters.value, bonusModifier);
    state.gridContent = result.grid;
    state.rollback = result.rollback;
    state.stun = result.stun;
    state.lifeLoss = result.lifeLoss;
    runCounters.value = result.newCounters;
  } else {
    state.path = randomPath();
  }
  
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.collectedBonuses.clear();
  
  if (mode === 'solo') {
    startChampionSelection({ mode: 'solo', delayStart: true });
  } else {
    showPath();
  }
}

function showPath() {
  state.revealed = true;
  state.inPlay = false;
  state.statusText = t('status.memorize');
  
  if (state.mode !== 'versus') {
    chronoMs.value = 0;
  } else {
    stopChrono();
  }
  
  if (state.timerId) clearTimeout(state.timerId);
  
  const pathRevealTime = (state.path.length * 200) + 500;
  state.revealDuration = Math.max(pathRevealTime, 2000);
  
  state.revealEndAt = Date.now() + state.revealDuration;
  startRevealTicker();
  state.timerId = setTimeout(hidePath, state.revealDuration);
  
  faceDownActive.value = false;
  revealComplete.value = false;
  state.powerUsed = false;
}

function hidePath() {
  state.inPlay = true;
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.statusText = t('status.yourTurn');
  stopRevealTicker();
  
  if (state.mode !== 'versus') {
    chronoMs.value = 0;
  }
  startChrono(versusStartAtMs.value, state.revealDuration);
  
  if (state.mode === 'versus') {
    startProgressAutoPublish(state);
  }
  
  setTimeout(() => {
    state.revealed = false;
    revealComplete.value = true;
  }, 500);
}

function newGame() {
  if (state.mode === 'solo') {
    if (!Array.isArray(state.soloPath) || state.soloPath.length === 0) {
      state.soloPath = randomPath();
    }
    // Copier le chemin préparé dans state.path pour l'utiliser dans le jeu
    state.path = state.soloPath.slice();
    
    state.heartCell = state.preparedHeart || null;
    state.preparedHeart = null;
    
    const currentFloor = Math.max(1, (soloLevel.value || 0) + 1);
    
    // Apply champion passive bonus (Vision Sacrée)
    const bonusModifier = currentChampionStats.value?.passive?.bonusOnPathChance || 0;
    
    const result = applyEnrichedGrid(state.soloPath, currentFloor, runCounters.value, bonusModifier);
    state.gridContent = result.grid;
    state.rollback = result.rollback;
    state.stun = result.stun;
    state.lifeLoss = result.lifeLoss;
    runCounters.value = result.newCounters;
  } else {
    state.path = randomPath();
  }
  
  state.nextIndex = 0;
  state.correctSet.clear();
  state.wrongSet.clear();
  state.collectedBonuses.clear();
  faceDownActive.value = false;
  stopChrono();
  chronoMs.value = 0;
  showPath();
}

async function goHome() {
  await navGoHome(leaveRoom, openNameModalIfNeeded);
}

function onCellClick(r, c) {
  gameOnCellClick(r, c, {
    state, mirrorColumns, clickBlocked, shakeActive, stunActive, justLost, flipBackActive,
    faceDownActive, soloLivesUsed, soloErrorCount, playerGold, playerEssence, playerGems, t, handleMatchWin,
    handleMatchLose, versusMode: state.mode === 'versus', hasActiveShield, consumeShieldCharge
  });
}

function handleChampionPick(card) {
  championPick(card, async (pickedCard) => {
    if (state.mode === 'versus') {
      await updatePlayerAvatarUrl(pickedCard.img);
    } else {
      closeChampionSelector();
      if (!state.revealed && !state.inPlay && state.mode === 'solo') {
        showPath();
      }
    }
  });
}

function onProfileSelect(card) {
  selectedAvatar.value = card;
  handleProfileSelect(card);
}

function handleEvolveChampion(championId) {
  const champion = championsState.value[championId];
  if (!champion || champion.level >= 10) return;
  
  // Get champion data from avatarCards
  const championCard = avatarCards.find(c => c.id === championId);
  if (!championCard) return;
  
  // Get stats for current and next level
  const currentStats = getChampionStats(championId, champion.level);
  const nextStats = getChampionStats(championId, champion.level + 1);
  
  if (!currentStats || !nextStats) return;
  
  // Calculate evolution cost
  const nextLevel = champion.level + 1;
  const cost = {
    gold: nextLevel * 50,
    essence: Math.floor(nextLevel / 2)
  };
  
  // Get new abilities unlocked at next level
  const newAbilities = [];
  
  // Check if new ability level unlocks something special
  if (nextStats.ability && nextStats.ability.charges > currentStats.ability.charges) {
    newAbilities.push({
      icon: '🛡️',
      name: currentStats.info.abilityNameSolo,
      description: `Charges: ${nextStats.ability.charges} (+${nextStats.ability.charges - currentStats.ability.charges})`
    });
  }
  
  if (nextStats.passive && nextStats.passive.bonusChance > currentStats.passive.bonusChance) {
    newAbilities.push({
      icon: '✨',
      name: currentStats.info.passiveName,
      description: `Bonus: ${(nextStats.passive.bonusChance * 100).toFixed(0)}% (+${((nextStats.passive.bonusChance - currentStats.passive.bonusChance) * 100).toFixed(0)}%)`
    });
  }
  
  // Prepare modal data
  evolutionModalChampionData.value = championCard;
  evolutionModalCurrentLevel.value = champion.level;
  evolutionModalNextLevel.value = nextLevel;
  evolutionModalCurrentStats.value = {
    shieldCharges: currentStats.ability?.charges || 0,
    bonusChance: `${(currentStats.passive?.bonusChance * 100 || 0).toFixed(0)}%`,
    essenceGain: currentStats.ability?.essenceGain || 0
  };
  evolutionModalNextStats.value = {
    shieldCharges: nextStats.ability?.charges || 0,
    bonusChance: `${(nextStats.passive?.bonusChance * 100 || 0).toFixed(0)}%`,
    essenceGain: nextStats.ability?.essenceGain || 0
  };
  evolutionModalCost.value = cost;
  evolutionModalNewAbilities.value = newAbilities;
  
  // Open modal
  showChampionEvolutionModal.value = true;
}

function confirmChampionEvolution(championId) {
  const result = evolveChampion(championId, playerGold.value, playerEssence.value);
  
  if (result.success) {
    // Deduct resources
    playerGold.value -= result.cost.gold;
    playerEssence.value -= result.cost.essence;
    
    // Save resources and champions
    saveResources();
    saveChampions();
    
    console.log(`[Champion] ${championId} evolved to level ${result.newLevel}!`);
  } else {
    console.warn(`[Champion] Evolution failed: ${result.error}`);
  }
}

function closeChampionEvolutionModal() {
  showChampionEvolutionModal.value = false;
}

// Account management handlers
function handleRenamePlayer(newName) {
  // Check if it's the first rename (free)
  if (!hasRenamedOnce.value) {
    // First rename is free
    usernameInput.value = newName;
    localStorage.setItem('memostep_username', newName);
    hasRenamedOnce.value = true;
    localStorage.setItem('memostep_hasRenamedOnce', 'true');
    console.log('[Account] First rename (free):', newName);
  } else {
    // Subsequent renames cost 100 gems
    if (playerGems.value >= 100) {
      playerGems.value -= 100;
      usernameInput.value = newName;
      localStorage.setItem('memostep_username', newName);
      saveResources();
      console.log('[Account] Paid rename (100 gems):', newName);
    } else {
      console.warn('[Account] Not enough gems for rename');
    }
  }
}

function handleLinkAccount() {
  // Open the auth modal to link account
  showAuthModal.value = true;
  isLinkingAccount.value = true;
  console.log('[Account] Opening auth modal to link account');
}

function loadAccountSettings() {
  try {
    const renamed = localStorage.getItem('memostep_hasRenamedOnce');
    hasRenamedOnce.value = renamed === 'true';
    
    isGuest.value = !currentUser.value;
  } catch (e) {
    console.error('[Account] Error loading account settings:', e);
  }
}

function loadSettings() {
  try {
    const indicators = localStorage.getItem('memostep_showCellIndicators');
    if (indicators !== null) {
      showCellIndicators.value = indicators === 'true';
    }
  } catch (e) {
    console.error('[Settings] Error loading settings:', e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem('memostep_showCellIndicators', String(showCellIndicators.value));
  } catch (e) {
    console.error('[Settings] Error saving settings:', e);
  }
}

async function updatePlayerAvatarUrl(url) {
  if (state.mode !== 'versus' || !versusCode.value) return;
  const me = playerId.value || ensurePlayerId();
  try {
    const sb = getSupabase();
    const { error } = await sb.from('players').update({ avatar_url: url, champion_ready: true }).eq('room_code', versusCode.value).eq('player_id', me);
    if (error && error.message?.includes('champion_ready')) {
      await sb.from('players').update({ avatar_url: url }).eq('room_code', versusCode.value).eq('player_id', me);
      closeChampionSelector();
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

function handleEndPathContinue() {
  // Ne pas préparer le chemin ici, cela sera fait dans le handler après validation
  endPathContinue(newGame, goHome);
}

function handleEndPathAbandon() {
  endPathAbandon(goHome);
}

function handleCloseLevelUpModal() {
  // Fermer la modal et exécuter l'action de continuation en attente
  closeLevelUpModal(executePendingContinue);
}

function handleBeginVersusFromLobby(payload) {
  try {
    if (payload && typeof payload === 'object') {
      if (payload.code) versusCode.value = payload.code;
      if (payload.room) versusRoom.value = payload.room;
      if (payload.code) {
        try { subscribeToRoom(payload.code); } catch (_) {}
      }
      if (typeof payload.seed === 'number' && typeof payload.startAtMs === 'number') {
        router.push('/game');
        return;
      }
    }
  } finally {
    router.push('/versus');
  }
}

// Handle keyboard input for champion abilities
function handleKeyDown(event) {
  // Only handle spacebar
  if (event.code !== 'Space') return;
  
  // Don't trigger if typing in input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
  
  // Only during active gameplay
  if (!state.inPlay) return;
  
  event.preventDefault();
  
  // Solo mode: Bouclier Sacré
  if (state.mode === 'solo') {
    if (!hasActiveShield.value) {
      const activated = activateShieldAbility();
      if (activated) {
        console.log('[Champion] Bouclier Sacré activated');
      }
    }
  }
  
  // Versus mode: Lumière Étourdissante
  if (state.mode === 'versus') {
    if (!hasActiveStun.value) {
      const result = activateStunAbility();
      if (result) {
        console.log('[Champion] Lumière Étourdissante activated', result);
        // TODO: Apply stun effect to other players
      }
    }
  }
}

// Watch for all players ready in versus
watch(versusRoom, (room) => {
  if (state.mode !== 'versus' || !showChampionSelector.value || versusReadyCountdown.value > 0) return;
  if (!room || !Array.isArray(room.players)) return;
  
  const allReady = room.players.every(p => p && p.champion_ready === true);
  if (allReady && room.players.length >= 1) {
    console.log('[App] All players ready, starting countdown');
    closeChampionSelector();
    startReadyCountdown(() => {
      console.log('[App] Countdown finished');
    });
  }
}, { deep: true });

// Lifecycle
onMounted(() => {
  try { currentLang.value = String(locale.value || 'fr'); } catch (_) {}
  fitRootScale();
  window.addEventListener('resize', fitRootScale);
  window.addEventListener('orientationchange', fitRootScale);
  window.addEventListener('keydown', handleKeyDown);
  
  try { ensurePlayerId(); } catch (_) {}
  
  initAudio();
  loadSelectedAvatar();
  loadPlayerXP();
  loadResources();
  loadChampions();
  loadUserProfile();
  loadAccountSettings();
  loadSettings();
  
  const authSubscription = onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      await loadUserProfile();
      isGuest.value = false;
    } else if (event === 'SIGNED_OUT') {
      currentUser.value = null;
      currentProfile.value = null;
      isGuestUser.value = true;
      isGuest.value = true;
    }
  });
  
  window._authSubscription = authSubscription;
  openNameModalIfNeeded();
});

onBeforeUnmount(() => {
  if (window._authSubscription) {
    window._authSubscription.unsubscribe();
  }
  window.removeEventListener('resize', fitRootScale);
  window.removeEventListener('orientationchange', fitRootScale);
  window.removeEventListener('keydown', handleKeyDown);
  if (state.timerId) clearTimeout(state.timerId);
  stopRevealTicker();
});
</script>

<style>
:root {
  --cols: 4;
  --rows: 10;
  --cell: 56px;          /* taille cible des cases */
  --gap: 8px;            /* espace entre cases */
  --pad: 12px;           /* padding du board */
  --accent: #6F08EF;
  --ok: #12b847;
  --bad: #fd1919;
  --bg: #0f1020;
  --panel: #17192c;
  --text: #e7e7ee;
  --muted: #9aa0b4;
}

html, body, #app {
  font-family: 'Changa One', 'Open Sans', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--bg);
  display: flex;
  flex-direction: column;
  font-weight: 400;
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

span {
    letter-spacing: 0.5px;
    text-shadow: 0 2px 0px black;
  /* Bordure (contour) du texte */
  -webkit-text-stroke: 2px rgba(0, 0, 0, 0.9);
  paint-order: stroke fill;
  color: white;
}

.content {
  width: 320px;
  height: 568px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: .5rem;
}

/* Frame that keeps the main content perfectly centered */
.app-frame {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  overflow: hidden;
  background-image: url('./assets/home-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Hide donors sidebar on narrow screens to preserve space */
@media (max-width: 900px) {
  .left-view { display: none; }
}

@media (max-width: 900px) {
  .right-view { display: none; }
}


/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal-card {
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 4px 0 #1a1c30;
  padding: 16px;
  min-width: 220px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Bounce-in animation when the modal appears */
  animation: modalBounce 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: center;
}
.modal-title { margin: 0; font-size: 20px; color: var(--text); }
.modal-actions { display: flex; gap: 8px; justify-content: center; }

/* Versus Ready Countdown */
.countdown-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.countdown-number {
  font-size: 120px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 0.8),
    0 0 40px rgba(59, 130, 246, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.5);
  animation: countdownPulse 1s ease-in-out;
}
.countdown-text {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
@keyframes countdownPulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.header {
  width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 4rem;
}

.header.small {
  height: 2.5rem;
}

.logo-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-btn {
  padding: 10px 14px;
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

.modal-btn:hover { background: #1f2238; }
.modal-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }

/* Hearts (lives) shown in lose modal */
.hearts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
.heart {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ff5a8a; /* active heart color */
  opacity: 1;
  transition: color 220ms ease, opacity 220ms ease, transform 160ms ease;
}
.heart svg { display: block; }
.heart svg path { fill: currentColor; }
.heart.off {
  color: #3a3f6b;   /* muted gray for off hearts */
  opacity: 0.45;
}
.heart.blink {
  animation: heartExtinguish 640ms ease-in-out both;
}
@keyframes heartExtinguish {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.2); }
  55%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@keyframes modalBounce {
  0%   { transform: scale(0.9); opacity: 0; }
  60%  { transform: scale(1.04); opacity: 1; }
  80%  { transform: scale(0.98); }
  100% { transform: scale(1); }
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
.menu-btn.w-11 { width: 50px; }
.menu-btn.h-11 { height: 44px; }

/* Normalize icon rendering */
.menu-btn.w-11.h-11 svg { display: block; }

/* Profile card header */
.profile-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid #2a2e52;
  background: #1a1c30;
  box-shadow: 0 2px 0 #1a1c30;
  color: var(--text);
  cursor: pointer;
}
.profile-avatar { border-radius: 10px; display:block; position: relative; }
.profile-level-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1c30;
  font-weight: 900;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 2px solid #1a1c30;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1;
  min-width: 20px;
  text-align: center;
}
.profile-meta { display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
.profile-name { font-weight: 800; font-size: 14px; line-height: 1; }
.profile-res { display:flex; gap:6px; }
.res-pill { font-size: 12px; padding: 2px 6px; border-radius: 999px; background:#101226; border:1px solid #2a2e52; }
.res-pill.gold { color:#ffd166; }
.res-pill.essence { color:#a78bfa; }
.res-pill.gem { color:#76e4f7; }
svg, img {
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
  image-rendering: optimizeQuality;
}

.bottom-bar {
  margin-top: auto;
  display: flex;
  gap: 8px;
  background: rgba(13, 14, 28, 0.85);
  border: 1px solid #2a2e52;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.02);
  padding: 6px;
}
.bottom-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #1a1c30;
  color: var(--text);
  border: 1px solid #2a2e52;
  border-radius: 10px;
  box-shadow: 0 2px 0 #101226;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 200ms ease;
  font-weight: 700;
}
.bottom-btn:hover { background: #1f2238; }
.bottom-btn.active {
  flex: 1.6;
  background: linear-gradient(135deg, rgba(111,8,239,0.45) 0%, rgba(111,8,239,0.25) 100%);
  border-color: #6F08EF;
  box-shadow: 0 0 0 1px rgba(111,8,239,0.35) inset, 0 6px 14px rgba(111,8,239,0.25);
}

.setting-item {
  padding: 12px 0;
  border-bottom: 1px solid #2a2e52;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.setting-toggle {
  appearance: none;
  width: 48px;
  height: 24px;
  background: #2a2e52;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
  border: 1px solid #3a3f52;
}

.setting-toggle::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.setting-toggle:checked {
  background: linear-gradient(135deg, #6F08EF, #8b5cf6);
  border-color: #6F08EF;
}

.setting-toggle:checked::after {
  transform: translateX(24px);
}
</style>
