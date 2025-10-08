// Supabase Realtime client for Versus mode - Version 2 avec table players séparée
// Requires env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
import { createClient } from '@supabase/supabase-js';

let supabase = null;
let roomSubscription = null;
// Cache local de la dernière snapshot de room par code pour des mises à jour optimistes
const roomCache = new Map();

export function initRealtime() {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  supabase = createClient(url, key, { auth: { persistSession: false } });
  return supabase;
}

// Fixed 8-color palette used across the app
export const PLAYER_COLORS = [
  '#e74c3c', // red
  '#e67e22', // orange
  '#f1c40f', // yellow
  '#2ecc71', // green
  '#1abc9c', // teal
  '#3498db', // blue
  '#9b59b6', // purple
  '#fd79a8', // pink
];

function pickAvailableColor(usedColors = []) {
  const used = new Set((usedColors || []).filter(Boolean).map(c => String(c).toLowerCase()));
  for (const c of PLAYER_COLORS) {
    if (!used.has(c.toLowerCase())) return c;
  }
  // Fallback: palette exhausted, pick random from palette
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

// Helper: Récupérer tous les joueurs d'une room
async function getRoomPlayers(roomCode) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', roomCode)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  const players = (data || []).map(p => ({
    id: p.player_id,
    name: p.name,
    color: p.color,
    score: p.score,
    lives: p.lives,
    progress: p.progress,
    current_round: p.current_round || 1
  }));
  console.log('[getRoomPlayers] Joueurs récupérés:', players.map(p => ({ id: p.id?.slice(0,6), round: p.current_round, progress: p.progress })));
  return players;
}

// Helper: Récupérer une room avec ses joueurs
async function getRoomWithPlayers(roomCode) {
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .single();
  
  if (roomErr) throw roomErr;
  if (!room) throw new Error('Room not found');
  
  const players = await getRoomPlayers(roomCode);
  const full = { ...room, players };
  roomCache.set(roomCode, full);
  console.log('[getRoomWithPlayers] Room complète:', { code: roomCode, playerCount: players.length });
  return full;
}

// Report a round result with both winner and loser. This increments the winner's
// score, decrements the loser's lives. If winner reaches 5 or loser hits 0 lives,
// the room finishes. Otherwise a new round is scheduled and returned.
export async function reportRoundResult(code, winnerId, loserId, timeMs) {
  initRealtime();
  
  // Récupérer la room et ses joueurs
  const room = await getRoomWithPlayers(code);
  const players = room.players;
  
  // Trouver le gagnant et le perdant
  const winner = players.find(p => p.id === winnerId);
  const loser = players.find(p => p.id === loserId);
  
  // Mettre à jour le score du gagnant
  if (winner) {
    const { error: winErr } = await supabase
      .from('players')
      .update({ score: winner.score + 1 })
      .eq('room_code', code)
      .eq('player_id', winnerId);
    if (winErr) throw winErr;
  }
  
  // Mettre à jour les vies du perdant
  if (loser) {
    const newLives = Math.max(0, loser.lives - 1);
    const { error: loseErr } = await supabase
      .from('players')
      .update({ lives: newLives })
      .eq('room_code', code)
      .eq('player_id', loserId);
    if (loseErr) throw loseErr;
  }
  
  const winnerReached = winner && winner.score + 1 >= 5;
  const loserBusted = loser && loser.lives - 1 <= 0;
  
  if (winnerReached || loserBusted) {
    const { data, error: upErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs })
      .eq('code', code)
      .select('*')
      .single();
    if (upErr) throw upErr;
    return await getRoomWithPlayers(code);
  }
  
  const seed = Math.floor(Math.random() * 1e9);
  const startAtMs = Date.now() + 1500;
  const { data, error: upErr } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs })
    .eq('code', code)
    .select('*')
    .single();
  if (upErr) throw upErr;
  return await getRoomWithPlayers(code);
}

// Reset the room to a fresh lobby state: reset all players' lives/scores/progress and clear seed
export async function resetRoom(code) {
  initRealtime();
  // Reset players
  const { error: playersErr } = await supabase
    .from('players')
    .update({ lives: 3, score: 0, progress: 0, current_round: 1 })
    .eq('room_code', code);
  if (playersErr) throw playersErr;

  // Reset room status and clear seed/start
  const { error: roomErr } = await supabase
    .from('rooms')
    .update({ status: 'waiting', seed: null, start_at_ms: null, winner_id: null, winner_time_ms: null })
    .eq('code', code);
  if (roomErr) throw roomErr;

  return await getRoomWithPlayers(code);
}

