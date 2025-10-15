<template>
  <div class="versus-view">
    <div v-if="!versusCode" class="flex flex-col mt-4 w-full grow justify-center">
      <div class="input-with-btn" style="height:46px;">
        <button type="button" class="icon-input-btn" aria-label="Pseudo">
          <User :size="18" aria-hidden="true" />
        </button>
        <input v-model="usernameInput" placeholder="Pseudo" class="input" style="height: 46px; width: 100%;"/> 
      </div>
      <button class="btn" @click="handleCreateRoom">Créer une partie</button>
        <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
          <input v-model="joinInput" placeholder="Code" class="input" style="text-transform:uppercase; margin-top: 12px; height: 46px;" />
          <button class="btn" @click="handleJoinRoom">Rejoindre</button>
        </div>
        <div v-if="versusError" class="error">{{ versusError }}</div>
      <button class="btn" @click="closeLobby">Retour</button>
      </div>
      <div v-else class="flex flex-col mt-4 w-full grow justify-center">
        <div style="display:flex; gap:8px; align-items:center; justify-content:center;">
          <button class="btn" @click="copyJoinLink">{{ copied ? 'Code copié' : 'Copier le code d\'invitation' }}</button>
        </div>
        <div style="margin:10px 0; font-weight:600;">Joueurs ({{ (versusRoom?.players || defaultPlayers).length }}/8)</div>
        <div class="slots">
          <div v-for="i in 8" :key="i" class="slot">
            <div class="badge" :style="{ background: slotColor(i-1), borderColor: slotColor(i-1) }">{{ i }}</div>
            <div class="name">
              {{ slotName(i-1) }}
            </div>
            <Crown v-if="isHostSlot(i-1)" class="slot-crown" :size="16" aria-label="Hôte" />
          </div>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
          <button class="btn" @click="closeLobby">Retour</button>
          <button v-if="versusIsHost" class="btn" :disabled="((versusRoom?.players || defaultPlayers).length < 2)" @click="handleStartVersus">Démarrer</button>
        </div>
        <div v-if="versusError" class="error">{{ versusError }}</div>
      </div>
    </div>
    <!-- Hidden audio element for waiting room music -->
    <audio ref="waitingAudioRef" :src="waitingRoomUrl" preload="auto" loop style="display:none"></audio>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { ensurePlayerId } from '../lib/storage.js';
import { initRealtime, createRoom, joinRoom, subscribeRoom, startRoom, getRoom, leaveRoom } from '../lib/realtime_v2.js';
import { User, Crown } from 'lucide-vue-next';
import waitingRoomUrl from '../assets/waitingRoom.mp3';

const emit = defineEmits(['close', 'begin']);

const props = defineProps({
  code: { type: String, default: '' },
  pauseMainMusic: { type: Function, default: null },
  resumeMainMusic: { type: Function, default: null },
});

const usernameInput = ref('');
const joinInput = ref('');
const versusCode = ref('');
const versusIsHost = ref(false);
const versusError = ref('');
const versusRoom = ref(null);
const playerId = ref(null);
let unsub = null;

// Waiting room audio
const waitingAudioRef = ref(null);

function playWaitingMusic() {
  // Pause main music first
  if (props.pauseMainMusic) {
    try { props.pauseMainMusic(); } catch (_) {}
  }
  const el = waitingAudioRef.value;
  if (!el) return;
  try {
    el.volume = 0.5; // Volume à 50%
    el.play().catch(() => {
      // Autoplay might be blocked
    });
  } catch (_) {}
}

function stopWaitingMusic() {
  const el = waitingAudioRef.value;
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch (_) {}
  // Resume main music
  if (props.resumeMainMusic) {
    try { props.resumeMainMusic(); } catch (_) {}
  }
}

// Persist username locally
const USERNAME_STORAGE_KEY = 'memostep_username';
onMounted(() => {
  try {
    const saved = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (saved) usernameInput.value = saved;
  } catch (_) {}
  // Ensure we have a stable player id
  if (!playerId.value) {
    try { playerId.value = ensurePlayerId(); } catch (_) {}
  }
  // If a code is provided by parent (App.vue), preload and subscribe
  const initial = (props.code || '').trim();
  if (initial) {
    versusCode.value = initial;
    subscribeToRoom(initial);
  }
  // Start waiting room music
  playWaitingMusic();
});
watch(() => usernameInput.value, (v) => {
  try { localStorage.setItem(USERNAME_STORAGE_KEY, String(v || '')); } catch (_) {}
});

