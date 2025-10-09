# ✅ Checklist de Test - Pouvoir Givre

## 🎯 Tests à effectuer

### ✓ Test 1 : Migration de la base de données

**Objectif** : Vérifier que les colonnes et fonctions sont créées

**Étapes** :
1. Ouvrir Supabase SQL Editor
2. Exécuter `database/add_freeze_system.sql`
3. Vérifier les messages de confirmation

**Résultat attendu** :
```
✓ Column frozen_clicks added
✓ Column pending_freeze added
✓ Function apply_freeze_power created
```

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 2 : Création d'une partie Versus

**Objectif** : Vérifier que le mode versus fonctionne

**Étapes** :
1. Lancer `npm run dev`
2. Cliquer sur "Versus"
3. Entrer un pseudo
4. Créer une partie
5. Copier le code

**Résultat attendu** :
- Code de 6 caractères généré
- Lobby affiché avec 1/8 joueurs
- Icône flocon visible (grisée)

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 3 : Rejoindre avec un second joueur

**Objectif** : Tester le multijoueur

**Étapes** :
1. Ouvrir un second onglet/navigateur
2. Aller sur l'application
3. Cliquer sur "Versus"
4. Entrer un pseudo différent
5. Coller le code et rejoindre

**Résultat attendu** :
- Les deux joueurs voient 2/8 joueurs
- Les deux pseudos sont affichés
- Couleurs différentes assignées

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 4 : Démarrage de la partie

**Objectif** : Vérifier la synchronisation

**Étapes** :
1. Dans l'onglet hôte, cliquer "Démarrer"
2. Observer les deux écrans

**Résultat attendu** :
- Les deux joueurs voient la même grille
- Phase de mémorisation synchronisée
- Même chemin à mémoriser
- Icône flocon devient active après mémorisation

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 5 : Activation du pouvoir givre

**Objectif** : Tester l'activation du pouvoir

