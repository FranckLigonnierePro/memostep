<template>
  <div class="versus-view">
    <div class="header">
      <div class="logo-container">
        <!-- Optional logo area; keep consistent spacing -->
        <h2 style="margin:0">Versus</h2>
      </div>
    </div>

    <div class="body">
      <div v-if="!versusCode">
        <div style="display:flex; gap:6px; justify-content:center; align-items:center; margin-bottom:10px;">
          <input v-model="usernameInput" placeholder="Pseudo" class="input" />
        </div>
        <button class="btn" @click="handleCreateRoom">Créer une partie</button>
        <div style="display:flex; gap:6px; justify-content:center; align-items:center; margin-top:10px;">
          <input v-model="joinInput" placeholder="Code" class="input" style="text-transform:uppercase;" />
          <button class="btn" @click="handleJoinRoom">Rejoindre</button>
        </div>
        <div v-if="versusError" class="error">{{ versusError }}</div>
      </div>

      <div v-else>
        <div style="margin:8px 0;">Code de salle</div>
        <div style="font-size:24px; letter-spacing:3px;">{{ versusCode }}</div>
        <div style="margin:10px 0; font-weight:600;">Joueurs ({{ (versusRoom?.players || []).length || 1 }}/8)</div>
        <ul class="players">
          <li v-for="p in (versusRoom?.players || defaultPlayers)" :key="p.id">{{ p.name || 'Player' }}</li>
        </ul>
        <div v-if="versusIsHost" style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
          <button class="btn" :disabled="((versusRoom?.players || defaultPlayers).length < 2)" @click="handleStartVersus">Démarrer</button>
        </div>
        <div v-if="versusError" class="error">{{ versusError }}</div>
      </div>
    </div>

    <div class="footer">
      <button class="btn" @click="closeLobby">Retour</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { ensurePlayerId } from '../lib/storage.js';
import { initRealtime, createRoom, joinRoom, subscribeRoom, startRoom, getRoom } from '../lib/realtime.js';

const emit = defineEmits(['close', 'begin']);

const usernameInput = ref('');
const joinInput = ref('');
const versusCode = ref('');
const versusIsHost = ref(false);
const versusError = ref('');
const versusRoom = ref(null);
const playerId = ref(null);
let unsub = null;

function defaultPlayersComputed() {
  return [{ id: playerId.value || ensurePlayerId(), name: (usernameInput.value || 'Player') }];
}
const defaultPlayers = computed(defaultPlayersComputed);

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
  width: 320px;
  height: 548px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: .5rem;
}
.header {
  width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 4rem;
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
.players { list-style:none; padding:0; margin:0; display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.players li { padding:6px 10px; border:1px solid #2a2e52; border-radius:8px; }
.error { color:#ff5a8a; font-size:12px; margin-top:6px; }
</style>
