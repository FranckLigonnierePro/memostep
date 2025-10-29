<template>
  <div class="callback-container">
    <div class="callback-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <h2>Connexion en cours...</h2>
        <p>{{ statusMessage }}</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>Erreur de connexion</h2>
        <p>{{ error }}</p>
        <button class="modal-btn" @click="goHome">Retour à l'accueil</button>
      </div>
      
      <div v-else class="success-state">
        <div class="success-icon">✅</div>
        <h2>Connexion réussie !</h2>
        <p v-if="migratedData">Vos données ont été sauvegardées.</p>
        <p>Redirection en cours...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  getSession, 
  getCurrentUser, 
  completeLinkGuestAccount,
  createOrUpdateProfile 
} from '../lib/auth.js';

const router = useRouter();

const loading = ref(true);
const error = ref('');
const statusMessage = ref('Vérification de la session...');
const migratedData = ref(false);

onMounted(async () => {
  try {
    // 1. Vérifier la session
    statusMessage.value = 'Vérification de la session...';
    const session = await getSession();
    
    if (!session) {
      throw new Error('Aucune session trouvée');
    }
    
    // 2. Récupérer l'utilisateur
    statusMessage.value = 'Récupération du profil...';
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // 3. Vérifier si c'est une liaison de compte guest
    const hasPendingMigration = sessionStorage.getItem('memostep_guest_migration');
    
    if (hasPendingMigration) {
      statusMessage.value = 'Migration de vos données...';
      await completeLinkGuestAccount();
      migratedData.value = true;
    } else {
      // Juste créer/mettre à jour le profil
      statusMessage.value = 'Création du profil...';
      await createOrUpdateProfile(user);
    }
    
    // 4. Succès
    loading.value = false;
    statusMessage.value = 'Connexion réussie !';
    
    // 5. Redirection après 1.5s
    setTimeout(() => {
      router.push('/');
    }, 1500);
    
  } catch (err) {
    console.error('[AuthCallback] Error:', err);
    error.value = err.message || 'Une erreur est survenue lors de la connexion';
    loading.value = false;
  }
});

function goHome() {
  router.push('/');
}
</script>

<style scoped>
.callback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1c30 0%, #0f1020 100%);
  padding: 24px;
}

.callback-card {
  background: rgba(26, 28, 48, 0.95);
  border: 2px solid rgba(155, 188, 255, 0.2);
  border-radius: 24px;
  padding: 48px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.loading-state,
.error-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(155, 188, 255, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.success-icon {
  font-size: 64px;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

h2 {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

p {
  color: #9bbcff;
  font-size: 16px;
  margin: 0;
}

.error-state p {
  color: #fca5a5;
}

.modal-btn {
  margin-top: 16px;
}
</style>