function defaultPlayersComputed() {
  return [{ id: playerId.value || ensurePlayerId(), name: (usernameInput.value || 'Player') }];
}
const defaultPlayers = computed(defaultPlayersComputed);

const slots = computed(() => {
  const list = (versusRoom.value && Array.isArray(versusRoom.value.players)) ? versusRoom.value.players : defaultPlayers.value;
  const arr = new Array(8).fill(null);
  for (let i = 0; i < Math.min(8, list.length); i++) arr[i] = list[i];
  return arr;
});

function slotName(idx) {
  const s = slots.value[idx];
  if (!s) return 'Libre';
  return s.name || 'Player';
}

function slotColor(idx) {
  const s = slots.value[idx];
  return (s && s.color) ? String(s.color) : '#1a1c30';
}

function isHostSlot(idx) {
  const s = slots.value[idx];
  return !!(s && versusRoom.value && s.id === versusRoom.value.host_id);
}

async function closeLobby() {
  // Leave the room before closing
  console.log('[VersusView] closeLobby called, versusCode:', versusCode.value);
  if (versusCode.value) {
    try {
      const me = playerId.value || ensurePlayerId();
      console.log('[VersusView] Calling leaveRoom with code:', versusCode.value, 'playerId:', me);
      await leaveRoom(versusCode.value, me);
      console.log('[VersusView] leaveRoom completed successfully');
    } catch (err) {
      console.error('[VersusView] Error leaving room:', err);
    }
  } else {
    console.warn('[VersusView] No versusCode, cannot leave room');
  }
  cleanupSub();
  stopWaitingMusic();
  emit('close');
}

function cleanupSub() {
  if (unsub) {
    try { unsub(); } catch (_) {}
    unsub = null;
  }
}

