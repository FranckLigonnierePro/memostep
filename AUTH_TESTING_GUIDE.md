# 🧪 Guide de Tests - Authentification Memostep

## 📋 Vue d'ensemble

Ce guide fournit des scénarios de test détaillés pour valider le système d'authentification.

---

## 🎯 Scénarios de Test

### Test 1 : Connexion Google (Nouveau Compte)

**Objectif**: Vérifier la création d'un nouveau compte via Google OAuth

**Prérequis**:
- Google OAuth configuré dans Supabase
- Application déployée ou en dev

**Étapes**:
1. Ouvrir l'application en mode incognito
2. Cliquer sur "Se connecter / Créer un compte"
3. Cliquer sur "Continuer avec Google"
4. Se connecter avec un compte Google (jamais utilisé sur l'app)
5. Autoriser l'application
6. Attendre la redirection

**Résultats attendus**:
- ✅ Redirection vers `/auth/callback`
- ✅ Message "Connexion en cours..."
- ✅ Redirection vers `/` (home)
- ✅ Profil créé dans `profiles` table
- ✅ Stats créées dans `player_stats` table
- ✅ Username généré (ex: "User12345678")
- ✅ Avatar par défaut débloqué

**Vérification Supabase**:
```sql
-- Vérifier le profil
SELECT * FROM profiles WHERE id = '[user_id]';

-- Vérifier les stats
SELECT * FROM player_stats WHERE player_id = '[user_id]';

-- Vérifier les avatars
SELECT * FROM player_avatars WHERE player_id = '[user_id]';
```

---

### Test 2 : Connexion Google (Compte Existant)

**Objectif**: Vérifier la reconnexion avec un compte existant

**Prérequis**:
- Avoir déjà créé un compte (Test 1)

**Étapes**:
1. Se déconnecter de l'application
2. Ouvrir en mode incognito
3. Cliquer sur "Se connecter"
4. Choisir Google
5. Se connecter avec le même compte Google

**Résultats attendus**:
- ✅ Connexion réussie
- ✅ Profil chargé correctement
- ✅ Stats préservées (XP, ressources)
- ✅ Avatar sélectionné restauré

---

### Test 3 : Liaison de Compte Guest (Scénario Complet)

**Objectif**: Vérifier la migration complète des données d'un guest

**Prérequis**:
- Application fraîche (localStorage vide)

**Étapes**:

#### Phase 1 : Jouer en Guest
1. Ouvrir l'application
2. Cliquer "Jouer maintenant" (mode guest)
3. Vérifier le nom généré (ex: "Memoguest1234")
4. Jouer plusieurs parties en mode solo
5. Gagner de l'XP (ex: 500 XP → Niveau 5)
6. Collecter des ressources:
   - Or: 150 🪙
   - Essence: 8 ✨
   - Gemmes: 2 💎
7. Atteindre le niveau 10 en solo
8. Noter les stats actuelles

#### Phase 2 : Lier le Compte
9. Cliquer sur le bouton "🔗" (Lier mon compte)
10. Vérifier l'affichage des données guest
11. Cliquer "Lier avec Google"
12. Se connecter avec Google
13. Attendre la migration

**Résultats attendus**:
- ✅ Message "Migration de vos données..."
- ✅ Notification "Compte lié avec succès !"
- ✅ Profil créé avec les données migrées
- ✅ XP migré : 500 XP
- ✅ Niveau calculé : 5
- ✅ Ressources migrées :
  - gold: 150
  - essence: 8
  - gems: 2
- ✅ Stats solo migrées :
  - solo_best_level: 10
  - solo_total_levels: 10+
- ✅ Avatar sélectionné débloqué

**Vérification Supabase**:
```sql
-- Vérifier la migration
SELECT 
  p.username,
  p.is_guest,
  ps.total_xp,
  ps.current_level,
  ps.gold,
  ps.essence,
  ps.gems,
  ps.solo_best_level
FROM profiles p
JOIN player_stats ps ON p.id = ps.player_id
WHERE p.id = '[user_id]';

-- Devrait retourner:
-- username: "Memoguest1234" ou nouveau username
-- is_guest: false
-- total_xp: 500
-- current_level: 5
-- gold: 150
-- essence: 8
-- gems: 2
-- solo_best_level: 10
```

**Vérification localStorage**:
```javascript
// Dans la console du navigateur
console.log('Migrated:', localStorage.getItem('memostep_migrated')); // "true"
console.log('Username:', localStorage.getItem('memostep_username')); // Préservé
```

---

### Test 4 : Magic Link Email

**Objectif**: Vérifier la connexion par email

**Étapes**:
1. Ouvrir l'application
2. Cliquer "Se connecter"
3. Cliquer "Continuer avec Email"
4. Entrer un email valide
5. Cliquer "Envoyer le lien magique"
6. Vérifier le message de succès
7. Ouvrir l'email reçu
8. Cliquer sur le lien de connexion
9. Attendre la redirection

**Résultats attendus**:
- ✅ Message "Un lien a été envoyé à [email]"
- ✅ Email reçu dans la boîte mail
- ✅ Lien fonctionnel
- ✅ Connexion réussie
- ✅ Profil créé

**Note**: Le lien expire après 1 heure par défaut.

---

### Test 5 : Email + Mot de passe (Inscription)

**Objectif**: Vérifier l'inscription avec email et mot de passe

**Étapes**:
1. Ouvrir l'application
2. Cliquer "Se connecter"
3. Cliquer "Continuer avec Email"
4. Cliquer "Utiliser un mot de passe"
5. Entrer un email et un mot de passe (min 6 caractères)
6. Cliquer "Créer un compte"
7. Attendre la confirmation

**Résultats attendus**:
- ✅ Compte créé
- ✅ Email de confirmation envoyé (si activé)
- ✅ Connexion automatique
- ✅ Profil créé

---

### Test 6 : Email + Mot de passe (Connexion)

**Objectif**: Vérifier la connexion avec email et mot de passe

**Prérequis**:
- Avoir créé un compte (Test 5)

**Étapes**:
1. Se déconnecter
2. Cliquer "Se connecter"
3. Cliquer "Continuer avec Email"
4. Cliquer "Utiliser un mot de passe"
5. Entrer email et mot de passe
6. Cliquer "Se connecter"

**Résultats attendus**:
- ✅ Connexion réussie
- ✅ Profil chargé
- ✅ Stats restaurées

---

### Test 7 : Déconnexion

**Objectif**: Vérifier la déconnexion

**Étapes**:
1. Être connecté
2. Appeler `signOut()` ou cliquer sur un bouton de déconnexion
3. Vérifier l'état de l'application

**Résultats attendus**:
- ✅ Session supprimée
- ✅ Retour en mode guest
- ✅ localStorage préservé (pour compatibilité)
- ✅ Profil non accessible

**Vérification**:
```javascript
import { getSession } from './lib/auth.js';
const session = await getSession();
console.log(session); // null
```

---

### Test 8 : Reconnexion Automatique

**Objectif**: Vérifier que la session persiste après rafraîchissement

**Étapes**:
1. Se connecter avec n'importe quel provider
2. Rafraîchir la page (F5)
3. Vérifier l'état de connexion

**Résultats attendus**:
- ✅ Session restaurée automatiquement
- ✅ Profil chargé
- ✅ Pas de re-authentification nécessaire

---

### Test 9 : Gestion des Erreurs

**Objectif**: Vérifier la gestion des erreurs

#### Test 9.1 : Email Invalide
1. Entrer un email invalide (ex: "test@")
2. Tenter d'envoyer le Magic Link

**Résultat attendu**:
- ✅ Message d'erreur "Email invalide"
- ✅ Bouton désactivé

#### Test 9.2 : Mot de passe Trop Court
1. Entrer un mot de passe < 6 caractères
2. Tenter de créer un compte

**Résultat attendu**:
- ✅ Message d'erreur de Supabase
- ✅ Compte non créé

#### Test 9.3 : Annulation OAuth
1. Cliquer sur Google
2. Annuler sur la page Google
3. Vérifier le retour

**Résultat attendu**:
- ✅ Retour sur l'application
- ✅ Pas de session créée
- ✅ Possibilité de réessayer

---

### Test 10 : Multi-Appareils

**Objectif**: Vérifier la synchronisation entre appareils

**Étapes**:
1. Se connecter sur l'appareil A
2. Gagner de l'XP et des ressources
3. Se connecter sur l'appareil B avec le même compte
4. Vérifier les données

**Résultats attendus**:
- ✅ Données synchronisées
- ✅ XP et ressources identiques
- ✅ Stats à jour

---

## 🔍 Tests de Sécurité

### Test S1 : RLS (Row Level Security)

**Objectif**: Vérifier que les utilisateurs ne peuvent pas accéder aux données des autres

**Étapes**:
1. Se connecter avec le compte A
2. Noter l'ID utilisateur A
3. Tenter d'accéder aux données du compte B via l'API

```javascript
// Tenter de lire les stats d'un autre utilisateur
const { data, error } = await supabase
  .from('player_stats')
  .select('*')
  .eq('player_id', '[autre_user_id]');

console.log(data); // Devrait être vide ou erreur
console.log(error); // Erreur RLS
```

**Résultat attendu**:
- ✅ Accès refusé
- ✅ Erreur RLS retournée

---

### Test S2 : Token Expiration

**Objectif**: Vérifier le rafraîchissement automatique des tokens

**Étapes**:
1. Se connecter
2. Attendre 1 heure (ou modifier manuellement l'expiration)
3. Faire une action nécessitant l'authentification

**Résultat attendu**:
- ✅ Token rafraîchi automatiquement
- ✅ Action réussie sans re-authentification

---

## 📊 Tests de Performance

### Test P1 : Temps de Connexion

**Objectif**: Mesurer le temps de connexion

**Méthode**:
```javascript
const start = performance.now();
await signInWithGoogle();
const end = performance.now();
console.log(`Connexion: ${end - start}ms`);
```

**Cible**: < 3000ms (incluant le redirect OAuth)

---

### Test P2 : Temps de Migration

**Objectif**: Mesurer le temps de migration des données guest

**Méthode**:
```javascript
const start = performance.now();
await migrateGuestData(user);
const end = performance.now();
console.log(`Migration: ${end - start}ms`);
```

**Cible**: < 2000ms

---

## 🐛 Debugging

### Activer les Logs Détaillés

```javascript
// Dans la console du navigateur
localStorage.setItem('supabase.auth.debug', 'true');

// Recharger la page
location.reload();
```

### Vérifier la Session

```javascript
import { getSession, getCurrentUser } from './lib/auth.js';

// Session
const session = await getSession();
console.log('Session:', session);

// User
const user = await getCurrentUser();
console.log('User:', user);
```

### Vérifier le Profil

```javascript
import { getProfile } from './lib/auth.js';

const profile = await getProfile(user.id);
console.log('Profile:', profile);
```

### Vérifier localStorage

```javascript
// Données guest
console.log('Username:', localStorage.getItem('memostep_username'));
console.log('XP:', localStorage.getItem('memostep_player_xp'));
console.log('Resources:', localStorage.getItem('memostep_resources'));
console.log('Migrated:', localStorage.getItem('memostep_migrated'));
```

---

## ✅ Checklist de Tests

### Tests Fonctionnels
- [ ] Connexion Google (nouveau compte)
- [ ] Connexion Google (compte existant)
- [ ] Connexion Apple (nouveau compte)
- [ ] Connexion Apple (compte existant)
- [ ] Magic Link Email
- [ ] Email + Mot de passe (inscription)
- [ ] Email + Mot de passe (connexion)
- [ ] Liaison compte guest (migration complète)
- [ ] Déconnexion
- [ ] Reconnexion automatique

### Tests d'Erreurs
- [ ] Email invalide
- [ ] Mot de passe trop court
- [ ] Annulation OAuth
- [ ] Réseau déconnecté
- [ ] Session expirée

### Tests de Sécurité
- [ ] RLS (accès refusé aux données d'autres users)
- [ ] Token refresh automatique
- [ ] HTTPS en production

### Tests Multi-Appareils
- [ ] Synchronisation des données
- [ ] Connexion simultanée
- [ ] Déconnexion sur un appareil

### Tests de Performance
- [ ] Temps de connexion < 3s
- [ ] Temps de migration < 2s
- [ ] Chargement du profil < 1s

---

## 📝 Rapport de Test (Template)

```markdown
# Rapport de Test - Authentification Memostep

**Date**: [Date]
**Testeur**: [Nom]
**Environnement**: [Dev/Staging/Prod]

## Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Connexion Google | ✅ Pass | Temps: 2.5s |
| Connexion Apple | ✅ Pass | Temps: 2.8s |
| Magic Link | ✅ Pass | Email reçu en 30s |
| Liaison Guest | ✅ Pass | Migration OK |
| Déconnexion | ✅ Pass | - |
| RLS | ✅ Pass | Accès refusé correctement |

## Bugs Trouvés

1. [Description du bug]
   - Sévérité: [Critique/Majeur/Mineur]
   - Étapes de reproduction: [...]
   - Résultat attendu: [...]
   - Résultat obtenu: [...]

## Recommandations

- [Recommandation 1]
- [Recommandation 2]

## Conclusion

[Résumé global]
```

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-01-29
