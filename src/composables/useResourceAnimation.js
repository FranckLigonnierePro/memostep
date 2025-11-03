/**
 * Composable pour gérer les animations de ressources collectées
 */

import { ref } from 'vue';

export function useResourceAnimation() {
  // Ressources collectées pendant la partie en cours
  const collectedResources = ref({
    gold: 0,
    gems: 0
  });

  // Particules d'animation en vol
  const flyingParticles = ref([]);

  /**
   * Ajoute des ressources collectées
   */
  function addCollectedResource(type, amount) {
    if (type === 'gold' || type === 'gem') {
      const key = type === 'gem' ? 'gems' : 'gold';
      collectedResources.value[key] += amount;
      console.log(`[ResourceAnimation] Added ${amount} ${type}. Total:`, collectedResources.value);
    }
  }

  /**
   * Réinitialise les ressources collectées
   */
  function resetCollectedResources() {
    collectedResources.value = { gold: 0, gems: 0 };
  }

  /**
   * Lance l'animation des ressources vers la barre de ressources
   */
  function animateResourcesToBar(playerGold, playerGems, onComplete) {
    const resources = { ...collectedResources.value };
    const particles = [];

    console.log('[ResourceAnimation] Creating particles for:', resources);

    // Créer des particules pour l'or
    const goldParticleCount = Math.min(resources.gold, 10);
    for (let i = 0; i < goldParticleCount; i++) {
      particles.push({
        id: `gold-${i}-${Date.now()}`,
        type: 'gold',
        delay: i * 100,
        amount: Math.ceil(resources.gold / goldParticleCount)
      });
    }

    // Créer des particules pour les gemmes
    const gemParticleCount = Math.min(resources.gems, 10);
    for (let i = 0; i < gemParticleCount; i++) {
      particles.push({
        id: `gem-${i}-${Date.now()}`,
        type: 'gem',
        delay: i * 100 + 50,
        amount: Math.ceil(resources.gems / gemParticleCount)
      });
    }

    console.log('[ResourceAnimation] Created particles:', particles.length);
    flyingParticles.value = particles;

    // Ajouter les ressources aux compteurs pendant l'animation
    if (playerGold && resources.gold > 0) {
      playerGold.value += resources.gold;
    }
    if (playerGems && resources.gems > 0) {
      playerGems.value += resources.gems;
    }

    // Nettoyer après l'animation
    const maxDelay = Math.max(...particles.map(p => p.delay), 0);
    setTimeout(() => {
      flyingParticles.value = [];
      resetCollectedResources();
      if (onComplete) onComplete();
    }, maxDelay + 1500);
  }

  /**
   * Vérifie s'il y a des ressources à animer
   */
  function hasResourcesToAnimate() {
    return collectedResources.value.gold > 0 || collectedResources.value.gems > 0;
  }

  return {
    collectedResources,
    flyingParticles,
    addCollectedResource,
    resetCollectedResources,
    animateResourcesToBar,
    hasResourcesToAnimate
  };
}
