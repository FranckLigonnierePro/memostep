# 🔐 Guide d'Intégration de l'Authentification

## 📋 Vue d'ensemble

Ce guide explique comment intégrer le système d'authentification Supabase avec liaison des comptes guests dans Memostep.

---

## 🎯 Fonctionnalités

### ✅ Authentification Multi-Provider
- **Google** - OAuth 2.0
- **Apple** - Sign in with Apple
- **Email** - Magic Link ou Mot de passe

### ✅ Gestion des Guests
- Jeu sans compte (localStorage)
- Liaison automatique lors de la connexion
- Migration des données (XP, ressources, stats)
- Préservation de la progression

### ✅ Sécurité
- Row Level Security (RLS)
- Tokens JWT automatiques
- Refresh automatique des sessions
- Protection des données utilisateur

---

## 📦 Fichiers Créés

### 1. **`src/lib/auth.js`** - Bibliothèque d'authentification
Fonctions principales :
- `signInWithGoogle()` - Connexion Google
- `signInWithApple()` - Connexion Apple
- `signInWithEmail()` - Magic Link
- `signInWithPassword()` - Email + Mot de passe
- `signUpWithPassword()` - Inscription
- `signOut()` - Déconnexion
- `migrateGuestData()` - Migration des données guest
- `linkGuestAccount()` - Liaison de compte
- `onAuthStateChange()` - Listener d'événements

### 2. **`src/components/AuthModal.vue`** - Modal de connexion
Interface utilisateur pour :
- Choix du provider (Google, Apple, Email)
- Formulaire email (Magic Link ou Mot de passe)
- Mode liaison de compte guest
- Gestion des erreurs

### 3. **`src/components/AuthCallback.vue`** - Page de callback OAuth
Gère :
- Retour après OAuth (Google, Apple)
- Vérification de la session
- Migration des données guest
- Redirection vers l'app

---

## 🚀 Étapes d'Intégration

### Étape 1 : Configuration Supabase

#### 1.1 Activer les Providers

Dans le dashboard Supabase (`Authentication > Providers`) :

**Google OAuth:**
```
1. Créer un projet Google Cloud
2. Activer Google+ API
3. Créer des identifiants OAuth 2.0
4. Ajouter l'URI de redirection:
   https://[votre-projet].supabase.co/auth/v1/callback
5. Copier Client ID et Client Secret dans Supabase
```

**Apple Sign In:**
```
1. Créer un App ID dans Apple Developer
2. Activer Sign in with Apple
3. Créer un Service ID
4. Ajouter l'URI de redirection:
   https://[votre-projet].supabase.co/auth/v1/callback
5. Configurer dans Supabase
```

**Email:**
```
1. Activer Email provider dans Supabase
2. Choisir: Magic Link ou Password (ou les deux)
3. Personnaliser les templates d'email (optionnel)
```

#### 1.2 Configurer les URLs de redirection

Dans `Authentication > URL Configuration` :
```
Site URL: https://votre-domaine.com
Redirect URLs:
  - https://votre-domaine.com/auth/callback
  - http://localhost:5173/auth/callback (dev)
```

---

### Étape 2 : Ajouter la Route de Callback

Modifier `src/router/index.js` :

```javascript
import AuthCallback from '../components/AuthCallback.vue';

const routes = [
  // ... routes existantes
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback
  }
];
```

---

### Étape 3 : Intégrer AuthModal dans App.vue

```vue
<template>
  <div class="app-frame">
    <!-- ... contenu existant ... -->
    
    <!-- Auth Modal -->
    <AuthModal
      v-if="showAuthModal"
      :isLinking="isLinkingAccount"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
      @continueAsGuest="handleContinueAsGuest"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AuthModal from './components/AuthModal.vue';
import { onAuthStateChange, isAuthenticated, isGuest } from './lib/auth.js';

const showAuthModal = ref(false);
const isLinkingAccount = ref(false);
const currentUser = ref(null);

// Ouvrir le modal de connexion
function openAuthModal(linking = false) {
  isLinkingAccount.value = linking;
  showAuthModal.value = true;
}

// Fermer le modal
function closeAuthModal() {
  showAuthModal.value = false;
  isLinkingAccount.value = false;
}

// Succès de connexion
function handleAuthSuccess() {
  console.log('[App] Auth success');
  closeAuthModal();
  // Recharger les données utilisateur
  loadUserProfile();
}

// Continuer en guest
function handleContinueAsGuest() {
  closeAuthModal();
  // Générer un nom de guest si nécessaire
  if (!localStorage.getItem('memostep_username')) {
    const guestName = `Memoguest${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    localStorage.setItem('memostep_username', guestName);
  }
}

