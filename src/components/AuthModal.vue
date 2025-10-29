<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card auth-modal">
      <button class="close-btn" @click="$emit('close')" aria-label="Fermer">×</button>
      
      <h2 class="modal-title">{{ isLinking ? 'Lier mon compte' : 'Connexion' }}</h2>
      
      <!-- Message de liaison de compte guest -->
      <div v-if="isLinking && guestUsername" class="guest-info">
        <p>🎮 Vous jouez actuellement en tant que <strong>{{ guestUsername }}</strong></p>
        <p>Liez votre compte pour sauvegarder votre progression sur tous vos appareils !</p>
      </div>
      
      <!-- Erreur -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- Loading -->
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Connexion en cours...</p>
      </div>
      
      <!-- Méthodes de connexion -->
      <div v-else class="auth-methods">
        <!-- Google -->
        <button class="auth-btn google-btn" @click="handleGoogleAuth">
          <img src="../assets/google-icon.svg" alt="Google" width="20" height="20" v-if="false" />
          <span class="auth-icon">🔍</span>
          <span>{{ isLinking ? 'Lier avec Google' : 'Continuer avec Google' }}</span>
        </button>
        
        <!-- Apple -->
        <button class="auth-btn apple-btn" @click="handleAppleAuth">
          <span class="auth-icon">🍎</span>
          <span>{{ isLinking ? 'Lier avec Apple' : 'Continuer avec Apple' }}</span>
        </button>
        
        <!-- Email -->
        <div class="divider">
          <span>ou</span>
        </div>
        
        <div v-if="!showEmailForm" class="email-toggle">
          <button class="auth-btn email-btn" @click="showEmailForm = true">
            <span class="auth-icon">📧</span>
            <span>{{ isLinking ? 'Lier avec Email' : 'Continuer avec Email' }}</span>
          </button>
        </div>
        
        <!-- Formulaire Email -->
        <div v-else class="email-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="votre@email.com"
              @keyup.enter="handleEmailAuth"
              :disabled="loading"
            />
          </div>
          
          <!-- Mode Magic Link (par défaut) -->
          <div v-if="emailMode === 'magic'">
            <button class="modal-btn" @click="handleEmailAuth" :disabled="!isEmailValid || loading">
              Envoyer le lien magique
            </button>
            <p class="email-hint">Un lien de connexion sera envoyé à votre email</p>
            <button class="text-btn" @click="emailMode = 'password'">
              Utiliser un mot de passe
            </button>
          </div>
          
          <!-- Mode Mot de passe -->
          <div v-else>
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                @keyup.enter="handlePasswordAuth"
                :disabled="loading"
              />
            </div>
            
            <button class="modal-btn" @click="handlePasswordAuth" :disabled="!isEmailValid || !password || loading">
              {{ isSignUp ? 'Créer un compte' : 'Se connecter' }}
            </button>
            
            <div class="auth-toggle">
              <button class="text-btn" @click="isSignUp = !isSignUp">
                {{ isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire' }}
              </button>
              <button class="text-btn" @click="emailMode = 'magic'">
                Utiliser un lien magique
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Message de succès pour Magic Link -->
      <div v-if="magicLinkSent" class="success-message">
        ✅ Un lien de connexion a été envoyé à {{ email }}. Vérifiez votre boîte mail !
      </div>
      
      <!-- Retour au mode guest -->
      <div v-if="!isLinking" class="guest-option">
        <button class="text-btn" @click="$emit('continueAsGuest')">
          Continuer sans compte
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  signInWithGoogle, 
  signInWithApple, 
  signInWithEmail,
  signInWithPassword,
  signUpWithPassword,
  linkGuestAccount,
  getGuestData
} from '../lib/auth.js';

const props = defineProps({
  isLinking: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'success', 'continueAsGuest']);

// État
const loading = ref(false);
const error = ref('');
const showEmailForm = ref(false);
const emailMode = ref('magic'); // 'magic' ou 'password'
const isSignUp = ref(false);
const magicLinkSent = ref(false);

// Formulaire
const email = ref('');
const password = ref('');

// Données du guest
const guestData = getGuestData();
const guestUsername = computed(() => guestData?.username || null);

// Validation
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

// Handlers
async function handleGoogleAuth() {
  loading.value = true;
  error.value = '';
  
  try {
    if (props.isLinking) {
      await linkGuestAccount('google');
      // Le redirect va gérer la suite
    } else {
      await signInWithGoogle();
      // Le redirect va gérer la suite
    }
  } catch (err) {
    error.value = err.message || 'Erreur lors de la connexion avec Google';
    loading.value = false;
  }
}

async function handleAppleAuth() {
  loading.value = true;
  error.value = '';
  
  try {
    if (props.isLinking) {
      await linkGuestAccount('apple');
      // Le redirect va gérer la suite
    } else {
      await signInWithApple();
      // Le redirect va gérer la suite
    }
  } catch (err) {
    error.value = err.message || 'Erreur lors de la connexion avec Apple';
    loading.value = false;
  }
}

async function handleEmailAuth() {
  if (!isEmailValid.value) {
    error.value = 'Email invalide';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    await signInWithEmail(email.value);
    magicLinkSent.value = true;
    loading.value = false;
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'envoi du lien magique';
    loading.value = false;
  }
}

async function handlePasswordAuth() {
  if (!isEmailValid.value || !password.value) {
    error.value = 'Email et mot de passe requis';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    if (isSignUp.value) {
      // Inscription
      const username = email.value.split('@')[0];
      await signUpWithPassword(email.value, password.value, username);
      emit('success');
      emit('close');
    } else {
      // Connexion
      await signInWithPassword(email.value, password.value);
      emit('success');
      emit('close');
    }
  } catch (err) {
    error.value = err.message || (isSignUp.value ? 'Erreur lors de l\'inscription' : 'Erreur lors de la connexion');
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-modal {
  max-width: 480px;
  width: 90%;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 32px;
  color: #9bbcff;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ffffff;
}

.guest-info {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
}

.guest-info p {
  margin: 4px 0;
  color: #9bbcff;
  font-size: 14px;
}

.guest-info strong {
  color: #ffffff;
  font-weight: 600;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  color: #fca5a5;
  font-size: 14px;
  text-align: center;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  color: #86efac;
  font-size: 14px;
  text-align: center;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(155, 188, 255, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.google-btn {
  background: #ffffff;
  color: #1f2937;
  border-color: #e5e7eb;
}

.google-btn:hover {
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.apple-btn {
  background: #000000;
  color: #ffffff;
  border-color: #1f2937;
}

.apple-btn:hover {
  background: #1f2937;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.email-btn {
  background: rgba(59, 130, 246, 0.1);
  color: #9bbcff;
  border-color: rgba(59, 130, 246, 0.3);
}

.email-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

.auth-icon {
  font-size: 20px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(155, 188, 255, 0.2);
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #9bbcff;
  font-size: 14px;
  font-weight: 600;
}

.form-group input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid rgba(155, 188, 255, 0.2);
  background: rgba(26, 28, 48, 0.8);
  color: #ffffff;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.email-hint {
  color: #6b7280;
  font-size: 13px;
  text-align: center;
  margin: -8px 0 0 0;
}

.auth-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.text-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.text-btn:hover {
  color: #60a5fa;
  text-decoration: underline;
}

.guest-option {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(155, 188, 255, 0.2);
  text-align: center;
}
</style>
