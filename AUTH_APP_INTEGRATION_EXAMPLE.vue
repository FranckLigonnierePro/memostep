<!-- 
  Exemple d'intégration de l'authentification dans App.vue
  
  Copiez les parties pertinentes dans votre App.vue existant
-->

<template>
  <div class="app-frame">
    <!-- Contenu existant de votre app -->
    <div class="content" :style="{ transform: `scale(${rootScale})`}">
      
      <!-- Header avec bouton de connexion/profil -->
      <div v-if="route.name === 'Game'" :class="'header small'">
        <button class="profile-card" @click="handleProfileClick" :aria-label="displayName" :title="displayName">
          <img class="profile-avatar" :src="avatarUrl" alt="avatar" width="36" height="36" />
          <div class="profile-level-badge">{{ playerLevel }}</div>
          <div class="profile-meta">
            <div class="profile-name">{{ displayName }}</div>
            <div class="profile-res">
              <span class="res-pill gold">🪙 {{ playerGold }}</span>
              <span class="res-pill essence">✨ {{ playerEssence }}</span>
              <span class="res-pill gem">💎 {{ playerGems }}</span>
            </div>
          </div>
        </button>
        
        <!-- Bouton "Lier mon compte" si guest -->
        <button v-if="isGuestUser" class="link-account-btn" @click="openAuthModal(true)" title="Lier mon compte">
          🔗
        </button>
      </div>
      
      <!-- Username Modal modifié -->
      <div v-if="route.name === 'Home' && showNameModal" class="username-modal">
        <div class="username-view">
          <h2>Bienvenue sur Memostep !</h2>
          
          <button class="modal-btn primary" @click="continueAsGuest">
            🎮 Jouer maintenant
          </button>
          
          <div class="divider">
            <span>ou</span>
          </div>
          
          <button class="modal-btn secondary" @click="openAuthModal(false)">
            🔐 Se connecter / Créer un compte
          </button>
          
          <p class="hint">
            Créez un compte pour sauvegarder votre progression sur tous vos appareils
          </p>
        </div>
      </div>
      
      <!-- Router View (contenu existant) -->
      <router-view v-slot="{ Component }">
        <component
          :is="Component"
          v-bind="routeProps"
          @start="newGame"
          @solo="() => startMode('solo')"
          @versus="openVersusView"
          @help="openHelp"
          @settings="openSettings"
          @stats="openStats"
          @openLang="openLang"
          @toggleAudio="toggleAudio"
          @openProfile="openProfile"
          @close="handleCloseView"
          @select="handleProfileSelect"
          @begin="handleBeginVersusFromLobby"
          @cellClick="onCellClick"
          @goHome="goHome"
          @newGame="newGame"
        />
      </router-view>
    </div>
    
    <!-- Auth Modal -->
    <AuthModal
      v-if="showAuthModal"
      :isLinking="isLinkingAccount"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
      @continueAsGuest="handleContinueAsGuest"
    />
    
    <!-- Notification de liaison réussie -->
    <div v-if="showLinkSuccessNotification" class="notification success">
      ✅ Compte lié avec succès ! Vos données ont été sauvegardées.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AuthModal from './components/AuthModal.vue';
import { 
  onAuthStateChange, 
  isAuthenticated, 
  isGuest as checkIsGuest,
  getCurrentUser,
  getProfile,
  signOut
} from './lib/auth.js';

// Router
const router = useRouter();
const route = useRoute();

// État d'authentification
const showAuthModal = ref(false);
const isLinkingAccount = ref(false);
const currentUser = ref(null);
const currentProfile = ref(null);
const isGuestUser = ref(true);
const showLinkSuccessNotification = ref(false);

// État existant de votre app
const showNameModal = ref(false);
const playerLevel = ref(1);
const playerGold = ref(0);
const playerEssence = ref(0);
const playerGems = ref(0);
const rootScale = ref(1);

// Computed
const displayName = computed(() => {
  if (currentProfile.value?.display_name) {
    return currentProfile.value.display_name;
  }
  if (currentProfile.value?.username) {
    return currentProfile.value.username;
  }
  // Fallback sur localStorage
  try {
    const saved = localStorage.getItem('memostep_username');
    if (saved) return String(saved).trim();
  } catch {}
  return 'Player';
});

const avatarUrl = computed(() => {
  if (currentProfile.value?.avatar_url) {
    return currentProfile.value.avatar_url;
  }
  // Fallback sur localStorage
  try {
    const saved = localStorage.getItem('selectedAvatar');
    if (saved) {
      const avatar = JSON.parse(saved);
      return avatar.img;
    }
  } catch {}
  return '/assets/profils/mage.png'; // Avatar par défaut
});

// Fonctions d'authentification

/**
 * Ouvre le modal d'authentification
 */
function openAuthModal(linking = false) {
  isLinkingAccount.value = linking;
  showAuthModal.value = true;
}

/**
 * Ferme le modal d'authentification
 */
function closeAuthModal() {
  showAuthModal.value = false;
  isLinkingAccount.value = false;
}

/**
 * Gère le succès de l'authentification
 */
async function handleAuthSuccess() {
  console.log('[App] Auth success');
  closeAuthModal();
  
  // Afficher notification si c'était une liaison
  if (isLinkingAccount.value) {
    showLinkSuccessNotification.value = true;
    setTimeout(() => {
      showLinkSuccessNotification.value = false;
    }, 5000);
  }
  
  // Recharger le profil
  await loadUserProfile();
}

/**
 * Gère le clic sur "Continuer en guest"
 */