// Charger le profil utilisateur
async function loadUserProfile() {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    // Charger le profil depuis Supabase
    // TODO: Implémenter getProfile()
  }
}

// Listener d'événements auth
let authSubscription = null;

onMounted(() => {
  // Écouter les changements d'auth
  authSubscription = onAuthStateChange((event, session) => {
    console.log('[App] Auth event:', event);
    
    if (event === 'SIGNED_IN') {
      currentUser.value = session?.user || null;
      loadUserProfile();
    } else if (event === 'SIGNED_OUT') {
      currentUser.value = null;
    }
  });
  
  // Vérifier si guest et proposer de lier le compte
  if (isGuest()) {
    // Afficher une notification pour lier le compte (optionnel)
    console.log('[App] User is guest, can link account');
  }
});

onBeforeUnmount(() => {
  if (authSubscription) {
    authSubscription.unsubscribe();
  }
});
</script>
```

---

### Étape 4 : Modifier UsernameModal.vue

Remplacer le contenu actuel par l'intégration avec AuthModal :

```vue
<template>
  <div class="username-view">
    <button class="modal-btn primary" @click="$emit('continueAsGuest')">
      🎮 Jouer maintenant
    </button>
    
    <div class="divider">
      <span>ou</span>
    </div>
    
    <button class="modal-btn secondary" @click="$emit('openAuth')">
      🔐 Se connecter / Créer un compte
    </button>
    
    <p class="hint">
      Créez un compte pour sauvegarder votre progression sur tous vos appareils
    </p>
  </div>
</template>

<script setup>
defineEmits(['continueAsGuest', 'openAuth']);
</script>
```

Et dans App.vue :

```vue
<UsernameModal
  v-if="route.name === 'Home' && showNameModal"
  @continueAsGuest="continueAsGuest"
  @openAuth="openAuthModal(false)"
/>
```

---

### Étape 5 : Ajouter un Bouton "Lier mon compte"

Dans ProfileView.vue ou dans le header :

```vue
<button 
  v-if="isGuest()" 
  class="link-account-btn"
  @click="openAuthModal(true)"
>
  🔗 Lier mon compte
</button>
```

---

## 🔄 Flux d'Authentification

### Flow 1 : Nouvelle Connexion (Non-Guest)

```
1. User clique "Se connecter"
   ↓
2. AuthModal s'ouvre (isLinking = false)
   ↓
3. User choisit un provider (Google/Apple/Email)
   ↓
4. Redirect vers le provider OAuth
   ↓
5. Callback vers /auth/callback
   ↓
6. AuthCallback vérifie la session
   ↓
7. createOrUpdateProfile() crée le profil
   ↓
8. Redirect vers / (home)
```

### Flow 2 : Liaison de Compte Guest

```
1. User joue en guest (Memoguest1234)
   ↓
2. User clique "Lier mon compte"
   ↓
3. AuthModal s'ouvre (isLinking = true)
   ↓
4. Affiche les données du guest
   ↓
5. User choisit un provider
   ↓
6. linkGuestAccount() sauvegarde les données dans sessionStorage
   ↓
7. Redirect vers le provider OAuth
   ↓
8. Callback vers /auth/callback
   ↓
9. AuthCallback détecte la migration pendante
   ↓
10. completeLinkGuestAccount() restaure les données
    ↓
11. migrateGuestData() migre vers la DB
    ↓
12. Redirect vers / avec compte lié
```

### Flow 3 : Magic Link Email

```
1. User entre son email
   ↓
2. signInWithEmail() envoie le lien
   ↓
3. User reçoit l'email
   ↓
4. User clique sur le lien
   ↓
5. Redirect vers /auth/callback avec token
   ↓
6. AuthCallback vérifie et crée le profil
   ↓
