<template>
  <div class="resource-particles-container">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="resource-particle"
      :class="particle.type"
      :style="getParticleStyle(particle)"
    >
      <img
        v-if="particle.type === 'gold'"
        src="../assets/piece.png"
        alt="coin"
        width="20"
        height="20"
      />
      <img
        v-else-if="particle.type === 'gem'"
        src="../assets/gem.png"
        alt="gem"
        width="20"
        height="20"
      />
      <span v-if="particle.amount > 1" class="particle-amount">+{{ particle.amount }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  particles: {
    type: Array,
    default: () => []
  }
});

function getParticleStyle(particle) {
  // Ajouter une variation aléatoire pour rendre l'animation plus naturelle
  const randomX = (Math.random() - 0.5) * 100;
  const randomY = (Math.random() - 0.5) * 100;
  
  return {
    animationDelay: `${particle.delay}ms`,
    '--random-x': `${randomX}px`,
    '--random-y': `${randomY}px`
  };
}
</script>

<style scoped>
.resource-particles-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.resource-particle {
  position: absolute;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 4px;
  animation: flyToResource 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  opacity: 0;
}

.resource-particle img {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.particle-amount {
  font-size: 12px;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 215, 0, 0.6);
  animation: pulse 0.3s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}

.resource-particle.gold {
  animation-name: flyToGold;
}

.resource-particle.gem {
  animation-name: flyToGem;
}

@keyframes flyToGold {
  0% {
    bottom: 50%;
    left: 50%;
    transform: translate(calc(-50% + var(--random-x, 0px)), calc(-50% + var(--random-y, 0px))) scale(0.3) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(calc(-50% + var(--random-x, 0px)), calc(-50% + var(--random-y, 0px))) scale(1.3) rotate(180deg);
  }
  100% {
    bottom: calc(100% - 40px);
    left: calc(0% + 140px);
    transform: translate(-50%, -50%) scale(0.4) rotate(720deg);
    opacity: 1;
  }
}

@keyframes flyToGem {
  0% {
    bottom: 50%;
    left: 50%;
    transform: translate(calc(-50% + var(--random-x, 0px)), calc(-50% + var(--random-y, 0px))) scale(0.3) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(calc(-50% + var(--random-x, 0px)), calc(-50% + var(--random-y, 0px))) scale(1.3) rotate(180deg);
  }
  100% {
    bottom: calc(100% - 40px);
    left: calc(0% + 230px);
    transform: translate(-50%, -50%) scale(0.4) rotate(720deg);
    opacity: 1;
  }
}

/* Variantes aléatoires pour plus de naturel */
.resource-particle:nth-child(2n) {
  animation-timing-function: cubic-bezier(0.33, 0.46, 0.45, 0.94);
}

.resource-particle:nth-child(3n) {
  animation-timing-function: cubic-bezier(0.25, 0.56, 0.45, 0.94);
}
</style>