// Join link and copy handler
const copied = ref(false);
const shareLink = computed(() => {
  const origin = window.location.origin;
  const path = window.location.pathname || '/';
  const code = (versusCode.value || '').trim();
  return `${origin}${path}?join=${encodeURIComponent(code)}`;
});
async function copyJoinLink() {
  try {
    const code = (versusCode.value || '').trim();
    await navigator.clipboard.writeText(code);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch (e) {
    versusError.value = 'Impossible de copier le code';
  }
}

function subscribeToRoom(code) {
  cleanupSub();
  async function handleRoomUpdate(room) {
    if (!room) return;
    versusRoom.value = room;
    // Update host flag based on room host_id
    try {
      const me = playerId.value || ensurePlayerId();
      versusIsHost.value = !!(room && room.host_id && room.host_id === me);
    } catch (_) { versusIsHost.value = false; }
    if (room.status === 'playing' && typeof room.seed === 'number' && typeof room.start_at_ms === 'number') {
      // Stop waiting room music when game starts
      stopWaitingMusic();
      // Inform parent (App) to start the versus game, and pass code/room
      emit('begin', { seed: room.seed, startAtMs: room.start_at_ms, code: versusCode.value, room });
      // Do NOT cleanup here; let App.vue keep the subscription alive during gameplay
    }
  }
  // Charger d'abord la room pour initialiser le cache, PUIS s'abonner
  (async () => {
    try {
      console.log('[VersusView] Chargement initial de la room:', code);
      const snapshot = await getRoom(code);
      console.log('[VersusView] Room chargée, initialisation du cache:', snapshot?.players?.length, 'joueurs');
      await handleRoomUpdate(snapshot);
      // Maintenant que le cache est initialisé, on peut s'abonner
      console.log('[VersusView] Création de la subscription...');
      unsub = subscribeRoom(code, async (room) => {
        await handleRoomUpdate(room);
      });
    } catch (err) {
      console.error('[VersusView] Erreur lors du chargement de la room:', err);
      // En cas d'erreur, on s'abonne quand même
      unsub = subscribeRoom(code, async (room) => {
        await handleRoomUpdate(room);
      });
    }
  })();
}

async function handleCreateRoom() {
  versusError.value = '';
  if (!playerId.value) { try { playerId.value = ensurePlayerId(); } catch (_) {} }
  const name = (usernameInput.value || '').trim();
  if (!name) { versusError.value = 'Pseudo requis'; return; }
  try {
    initRealtime();
  } catch (e) { versusError.value = 'Supabase non configuré'; return; }
  try {
    const pid = playerId.value || ensurePlayerId();
    const code = await createRoom(pid, name);
    versusCode.value = code;
    versusIsHost.value = true;
    subscribeToRoom(code);
  } catch (e) {
    versusError.value = String((e && e.message) || e);
  }
}

async function handleJoinRoom() {
  versusError.value = '';
  if (!playerId.value) { try { playerId.value = ensurePlayerId(); } catch (_) {} }
  const code = (joinInput.value || '').trim().toUpperCase();
  const name = (usernameInput.value || '').trim();
  if (!name) { versusError.value = 'Pseudo requis'; return; }
  if (!code) { versusError.value = 'Code requis'; return; }
  try {
    initRealtime();
  } catch (e) { versusError.value = 'Supabase non configuré'; return; }
  try {
    const pid = playerId.value || ensurePlayerId();
    console.log('[VersusView] Tentative de rejoindre la room:', code);
    const room = await joinRoom(code, pid, name);
    console.log('[VersusView] Join réussi, room reçue avec', room?.players?.length, 'joueurs');
    versusCode.value = code;
    versusIsHost.value = false;
    // Mettre à jour immédiatement versusRoom avec la room retournée
    if (room) {
      versusRoom.value = room;
      console.log('[VersusView] versusRoom mis à jour:', versusRoom.value.players?.length, 'joueurs');
    }
    subscribeToRoom(code);
  } catch (e) {
    console.error('[VersusView] Erreur lors du join:', e);
    versusError.value = String((e && e.message) || e);
  }
}

async function handleStartVersus() {
  try {
    const room = versusRoom.value;
    const playersCount = (room && Array.isArray(room.players)) ? room.players.length : (defaultPlayers.value.length);
    if (!versusIsHost.value) { versusError.value = "Seul l'hôte peut démarrer"; return; }
    if (!versusCode.value) { versusError.value = 'Salle inconnue'; return; }
    if (playersCount < 2) { versusError.value = 'Au moins 2 joueurs requis'; return; }
    const seed = Math.floor(Math.random() * 1e9);
    const startAt = Date.now() + 1500;
    await startRoom(versusCode.value, seed, startAt);
  } catch (e) {
    versusError.value = String((e && e.message) || e);
  }
}

onBeforeUnmount(() => {
  cleanupSub();
  stopWaitingMusic();
});
</script>

<style scoped>
.versus-view {
  margin-bottom: .5rem;
  justify-content: space-between;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
}

.body { flex: 1; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; }
.footer { display:flex; justify-content:center; }
.input {
  padding:8px; border-radius:8px; border:1px solid #2a2e52; background:#0f1020; color:#fff;
}
.btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #2a2e52;
  margin-top: .75rem;
  background: #1a1c30;
  color: #fff;
  box-shadow: 0 2px 0 #1a1c30;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.slots { display:flex; flex-direction: column; flex-wrap:wrap; gap:4px; }
.slot { display:flex; align-items:center; gap:8px; padding:4px; border:1px solid #2a2e52; border-radius:10px; background:#0f1020; min-width:0; }
.slot .badge { width:22px; height:22px; border-radius:999px; background:#1a1c30; border:1px solid #2a2e52; display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; }
.slot .name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#fff; font-weight:700; }
.error { color:#ff5a8a; font-size:12px; margin-top:6px; }
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

/* Input with external icon button */
.input-with-btn { display:flex; align-items:center; gap:8px; }
.icon-input-btn {
  width: 46px; height: 46px;
  min-width: 46px;
  display:flex; align-items:center; justify-content:center;
  border-radius: 10px;
  border: 1px solid #2a2e52;
  background: #1a1c30;
  color: var(--text);
  pointer-events: none;
  cursor: pointer;
}
.icon-input-btn:hover { background: #1f2238; }
.icon-input-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }
.icon-person { width:18px; height:18px; color: var(--text); opacity:.9; }
</style>