**Étapes** :
1. Attendre la fin de la mémorisation
2. Appuyer sur ESPACE (ou cliquer l'icône flocon)
3. Observer l'écran de l'adversaire

**Résultat attendu** :
- **Joueur qui active** :
  - Icône flocon devient grisée (utilisée)
  - Pas d'effet sur sa propre grille
  
- **Adversaire** :
  - Tempête de neige apparaît (2 secondes)
  - 50 flocons tombent du haut
  - Grille se couvre de glace bleue
  - Compteur "8" géant au centre

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 6 : Grille gelée - Clics 8 à 5

**Objectif** : Tester le compteur sans fissures

**Étapes** :
1. Sur l'écran gelé, cliquer n'importe où
2. Observer le compteur après chaque clic
3. Faire 4 clics (8 → 7 → 6 → 5)

**Résultat attendu** :
- Compteur décrémente : 8 → 7 → 6 → 5
- Glace reste opaque (pas de fissures)
- Animation de pulsation du compteur
- Impossible de cliquer sur les bonnes cases

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 7 : Apparition des fissures - Clics 4 à 1

**Objectif** : Tester les fissures progressives

**Étapes** :
1. Continuer à cliquer (4 clics supplémentaires)
2. Observer après chaque clic

**Résultat attendu** :
- **Clic 5** (compteur → 4) : Première fissure apparaît
- **Clic 6** (compteur → 3) : Deuxième fissure
- **Clic 7** (compteur → 2) : Troisième fissure
- **Clic 8** (compteur → 1) : Quatrième fissure
- Glace devient plus transparente
- Fissures blanches visibles

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 8 : Brisure finale

**Objectif** : Vérifier la libération

**Étapes** :
1. Faire le 8ème clic (compteur → 0)
2. Observer la grille

**Résultat attendu** :
- Glace disparaît complètement
- Compteur disparaît
- Grille redevient cliquable
- Jeu reprend normalement

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 9 : Synchronisation temps réel

**Objectif** : Vérifier la synchro entre joueurs

**Étapes** :
1. Observer les deux écrans pendant le gel
2. Comparer les compteurs

**Résultat attendu** :
- Les deux joueurs voient le même état
- Compteur synchronisé
- Fissures apparaissent en même temps
- Pas de décalage visible

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 10 : Pouvoir utilisé une seule fois

**Objectif** : Vérifier qu'on ne peut pas réutiliser

**Étapes** :
1. Après avoir utilisé le pouvoir
2. Essayer de réappuyer sur ESPACE
3. Observer l'icône flocon

**Résultat attendu** :
- Icône reste grisée
- Rien ne se passe
- Console : `[handleFreezePower] ❌ Blocked: power already used`

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 11 : Nouveau round

**Objectif** : Vérifier la réinitialisation

**Étapes** :
1. Finir le round (un joueur gagne)
2. Attendre le nouveau round
3. Vérifier l'icône flocon

**Résultat attendu** :
- Icône flocon redevient active
- Pouvoir réutilisable
- `state.powerUsed = false`

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 12 : Animations CSS

**Objectif** : Vérifier la qualité visuelle

**Aspects à vérifier** :
- [ ] Flocons tombent de manière fluide
- [ ] Flocons ont des tailles différentes
- [ ] Flocons ont des vitesses différentes
- [ ] Compteur pulse régulièrement
- [ ] Fissures apparaissent avec animation
- [ ] Glace a un effet de brillance
- [ ] Effet de flou (backdrop-filter) visible

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 13 : Performance

**Objectif** : Vérifier qu'il n'y a pas de lag

**Étapes** :
1. Ouvrir DevTools (F12) → Performance
2. Activer le pouvoir givre
3. Enregistrer pendant 5 secondes

**Résultat attendu** :
- FPS reste > 30
- Pas de freeze de l'interface
- Animations fluides
- Pas de memory leak

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 14 : Responsive (Mobile)

**Objectif** : Tester sur petit écran

**Étapes** :
1. Ouvrir DevTools → Toggle device toolbar
2. Sélectionner iPhone 12 Pro
3. Tester le pouvoir givre

**Résultat attendu** :
- Flocons visibles et fluides
- Compteur bien centré
- Fissures visibles
- Pas de débordement

**Status** : [ ] Réussi / [ ] Échoué

---

### ✓ Test 15 : Console logs

**Objectif** : Vérifier les logs de debug

**Logs attendus lors de l'activation** :
```javascript
[handleFreezePower] ✅ Activating freeze power...
[handleFreezePower] ✅ Freeze power activated!
[applyPendingFreeze] Applying pending freeze to entire grid
[applyPendingFreeze] ❄️ Pending freeze applied to entire grid!
```

**Status** : [ ] Réussi / [ ] Échoué

---

## 🐛 Bugs connus à vérifier

### Bug potentiel 1 : Double activation
**Scénario** : Spam de la touche ESPACE
**Test** : Appuyer rapidement 5 fois sur ESPACE
**Attendu** : Une seule activation
**Status** : [ ] OK / [ ] Bug

### Bug potentiel 2 : Désynchronisation
**Scénario** : Connexion lente
**Test** : Throttle network à "Slow 3G"
**Attendu** : Synchronisation maintenue
**Status** : [ ] OK / [ ] Bug

### Bug potentiel 3 : Compteur négatif
**Scénario** : Cliquer très rapidement
**Test** : Spam de clics pendant le gel
**Attendu** : Compteur ne descend pas en dessous de 0
**Status** : [ ] OK / [ ] Bug

---

## 📊 Résultats des tests

**Date** : ___________
**Testeur** : ___________

**Résumé** :
- Tests réussis : ___ / 15
- Tests échoués : ___ / 15
- Bugs trouvés : ___

**Commentaires** :
```
[Vos notes ici]
```

---

## 🔧 Commandes utiles pour le debug

### Voir l'état local
```javascript
// Dans la console navigateur
console.log('State:', {
  frozenGrid: state.frozenGrid,
  frozenClicksLeft: state.frozenClicksLeft,
  showSnowstorm: state.showSnowstorm,
  powerUsed: state.powerUsed
});
```

### Forcer le gel (debug)
```javascript
// Dans la console navigateur
state.frozenGrid = true;
state.frozenClicksLeft = 8;
state.showSnowstorm = true;
```

### Vérifier la base de données
```sql
-- Dans Supabase SQL Editor
SELECT 
  player_id,
  frozen_clicks,
  pending_freeze
FROM players
WHERE room_code = 'VOTRE_CODE';
```

### Réinitialiser un joueur
```sql
-- Dans Supabase SQL Editor
UPDATE players
SET frozen_clicks = 0, pending_freeze = false
WHERE room_code = 'VOTRE_CODE'
AND player_id = 'VOTRE_ID';
```

---

## ✅ Validation finale

Une fois tous les tests passés :
- [ ] Commit des changements
- [ ] Push vers le repo
- [ ] Déploiement en production
- [ ] Test en production
- [ ] Documentation mise à jour

**Signature** : ___________
**Date** : ___________
