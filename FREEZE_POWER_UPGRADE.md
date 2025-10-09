# 🎮 Mise à jour du Pouvoir Givre - Guide Complet

## 📋 Résumé des changements

Le pouvoir givre a été complètement repensé pour offrir une expérience plus spectaculaire :

### Avant ❄️
- Gelait **une seule ligne** de la grille
- 4 clics pour briser la glace
- Pas d'animation d'arrivée
- Effet visuel simple

### Après ❄️❄️❄️
- Gèle **toute la grille** (40 cellules)
- **8 clics** pour briser la glace progressivement
- **Tempête de neige** animée (50 flocons) à l'arrivée
- **Fissures progressives** qui apparaissent après 4 clics
- Compteur géant au centre de la grille
- Effets visuels améliorés (dégradés, flou, brillance)

---

## 🚀 Déploiement

### Étape 1 : Migration de la base de données

Exécutez le script SQL dans **Supabase SQL Editor** :

```bash
# Ouvrez : https://supabase.com/dashboard/project/[VOTRE_PROJECT]/sql/new
# Copiez-collez le contenu de : database/add_freeze_system.sql
# Cliquez sur "Run"
```

Le script va :
- ✅ Ajouter la colonne `frozen_clicks` (INTEGER)
- ✅ Ajouter la colonne `pending_freeze` (BOOLEAN)
- ✅ Créer la fonction `apply_freeze_power()`
- ✅ Créer les index nécessaires
- ✅ Configurer les permissions

**Vérification** : Vous devriez voir ces messages dans la console :
```
✓ Column frozen_clicks added
✓ Column pending_freeze added
✓ Function apply_freeze_power created
```

### Étape 2 : Démarrer l'application

```bash
npm run dev
```

---

## 🎯 Comment tester

### 1. Créer une partie Versus

1. Cliquez sur **"Versus"** dans le menu principal
2. Entrez votre pseudo
3. Cliquez sur **"Créer une partie"**
4. Copiez le code de la room

### 2. Rejoindre avec un deuxième joueur

Ouvrez un **deuxième onglet** (ou navigateur privé) :
1. Allez sur l'application
2. Cliquez sur **"Versus"**
3. Entrez un pseudo différent
4. Collez le code et cliquez sur **"Rejoindre"**

### 3. Démarrer la partie

Dans le premier onglet (hôte) :
1. Cliquez sur **"Démarrer"**
2. Mémorisez le chemin (phase de révélation)
3. Attendez que la grille se retourne

### 4. Utiliser le pouvoir givre

**Pendant la phase de jeu** (après mémorisation) :
- Appuyez sur la touche **ESPACE** ⌨️
- Ou cliquez sur l'icône ❄️ dans la barre latérale

### 5. Observer les effets

#### Phase 1 : Arrivée du givre (2 secondes)
- 🌨️ **Tempête de neige** : 50 flocons tombent du haut de l'écran
- ❄️ Toute la grille se couvre de glace bleue brillante
- 🔢 Un compteur géant "8" apparaît au centre

#### Phase 2 : Grille gelée (8 clics)
- 🚫 Impossible de cliquer sur les bonnes cases
- 🔨 Chaque clic décrémente le compteur
- 💫 Animation de pulsation du compteur

#### Phase 3 : Fissures (après 4 clics)
- 🪨 Des fissures blanches apparaissent progressivement
- 📉 L'opacité de la glace diminue
- ⚡ Chaque nouvelle fissure a une animation d'apparition

#### Phase 4 : Libération (après 8 clics)
- ✨ La glace disparaît complètement
- 🎮 Le jeu reprend normalement

---

## 🎨 Détails techniques

### Animations CSS

#### Tempête de neige
```css
@keyframes snowfall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}
```

#### Pulsation du compteur
```css
@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}
```

#### Apparition des fissures
```css
@keyframes crackAppear {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
```

### Structure des données

#### État local (App.vue)
```javascript
state: {
  frozenGrid: false,        // Grille gelée ou non
  frozenClicksLeft: 0,      // Clics restants (0-8)
  showSnowstorm: false,     // Afficher la tempête
  powerUsed: false          // Pouvoir déjà utilisé
}
```

