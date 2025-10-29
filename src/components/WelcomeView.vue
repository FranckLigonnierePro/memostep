<template>
  <div class="welcome-page">
    <div class="welcome-card">
      <p class="subtitle">Jouez en invité ou créez un compte pour sauvegarder votre progression.</p>

      <div class="actions">
        <button class="btn primary" @click="playNow">Jouer maintenant</button>
        <div class="divider"><span>ou</span></div>
        <button class="btn secondary" @click="goLogin">Se connecter / Créer un compte</button>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  } catch (_) {}
  router.push('/');
}

function goLogin() {
  router.push('/login');
}
</script>

<style scoped>
.welcome-page {
  margin-bottom: .5rem;
  justify-content: space-between;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
}

.welcome-card {
}
.title { color:#fff; margin:0 0 8px 0; font-size:28px; font-weight:800; }
.subtitle { color:#9bbcff; margin:0 0 18px 0; font-size:14px; }
.actions { display:flex; flex-direction:column; gap:12px; }
.btn { padding: 14px 20px; border-radius: 12px; font-weight: 800; border: 2px solid transparent; cursor: pointer; }
.primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color:#fff; }
.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.35); }
.secondary { background: rgba(59,130,246,.12); color:#9bbcff; border-color: rgba(59,130,246,.35); }
.secondary:hover { background: rgba(59,130,246,.18); }
.divider { display:flex; align-items:center; gap:16px; color:#6b7280; font-size:14px; margin:6px 0; justify-content:center; }
.divider::before,.divider::after { content:''; width:120px; height:1px; background:rgba(155,188,255,0.2); }
</style>