function handleContinueAsGuest() {
  closeAuthModal();
  continueAsGuest();
}

/**
 * Continue en mode guest
 */
function continueAsGuest() {
  let username = localStorage.getItem('memostep_username');
  
  if (!username) {
    // Générer un nom de guest
    const n = Math.floor(Math.random() * 10000);
    username = `Memoguest${String(n).padStart(4, '0')}`;
    localStorage.setItem('memostep_username', username);
  }
  
  showNameModal.value = false;
  isGuestUser.value = true;
}

/**
 * Charge le profil utilisateur depuis Supabase
 */
async function loadUserProfile() {
  try {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      const user = await getCurrentUser();
      currentUser.value = user;
      
      // Charger le profil complet
      const profile = await getProfile(user.id);
      currentProfile.value = profile;
      
      // Mettre à jour les stats depuis player_stats
      if (profile.player_stats) {
        playerLevel.value = profile.player_stats.current_level || 1;
        playerGold.value = profile.player_stats.gold || 0;
        playerEssence.value = profile.player_stats.essence || 0;
        playerGems.value = profile.player_stats.gems || 0;
      }
      
      isGuestUser.value = false;
      console.log('[App] Profile loaded:', profile);
    } else {
      // Pas authentifié, charger depuis localStorage
      loadLocalStats();
      isGuestUser.value = checkIsGuest();
    }
  } catch (error) {
    console.error('[App] Error loading profile:', error);
    // Fallback sur localStorage
    loadLocalStats();
    isGuestUser.value = true;
  }
}

/**
 * Charge les stats depuis localStorage (fallback)
 */
function loadLocalStats() {
  try {
    // Charger XP
    const xpData = localStorage.getItem('memostep_player_xp');
    if (xpData) {
      const parsed = JSON.parse(xpData);
      playerLevel.value = calculateLevelFromXP(parsed.totalXp || 0);
    }
    
    // Charger ressources
    const resources = localStorage.getItem('memostep_resources');
    if (resources) {
      const parsed = JSON.parse(resources);
      playerGold.value = parsed.gold || 0;
      playerEssence.value = parsed.essence || 0;
      playerGems.value = parsed.gems || 0;
    }
  } catch (error) {
    console.error('[App] Error loading local stats:', error);
  }
}

/**
 * Calcule le niveau depuis l'XP (simplifié)
 */
function calculateLevelFromXP(totalXp) {
  let level = 1;
  let xpUsed = 0;
  
  for (let i = 1; i <= 50; i++) {
    const xpRequired = 100 + (i - 1) * 50;
    if (totalXp >= xpUsed + xpRequired) {
      xpUsed += xpRequired;
      level = i + 1;
    } else {
      break;
    }
  }
  
  return Math.min(level, 50);
}

/**
 * Gère le clic sur le profil
 */
function handleProfileClick() {
  if (isGuestUser.value) {
    // Proposer de lier le compte
    openAuthModal(true);
  } else {
    // Ouvrir le profil
    openProfile();
  }
}

/**
 * Ouvre la vue profil
 */
function openProfile() {
  router.push('/profile');
}

/**
 * Déconnexion
 */
async function handleSignOut() {
  try {
    await signOut();
    currentUser.value = null;
    currentProfile.value = null;
    isGuestUser.value = true;
    
    // Recharger les stats locales
    loadLocalStats();
    
    console.log('[App] Signed out');
  } catch (error) {
    console.error('[App] Error signing out:', error);
  }
}

/**
 * Vérifie si le modal de nom doit être affiché
 */
function openNameModalIfNeeded() {
  try {
    const username = localStorage.getItem('memostep_username');
    if (!username && route.name === 'Home' && !currentUser.value) {
      showNameModal.value = true;
    }
  } catch {
    if (route.name === 'Home' && !currentUser.value) {
      showNameModal.value = true;
    }
  }
}

// Listener d'événements auth
let authSubscription = null;

onMounted(async () => {
  console.log('[App] Mounted');
  
  // Charger le profil initial
  await loadUserProfile();
  
  // Écouter les changements d'auth
  authSubscription = onAuthStateChange(async (event, session) => {
    console.log('[App] Auth event:', event, session?.user?.id);
    
    if (event === 'SIGNED_IN') {
      await loadUserProfile();
    } else if (event === 'SIGNED_OUT') {
      currentUser.value = null;
      currentProfile.value = null;
      isGuestUser.value = true;
      loadLocalStats();
    }
  });
  
  // Vérifier si le modal de nom doit être affiché
  openNameModalIfNeeded();
});

onBeforeUnmount(() => {
  if (authSubscription) {
    authSubscription.unsubscribe();
  }
});

// Exposer les fonctions pour les autres composants
defineExpose({
  openAuthModal,
  handleSignOut,
  loadUserProfile
});
</script>

<style scoped>
/* Styles pour le bouton de liaison */
.link-account-btn {
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  color: #3b82f6;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.link-account-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.6);
  transform: scale(1.05);
}

/* Notification */
.notification {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  z-index: 10000;
}

.notification.success {
  background: rgba(34, 197, 94, 0.95);
  color: #ffffff;
  border: 2px solid rgba(34, 197, 94, 1);
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Username Modal */
.username-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.username-view {
  background: rgba(26, 28, 48, 0.95);
  border: 2px solid rgba(155, 188, 255, 0.2);
  border-radius: 24px;
  padding: 48px;
  max-width: 480px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.username-view h2 {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

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

.hint {
  color: #6b7280;
  font-size: 14px;
  margin: 8px 0 0 0;
}
</style>
