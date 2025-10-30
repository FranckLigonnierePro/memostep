<template>
  <div class="welcome-page">
    <div class="welcome-card">
      
      <div class="actions">
        <div class="btn-wrap" role="button" tabindex="0" aria-label="Jouer maintenant" @click="playNow"
        @keydown.enter="playNow" @keydown.space="playNow">
        <img class="svg-btn" :src="primaryBtn" alt="" width="213" height="93" />
        <span class="btn-label-primary">Jouer</span>
        <span class="btn-label-secondary">Maintenant</span>
      </div>
      <div class="btn-wrap" role="button" tabindex="0" aria-label="Se connecter / Créer un compte"
      @click="goLogin" @keydown.enter="goLogin" @keydown.space="goLogin">
      <img class="svg-btn" :src="secondaryBtn" alt="" width="213" height="65" />
      <span class="btn-label-tertiary">Connexion /<br> Créer un compte</span>
    </div>
  </div>
  <!-- <p class="subtitle">Jouez en invité ou créez un compte pour sauvegarder votre progression.</p> -->
    </div>
  </div>
</template>

<script setup>
import primaryBtn from '../assets/buttons/primary_btn.svg';
import secondaryBtn from '../assets/buttons/secondary_btn.svg';
import { useRouter } from 'vue-router';

const router = useRouter();

function generateGuestName() {
  const n = Math.floor(Math.random() * 10000);
  return `Memoguest${String(n).padStart(4, '0')}`;
}

function playNow() {
  try {
    const existing = (localStorage.getItem('memostep_username') || '').trim();
    if (!existing) {
      localStorage.setItem('memostep_username', generateGuestName());
    }
  } catch (_) { }
  router.push('/');
}

function goLogin() {
  router.push('/login');
}
</script>

<style scoped>
.welcome-page {
  margin-bottom: .5rem;
  justify-content: end;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
}

.btn-wrap {
  position: relative;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.svg-btn {
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
  display: block;

  margin: 0 auto;
}

.btn-wrap:hover {
  cursor: pointer;
  transform: scale(.95);
  transition: 0.05s ease-in-out;
}

.btn-label-primary {
  z-index: 2;
  font-size: 36px;
  position: absolute;
  top: 26%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 3px 0px black, 0 4px 0px rgba(0, 0, 0, 0.2);
  /* Bordure (contour) du texte */
  -webkit-text-stroke: 2px rgba(0, 0, 0, 0.9);
  text-stroke: 2px rgba(0, 0, 0, 0.9);
  paint-order: stroke fill;
  color: white;
}

.btn-label-secondary {
  z-index: 2;
  font-size: 32px;
  position: absolute;
  top: 58%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 3px 0px black, 0 4px 0px rgba(0, 0, 0, 0.2);
  /* Bordure (contour) du texte */
  -webkit-text-stroke: 2px rgba(0, 0, 0, 0.9);
  text-stroke: 2px rgba(0, 0, 0, 0.9);
  paint-order: stroke fill;
  color: white;
}

.btn-label-tertiary {
  z-index: 2;
  font-size: 20px;
  position: absolute;
  line-height: 1;
  top: 41%;
  left: 50%;
  width: 100%;
  transform: translate(-50%, -50%);
  text-shadow: 0 2px 0px black, 0 3px 0px rgba(0, 0, 0, 0.2);
  /* Bordure (contour) du texte */
  -webkit-text-stroke: 1.5px rgba(0, 0, 0, 0.9);
  text-stroke: 1.5px rgba(0, 0, 0, 0.9);
  paint-order: stroke fill;
  color: white;
}

.btn-wrap:active {
  transform: scale(0.95);
  transition: 0.05s;
}
</style>