#### Base de données (players table)
```sql
frozen_clicks INTEGER DEFAULT 0      -- Clics restants
pending_freeze BOOLEAN DEFAULT false -- Gel en attente
```

### Logique de jeu

1. **Activation du pouvoir** (touche Espace)
   - Appelle `usePower(code, playerId, 'freeze')`
   - Fonction PostgreSQL `apply_freeze_power()` met `pending_freeze = true` pour tous les adversaires

2. **Application du gel** (fin de mémorisation)
   - Détecte `pending_freeze = true`
   - Met à jour `frozen_clicks = 8`
   - Active `showSnowstorm = true` (2 secondes)
   - Active `frozenGrid = true`

3. **Brisure progressive** (clics sur la grille)
   - Chaque clic décrémente `frozen_clicks`
   - À 4 clics restants : fissures apparaissent
   - À 0 clic : `frozenGrid = false`, jeu reprend

---

## 🐛 Dépannage

### La tempête de neige ne s'affiche pas
- Vérifiez que `showSnowstorm` est bien passé en prop à `BoardView`
- Ouvrez la console : devrait voir `[applyPendingFreeze] ❄️ Pending freeze applied to entire grid!`

### Le compteur ne se met pas à jour
- Vérifiez la synchronisation avec Supabase
- Ouvrez l'onglet Network pour voir les requêtes
- Vérifiez que la fonction `updateFreezeState()` est appelée

### Les fissures n'apparaissent pas
- Les fissures n'apparaissent qu'après 4 clics (quand `frozenClicksLeft <= 4`)
- Vérifiez la classe CSS `.cracking` sur `.ice-overlay`

### Le pouvoir ne s'active pas
- Vérifiez que la fonction PostgreSQL `apply_freeze_power` existe
- Vérifiez les permissions : `GRANT EXECUTE ... TO authenticated, anon`
- Regardez les logs Supabase pour les erreurs

---

## 📊 Comparaison des performances

| Aspect | Avant | Après |
|--------|-------|-------|
| Cellules gelées | 4 (1 ligne) | 40 (toute la grille) |
| Clics pour briser | 4 | 8 |
| Animations | 1 (shimmer) | 4 (neige, pulse, fissures, shimmer) |
| Flocons animés | 0 | 50 |
| Impact visuel | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Difficulté | Moyenne | Élevée |

---

## 🎮 Conseils de gameplay

### Pour l'attaquant (qui utilise le pouvoir)
- ✅ Utilisez le pouvoir **au bon moment** (quand l'adversaire est proche de gagner)
- ✅ Un seul usage par round, choisissez bien !
- ✅ Le pouvoir se réinitialise à chaque nouveau round

### Pour la victime (qui subit le gel)
- ✅ **Cliquez rapidement** n'importe où pour briser la glace
- ✅ Pas besoin de viser les bonnes cases pendant le gel
- ✅ 8 clics = environ 2-3 secondes de perte

---

## 🔮 Améliorations futures possibles

- [ ] Son de glace qui se brise
- [ ] Particules de glace qui s'envolent à la brisure
- [ ] Effet de tremblement de la grille
- [ ] Pouvoir "Feu" pour contrer le givre
- [ ] Combo : plusieurs pouvoirs utilisables
- [ ] Statistiques : nombre de gels subis/infligés

---

## 📝 Notes de version

**Version 2.0 - Système de Givre Amélioré**
- ✨ Gel de toute la grille (au lieu d'une ligne)
- ✨ Animation de tempête de neige (50 flocons)
- ✨ Système de fissures progressives
- ✨ Compteur géant au centre
- ✨ 8 clics pour briser (au lieu de 4)
- 🔧 Optimisation du code
- 🔧 Documentation complète
- 🐛 Correction des bugs de synchronisation

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs de la console navigateur (F12)
2. Vérifiez les logs Supabase
3. Vérifiez que la migration SQL a bien été exécutée
4. Redémarrez le serveur de développement

Bon jeu ! ❄️🎮
