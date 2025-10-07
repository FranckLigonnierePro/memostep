<template>
  <div v-if="visible" class="power-wheel-overlay">
    <div class="power-wheel-container">
      <h2 class="wheel-title">Roue des Pouvoirs</h2>
      
      <!-- Wheel -->
      <div class="wheel-wrapper">
        <div class="wheel" :class="{ spinning: isSpinning }" :style="{ transform: `rotate(${rotation}deg)` }">
          <div
            v-for="(power, index) in powers"
            :key="index"
            class="wheel-slot"
            :style="getSlotStyle(index)"
            @click="!isSpinning && selectPower(index)"
          >
            <div class="slot-content">
              <div class="slot-icon">{{ power.icon }}</div>
              <div class="slot-name">{{ power.name }}</div>
            </div>
          </div>
        </div>
        
        <!-- Pointer -->
        <div class="wheel-pointer"></div>
      </div>
      
      <div v-if="selectedPower" class="selected-power">
        <div class="selected-icon">{{ selectedPower.icon }}</div>
        <div class="selected-name">{{ selectedPower.name }}</div>
        <div class="selected-desc">{{ selectedPower.description }}</div>
      </div>
      
      <button v-if="!isSpinning" class="spin-btn" @click="spin">
        {{ selectedPower ? 'Relancer' : 'Tourner la roue' }}
      </button>
      
      <div v-if="isSpinning" class="spinning-text">La roue tourne...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['powerSelected', 'close']);

// Liste des pouvoirs (pour l'instant visuels uniquement)
const powers = [
  { id: 'speed', name: 'Vitesse', icon: '⚡', description: 'Temps de mémorisation réduit' },
  { id: 'shield', name: 'Bouclier', icon: '🛡️', description: 'Une vie supplémentaire' },
  { id: 'vision', name: 'Vision', icon: '👁️', description: 'Aperçu du chemin pendant 2s' },
  { id: 'freeze', name: 'Gel', icon: '❄️', description: 'Gèle les adversaires 3s' },
  { id: 'double', name: 'Double', icon: '✨', description: 'Points doublés ce tour' },
  { id: 'swap', name: 'Échange', icon: '🔄', description: 'Échange ton score avec un adversaire' },
  { id: 'reveal', name: 'Révélation', icon: '💡', description: 'Révèle la prochaine case' },
  { id: 'chaos', name: 'Chaos', icon: '🌀', description: 'Mélange les chemins adverses' }
];

const isSpinning = ref(false);
const rotation = ref(0);
const selectedPower = ref(null);

const slotAngle = 360 / powers.length;

function getSlotStyle(index) {
  const angle = index * slotAngle;
  return {
    transform: `rotate(${angle}deg) translateY(-120px)`,
    '--slot-color': getSlotColor(index)
  };
}

function getSlotColor(index) {
  const colors = ['#6F08EF', '#12b886', '#ff2e5f', '#ffa94d', '#4dabf7', '#ff6b9d', '#51cf66', '#845ef7'];
  return colors[index % colors.length];
}

function selectPower(index) {
  // Pour l'instant, ne fait rien au clic (comme demandé)
  // selectedPower.value = powers[index];
  // emit('powerSelected', powers[index]);
}

function spin() {
  if (isSpinning.value) return;
  
  isSpinning.value = true;
  
  // Nombre de tours complets + position finale aléatoire
  const spins = 3 + Math.random() * 2; // 3-5 tours
  const randomIndex = Math.floor(Math.random() * powers.length);
  const finalAngle = spins * 360 + (randomIndex * slotAngle);
  
  rotation.value = finalAngle;
  
  // Après l'animation (3 secondes)
  setTimeout(() => {
    isSpinning.value = false;
    selectedPower.value = powers[randomIndex];
    emit('powerSelected', powers[randomIndex]);
  }, 3000);
}
</script>

<style scoped>
.power-wheel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 300ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.power-wheel-container {
  background: var(--panel, #17192c);
  border: 2px solid #2a2e52;
  border-radius: 20px;
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: slideUp 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.wheel-title {
  margin: 0;
  font-size: 24px;
  color: var(--text, #e7e7ee);
  font-weight: 700;
}

.wheel-wrapper {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1c30 0%, #0f1020 100%);
  border: 4px solid #2a2e52;
  box-shadow: 0 0 40px rgba(111, 8, 239, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5);
  transition: transform 3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.wheel.spinning {
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.wheel-slot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  margin-left: -35px;
  margin-top: -35px;
  transform-origin: center center;
  cursor: pointer;
  transition: transform 200ms ease;
}

.wheel-slot:hover {
  transform: rotate(var(--angle, 0deg)) translateY(-120px) scale(1.1) !important;
}

.slot-content {
  width: 100%;
  height: 100%;
  background: var(--slot-color, #6F08EF);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 200ms ease;
}

.wheel-slot:hover .slot-content {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.4);
}

.slot-icon {
  font-size: 28px;
  line-height: 1;
}

.slot-name {
  font-size: 9px;
  font-weight: 700;
  color: white;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.wheel-pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 25px solid #ff2e5f;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  z-index: 10;
}

.selected-power {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(111, 8, 239, 0.1);
  border: 1px solid rgba(111, 8, 239, 0.3);
  border-radius: 12px;
  min-width: 200px;
  animation: powerReveal 400ms ease;
}

@keyframes powerReveal {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.selected-icon {
  font-size: 48px;
}

.selected-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text, #e7e7ee);
}

.selected-desc {
  font-size: 13px;
  color: var(--muted, #9aa0b4);
  text-align: center;
  font-weight: 500;
}

.spin-btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: 2px solid #6F08EF;
  background: linear-gradient(135deg, #6F08EF 0%, #8b3aff 100%);
  color: white;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 0 #5606bf, 0 6px 20px rgba(111, 8, 239, 0.4);
  transition: all 150ms ease;
}

.spin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #5606bf, 0 8px 24px rgba(111, 8, 239, 0.5);
}

.spin-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #5606bf, 0 4px 16px rgba(111, 8, 239, 0.3);
}

.spinning-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent, #6F08EF);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
