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
      </div>
      <div v-else class="flex flex-col mt-4 w-full grow justify-center">
        <div style="margin:8px 0;">Code de salle</div>
        <div style="font-size:24px; letter-spacing:3px;">{{ versusCode }}</div>
        <div style="margin:10px 0; font-weight:600;">Joueurs ({{ (versusRoom?.players || defaultPlayers).length }}/8)</div>
        <div class="slots">
          <div v-for="i in 8" :key="i" class="slot">
            <div class="badge">{{ i }}</div>
            <div class="name">
              {{ slotName(i-1) }}
            </div>
          </div>
        </div>
        <div v-if="versusIsHost" style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
          <button class="btn" :disabled="((versusRoom?.players || defaultPlayers).length < 2)" @click="handleStartVersus">Démarrer</button>
        </div>
        <div v-if="versusError" class="error">{{ versusError }}</div>
      </div>
    </div>

    <button class="btn" @click="closeLobby">Retour</button>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { ensurePlayerId } from '../lib/storage.js';
import { initRealtime, createRoom, joinRoom, subscribeRoom, startRoom, getRoom } from '../lib/realtime.js';
import { User } from 'lucide-vue-next';

const emit = defineEmits(['close', 'begin']);

const usernameInput = ref('');
const joinInput = ref('');
const versusCode = ref('');
const versusIsHost = ref(false);
const versusError = ref('');
const versusRoom = ref(null);
const playerId = ref(null);
let unsub = null;

// Persist username locally
const USERNAME_STORAGE_KEY = 'memostep_username';
onMounted(() => {
  try {
    const saved = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (saved) usernameInput.value = saved;
  } catch (_) {}
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

function closeLobby() {
  cleanupSub();
  emit('close');
}

function cleanupSub() {
  if (unsub) {
    try { unsub(); } catch (_) {}
    unsub = null;
  }
}

function subscribeToRoom(code) {
  cleanupSub();
  async function handleRoomUpdate(room) {
    if (!room) return;
    versusRoom.value = room;
    if (room.status === 'playing' && typeof room.seed === 'number' && typeof room.start_at_ms === 'number') {
      // Inform parent (App) to start the versus game, and pass code/room
      emit('begin', { seed: room.seed, startAtMs: room.start_at_ms, code: versusCode.value, room });
      cleanupSub();
    }
  }
  unsub = subscribeRoom(code, async (room) => {
    await handleRoomUpdate(room);
  });
  (async () => {
    try {
      const snapshot = await getRoom(code);
      await handleRoomUpdate(snapshot);
    } catch (_) {}
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
    await joinRoom(code, pid, name);
    versusCode.value = code;
    versusIsHost.value = false;
    subscribeToRoom(code);
  } catch (e) {
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
.slots { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:8px; }
.slot { display:flex; align-items:center; gap:8px; padding:8px; border:1px solid #2a2e52; border-radius:10px; background:#0f1020; min-width:0; }
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