// Update a player's per-round progress (0..1) without changing seed/start/status.
// This enables realtime UI for bubbles.
// Chaque joueur est mis à jour indépendamment dans sa propre ligne.
// AUCUN risque d'écraser les données des autres joueurs.
export async function setPlayerProgress(code, playerId, progress) {
  initRealtime();
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  
  // Stratégie: Essayer d'abord une mise à jour, si aucune ligne affectée, créer le joueur
  // Cela évite une lecture préalable et est plus performant
  const { data: updated, error: upErr } = await supabase
    .from('players')
    .update({ progress: p })
    .eq('room_code', code)
    .eq('player_id', playerId)
    .select();
  
  if (upErr) throw upErr;
  
  // Si aucune ligne n'a été mise à jour, le joueur n'existe pas encore
  if (!updated || updated.length === 0) {
    console.log('[setPlayerProgress] Joueur non trouvé, création...');
    // Récupérer les couleurs utilisées pour en choisir une nouvelle
    const players = await getRoomPlayers(code);
    const usedColors = players.map(pl => pl.color);
    const color = pickAvailableColor(usedColors);
    
    // Créer le joueur avec la progression initiale
    const { error: insErr } = await supabase
      .from('players')
      .insert([{
        room_code: code,
        player_id: playerId,
        name: 'Player',
        color,
        score: 0,
        lives: 3,
        progress: p,
        current_round: 1
      }]);
    if (insErr) throw insErr;
    console.log('[setPlayerProgress] Joueur créé avec progression:', p);
  } else {
    console.log('[setPlayerProgress] ✅ Progression mise à jour:', { playerId: playerId.slice(0,8), progress: p });
  }
  
  // Retourner null pour éviter une requête coûteuse
  // Le realtime subscription mettra à jour l'UI automatiquement
  return null;
}

export async function joinRoom(code, playerId, name) {
  initRealtime();
  
  console.log('[joinRoom] Tentative de rejoindre:', { code, playerId, name });
  
  // Vérifier que la room existe
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error) {
    console.error('[joinRoom] Erreur lors de la récupération de la room:', error);
    throw error;
  }
  if (!room) throw new Error('Room not found');
  
  console.log('[joinRoom] Room trouvée:', room);
  
  // Vérifier si le joueur existe déjà
  const { data: existing, error: getErr } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', code)
    .eq('player_id', playerId)
    .maybeSingle();
  
  if (getErr) {
    console.error('[joinRoom] Erreur lors de la vérification du joueur:', getErr);
    throw getErr;
  }
  
  if (existing) {
    console.log('[joinRoom] Joueur existe déjà, mise à jour du nom');
    // Mettre à jour le nom du joueur
    const { error: upErr } = await supabase
      .from('players')
      .update({ name: name || existing.name || 'Player' })
      .eq('room_code', code)
      .eq('player_id', playerId);
    if (upErr) {
      console.error('[joinRoom] Erreur lors de la mise à jour:', upErr);
      throw upErr;
    }
  } else {
    console.log('[joinRoom] Nouveau joueur, création...');
    // Créer un nouveau joueur
    const players = await getRoomPlayers(code);
    const usedColors = players.map(p => p.color);
    const color = pickAvailableColor(usedColors);
    
    console.log('[joinRoom] Couleur choisie:', color);
    
    const { error: insErr } = await supabase
      .from('players')
      .insert([{
        room_code: code,
        player_id: playerId,
        name: name || 'Player',
        color,
        score: 0,
        lives: 3,
        progress: 0,
        current_round: 1
      }]);
    if (insErr) {
      console.error('[joinRoom] Erreur lors de l\'insertion:', insErr);
      throw insErr;
    }
    console.log('[joinRoom] Joueur créé avec succès');
  }
  
  // Vérifier que le joueur a bien été ajouté et retourner la room complète
  const finalPlayers = await getRoomPlayers(code);
  console.log('[joinRoom] Joueurs dans la room après join:', finalPlayers);
  
  // Retourner la room complète pour forcer une mise à jour de l'UI
  const fullRoom = await getRoomWithPlayers(code);
  console.log('[joinRoom] ✅ Join réussi, room complète:', { code, playerCount: fullRoom.players.length });
  return fullRoom;
}

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function createRoom(hostId, hostName) {
  initRealtime();
  const code = randomCode(6);
  const hostColor = pickAvailableColor([]);
  
  // Créer la room (avec guest_id à null)
  const { error: roomErr } = await supabase
    .from('rooms')
    .insert([{ 
      code, 
      status: 'waiting', 
      host_id: hostId,
      guest_id: null
    }]);
  
  if (roomErr) throw roomErr;
  
  // Créer le joueur hôte
  const { error: playerErr } = await supabase
    .from('players')
    .insert([{
      room_code: code,
      player_id: hostId,
      name: hostName || 'Player',
      color: hostColor,
      score: 0,
      lives: 3,
      progress: 0
    }]);
  
  if (playerErr) throw playerErr;
  
  return code;
}

