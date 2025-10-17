<template>
  <div class="flow-hud">
    <!-- Combo Indicator -->
    <div class="hud-combo" :style="{ color: comboColor }">
      <div class="combo-label">COMBO</div>
      <div class="combo-value">{{ formatCombo(combo) }}</div>
    </div>

    <!-- Score Display -->
    <div class="hud-score">
      <div class="score-label">SCORE</div>
      <div class="score-value">{{ formatScore(score) }}</div>
    </div>

    <!-- Streak Indicator -->
    <div v-if="streak > 0" class="hud-streak">
      <div class="streak-icon">🔥</div>
      <div class="streak-value">{{ streak }}</div>
    </div>

    <!-- Branch Indicator -->
    <div class="hud-branch" :style="{ borderColor: branchColor }">
      <div class="branch-label">{{ branchLabel }}</div>
      <div class="branch-dot" :style="{ background: branchColor }"></div>
    </div>

    <!-- Tempo Visualizer -->
    <div class="hud-tempo">
      <div class="tempo-label">{{ Math.round(tempoBPM) }} BPM</div>
      <div class="tempo-bar">
        <div 
          class="tempo-fill" 
          :style="{ 
            width: tempoPercentage + '%',
            background: tempoColor 
          }"
        ></div>
      </div>
      <div class="tempo-beat-indicator">
        <div 
          v-for="i in 4" 
          :key="i" 
          class="beat-dot"
          :class="{ active: beatInBar >= i }"
        ></div>
      </div>
    </div>

    <!-- Error Tolerance Indicator -->
    <div v-if="showErrors" class="hud-errors">
      <div class="errors-label">Erreurs</div>
      <div class="errors-dots">
        <div 
          v-for="i in errorTolerance" 
          :key="i"
          class="error-dot"
          :class="{ used: i <= errorsInPattern }"
        ></div>
      </div>
    </div>

    <!-- Flow State Indicator -->
    <div class="hud-state" :style="{ background: stateColor }">
      {{ stateLabel }}
    </div>

    <!-- Perfect/Jackpot Effects -->
    <transition name="perfect-fade">
      <div v-if="showPerfectFX" class="perfect-fx">
        <div class="perfect-halo"></div>
        <div class="perfect-text">PERFECT!</div>
      </div>
    </transition>

    <transition name="jackpot-fade">
      <div v-if="showJackpotFX" class="jackpot-fx">
        <div class="jackpot-explosion">
          <div 
            v-for="i in 20" 
            :key="i" 
            class="jackpot-particle"
            :style="particleStyle(i)"
          ></div>
        </div>
        <div class="jackpot-text">JACKPOT!</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ColorManager } from '../lib/fxManager.js';
import { TEMPO, PATTERN } from '../lib/flowConfig.js';

const props = defineProps({
  combo: { type: Number, default: 1.0 },
  score: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  branch: { type: String, default: 'FULL_PREVIEW' },
  flowState: { type: String, default: 'OBSERVE' },
  tempoBPM: { type: Number, default: 100 },
  beatCount: { type: Number, default: 0 },
  errorsInPattern: { type: Number, default: 0 },
  errorTolerance: { type: Number, default: PATTERN.ERROR_TOLERANCE },
  showPerfectFX: { type: Boolean, default: false },
  showJackpotFX: { type: Boolean, default: false },
  showErrors: { type: Boolean, default: true },
});

// Formatage
const formatCombo = (combo) => `×${combo.toFixed(1)}`;
const formatScore = (score) => score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Couleurs
const comboColor = computed(() => ColorManager.getComboColor(props.combo));
const branchColor = computed(() => ColorManager.getBranchColor(props.branch));
const stateColor = computed(() => ColorManager.getStateColor(props.flowState));
const tempoColor = computed(() => {
  const normalized = (props.tempoBPM - TEMPO.BASE_BPM) / (TEMPO.MAX_BPM - TEMPO.BASE_BPM);
  if (normalized >= 0.8) return '#fa5252';
  if (normalized >= 0.6) return '#fab005';
  if (normalized >= 0.4) return '#12b886';
  return '#4dabf7';
});

