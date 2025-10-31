<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="evolution-modal" :class="{ evolving: isEvolving }">
          <!-- Champion Portrait -->
          <div class="champion-portrait">
            <img :src="championData.img" :alt="championData.name" class="portrait-img" />
            <div class="level-badge current">{{ currentLevel }}</div>
            <div v-if="isEvolving" class="level-badge next">{{ nextLevel }}</div>
          </div>

          <!-- Title -->
          <h2 class="modal-title">
            <span v-if="!isEvolving">Faire évoluer {{ championData.name }} ?</span>
            <span v-else>{{ championData.name }} évolue !</span>
          </h2>

          <!-- Stats Comparison -->
          <div class="stats-container">
            <div class="stats-column">
              <div class="stats-header">Niveau {{ currentLevel }}</div>
              <div class="stat-item" v-for="(value, key) in currentStats" :key="'current-' + key">
                <span class="stat-label">{{ getStatLabel(key) }}</span>
                <span class="stat-value">{{ value }}</span>
              </div>
            </div>

            <div class="arrow-separator">
              <span class="arrow-icon">→</span>
            </div>

            <div class="stats-column next">
              <div class="stats-header">Niveau {{ nextLevel }}</div>
              <div class="stat-item" v-for="(value, key) in nextStats" :key="'next-' + key">
                <span class="stat-label">{{ getStatLabel(key) }}</span>
                <span class="stat-value improved">{{ value }}</span>
                <span v-if="getStatDiff(key) > 0" class="stat-diff">+{{ getStatDiff(key) }}</span>
              </div>
            </div>
          </div>

          <!-- New Abilities Unlocked -->
          <div v-if="newAbilities.length > 0" class="new-abilities">
            <div class="abilities-header">🎉 Nouvelles capacités débloquées !</div>
            <div class="ability-list">
              <div v-for="ability in newAbilities" :key="ability.name" class="ability-item">
                <span class="ability-icon">{{ ability.icon }}</span>
                <div class="ability-info">
                  <div class="ability-name">{{ ability.name }}</div>
                  <div class="ability-desc">{{ ability.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Evolution Cost -->
          <div v-if="!isEvolving" class="evolution-cost">
            <div class="cost-header">Coût d'évolution</div>
            <div class="cost-items">
              <div class="cost-item" :class="{ insufficient: !hasEnoughGold }">
                <span class="cost-icon">💰</span>
                <span class="cost-amount">{{ cost.gold }}</span>
              </div>
              <div class="cost-item" :class="{ insufficient: !hasEnoughEssence }">
                <span class="cost-icon">✨</span>
                <span class="cost-amount">{{ cost.essence }}</span>
              </div>
            </div>
          </div>

          <!-- Evolution Animation -->
          <div v-if="isEvolving" class="evolution-animation">
            <div class="particles">
              <span v-for="i in 30" :key="i" class="particle" :style="particleStyle(i)"></span>
            </div>
            <div class="rays">
              <span v-for="i in 8" :key="i" class="ray" :style="rayStyle(i)"></span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <button 
              v-if="!isEvolving"
              class="btn-cancel" 
              @click="$emit('close')"
            >
              Annuler
            </button>
            <button 
              v-if="!isEvolving"
              class="btn-evolve" 
              :disabled="!canAfford"
              @click="handleEvolve"
            >
              <span class="btn-icon">⬆️</span>
              <span>Évoluer</span>
            </button>
            <button 
              v-if="isEvolving && evolutionComplete"
              class="btn-continue" 
              @click="handleContinue"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  championData: { type: Object, required: true },
  currentLevel: { type: Number, required: true },
  nextLevel: { type: Number, required: true },
  currentStats: { type: Object, required: true },
  nextStats: { type: Object, required: true },
  cost: { type: Object, required: true },
  playerGold: { type: Number, required: true },
  playerEssence: { type: Number, required: true },
  newAbilities: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'evolve']);

const isEvolving = ref(false);
const evolutionComplete = ref(false);

const hasEnoughGold = computed(() => props.playerGold >= props.cost.gold);
const hasEnoughEssence = computed(() => props.playerEssence >= props.cost.essence);
const canAfford = computed(() => hasEnoughGold.value && hasEnoughEssence.value);

function getStatLabel(key) {
  const labels = {
    shieldCharges: 'Charges bouclier',
    stunDuration: 'Durée stun',
    bonusChance: 'Chance bonus',
    essenceGain: 'Gain essence'
  };
  return labels[key] || key;
}

function getStatDiff(key) {
  return props.nextStats[key] - props.currentStats[key];
}

function handleEvolve() {
  if (!canAfford.value) return;
  
  isEvolving.value = true;
  
  // Animation duration
  setTimeout(() => {
    evolutionComplete.value = true;
  }, 2500);
  
  // Emit evolve event
  emit('evolve', props.championData.id);
}

