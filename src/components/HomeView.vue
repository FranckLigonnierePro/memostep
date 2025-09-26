<template>
  <div class="home">
      <div class="menu">
        <button class="menu-btn" @click="emit('daily')">Parcour du jour</button>
        <button class="menu-btn" @click="emit('solo')">Mode solo</button>
        <button class="menu-btn" @click="emit('versus')">Mode versus</button>
        <button class="menu-btn" @click="emit('battle')">Mode battle royale</button>
      </div>
  </div>
</template>

<script setup>
const props = defineProps({
  logoSrc: { type: String, default: '' },
});
const emit = defineEmits(['start', 'daily', 'solo', 'versus', 'battle']);
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

.home-card {
  background: var(--panel);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  box-shadow: 0 2px 0 #1a1c30;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.home-logo { width: 72px; height: 72px; border-radius: 16px; }
.home-title { margin: 0; font-size: 24px; letter-spacing: .4px; color: var(--text); }

.start-btn {
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid #2a2e52;
  background: var(--panel);
  color: var(--text);
  box-shadow: 0 2px 0 #1a1c30;
  font-weight: 700;
  cursor: pointer;
}

.start-btn:hover { background: #1f2238; }
.start-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }

.menu {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.menu-btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #2a2e52;
  background: #1a1c30;
  color: var(--text);
  box-shadow: 0 2px 0 #1a1c30;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.menu-btn:hover { background: #1f2238; }
.menu-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }
</style>
