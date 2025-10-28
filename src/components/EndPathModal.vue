<template>
  <Teleport to="body">
    <Transition name="endpath">
      <div v-if="visible" class="endpath-overlay" @click.self="handleAbandon">
        <div class="endpath-modal">
          <!-- Status icon -->
          <div class="status-icon" :class="statusClass">
            <span v-if="status === 'completed'">🎉</span>
            <span v-else-if="status === 'no_life_left'">💔</span>
            <span v-else>⏸️</span>
          </div>
          
          <!-- Title -->
          <h2 class="endpath-title">{{ getTitle() }}</h2>
          <p class="endpath-subtitle">{{ getSubtitle() }}</p>
          
          <!-- Stats -->
          <div class="stats-container">
            <div class="stat-row">
              <span class="stat-label">{{ $t('endpath.stage') || 'Stage' }}</span>
              <span class="stat-value">{{ stage }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">{{ $t('endpath.time') || 'Time' }}</span>
              <span class="stat-value">{{ formatTime(timeSeconds) }}</span>
            </div>
            <div v-if="livesLeft !== null" class="stat-row">
              <span class="stat-label">{{ $t('endpath.lives') || 'Lives' }}</span>
              <span class="stat-value">❤️ {{ livesLeft }}/3</span>
            </div>
          </div>
          
          <!-- XP Breakdown -->
          <div class="xp-breakdown">
            <h3 class="xp-title">{{ $t('endpath.xpEarned') || 'XP Earned' }}</h3>
            <div class="xp-details">
              <div class="xp-line">
                <span>{{ $t('endpath.baseXp') || 'Base XP' }} ({{ stage }} stages)</span>
                <span class="xp-amount">+{{ xpBreakdown.baseXp }}</span>
              </div>
              <div class="xp-line">
                <span>{{ $t('endpath.timeBonus') || 'Time Bonus' }} ({{ timeSeconds }}s)</span>
                <span class="xp-amount">+{{ xpBreakdown.timeXp }}</span>
              </div>
              <div class="xp-line multiplier">
                <span>{{ $t('endpath.multiplier') || 'Multiplier' }} ({{ getMultiplierLabel() }})</span>
                <span class="xp-amount">×{{ xpBreakdown.multiplier }}</span>
              </div>
              <div class="xp-line total">
                <span>{{ $t('endpath.total') || 'Total' }}</span>
                <span class="xp-amount total-xp">{{ xpBreakdown.totalXp }} XP</span>
              </div>
            </div>
          </div>
          
          <!-- Buttons -->
          <div class="button-container">
            <button 
              v-if="status !== 'no_life_left'"
              class="endpath-btn secondary" 
              @click="handleAbandon"
            >
              {{ $t('endpath.stop') || 'Stop' }}
            </button>
            <button 
              class="endpath-btn primary" 
              @click="handleContinue"
            >
              {{ status === 'no_life_left' ? ($t('endpath.backHome') || 'Back to Home') : ($t('endpath.continue') || 'Continue') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  status: { type: String, default: 'completed' }, // 'completed', 'no_life_left', 'abandon'
  stage: { type: Number, default: 1 },
  timeSeconds: { type: Number, default: 0 },
  livesLeft: { type: Number, default: null },
  xpBreakdown: { 
    type: Object, 
    default: () => ({ baseXp: 0, timeXp: 0, multiplier: 1.0, totalXp: 0 })
  },
});

const emit = defineEmits(['continue', 'abandon']);

const statusClass = computed(() => {
  return {
    'status-completed': props.status === 'completed',
    'status-failed': props.status === 'no_life_left',
    'status-paused': props.status === 'abandon'
  };
});

function getTitle() {
  switch (props.status) {
    case 'completed':
      return 'Stage Completed!';
    case 'no_life_left':
      return 'Game Over';
    default:
      return 'Pause';
  }
}

function getSubtitle() {
  switch (props.status) {
    case 'completed':
      return 'Great job! Ready for the next challenge?';
    case 'no_life_left':
      return 'No lives left. Better luck next time!';
    default:
      return 'Take a break or keep going?';
  }
}

function getMultiplierLabel() {
  switch (props.status) {
    case 'completed':
      return 'Completed';
    case 'no_life_left':
      return 'Failed';
    default:
      return 'Abandon';
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleContinue() {
  emit('continue');
}

function handleAbandon() {
  emit('abandon');
}
</script>

<style scoped>
.endpath-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.endpath-modal {
  position: relative;
  background: linear-gradient(135deg, #1a1c30 0%, #2a2e52 100%);
  border-radius: 24px;
  border: 2px solid #4c6ef5;
  box-shadow: 
    0 0 40px rgba(76, 110, 245, 0.3),
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

/* Status Icon */
.status-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 48px;
  animation: icon-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes icon-entrance {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.status-icon.status-completed {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
}

.status-icon.status-failed {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
}

.status-icon.status-paused {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
}

/* Title */
.endpath-title {
  font-size: 32px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 8px;
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

.endpath-subtitle {
  font-size: 16px;
  color: #a0a5c8;
  margin: 0 0 30px;
  animation: title-slide 0.6s ease-out 0.3s backwards;
}

/* Stats */
.stats-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  animation: stats-fade 0.6s ease-out 0.4s backwards;
}

@keyframes stats-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #a0a5c8;
  font-weight: 600;
}

.stat-value {
  font-size: 16px;
  color: #fff;
  font-weight: 700;
}

/* XP Breakdown */
.xp-breakdown {
  background: rgba(123, 44, 255, 0.1);
  border: 1px solid rgba(123, 44, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  animation: xp-fade 0.6s ease-out 0.5s backwards;
}

@keyframes xp-fade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.xp-title {
  font-size: 16px;
  font-weight: 700;
  color: #a78bfa;
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.xp-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xp-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #a0a5c8;
}

.xp-line.multiplier {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #fbbf24;
}

.xp-line.total {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 2px solid rgba(123, 44, 255, 0.5);
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.xp-amount {
  font-weight: 700;
  color: #a78bfa;
}

.xp-amount.total-xp {
  font-size: 20px;
  color: #c4b5fd;
  text-shadow: 0 0 10px rgba(123, 44, 255, 0.5);
}

/* Buttons */
.button-container {
  display: flex;
  gap: 12px;
  justify-content: center;
  animation: button-fade 0.6s ease-out 0.6s backwards;
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

.endpath-btn {
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
}

.endpath-btn.primary {
  background: linear-gradient(180deg, #ffe066 0%, #ffd43b 60%, #fcc419 100%);
  color: #1a1c30;
  box-shadow:
    0 6px 0 #b88911,
    0 10px 18px rgba(0,0,0,0.25),
    inset 0 2px 0 rgba(255,255,255,0.6);
}

.endpath-btn.primary:hover {
  filter: brightness(1.05);
  transform: translateY(-2px);
  box-shadow:
    0 8px 0 #b88911,
    0 12px 20px rgba(0,0,0,0.3),
    inset 0 2px 0 rgba(255,255,255,0.6);
}

.endpath-btn.primary:active {
  transform: translateY(3px);
  box-shadow:
    0 3px 0 #b88911,
    0 6px 12px rgba(0,0,0,0.2),
    inset 0 2px 0 rgba(255,255,255,0.6);
}

.endpath-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
}

.endpath-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
}

.endpath-btn.secondary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
}

/* Transition */
.endpath-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.endpath-leave-active {
  transition: all 0.3s ease-out;
}

.endpath-enter-from,
.endpath-leave-to {
  opacity: 0;
}

.endpath-enter-from .endpath-modal {
  transform: scale(0.8) translateY(-50px);
}

.endpath-leave-to .endpath-modal {
  transform: scale(0.9);
  opacity: 0;
}
</style>
