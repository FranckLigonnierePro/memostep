# Comparaison: Ancienne vs Nouvelle Structure

## Requêtes de base

### Récupérer une room avec ses joueurs

**Ancienne structure (JSONB):**
```javascript
const { data: room } = await supabase
  .from('rooms')
  .select('*')
  .eq('code', code)
  .single();
// room.players est déjà un array JSON
```

**Nouvelle structure (Table séparée):**
```javascript
// Option 1: Deux requêtes
const { data: room } = await supabase
  .from('rooms')
  .select('*')
  .eq('code', code)
  .single();

const { data: players } = await supabase
  .from('players')
  .select('*')
  .eq('room_code', code);

// Option 2: Utiliser la vue
const { data: room } = await supabase
  .from('rooms_with_players')
  .select('*')
  .eq('code', code)
  .single();
// room.players est un array JSON construit par la vue
```

## Mise à jour d'un joueur

### Mettre à jour le score d'un joueur

**Ancienne structure:**
```javascript
// 1. Récupérer toute la room
const { data: room } = await supabase
  .from('rooms')
  .select('*')
  .eq('code', code)
  .single();

// 2. Modifier le tableau JSON en mémoire
const players = room.players.slice();
const idx = players.findIndex(p => p.id === playerId);
if (idx !== -1) {
  players[idx] = { ...players[idx], score: newScore };
}

// 3. Réécrire tout le tableau
const { data } = await supabase
  .from('rooms')
  .update({ players })
  .eq('code', code);
```

**Nouvelle structure:**
```javascript
// Mise à jour directe et atomique
const { data } = await supabase
  .from('players')
  .update({ score: newScore })
  .eq('room_code', code)
  .eq('player_id', playerId);
```

## Ajouter un joueur

### Ajouter un nouveau joueur à une room

**Ancienne structure:**
```javascript
// 1. Récupérer la room
const { data: room } = await supabase
  .from('rooms')
  .select('*')
  .eq('code', code)
  .single();

// 2. Ajouter au tableau
const players = [...room.players, newPlayer];

// 3. Réécrire tout le tableau
await supabase
  .from('rooms')
  .update({ players })
  .eq('code', code);
```

**Nouvelle structure:**
```javascript
// Insertion directe
await supabase
  .from('players')
  .insert([{
    room_code: code,
    player_id: newPlayer.id,
    name: newPlayer.name,
    color: newPlayer.color,
    score: 0,
    lives: 3,
    progress: 0
  }]);
```

## Requêtes avancées

### Trouver toutes les rooms où un joueur est présent

**Ancienne structure:**
```javascript
// Impossible de faire efficacement avec JSONB
// Il faudrait récupérer toutes les rooms et filtrer en JavaScript
const { data: allRooms } = await supabase
  .from('rooms')
  .select('*');

const myRooms = allRooms.filter(room => 
  room.players.some(p => p.id === playerId)
);
```

**Nouvelle structure:**
```javascript
// Requête SQL efficace avec index
const { data: myRooms } = await supabase
  .from('players')
  .select('room_code, rooms(*)')
  .eq('player_id', playerId);
```

### Obtenir le classement des joueurs par score

**Ancienne structure:**
```javascript
// Impossible avec SQL, doit être fait en JavaScript
const { data: rooms } = await supabase
  .from('rooms')
  .select('*');

const allPlayers = rooms.flatMap(room => 
  room.players.map(p => ({ ...p, room_code: room.code }))
);

const ranking = allPlayers.sort((a, b) => b.score - a.score);
```

**Nouvelle structure:**
```javascript
// Requête SQL directe et efficace
const { data: ranking } = await supabase
  .from('players')
  .select('*')
  .order('score', { ascending: false })
  .limit(10);
```

### Compter les joueurs actifs

**Ancienne structure:**
```javascript
const { data: rooms } = await supabase
  .from('rooms')
  .select('*')
  .eq('status', 'playing');

const totalPlayers = rooms.reduce((sum, room) => 
  sum + (room.players?.length || 0), 0
);
```

**Nouvelle structure:**
```javascript
const { count } = await supabase
  .from('players')
  .select('*', { count: 'exact', head: true })
  .in('room_code', 
    supabase
      .from('rooms')
      .select('code')
      .eq('status', 'playing')
  );
```

## Realtime Subscriptions

### S'abonner aux changements

**Ancienne structure:**
```javascript
// Un seul canal pour tout
supabase
  .channel(`room:${code}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'rooms', 
    filter: `code=eq.${code}` 
  }, (payload) => {
    // Tout changement déclenche un événement
    // Même si un seul joueur change
    callback(payload.new);
  })
  .subscribe();
```

**Nouvelle structure:**
```javascript
// Deux canaux pour une granularité fine
supabase
  .channel(`room:${code}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'rooms', 
    filter: `code=eq.${code}` 
  }, async (payload) => {
    // Changements de la room (status, seed, etc.)
    const room = await getRoomWithPlayers(code);
    callback(room);
  })
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'players', 
    filter: `room_code=eq.${code}` 
  }, async () => {
    // Changements des joueurs (score, lives, progress)
    const room = await getRoomWithPlayers(code);
    callback(room);
  })
  .subscribe();
```

## Performance

### Taille des données transférées

**Ancienne structure:**
```
Mise à jour du score d'un joueur:
- Lecture: ~2KB (toute la room + tous les joueurs)
- Écriture: ~2KB (toute la room + tous les joueurs)
- Total: ~4KB
```

**Nouvelle structure:**
```
Mise à jour du score d'un joueur:
- Lecture: ~200B (un seul joueur)
- Écriture: ~200B (un seul joueur)
- Total: ~400B (10x plus efficace)
```

### Concurrence

**Ancienne structure:**
```
Problème: Si deux joueurs mettent à jour leur score simultanément,
l'un des deux écrase les changements de l'autre car ils modifient
tous les deux le même champ JSONB.

Solution: Utiliser des transactions ou des verrous optimistes.
```

**Nouvelle structure:**
```
Pas de problème: Chaque joueur a sa propre ligne dans la table.
Les mises à jour sont atomiques et isolées par défaut.
```

## Conclusion

### Avantages de la nouvelle structure

✅ **Performance**: Requêtes plus rapides, moins de données transférées  
✅ **Concurrence**: Pas de conflits de mise à jour  
✅ **Flexibilité**: Requêtes SQL avancées possibles  
✅ **Maintenabilité**: Code plus simple et plus lisible  
✅ **Scalabilité**: Meilleure performance avec beaucoup de joueurs  
✅ **Intégrité**: Contraintes de clé étrangère  
✅ **Realtime**: Granularité fine des événements  

### Inconvénients potentiels

⚠️ **Complexité**: Nécessite une migration  
⚠️ **Requêtes**: Parfois besoin de jointures (mais la vue aide)  
⚠️ **Compatibilité**: Nécessite de mettre à jour le code existant  

### Recommandation

**La nouvelle structure est fortement recommandée** pour tout projet qui:
- A plus de 2-3 joueurs par room
- Nécessite des mises à jour fréquentes
- Veut faire des requêtes avancées sur les joueurs
- Prévoit de scaler l'application
