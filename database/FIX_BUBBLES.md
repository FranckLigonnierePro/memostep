## 🐛 Problème: Les Bulles ne se Mettent pas à Jour

### Symptôme
Les bulles de progression des joueurs ne se mettent pas à jour en temps réel sur tous les écrans.

### 🔍 Diagnostic

**Étape 1: Vérifier que Realtime est activé**

1. Allez dans **Supabase Dashboard**
2. Cliquez sur **Database** → **Replication**
3. Vérifiez que ces tables sont **cochées**:
   - ✅ `rooms`
   - ✅ `players`

Si elles ne sont pas cochées, **cochez-les** et attendez 10-15 secondes.

**Étape 2: Exécuter le script de test SQL**

Dans **Supabase SQL Editor**, exécutez:
```
database/test_realtime.sql
```

Ce script va:
- Vérifier que Realtime est activé
- Tester les politiques RLS
- Créer une room de test
- Mettre à jour la progression

Regardez les résultats:
- Les tables doivent être marquées "✓ Activé"
- Les politiques RLS doivent permettre SELECT, INSERT, UPDATE

**Étape 3: Tester avec la page HTML**

1. Ouvrez `test_realtime.html` dans votre navigateur
2. Entrez votre URL et clé Supabase
3. Cliquez sur "Initialiser"
4. Suivez les étapes 1-4 dans l'ordre
5. Observez les logs

**Logs attendus:**
```
[timestamp] Supabase initialisé avec succès
[timestamp] ✅ Room créée
[timestamp] ✅ Joueur ajouté
[timestamp] 📡 Statut subscription: SUBSCRIBED
[timestamp] ✅ Progression mise à jour
[timestamp] 🔔 Changement PLAYERS détecté: UPDATE
```

Si vous voyez `🔔 Changement PLAYERS détecté`, **Realtime fonctionne!**

Si vous ne voyez PAS ce message, Realtime n'est pas activé.

### ✅ Solution

**Si Realtime n'est pas activé:**

Exécutez ce script dans **Supabase SQL Editor**:
```sql
-- Activer Realtime pour players
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Activer Realtime pour rooms
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Vérifier
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

Vous devriez voir `players` et `rooms` dans les résultats.

**Si Realtime est activé mais ne fonctionne toujours pas:**

1. **Rafraîchissez toutes les pages** (F5)
2. **Videz le cache** du navigateur
3. **Redémarrez** votre serveur de développement

### 🧪 Test Final

1. Ouvrez **deux navigateurs** (ou deux onglets en navigation privée)
2. Dans le premier, créez une room
3. Dans le second, rejoignez la room
4. Ouvrez la **Console (F12)** dans les deux navigateurs
5. Démarrez la partie

**Logs attendus dans la console:**
```
[setPlayerProgress] Progression mise à jour: { playerId: "...", progress: 0.1 }
[subscribeRoom] Changement détecté dans players: { ... }
[subscribeRoom] Room après changement joueur: { players: [...] }
```

Si vous voyez ces logs, les bulles devraient se mettre à jour!

### 📊 Vérification Manuelle

Si rien ne fonctionne, vérifiez manuellement dans Supabase:

1. Allez dans **Table Editor** → **players**
2. Pendant qu'un joueur joue, **rafraîchissez** la table
3. La colonne `progress` devrait changer

Si `progress` change dans la table mais pas dans l'UI:
→ Le problème est Realtime (voir solution ci-dessus)

Si `progress` ne change PAS dans la table:
→ Le problème est dans le code JavaScript (vérifiez les logs de la console)

### 🆘 Checklist de Dépannage

- [ ] Realtime activé pour `rooms` et `players` dans Dashboard
- [ ] Script `test_realtime.sql` exécuté avec succès
- [ ] Test HTML montre `🔔 Changement PLAYERS détecté`
- [ ] Console montre les logs `[setPlayerProgress]` et `[subscribeRoom]`
- [ ] La colonne `progress` change dans la table Supabase
- [ ] Les deux navigateurs sont rafraîchis (F5)
- [ ] Le cache est vidé

### 🎯 Cause Probable

Dans 90% des cas, le problème vient du fait que **Realtime n'est pas activé** pour la table `players` dans Supabase Dashboard.

**Solution rapide:**
1. Dashboard → Database → Replication
2. Cocher `players`
3. Attendre 15 secondes
4. Rafraîchir les pages (F5)

Ça devrait fonctionner! 🎉