function handleContinue() {
  emit('close');
  resetModal();
}

function resetModal() {
  isEvolving.value = false;
  evolutionComplete.value = false;
}

function particleStyle(index) {
  const angle = (index / 30) * 360;
  const distance = 100 + Math.random() * 100;
  const duration = 1 + Math.random() * 1.5;
  const delay = Math.random() * 0.5;
  
  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--duration': `${duration}s`,
    '--delay': `${delay}s`
  };
}

function rayStyle(index) {
  const angle = (index / 8) * 360;
  return {
    transform: `rotate(${angle}deg)`
  };
}

// Reset when modal closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    setTimeout(resetModal, 300);
  }
});
</script>

<style scoped>
.modal-overlay {
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

.evolution-modal {
  background: linear-gradient(180deg, #1f2238 0%, #17192c 100%);
  border: 2px solid #fbbf24;
  border-radius: 24px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2);
  position: relative;
  animation: modal-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.evolution-modal.evolving {
  border-color: #8b5cf6;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.6), 0 0 80px rgba(139, 92, 246, 0.4);
  animation: evolving-pulse 2s ease-in-out infinite;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes evolving-pulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.6), 0 0 80px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 8px 40px rgba(139, 92, 246, 0.8), 0 0 100px rgba(139, 92, 246, 0.6);
  }
}

/* Champion Portrait */
.champion-portrait {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 24px;
}

.portrait-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid #fbbf24;
  object-fit: cover;
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
  transition: all 0.3s ease;
}

.evolution-modal.evolving .portrait-img {
  border-color: #8b5cf6;
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.8);
  animation: portrait-glow 2s ease-in-out infinite;
}

@keyframes portrait-glow {
  0%, 100% {
    box-shadow: 0 0 50px rgba(139, 92, 246, 0.8);
  }
  50% {
    box-shadow: 0 0 70px rgba(139, 92, 246, 1);
  }
}

.level-badge {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: 3px solid #17192c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: #000;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.6);
}

.level-badge.current {
  bottom: -8px;
  left: -8px;
}

.level-badge.next {
  bottom: -8px;
  right: -8px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  animation: badge-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-appear {
  from {
    opacity: 0;
    transform: scale(0) rotate(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Title */
.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.evolution-modal.evolving .modal-title {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: title-pulse 2s ease-in-out infinite;
}

/* Stats Container */
.stats-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: stretch;
}

.stats-column {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.stats-column.next {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.stats-header {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.stat-value.improved {
  color: #22c55e;
}

.stat-diff {
  font-size: 12px;
  font-weight: 700;
  color: #22c55e;
  margin-left: 4px;
}

.arrow-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

.arrow-icon {
  font-size: 32px;
  color: #fbbf24;
  animation: arrow-pulse 2s ease-in-out infinite;
}

@keyframes arrow-pulse {
  0%, 100% {
    transform: translateX(0);
    opacity: 0.7;
  }
  50% {
    transform: translateX(8px);
    opacity: 1;
  }
}

/* New Abilities */
.new-abilities {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15));
  border: 2px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.abilities-header {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 12px;
}

.ability-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ability-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.ability-icon {
  font-size: 24px;
  line-height: 1;
}

.ability-info {
  flex: 1;
}

.ability-name {
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 4px;
}

.ability-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

/* Evolution Cost */
.evolution-cost {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.cost-header {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cost-items {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(251, 191, 36, 0.5);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cost-item.insufficient {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.1);
}

.cost-icon {
  font-size: 24px;
  line-height: 1;
}

.cost-amount {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.cost-item.insufficient .cost-amount {
  color: #ef4444;
}

/* Evolution Animation */
.evolution-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 24px;
}

.particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #8b5cf6, #ec4899);
  border-radius: 50%;
  animation: particle-burst var(--duration) ease-out var(--delay) infinite;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.8);
}

@keyframes particle-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0);
    opacity: 0;
  }
}

.rays {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ray {
  position: absolute;
  width: 4px;
  height: 200%;
  background: linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.6), transparent);
  transform-origin: center;
  animation: ray-rotate 4s linear infinite;
}

@keyframes ray-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Action Buttons */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel,
.btn-evolve,
.btn-continue {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.btn-evolve {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
  border: 2px solid #fbbf24;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.btn-evolve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.6);
}

.btn-evolve:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-continue {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff;
  border: 2px solid #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  animation: btn-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.6);
}

@keyframes btn-appear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.btn-icon {
  font-size: 20px;
  line-height: 1;
}

/* Modal Fade Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .evolution-modal {
  animation: modal-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-leave-active .evolution-modal {
  animation: modal-exit 0.3s ease;
}

@keyframes modal-exit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* Scrollbar */
.evolution-modal::-webkit-scrollbar {
  width: 8px;
}

.evolution-modal::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.evolution-modal::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #ec4899);
  border-radius: 4px;
}
</style>
