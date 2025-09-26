<template>
  <div class="home">
      <div class="flex flex-col mt-4 w-full grow justify-center">
        <button class="menu-btn" @click="emit('daily')">Parcour du jour</button>
        <button class="menu-btn" @click="emit('solo')">Mode solo</button>
        <button class="menu-btn" @click="emit('versus')">Mode versus</button>
        <button class="menu-btn" @click="emit('battle')">Mode battle royale</button>
        <div class="w-full h-12 mt-6 flex justify-start relative">
          <button class="menu-btn mr-2 w-12" @click="emit('daily')">C</button>
          <button class="menu-btn mr-2 w-12" @click="emit('solo')">T</button>
          <button class="menu-btn mr-2 w-12" @click="emit('versus')">R</button>
        </div>
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
</style>