7. Redirect vers /
```

---

## 📊 Migration des Données Guest

### Données Migrées

```javascript
{
  // Profil
  username: 'Memoguest1234' → username réel ou conservé
  avatar_url: selectedAvatar.img
  
  // Stats XP
  total_xp: playerXp.totalXp
  current_level: calculé depuis XP
  
  // Ressources
  gold: resources.gold
  essence: resources.essence
  gems: resources.gems
  
  // Stats Solo
  solo_best_level: depuis solo_scores
  solo_best_time_ms: depuis solo_scores
  solo_total_levels: depuis solo_scores
  
  // Avatar
  player_avatars: avatar sélectionné débloqué
}
```

### Données Préservées en localStorage

Après migration, ces données restent en localStorage pour compatibilité :
- `memostep_username` - Pour affichage
- `selectedAvatar` - Pour UI
- `memostep_migrated` - Flag de migration

---

## 🔐 Sécurité et RLS

### Politiques Appliquées

Les politiques RLS sont déjà définies dans `database_schema.sql` :

```sql
-- Profiles: lecture publique, écriture propriétaire
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Stats: lecture publique, écriture propriétaire
CREATE POLICY "Users can update own stats" ON player_stats
  FOR UPDATE USING (auth.uid() = player_id);

-- Avatars: propriétaire uniquement
CREATE POLICY "Users can manage own avatars" ON player_avatars
  FOR ALL USING (auth.uid() = player_id);
```

### Vérification Côté Client

```javascript
import { getCurrentUser } from './lib/auth.js';

// Vérifier avant une action sensible
async function updateProfile(data) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  // Continuer avec la mise à jour
}
```

---

## 🧪 Tests

### Test 1 : Connexion Google
```
1. Ouvrir l'app en mode incognito
2. Cliquer "Se connecter"
3. Choisir Google
4. Se connecter avec un compte Google
5. Vérifier la redirection vers /
6. Vérifier que le profil est créé dans Supabase
```

### Test 2 : Liaison Guest
```
1. Ouvrir l'app
2. Jouer en guest (Memoguest1234)
3. Gagner de l'XP et des ressources
4. Cliquer "Lier mon compte"
5. Se connecter avec Google
6. Vérifier que les données sont migrées
7. Vérifier dans Supabase que player_stats contient les bonnes valeurs
```

### Test 3 : Magic Link
```
1. Ouvrir l'app
2. Cliquer "Se connecter"
3. Choisir Email
4. Entrer un email valide
5. Vérifier l'envoi du lien
6. Ouvrir l'email et cliquer sur le lien
7. Vérifier la connexion
```

---

## 🐛 Debugging

### Logs Utiles

```javascript
// Activer les logs détaillés
localStorage.setItem('supabase.auth.debug', 'true');

// Vérifier la session
import { getSession } from './lib/auth.js';
const session = await getSession();
console.log('Session:', session);

// Vérifier le profil
import { getProfile } from './lib/auth.js';
const profile = await getProfile(userId);
console.log('Profile:', profile);
```

### Erreurs Communes

**"No session found"**
- Vérifier que les URLs de redirection sont configurées
- Vérifier que le callback est bien sur `/auth/callback`

**"Invalid provider"**
- Vérifier que le provider est activé dans Supabase
- Vérifier les credentials (Client ID, Secret)

**"Migration failed"**
- Vérifier que les tables existent (profiles, player_stats)
- Vérifier les politiques RLS
- Vérifier les logs dans Supabase Dashboard

---

## 📝 Checklist d'Intégration

- [ ] Configurer les providers dans Supabase
- [ ] Ajouter les URLs de redirection
- [ ] Créer la route `/auth/callback`
- [ ] Intégrer AuthModal dans App.vue
- [ ] Modifier UsernameModal.vue
- [ ] Ajouter le bouton "Lier mon compte"
- [ ] Tester la connexion Google
- [ ] Tester la connexion Apple
- [ ] Tester le Magic Link
- [ ] Tester la liaison de compte guest
- [ ] Vérifier la migration des données
- [ ] Tester la déconnexion
- [ ] Vérifier les politiques RLS

---

## 🚀 Prochaines Étapes

### Phase 1 : Fonctionnalités de Base (Actuel)
- ✅ Authentification multi-provider
- ✅ Liaison de comptes guests
- ✅ Migration des données

### Phase 2 : Améliorations
- [ ] Gestion du profil (modifier username, avatar)
- [ ] Suppression de compte
- [ ] Changement de mot de passe
- [ ] Vérification d'email

### Phase 3 : Social
- [ ] Liste d'amis
- [ ] Invitations
- [ ] Partage de scores
- [ ] Classements entre amis

---

## 📞 Support

Pour toute question :
- Consulter la [documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- Vérifier les logs dans Supabase Dashboard
- Tester avec les outils de debug fournis

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-01-29
