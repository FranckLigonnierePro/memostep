<template>
  <Teleport to="body">
    <Transition name="levelup">
      <div v-if="visible" class="levelup-overlay" @click="handleClose">
        <div class="levelup-modal" @click.stop>
          <!-- Animated stars/particles -->
          <div class="particles">
            <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></div>
          </div>
          
          <!-- Level badge with animation -->
          <div class="level-badge-container">
            <div class="level-badge">
              <div class="level-number">{{ newLevel }}</div>
            </div>
            <div class="level-rays"></div>
          </div>
          
          <!-- Title -->
          <h2 class="levelup-title">{{ $t('levelup.title') || 'LEVEL UP!' }}</h2>
          <p class="levelup-subtitle">{{ $t('levelup.reached') || 'You reached level' }} {{ newLevel }}</p>
          
          <!-- Rewards list -->
          <div v-if="rewards && rewards.length > 0" class="rewards-container">
            <h3 class="rewards-title">{{ $t('levelup.rewards') || 'Rewards' }}</h3>
            <div class="rewards-list">
              <div v-for="(rewardData, idx) in rewards" :key="idx" class="reward-item">
                <div v-if="rewardData.reward.coins" class="reward-entry">
                  <span class="reward-icon">🪙</span>
                  <span class="reward-text">+{{ rewardData.reward.coins }} {{ $t('levelup.coins') || 'Coins' }}</span>
                </div>
                <div v-if="rewardData.reward.gemmes" class="reward-entry">
                  <span class="reward-icon">💎</span>
                  <span class="reward-text">+{{ rewardData.reward.gemmes }} {{ $t('levelup.gems') || 'Gems' }}</span>
                </div>
                <div v-if="rewardData.reward.coffre" class="reward-entry">
                  <span class="reward-icon">📦</span>
                  <span class="reward-text">{{ getChestName(rewardData.reward.coffre) }}</span>
                </div>
                <div v-if="rewardData.reward.personnage" class="reward-entry">
                  <span class="reward-icon">⭐</span>
                  <span class="reward-text">{{ rewardData.reward.personnage }}</span>
                </div>
                <div v-if="rewardData.reward.skin_exclusif" class="reward-entry">
                  <span class="reward-icon">✨</span>
                  <span class="reward-text">{{ rewardData.reward.skin_exclusif }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Close button -->
          <button class="levelup-btn" @click="handleClose">
            {{ $t('levelup.continue') || 'Continue' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  newLevel: { type: Number, default: 1 },
  rewards: { type: Array, default: () => [] }, // Array of { level, reward }
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}

function particleStyle(index) {
  const angle = (index / 20) * 360;
  const distance = 150 + Math.random() * 50;
  const duration = 1 + Math.random() * 0.5;
  const delay = Math.random() * 0.3;
  
  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--duration': `${duration}s`,
    '--delay': `${delay}s`,
  };
}

function getChestName(type) {
  const names = {
    bronze: 'Bronze Chest',
    argent: 'Silver Chest',
    or: 'Gold Chest',
    légendaire: 'Legendary Chest',
    mythique: 'Mythic Chest',
  };
  return names[type] || type;
}
</script>

<style scoped>
.levelup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.levelup-modal {
  position: relative;
  background: linear-gradient(135deg, #1a1c30 0%, #2a2e52 100%);
  border-radius: 24px;
  border: 2px solid #ffd700;
  box-shadow: 
    0 0 40px rgba(255, 215, 0, 0.4),
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  overflow: hidden;
}

/* Particles animation */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #ffd700 0%, transparent 70%);
  border-radius: 50%;
  animation: particle-burst var(--duration) ease-out var(--delay) forwards;
}

@keyframes particle-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(var(--distance)) scale(0);
    opacity: 0;
  }
}

/* Level badge */
.level-badge-container {
  position: relative;
  margin: 0 auto 30px;
  width: 120px;
  height: 120px;
  animation: badge-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-entrance {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.level-badge {
  position: relative;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffc107 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #1a1c30;
  box-shadow: 
    0 0 30px rgba(255, 215, 0, 0.6),
    0 8px 16px rgba(0, 0, 0, 0.4),
    inset 0 4px 8px rgba(255, 255, 255, 0.5);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 0 30px rgba(255, 215, 0, 0.6),
      0 8px 16px rgba(0, 0, 0, 0.4),
      inset 0 4px 8px rgba(255, 255, 255, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 
      0 0 50px rgba(255, 215, 0, 0.8),
      0 12px 24px rgba(0, 0, 0, 0.5),
      inset 0 4px 8px rgba(255, 255, 255, 0.5);
  }
}

.level-number {
  font-size: 48px;
  font-weight: 900;
  color: #1a1c30;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: number-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards;
}

@keyframes number-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.level-rays {
  position: absolute;
  inset: -20px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 215, 0, 0.3) 45deg,
    transparent 90deg,
    rgba(255, 215, 0, 0.3) 135deg,
    transparent 180deg,
    rgba(255, 215, 0, 0.3) 225deg,
    transparent 270deg,
    rgba(255, 215, 0, 0.3) 315deg,
    transparent 360deg
  );
  border-radius: 50%;
  animation: rays-rotate 4s linear infinite;
  pointer-events: none;
}

@keyframes rays-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Title */
.levelup-title {
  font-size: 36px;
  font-weight: 900;
  color: #ffd700;
  margin: 0 0 8px;
  text-shadow: 
    0 0 20px rgba(255, 215, 0, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.3);
  animation: title-slide 0.6s ease-out 0.2s backwards;
}

@keyframes title-slide {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.levelup-subtitle {
  font-size: 16px;
  color: #a0a5c8;
  margin: 0 0 30px;
  animation: title-slide 0.6s ease-out 0.3s backwards;
}

/* Rewards */
.rewards-container {
  margin: 30px 0;
  animation: rewards-fade 0.6s ease-out 0.4s backwards;
}

@keyframes rewards-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rewards-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.reward-entry:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 215, 0, 0.3);
  transform: translateX(4px);
}

.reward-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.reward-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  text-align: left;
}

/* Button */
.levelup-btn {
  margin-top: 30px;
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(180deg, #ffe066 0%, #ffd43b 60%, #fcc419 100%);
  color: #1a1c30;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  box-shadow:
    0 6px 0 #b88911,
    0 10px 18px rgba(0,0,0,0.25),
    inset 0 2px 0 rgba(255,255,255,0.6);
  transition: all 0.1s ease;
  animation: button-fade 0.6s ease-out 0.5s backwards;
}

@keyframes button-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.levelup-btn:hover {
  filter: brightness(1.05);
}

.levelup-btn:active {
  transform: translateY(3px);
  box-shadow:
    0 3px 0 #b88911,
    0 6px 12px rgba(0,0,0,0.2),
    inset 0 2px 0 rgba(255,255,255,0.6);
}

/* Transition */
.levelup-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.levelup-leave-active {
  transition: all 0.3s ease-out;
}

.levelup-enter-from,
.levelup-leave-to {
  opacity: 0;
}

.levelup-enter-from .levelup-modal {
  transform: scale(0.8) translateY(-50px);
}

.levelup-leave-to .levelup-modal {
  transform: scale(0.9);
  opacity: 0;
}
</style>
