<template>
  <div class="leaderboard">
    <div class="title">Solo</div>
    <div class="list" v-if="soloEffectiveRanking.length">
      <div
        v-for="(p, idx) in soloEffectiveRanking"
        :key="p.id || idx"
        class="row"
      >
        <div class="pos">{{ idx + 1 }}.</div>
        <div class="dot" :style="{ background: p.color || '#ffffff' }"></div>
        <div class="name" :title="p.name">{{ p.name }}</div>
        <div class="score">{{ p.score }}</div>
      </div>
    </div>

    <div class="title" style="margin-top:10px;">Multijoueur</div>
    <div class="list" v-if="versusEffectiveRanking.length">
      <div
        v-for="(p, idx) in versusEffectiveRanking"
        :key="p.id || idx"
        class="row"
      >
        <div class="pos">{{ idx + 1 }}.</div>
        <div class="dot" :style="{ background: p.color || '#ffffff' }"></div>
        <div class="name" :title="p.name">{{ p.name }}</div>
        <div class="score">{{ p.score }}/5</div>
      </div>
    </div>
  </div>
  </template>

<script setup>
import { defineProps, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { initRealtime } from '../lib/realtime_v2.js';

const props = defineProps({
  ranking: { type: Array, default: () => [] },
  roomCode: { type: String, default: '' },
  soloRanking: { type: Array, default: () => [] },
});

const supa = ref(null);
const sub = ref(null);
const subSolo = ref(null);
const livePlayers = ref([]);
const liveSolo = ref([]);

const versusEffectiveRanking = computed(() => {
  if (props.roomCode && livePlayers.value.length) return livePlayers.value;
  return props.ranking || [];
});
const soloEffectiveRanking = computed(() => {
  if (liveSolo.value.length) return liveSolo.value;
  return props.soloRanking || [];
});

async function fetchPlayers(code) {
  if (!code) { livePlayers.value = []; return; }
  try {
    if (!supa.value) supa.value = initRealtime();
    const { data, error } = await supa.value
      .from('players')
      .select('*')
      .eq('room_code', code)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    livePlayers.value = (data || []).map(p => ({
      id: p.player_id,
      name: p.name || 'Player',
      color: p.color || '#ffffff',
      score: Number(p.score || 0),
    }));
  } catch (_) {
    // ignore errors for UI; fallback to prop ranking
  }
}

function subscribePlayers(code) {
  if (!code) return;
  if (!supa.value) supa.value = initRealtime();
  // Cleanup previous
  if (sub.value) { try { supa.value.removeChannel(sub.value); } catch(_){} sub.value = null; }
  const ch = supa.value
    .channel(`lb:${code}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'players',
      filter: `room_code=eq.${code}`,
    }, async () => {
      await fetchPlayers(code);
    })
    .subscribe();
  sub.value = ch;
}

async function fetchSolo() {
  try {
    if (!supa.value) supa.value = initRealtime();
    const { data, error } = await supa.value
      .from('solo_scores')
      .select('*')
      .limit(200);
    if (error) throw error;
    const rows = Array.isArray(data) ? data.slice() : [];
    // Sort client-side to avoid errors if some columns are missing
    rows.sort((a, b) => {
      const blA = Number(a?.best_level ?? 0);
      const blB = Number(b?.best_level ?? 0);
      if (blA !== blB) return blB - blA;
      const tlA = Number(a?.total_levels ?? 0);
      const tlB = Number(b?.total_levels ?? 0);
      return tlB - tlA;
    });
    liveSolo.value = rows.slice(0, 50).map(r => ({
      id: r.player_id,
      name: r.name || 'Player',
      color: r.color || '#ffffff',
      score: Number(r.best_level || 0),
    }));
  } catch (e) { try { console.error('[Leaderboard] solo_scores fetch error:', e); } catch(_){} }
}

function subscribeSolo() {
  if (!supa.value) supa.value = initRealtime();
  if (subSolo.value) { try { supa.value.removeChannel(subSolo.value); } catch(_){} subSolo.value = null; }
  const ch = supa.value
    .channel('lb:solo')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'solo_scores',
    }, async () => { await fetchSolo(); })
    .subscribe();
  subSolo.value = ch;
}

onMounted(async () => {
  if (props.roomCode) {
    await fetchPlayers(props.roomCode);
    subscribePlayers(props.roomCode);
  }
  await fetchSolo();
  subscribeSolo();
});

onBeforeUnmount(() => {
  if (supa.value && sub.value) {
    try { supa.value.removeChannel(sub.value); } catch(_){}
    sub.value = null;
  }
  if (supa.value && subSolo.value) {
    try { supa.value.removeChannel(subSolo.value); } catch(_){}
    subSolo.value = null;
  }
});

watch(() => props.roomCode, async (code, prev) => {
  if (code === prev) return;
  if (!code) {
    if (supa.value && sub.value) { try { supa.value.removeChannel(sub.value); } catch(_){} sub.value = null; }
    livePlayers.value = [];
    return;
  }
  await fetchPlayers(code);
  subscribePlayers(code);
});
</script>

<style scoped>
.leaderboard { 
  width: 100%; 
  padding: 12px; 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}
.title { 
  font-weight: 700; 
  font-size: 18px; 
  margin-bottom: 4px; 
}
.list { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
}
.row { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 6px 8px; 
  background: #1a1c30; 
  border-radius: 8px; 
  border: 1px solid #2a2e52; 
}
.pos { 
  font-weight: 700; 
  font-size: 16px; 
  min-width: 24px; 
}
.dot { 
  width: 20px; 
  height: 20px; 
  border-radius: 999px; 
  border: 2px solid rgba(0,0,0,0.2); 
}
.name { 
  flex: 1; 
  font-weight: 600; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
}
.score { 
  font-size: 14px; 
  color: #12b886; 
}
</style>