export async function startRoom(code, seed, startAtMs) {
  initRealtime();
  
  // Réinitialiser la progression de tous les joueurs
  const { error: resetErr } = await supabase
    .from('players')
    .update({ progress: 0 })
    .eq('room_code', code);
  
  if (resetErr) throw resetErr;
  
  // Mettre à jour la room
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing', seed, start_at_ms: startAtMs })
    .eq('code', code);
  
  if (error) throw error;
}

export async function finishRoom(code, winnerId, timeMs) {
  initRealtime();
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'finished', winner_id: winnerId, winner_time_ms: timeMs })
    .eq('code', code);
  if (error) throw error;
}

// Report a round win in versus mode. Increments the winner's score.
// If the winner reaches 5, finishes the room. Otherwise, schedules
// a new round by updating a fresh seed and synchronized start_at_ms while keeping
// status to 'playing'. Returns the updated room snapshot with players.
export async function reportRoundWin(code, winnerId, timeMs) {
  initRealtime();
  
  // Récupérer la room et ses joueurs
  const room = await getRoomWithPlayers(code);
  const players = room.players;
  
  // Trouver le joueur gagnant
  const winner = players.find(p => p.id === winnerId);
  
  if (winner) {
    const nextScore = winner.score + 1;
    
    // Mettre à jour le score
    const { error: scoreErr } = await supabase
      .from('players')
      .update({ score: nextScore })
      .eq('room_code', code)
      .eq('player_id', winnerId);
    
    if (scoreErr) throw scoreErr;
    
    // Rafraîchir les joueurs après mise à jour
    const updatedPlayers = await getRoomPlayers(code);
    
    // Check if match should end:
    // 1. All players finished (score >= 5)
    // 2. OR only one player has lives remaining
    const allFinished = updatedPlayers.every(p => p.score >= 5);
    const playersWithLives = updatedPlayers.filter(p => p.lives > 0);
    const onlyOneAlive = playersWithLives.length <= 1;
    
    if (allFinished || onlyOneAlive) {
      // Determine winner: highest score, or last one alive
      const sortedByScore = updatedPlayers.slice().sort((a, b) => b.score - a.score);
      const finalWinner = sortedByScore[0];
      
      const { error: upErr } = await supabase
        .from('rooms')
        .update({ 
          status: 'finished', 
          winner_id: finalWinner?.id || winnerId, 
          winner_time_ms: timeMs 
        })
        .eq('code', code);
      
      if (upErr) throw upErr;
      return await getRoomWithPlayers(code);
    }
    
    // Chaque joueur avance à son propre rythme
    // Quand un joueur finit son round, il passe au suivant
    // Les autres continuent leur round actuel
    
    // Incrémenter le current_round du joueur gagnant et réinitialiser sa progression
    const { error: roundErr } = await supabase
      .from('players')
      .update({ 
        current_round: (winner.current_round || 1) + 1,
        progress: 0 
      })
      .eq('room_code', code)
      .eq('player_id', winnerId);
    
    if (roundErr) throw roundErr;
    
    console.log('[reportRoundWin] Joueur', winnerId, 'passe au round', (winner.current_round || 1) + 1);
    
    return await getRoomWithPlayers(code);
  }
  
  return room;
}

