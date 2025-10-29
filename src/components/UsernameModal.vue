<template>
  <div class="username-view" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:24px;">
    <h2 style="color:#ffffff; font-size:24px; font-weight:700; margin:0 0 8px 0;">Bienvenue sur Memostep !</h2>
    
    <button class="modal-btn primary" style="width:100%; max-width:520px;" @click="$emit('continueAsGuest')">
      🎮 Jouer maintenant
    </button>
    
    <div style="display:flex; align-items:center; gap:16px; margin:8px 0; color:#6b7280; font-size:14px; width:100%; max-width:520px;">
      <div style="flex:1; height:1px; background:rgba(155,188,255,0.2);"></div>
      <span>ou</span>
      <div style="flex:1; height:1px; background:rgba(155,188,255,0.2);"></div>
    </div>
    
    <button class="modal-btn secondary" style="width:100%; max-width:520px;" @click="$emit('openProfile')">
      🔐 Se connecter / Créer un compte
    </button>
    
    <p style="color:#6b7280; font-size:14px; margin:8px 0 0 0; text-align:center;">
      Créez un compte pour sauvegarder votre progression sur tous vos appareils
    </p>
  </div>
</template>

<script setup lang="ts">
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

<style scoped>
.modal-btn {
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
}

.modal-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.modal-btn.secondary {
  background: rgba(59, 130, 246, 0.1);
  color: #9bbcff;
  border-color: rgba(59, 130, 246, 0.3);
}

.modal-btn.secondary:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}
</style>
