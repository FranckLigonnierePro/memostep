<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="account-modal">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">Mon Compte</h2>
            <button class="close-btn" @click="$emit('close')" aria-label="Fermer">✕</button>
          </div>

          <!-- Content -->
          <div class="modal-content">
            <!-- Account Type -->
            <div class="account-type">
              <span class="account-icon">{{ isGuest ? '👤' : '🔗' }}</span>
              <span class="account-label">{{ isGuest ? 'Compte Invité' : 'Compte Lié' }}</span>
            </div>

            <!-- Username Section -->
            <div class="section">
              <div class="section-header">
                <h3 class="section-title">Nom d'utilisateur</h3>
                <span v-if="!hasRenamedOnce" class="free-badge">1 changement gratuit</span>
                <span v-else class="paid-badge">💎 100 gemmes</span>
              </div>

              <div class="username-display">
                <span class="current-username">{{ displayName }}</span>
                <button 
                  class="edit-btn" 
                  @click="startEditing"
                  :disabled="isEditing"
                >
                  ✏️
                </button>
              </div>

              <div v-if="isEditing" class="edit-section">
                <input
                  v-model="newUsername"
                  type="text"
                  class="username-input"
                  placeholder="Nouveau nom d'utilisateur"
                  maxlength="20"
                  @keydown.enter="saveUsername"
                  @keydown.esc="cancelEditing"
                  ref="usernameInput"
                />
                <div class="edit-actions">
                  <button class="btn-cancel" @click="cancelEditing">Annuler</button>
                  <button 
                    class="btn-save" 
                    @click="saveUsername"
                    :disabled="!isUsernameValid"
                  >
                    {{ hasRenamedOnce ? 'Payer 💎 100' : 'Sauvegarder' }}
                  </button>
                </div>
                <div v-if="usernameError" class="error-message">{{ usernameError }}</div>
                <div v-if="!hasRenamedOnce" class="info-message">
                  ℹ️ Premier changement gratuit
                </div>
                <div v-else class="warning-message">
                  ⚠️ Les changements suivants coûtent 100 gemmes
                </div>
              </div>
            </div>

            <!-- Link Account Section (only for guests) -->
            <div v-if="isGuest" class="section link-section">
              <div class="section-header">
                <h3 class="section-title">Sécuriser mon compte</h3>
              </div>
              <p class="link-description">
                Liez votre compte pour sauvegarder votre progression et y accéder depuis n'importe quel appareil.
              </p>
              <button class="btn-link-account" @click="$emit('linkAccount')">
                <span class="link-icon">🔗</span>
                <span>Lier mon compte</span>
              </button>
            </div>

            <!-- Account Info -->
            <div class="section">
              <div class="section-header">
                <h3 class="section-title">Informations</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Niveau</span>
                  <span class="info-value">{{ playerLevel }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Or</span>
                  <span class="info-value">💰 {{ playerGold }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Gemmes</span>
                  <span class="info-value">💎 {{ playerGems }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Essence</span>
                  <span class="info-value">✨ {{ playerEssence }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn-close" @click="$emit('close')">Fermer</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  displayName: { type: String, default: 'Player' },
  isGuest: { type: Boolean, default: true },
  hasRenamedOnce: { type: Boolean, default: false },
  playerLevel: { type: Number, default: 1 },
  playerGold: { type: Number, default: 0 },
  playerGems: { type: Number, default: 0 },
  playerEssence: { type: Number, default: 0 },
});

const emit = defineEmits(['close', 'rename', 'linkAccount']);

const isEditing = ref(false);
const newUsername = ref('');
const usernameError = ref('');
const usernameInput = ref(null);

const isUsernameValid = computed(() => {
  const trimmed = newUsername.value.trim();
  return trimmed.length >= 3 && trimmed.length <= 20;
});

function startEditing() {
  isEditing.value = true;
  newUsername.value = props.displayName;
  usernameError.value = '';
  
  nextTick(() => {
    usernameInput.value?.focus();
  });
}

function cancelEditing() {
  isEditing.value = false;
  newUsername.value = '';
  usernameError.value = '';
}

function saveUsername() {
  const trimmed = newUsername.value.trim();
  
  if (!isUsernameValid.value) {
    usernameError.value = 'Le nom doit contenir entre 3 et 20 caractères';
    return;
  }
  
  if (trimmed === props.displayName) {
    usernameError.value = 'Le nouveau nom est identique à l\'ancien';
    return;
  }
  
  // Check if user has enough gems for paid rename
  if (props.hasRenamedOnce && props.playerGems < 100) {
    usernameError.value = 'Vous n\'avez pas assez de gemmes (100 requis)';
    return;
  }
  
  emit('rename', trimmed);
  cancelEditing();
}

// Reset editing state when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    cancelEditing();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.account-modal {
  background: linear-gradient(180deg, #1f2238 0%, #17192c 100%);
  border: 2px solid #fbbf24;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2);
  animation: modal-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* Content */
.modal-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Account Type */
.account-type {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.account-icon {
  font-size: 32px;
  line-height: 1;
}

.account-label {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

/* Sections */
.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.free-badge {
  font-size: 12px;
  font-weight: 600;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.paid-badge {
  font-size: 12px;
  font-weight: 600;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.4);
}

/* Username Display */
.username-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.current-username {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.edit-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn:hover:not(:disabled) {
  background: rgba(251, 191, 36, 0.3);
  transform: scale(1.1);
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Edit Section */
.edit-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.username-input {
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.username-input:focus {
  outline: none;
  border-color: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-save {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
  border: 2px solid #fbbf24;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Messages */
.error-message,
.info-message,
.warning-message {
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 6px;
}

.error-message {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.info-message {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.warning-message {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
}

/* Link Account Section */
.link-section {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  padding: 16px;
  border-radius: 12px;
  border: 2px solid rgba(139, 92, 246, 0.3);
}

.link-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 12px;
}

.btn-link-account {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border: 2px solid #8b5cf6;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-link-account:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.6);
}

.link-icon {
  font-size: 20px;
  line-height: 1;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

/* Footer */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.btn-close {
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* Modal Fade Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
.account-modal::-webkit-scrollbar {
  width: 8px;
}

.account-modal::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.account-modal::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #fbbf24, #f59e0b);
  border-radius: 4px;
}
</style>
