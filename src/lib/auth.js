/**
 * auth.js
 * 
 * Gestion de l'authentification et liaison des comptes guests
 * Utilise Supabase Auth pour Google, Apple, Email
 */

import { createClient } from '@supabase/supabase-js';

let supabase = null;

/**
 * Initialise le client Supabase Auth
 */
export function initAuth() {
  if (supabase) return supabase;
  
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  }
  
  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  return supabase;
}

/**
 * Récupère le client Supabase
 */
export function getSupabase() {
  if (!supabase) initAuth();
  return supabase;
}

/**
 * Récupère la session actuelle
 */
export async function getSession() {
  const sb = getSupabase();
  const { data: { session }, error } = await sb.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Récupère l'utilisateur actuel
 */
export async function getCurrentUser() {
  const sb = getSupabase();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export async function isAuthenticated() {
  try {
    const session = await getSession();
    return !!session;
  } catch {
    return false;
  }
}

// ============================================
// CONNEXION AVEC PROVIDERS
// ============================================

/**
 * Connexion avec Google
 */
export async function signInWithGoogle() {
  const sb = getSupabase();
  
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Connexion avec Apple
 */
export async function signInWithApple() {
  const sb = getSupabase();
  
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Connexion avec Email (Magic Link)
 */
export async function signInWithEmail(email) {
  const sb = getSupabase();
  
  const { data, error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Connexion avec Email et Mot de passe
 */
export async function signInWithPassword(email, password) {
  const sb = getSupabase();
  
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

/**
 * Inscription avec Email et Mot de passe
 */
export async function signUpWithPassword(email, password, username) {
  const sb = getSupabase();
  
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0]
      }
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Déconnexion
 */
export async function signOut() {
  const sb = getSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

// ============================================
// GESTION DES PROFILS
// ============================================

/**
 * Crée ou met à jour le profil utilisateur
 */
export async function createOrUpdateProfile(user, additionalData = {}) {
  const sb = getSupabase();
  
  const username = additionalData.username || 
                   user.user_metadata?.username || 
                   user.email?.split('@')[0] || 
                   `User${user.id.slice(0, 8)}`;
  
  const profileData = {
    id: user.id,
    username,
    display_name: additionalData.display_name || user.user_metadata?.full_name || username,
    avatar_url: additionalData.avatar_url || user.user_metadata?.avatar_url || null,
    is_guest: false,
    updated_at: new Date().toISOString()
  };
  
  // Upsert profile
  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();
  
  if (profileError) throw profileError;
  
  // Vérifier si player_stats existe, sinon créer
  const { data: stats, error: statsError } = await sb
    .from('player_stats')
    .select('player_id')
    .eq('player_id', user.id)
    .maybeSingle();
  
  if (!stats) {
    const { error: createStatsError } = await sb
      .from('player_stats')
      .insert({ player_id: user.id });
    
    if (createStatsError) throw createStatsError;
  }
  
  return profile;
}

/**
 * Récupère le profil complet d'un utilisateur
 */
export async function getProfile(userId) {
  const sb = getSupabase();
  
  const { data, error } = await sb
    .from('profiles')
    .select(`
      *,
      player_stats (*)
    `)
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// LIAISON DES COMPTES GUESTS
// ============================================

/**
 * Récupère les données du guest depuis localStorage
 */
export function getGuestData() {
  try {
    const username = localStorage.getItem('memostep_username');
    const selectedAvatar = localStorage.getItem('selectedAvatar');
    const playerXp = localStorage.getItem('memostep_player_xp');
    const resources = localStorage.getItem('memostep_resources');
    
    return {
      username: username ? String(username).trim() : null,
      selectedAvatar: selectedAvatar ? JSON.parse(selectedAvatar) : null,
      xpData: playerXp ? JSON.parse(playerXp) : null,
      resources: resources ? JSON.parse(resources) : null
    };
  } catch (error) {
    console.error('[Auth] Error getting guest data:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur actuel est un guest
 */
export function isGuest() {
  try {
    const username = localStorage.getItem('memostep_username');
    if (!username) return true; // Pas de username = guest par défaut
    
    const usernameStr = String(username).trim();
    // Guest si correspond au pattern Memoguest####
    return /^Memoguest\d{4}$/.test(usernameStr);
  } catch {
    return true;
  }
}

/**
 * Migre les données du guest vers le compte authentifié
 */
export async function migrateGuestData(user) {
  const sb = getSupabase();
  const guestData = getGuestData();
  
  if (!guestData) {
    console.log('[Auth] No guest data to migrate');
    return;
  }
  
  console.log('[Auth] Migrating guest data:', guestData);
  
  try {
    // 1. Créer/mettre à jour le profil avec les données du guest
    await createOrUpdateProfile(user, {
      username: guestData.username && !isGuest() ? guestData.username : undefined,
      avatar_url: guestData.selectedAvatar?.img || null
    });
    
    // 2. Migrer les stats XP
    if (guestData.xpData?.totalXp) {
      await sb
        .from('player_stats')
        .update({
          total_xp: guestData.xpData.totalXp,
          current_level: calculateLevelFromXP(guestData.xpData.totalXp)
        })
        .eq('player_id', user.id);
    }
    
    // 3. Migrer les ressources
    if (guestData.resources) {
      await sb
        .from('player_stats')
        .update({
          gold: guestData.resources.gold || 0,
          essence: guestData.resources.essence || 0,
          gems: guestData.resources.gems || 0
        })
        .eq('player_id', user.id);
    }
    
    // 4. Migrer les données de solo_scores si le guest a un player_id
    const guestPlayerId = localStorage.getItem('memostep_player_id');
    if (guestPlayerId) {
      const { data: soloScore } = await sb
        .from('solo_scores')
        .select('*')
        .eq('player_id', guestPlayerId)
        .maybeSingle();
      
      if (soloScore) {
        await sb
          .from('player_stats')
          .update({
            solo_best_level: Math.max(soloScore.best_level || 0, 0),
            solo_best_time_ms: soloScore.best_time_ms,
            solo_total_levels: soloScore.total_levels || 0
          })
          .eq('player_id', user.id);
      }
    }
    
    // 5. Débloquer l'avatar sélectionné
    if (guestData.selectedAvatar?.id) {
      await sb
        .from('player_avatars')
        .upsert({
          player_id: user.id,
          avatar_id: guestData.selectedAvatar.id,
          is_selected: true
        }, { onConflict: 'player_id,avatar_id' });
    }
    
    console.log('[Auth] Guest data migration completed');
    
    // 6. Marquer la migration comme terminée (optionnel)
    localStorage.setItem('memostep_migrated', 'true');
    
  } catch (error) {
    console.error('[Auth] Error migrating guest data:', error);
    throw error;
  }
}

/**
 * Calcule le niveau depuis l'XP total (simplifié)
 */
function calculateLevelFromXP(totalXp) {
  let level = 1;
  let xpUsed = 0;
  
  for (let i = 1; i <= 50; i++) {
    const xpRequired = 100 + (i - 1) * 50;
    if (totalXp >= xpUsed + xpRequired) {
      xpUsed += xpRequired;
      level = i + 1;
    } else {
      break;
    }
  }
  
  return Math.min(level, 50);
}

/**
 * Lie un compte guest existant à un compte authentifié
 * (Flow complet de liaison)
 */
export async function linkGuestAccount(provider = 'google') {
  // 1. Sauvegarder les données du guest
  const guestData = getGuestData();
  if (!guestData) {
    throw new Error('No guest data found');
  }
  
  // 2. Sauvegarder dans sessionStorage pour récupération après redirect
  sessionStorage.setItem('memostep_guest_migration', JSON.stringify(guestData));
  
  // 3. Initier la connexion selon le provider
  switch (provider) {
    case 'google':
      return await signInWithGoogle();
    case 'apple':
      return await signInWithApple();
    case 'email':
      // Pour email, on retourne null et on laisse l'UI gérer l'input
      return null;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Complète la liaison après le callback OAuth
 * (À appeler dans la page de callback)
 */
export async function completeLinkGuestAccount() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  // Récupérer les données du guest depuis sessionStorage
  const guestDataStr = sessionStorage.getItem('memostep_guest_migration');
  if (guestDataStr) {
    const guestData = JSON.parse(guestDataStr);
    
    // Restaurer dans localStorage temporairement pour la migration
    if (guestData.username) localStorage.setItem('memostep_username', guestData.username);
    if (guestData.selectedAvatar) localStorage.setItem('selectedAvatar', JSON.stringify(guestData.selectedAvatar));
    if (guestData.xpData) localStorage.setItem('memostep_player_xp', JSON.stringify(guestData.xpData));
    if (guestData.resources) localStorage.setItem('memostep_resources', JSON.stringify(guestData.resources));
    
    // Nettoyer sessionStorage
    sessionStorage.removeItem('memostep_guest_migration');
  }
  
  // Migrer les données
  await migrateGuestData(user);
  
  return user;
}

// ============================================
// LISTENERS D'ÉVÉNEMENTS AUTH
// ============================================

/**
 * Écoute les changements d'état d'authentification
 */
export function onAuthStateChange(callback) {
  const sb = getSupabase();
  
  const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State change:', event, session?.user?.id);
    
    // Créer/mettre à jour le profil lors de la connexion
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        // Vérifier si c'est une première connexion ou une liaison
        const hasMigrated = localStorage.getItem('memostep_migrated');
        
        if (!hasMigrated && isGuest()) {
          // Migrer les données du guest
          await migrateGuestData(session.user);
        } else {
          // Juste créer/mettre à jour le profil
          await createOrUpdateProfile(session.user);
        }
      } catch (error) {
        console.error('[Auth] Error in SIGNED_IN handler:', error);
      }
    }
    
    // Appeler le callback utilisateur
    callback(event, session);
  });
  
  return subscription;
}

/**
 * Nettoie les listeners
 */
export function cleanupAuthListeners(subscription) {
  if (subscription) {
    subscription.unsubscribe();
  }
}
