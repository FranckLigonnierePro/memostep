<template>
  <div class="username-view" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:24px;">
    <button class="modal-btn" style="width:100%; max-width:520px;" @click="$emit('continueAsGuest')">
      Jouer maintenant
    </button>
    <button class="modal-btn" style="width:100%; max-width:520px; background:none; border:1px solid #2a2e52; color:#9bbcff;" @click="showAuth = !showAuth">
      Se connecter / Créer un compte
    </button>
    <div v-if="showAuth" style="display:flex; flex-direction:column; gap:8px; width:100%; max-width:520px;">
      <button class="modal-btn" @click="$emit('openProfile')">Continuer avec Google</button>
      <button class="modal-btn" @click="$emit('openProfile')">Continuer avec Apple</button>
      <button class="modal-btn" @click="$emit('openProfile')">Continuer avec Email</button>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showAuth = ref(false);

defineProps<{
  name: string;
  error?: string;
}>();

defineEmits<{
  (e: 'update:name', value: string): void;
  (e: 'continueAsGuest'): void;
  (e: 'openProfile'): void;
}>();
</script>
