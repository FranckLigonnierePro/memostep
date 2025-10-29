<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">Connexion</h1>
      <p class="subtitle" v-if="isLinking">Liez votre compte invité pour sauvegarder votre progression</p>

      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <div>Chargement...</div>
      </div>

      <div v-else class="methods">
        <button class="auth-btn google" @click="handleGoogleAuth">
          <span class="icon">🔍</span> {{ isLinking ? 'Lier avec Google' : 'Continuer avec Google' }}
        </button>

        <button class="auth-btn apple" @click="handleAppleAuth">
          <span class="icon">🍎</span> {{ isLinking ? 'Lier avec Apple' : 'Continuer avec Apple' }}
        </button>

        <div class="divider"><span>ou</span></div>

        <div class="email-section">
          <div class="tabs">
            <button :class="['tab', emailMode==='magic' && 'active']" @click="emailMode='magic'">Lien magique</button>
            <button :class="['tab', emailMode==='password' && 'active']" @click="emailMode='password'">Mot de passe</button>
          </div>

          <div class="form">
            <label>Email</label>
            <input type="email" v-model="email" placeholder="vous@exemple.com" />
          </div>

          <div v-if="emailMode==='magic'">
            <button class="auth-btn email" :disabled="!isEmailValid || loading" @click="handleEmailMagic">
              Envoyer le lien magique
            </button>
            <p class="hint" v-if="magicLinkSent">✅ Lien envoyé à {{ email }}. Vérifiez votre boîte mail.</p>
          </div>

          <div v-else>
            <div class="form">
              <label>Mot de passe</label>
              <input type="password" v-model="password" placeholder="••••••••" />
            </div>
            <div class="actions">
              <button class="auth-btn email" :disabled="!isEmailValid || !password || loading" @click="handlePasswordAuth">
                {{ isSignUp ? 'Créer un compte' : 'Se connecter' }}
              </button>
              <button class="link" @click="isSignUp=!isSignUp">
                {{ isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire' }}
              </button>
            </div>
          </div>
        </div>

        <button class="link small" @click="goHome">← Retour</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  signInWithPassword,
  signUpWithPassword,
  linkGuestAccount,
  isGuest,
} from '../lib/auth.js';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const error = ref('');
const email = ref('');
const password = ref('');
const emailMode = ref('magic'); // magic | password
const isSignUp = ref(false);
const magicLinkSent = ref(false);
const isLinking = ref(false);

onMounted(() => {
  // query ?link=1 pour forcer le mode liaison
  isLinking.value = route.query.link === '1' || (isGuest() === true);
});

const isEmailValid = computed(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email.value));

async function handleGoogleAuth() {
  try {
    loading.value = true; error.value='';
    if (isLinking.value) {
      await linkGuestAccount('google');
    } else {
      await signInWithGoogle();
    }
  } catch (e) {
    error.value = e?.message || 'Erreur Google';
    loading.value = false;
  }
}

async function handleAppleAuth() {
  try {
    loading.value = true; error.value='';
    if (isLinking.value) {
      await linkGuestAccount('apple');
    } else {
      await signInWithApple();
    }
  } catch (e) {
    error.value = e?.message || 'Erreur Apple';
    loading.value = false;
  }
}

async function handleEmailMagic() {
  try {
    if (!isEmailValid.value) { error.value = 'Email invalide'; return; }
    loading.value = true; error.value='';
    await signInWithEmail(email.value);
    magicLinkSent.value = true;
    loading.value = false;
  } catch (e) {
    error.value = e?.message || "Erreur lors de l'envoi du lien";
    loading.value = false;
  }
}

async function handlePasswordAuth() {
  try {
    if (!isEmailValid.value || !password.value) { error.value = 'Email et mot de passe requis'; return; }
    loading.value = true; error.value='';
    if (isSignUp.value) {
      await signUpWithPassword(email.value, password.value, email.value.split('@')[0]);
    } else {
      await signInWithPassword(email.value, password.value);
    }
    router.push('/');
  } catch (e) {
    error.value = e?.message || (isSignUp.value ? "Erreur d'inscription" : 'Erreur de connexion');
    loading.value = false;
  }
}

function goHome() { router.push('/'); }
</script>

<style scoped>
.login-page {
  margin-bottom: .5rem;
  justify-content: space-between;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
}
.login-card {
}
.title { color: #fff; margin: 0 0 6px 0; font-size: 28px; font-weight: 800; }
.subtitle { color: #9bbcff; margin: 0 0 18px 0; font-size: 14px; }
.error { background: rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.35); color:#fca5a5; padding:10px; border-radius:10px; margin-bottom:12px; text-align:center; }
.loading { display:flex; flex-direction:column; gap:12px; align-items:center; color:#9bbcff; }
.spinner { width:40px; height:40px; border:4px solid rgba(155,188,255,0.2); border-top-color:#3b82f6; border-radius:999px; animation:spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.methods { display:flex; flex-direction:column; gap:12px; }
.auth-btn { display:flex; align-items:center; justify-content:center; gap:10px; border-radius:12px; padding:12px 16px; font-weight:700; border:2px solid transparent; cursor:pointer; transition:all .2s; }
.auth-btn.google { background:#fff; color:#111827; border-color:#e5e7eb; }
.auth-btn.google:hover { background:#f3f4f6; }
.auth-btn.apple { background:#000; color:#fff; border-color:#1f2937; }
.auth-btn.apple:hover { background:#111827; }
.auth-btn.email { background: rgba(59,130,246,.12); color:#9bbcff; border-color: rgba(59,130,246,.35); }
.auth-btn.email:hover { background: rgba(59,130,246,.18); }
.divider { display:flex; align-items:center; gap:16px; color:#6b7280; font-size:14px; margin:6px 0; }
.divider::before,.divider::after { content:''; flex:1; height:1px; background:rgba(155,188,255,0.2); }
.email-section { display:flex; flex-direction:column; gap:10px; }
.tabs { display:flex; gap:8px; }
.tab { flex:1; padding:8px 10px; border-radius:10px; border:2px solid rgba(155,188,255,0.2); background:transparent; color:#9bbcff; font-weight:700; cursor:pointer; }
.tab.active { border-color:#3b82f6; color:#ffffff; background: rgba(59,130,246,.15); }
.form { display:flex; flex-direction:column; gap:6px; }
.form label { color:#9bbcff; font-size:13px; font-weight:700; }
.form input { padding:12px 14px; border-radius:10px; background: rgba(26,28,48,.85); border:2px solid rgba(155,188,255,0.2); color:#fff; }
.hint { color:#9bbcff; font-size:13px; }
.actions { display:flex; flex-direction:column; gap:8px; }
.link { background:none; border:none; color:#3b82f6; cursor:pointer; font-weight:600; }
.link.small { align-self:center; margin-top:4px; }
.link:hover { text-decoration: underline; color:#60a5fa; }
.icon { font-size:18px; }
</style>