export function subscribeRoom(code, callback) {
  initRealtime();
  if (roomSubscription) {
    supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  }
  
  console.log('[subscribeRoom] Abonnement à la room:', code);
  
  // S'abonner aux changements de la room ET des joueurs
  roomSubscription = supabase
    .channel(`room:${code}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'rooms', 
      filter: `code=eq.${code}` 
    }, async (payload) => {
      console.log('[subscribeRoom] Changement détecté dans rooms:', payload);
      // Quand la room change, récupérer les joueurs et envoyer le tout
      const room = await getRoomWithPlayers(code).catch((err) => {
        console.error('[subscribeRoom] Erreur getRoomWithPlayers:', err);
        const cached = roomCache.get(code);
        return cached || payload.new || payload.old || null;
      });
      console.log('[subscribeRoom] Room mise à jour:', room);
      callback(room);
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'players', 
      filter: `room_code=eq.${code}` 
    }, async (payload) => {
      console.log('[subscribeRoom] Changement détecté dans players:', payload);
      // Mise à jour optimiste immédiate à partir du payload
      try {
        const cached = roomCache.get(code);
        console.log('[subscribeRoom] Cache disponible:', !!cached, 'Payload:', !!payload?.new);
        if (cached && (payload?.new || payload?.old)) {
          const row = payload.new || payload.old;
          const pid = row.player_id;
          console.log('[subscribeRoom] Mise à jour du joueur:', pid, 'progress:', row.progress);
          const idx = Array.isArray(cached.players) ? cached.players.findIndex(p => p && p.id === pid) : -1;
          console.log('[subscribeRoom] Index du joueur dans le cache:', idx, 'Total joueurs:', cached.players?.length);
          const updatedPlayer = {
            id: row.player_id,
            name: row.name ?? (cached.players?.[idx]?.name || 'Player'),
            color: row.color ?? (cached.players?.[idx]?.color || '#ffffff'),
            score: row.score ?? (cached.players?.[idx]?.score || 0),
            lives: row.lives ?? (cached.players?.[idx]?.lives || 3),
            progress: row.progress ?? (cached.players?.[idx]?.progress || 0),
            current_round: row.current_round ?? (cached.players?.[idx]?.current_round || 1),
          };
          const nextPlayers = Array.isArray(cached.players) ? [...cached.players] : [];
          if (idx >= 0) {
            nextPlayers[idx] = updatedPlayer;
          } else {
            nextPlayers.push(updatedPlayer);
          }
          const optimistic = { ...cached, players: nextPlayers };
          roomCache.set(code, optimistic);
          console.log('[subscribeRoom] ✅ Optimistic room update from payload:', { 
            playerId: pid, 
            progress: updatedPlayer.progress,
            allPlayers: nextPlayers.map(p => ({ id: p.id?.slice(0,6), progress: p.progress }))
          });
          callback(optimistic);
        } else {
          console.warn('[subscribeRoom] ⚠️ Pas de cache ou payload vide, skip optimistic update');
        }
      } catch (e) {
        console.error('[subscribeRoom] ❌ Optimistic merge error:', e);
      }

      // Puis rafraîchir en arrière-plan pour garantir la cohérence
      const fresh = await getRoomWithPlayers(code).catch((err) => {
        console.error('[subscribeRoom] Erreur getRoomWithPlayers (refresh):', err);
        return null;
      });
      if (fresh) {
        console.log('[subscribeRoom] Room après refresh joueur:', fresh);
        callback(fresh);
      }
    })
    .subscribe((status) => {
      console.log('[subscribeRoom] Statut de la subscription:', status);
    });
  
  return () => {
    console.log('[subscribeRoom] Désabonnement de la room:', code);
    if (roomSubscription) supabase.removeChannel(roomSubscription);
    roomSubscription = null;
  };
}

export async function getRoom(code) {
  initRealtime();
  return await getRoomWithPlayers(code);
}

// Decrement lives for a given loser without awarding a round win or changing the
// current round seed/start time. If lives reach 0, finish the room and set winner_id.
export async function reportLifeLoss(code, loserId, winnerIdIfBusted) {
  initRealtime();
  
  // Récupérer le joueur
  const { data: player, error: getErr } = await supabase
    .from('players')
    .select('*')
    .eq('room_code', code)
    .eq('player_id', loserId)
    .maybeSingle();
  
  if (getErr) throw getErr;
  
  const currentLives = player ? player.lives : 3;
  const newLives = Math.max(0, currentLives - 1);
  
  if (player) {
    // Mettre à jour les vies
    const { error: upErr } = await supabase
      .from('players')
      .update({ lives: newLives })
      .eq('room_code', code)
      .eq('player_id', loserId);
    
    if (upErr) throw upErr;
  } else {
    // Créer le joueur s'il n'existe pas
    const players = await getRoomPlayers(code);
    const usedColors = players.map(p => p.color);
    const color = pickAvailableColor(usedColors);
    
    const { error: insErr } = await supabase
      .from('players')
      .insert([{
        room_code: code,
        player_id: loserId,
        name: 'Player',
        color,
        score: 0,
        lives: newLives,
        progress: 0
      }]);
    
    if (insErr) throw insErr;
  }
  
  if (newLives <= 0 && winnerIdIfBusted) {
    const { error: finishErr } = await supabase
      .from('rooms')
      .update({ status: 'finished', winner_id: winnerIdIfBusted })
      .eq('code', code);
    
    if (finishErr) throw finishErr;
  }
  
  return await getRoomWithPlayers(code);
}