// Labels
const branchLabel = computed(() => {
  const labels = {
    FLOW_CHAIN: 'FLOW',
    QUICK_PREVIEW: 'QUICK',
    FULL_PREVIEW: 'FULL',
  };
  return labels[props.branch] || props.branch;
});

const stateLabel = computed(() => {
  const labels = {
    OBSERVE: 'OBSERVE',
    INPUT: 'INPUT',
    REWARD: 'REWARD',
    TRANSITION: 'NEXT',
  };
  return labels[props.flowState] || props.flowState;
});

// Tempo
const tempoPercentage = computed(() => {
  return ((props.tempoBPM - TEMPO.BASE_BPM) / (TEMPO.MAX_BPM - TEMPO.BASE_BPM)) * 100;
});

const beatInBar = computed(() => props.beatCount % 4);

// Particules jackpot
const particleStyle = (index) => {
  const angle = (Math.PI * 2 * index) / 20;
  const distance = 100 + Math.random() * 50;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  
  return {
    '--tx': `${x}px`,
    '--ty': `${y}px`,
    animationDelay: `${index * 0.05}s`,
  };
};
</script>

<style scoped>
.flow-hud {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
  pointer-events: none;
}

/* Combo */
.hud-combo {
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 20px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid currentColor;
  box-shadow: 0 0 20px currentColor;
}

.combo-label {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.7;
  letter-spacing: 1px;
}

.combo-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-top: 4px;
}

/* Score */
.hud-score {
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 20px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #12b886;
}

.score-label {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.7;
  letter-spacing: 1px;
  color: #12b886;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: #12b886;
  margin-top: 4px;
}

/* Streak */
.hud-streak {
  background: rgba(255, 107, 0, 0.2);
  padding: 8px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid #ff6b00;
  animation: pulse 1s ease-in-out infinite;
}

.streak-icon {
  font-size: 20px;
}

.streak-value {
  font-size: 20px;
  font-weight: 700;
  color: #ff6b00;
}

/* Branch */
.hud-branch {
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid;
}

.branch-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
}

.branch-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

/* Tempo */
.hud-tempo {
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #4dabf7;
}

.tempo-label {
  font-size: 12px;
  font-weight: 600;
  color: #4dabf7;
  margin-bottom: 6px;
}

.tempo-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.tempo-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: 3px;
}

.tempo-beat-indicator {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.beat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.1s ease;
}

.beat-dot.active {
  background: #4dabf7;
  box-shadow: 0 0 8px #4dabf7;
  transform: scale(1.3);
}

/* Errors */
.hud-errors {
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 12px;
  border: 2px solid #fa5252;
}

.errors-label {
  font-size: 10px;
  font-weight: 600;
  color: #fa5252;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.errors-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.error-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #fa5252;
  transition: all 0.2s ease;
}

.error-dot.used {
  background: #fa5252;
  box-shadow: 0 0 8px #fa5252;
}

/* State */
.hud-state {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 1px;
  color: white;
}

/* Perfect FX */
.perfect-fx {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}

.perfect-halo {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(18, 184, 134, 0.3) 0%, transparent 70%);
  animation: perfect-pulse 2s ease-out;
}

.perfect-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: 900;
  color: #12b886;
  text-shadow: 0 0 20px #12b886;
  animation: perfect-zoom 2s ease-out;
}

/* Jackpot FX */
.jackpot-fx {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}

.jackpot-explosion {
  position: relative;
  width: 400px;
  height: 400px;
}

.jackpot-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #FFD700;
  animation: jackpot-explode 3s ease-out forwards;
}

.jackpot-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 64px;
  font-weight: 900;
  color: #FFD700;
  text-shadow: 0 0 30px #FFD700;
  animation: jackpot-zoom 3s ease-out;
}

/* Animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes perfect-pulse {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes perfect-zoom {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

@keyframes jackpot-explode {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}

@keyframes jackpot-zoom {
  0% { transform: translate(-50%, -50%) scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0; }
}

.perfect-fade-enter-active, .perfect-fade-leave-active,
.jackpot-fade-enter-active, .jackpot-fade-leave-active {
  transition: opacity 0.3s ease;
}

.perfect-fade-enter-from, .perfect-fade-leave-to,
.jackpot-fade-enter-from, .jackpot-fade-leave-to {
  opacity: 0;
}
</style>
