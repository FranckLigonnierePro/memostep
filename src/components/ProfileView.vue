<template>
  <div class="profile-view">
    <div class="profile-body mt-4">
      <p class="profile-title">Progression XP</p>

      <!-- XP Progress Roadmap -->
      <div class="xp-roadmap-container">
        <div class="xp-roadmap-header">
          <div class="current-level-badge">
            <div class="badge-inner">{{ playerLevel }}</div>
          </div>
          <div class="xp-info">
            <div class="xp-text">Niveau {{ playerLevel }}</div>
            <div class="xp-bar">
              <div class="xp-bar-fill" :style="{ width: (playerLevelProgress * 100) + '%' }"></div>
            </div>
            <div class="xp-numbers">{{ currentLevelXp }} / {{ nextLevelXp }} XP</div>
          </div>
        </div>
        
        <div class="xp-roadmap-scroll">
          <div class="xp-roadmap-track">
            <div 
              v-for="levelData in levelsList" 
              :key="levelData.level"
              class="level-milestone"
              :class="{
                'completed': levelData.level < playerLevel,
                'current': levelData.level === playerLevel,
                'locked': levelData.level > playerLevel
              }"
            >
              <div class="milestone-connector" v-if="levelData.level > 1"></div>
              <div class="milestone-node">
                <div class="node-inner">{{ levelData.level }}</div>
              </div>
              <div class="milestone-rewards">
                <div class="reward-title">Niveau {{ levelData.level }}</div>
                <div class="reward-list" v-if="levelData.reward">
                  <div v-if="levelData.reward.coins" class="reward-item">
                    <span class="reward-icon">💰</span>
                    <span>{{ levelData.reward.coins }} coins</span>
                  </div>
                  <div v-if="levelData.reward.gemmes" class="reward-item">
                    <span class="reward-icon">💎</span>
                    <span>{{ levelData.reward.gemmes }} gemmes</span>
                  </div>
                  <div v-if="levelData.reward.coffre" class="reward-item">
                    <span class="reward-icon">📦</span>
                    <span>Coffre {{ levelData.reward.coffre }}</span>
                  </div>
                  <div v-if="levelData.reward.personnage" class="reward-item special">
                    <span class="reward-icon">⭐</span>
                    <span>{{ levelData.reward.personnage }}</span>
                  </div>
                  <div v-if="levelData.reward.skin_exclusif" class="reward-item special">
                    <span class="reward-icon">👑</span>
                    <span>{{ levelData.reward.skin_exclusif }}</span>
                  </div>
                </div>
                <div class="reward-xp">{{ levelData.xp_required }} XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <button class="btn" @click="$emit('close')">Retour</button>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import xpSystemData from '../lib/playerXpSystem.json';
import { calculateLevel } from '../lib/xpSystem.js';

const props = defineProps({
  playerLevel: { type: Number, default: 1 },
  playerTotalXp: { type: Number, default: 0 },
  playerLevelProgress: { type: Number, default: 0 },
  championsState: { type: Object, default: () => ({}) },
  playerGold: { type: Number, default: 0 },
  playerEssence: { type: Number, default: 0 }
});

const emit = defineEmits(['close']);

const levelsList = computed(() => xpSystemData.player_xp_system.levels);

const currentLevelInfo = computed(() => calculateLevel(props.playerTotalXp));
const currentLevelXp = computed(() => {
  if (props.playerLevel >= 50) return props.playerTotalXp;
  return currentLevelInfo.value.currentLevelXp || 0;
});
const nextLevelXp = computed(() => {
  if (props.playerLevel >= 50) return 0;
  return currentLevelInfo.value.xpForNextLevel || 0;
});
</script>

<style scoped>
.profile-view {
  margin-bottom: .5rem;
  justify-content: space-between;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.profile-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.profile-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cards-grid {
  display: grid;
  align-items: stretch;
  align-content: start;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  padding: 2px 25px;
  box-sizing: border-box;
  margin-top: 16px;
  margin-bottom: 16px;
}

.char-card {
  position: relative;
  display: block;
  padding: 0;
  border-radius: 14px;
  border: 1px solid #2a2e52;
  background: #17192c;
  box-shadow: 0 2px 0 #1a1c30;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform .06s ease, box-shadow .06s ease, background .06s ease;
  /* Playing card ratio */
  aspect-ratio: 2 / 3;
  overflow: hidden;
}
.char-card:hover { background: #1f2238; border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset, 0 0 12px var(--glow), 0 0 18px var(--glow); }
.char-card:active { transform: translateY(1px); box-shadow: 0 1px 0 #1a1c30; }
.card-media { position: absolute; inset: 0; }
.char-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-label {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1;
  text-align: center;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.65) 100%);
  text-shadow: 0 0 6px var(--glow), 0 0 2px rgba(0,0,0,0.65);
  z-index: 3;
}

/* Sparkling particles overlay (rising sparks) */
.sparkles {
  position: absolute; inset: 0; pointer-events: none; z-index: 2; /* above image */
  opacity: 0;
  transition: opacity .15s ease;
  mix-blend-mode: screen;
}
.char-card:hover .sparkles { opacity: 1; }
.sparkles { z-index: 4; } /* ensure particles above label for visibility */
.sparkles .p {
  position: absolute;
  bottom: 0px;
  width: 2px; height: 2px;
  background: radial-gradient(circle at 50% 50%, #fff 0 40%, var(--accent) 70%);
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--accent), 0 0 10px var(--glow), 0 0 2px #fff;
  filter: drop-shadow(0 0 10px var(--glow));
  opacity: 0;
  will-change: transform, opacity;
  display: block; /* ensure width/height apply on span */
}

/* tiny trailing flame */
.sparkles .p::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 12px;
  background: linear-gradient(to top, var(--accent), transparent);
  filter: blur(2px);
  opacity: .6;
}
/* Animate always (for touch devices), intensify on hover */
/* Only animate on hover */
.char-card .sparkles .p { animation: none; }
.char-card:hover .sparkles .p { animation: rise 1.6s linear infinite; }

/* Assign varied positions, delays, and drifts */
.sparkles .p:nth-child(1)  { left: 6%;  animation-delay: 0.00s; animation-duration: 1.4s; }
.sparkles .p:nth-child(2)  { left: 14%; animation-delay: 0.15s; animation-duration: 1.8s; }
.sparkles .p:nth-child(3)  { left: 22%; animation-delay: 0.05s; animation-duration: 1.5s; }
.sparkles .p:nth-child(4)  { left: 30%; animation-delay: 0.25s; animation-duration: 1.9s; }
.sparkles .p:nth-child(5)  { left: 38%; animation-delay: 0.10s; animation-duration: 1.6s; }
.sparkles .p:nth-child(6)  { left: 46%; animation-delay: 0.35s; animation-duration: 1.7s; }
.sparkles .p:nth-child(7)  { left: 54%; animation-delay: 0.05s; animation-duration: 1.3s; }
.sparkles .p:nth-child(8)  { left: 62%; animation-delay: 0.20s; animation-duration: 1.8s; }
.sparkles .p:nth-child(9)  { left: 70%; animation-delay: 0.10s; animation-duration: 1.6s; }
.sparkles .p:nth-child(10) { left: 78%; animation-delay: 0.30s; animation-duration: 1.9s; }
.sparkles .p:nth-child(11) { left: 86%; animation-delay: 0.12s; animation-duration: 1.5s; }
.sparkles .p:nth-child(12) { left: 26%; animation-delay: 0.40s; animation-duration: 1.7s; }
.sparkles .p:nth-child(13) { left: 50%; animation-delay: 0.22s; animation-duration: 1.6s; }
.sparkles .p:nth-child(14) { left: 74%; animation-delay: 0.08s; animation-duration: 1.4s; }
.sparkles .p:nth-child(15) { left: 12%; animation-delay: 0.28s; animation-duration: 1.7s; }
.sparkles .p:nth-child(16) { left: 18%; animation-delay: 0.06s; animation-duration: 1.5s; }
.sparkles .p:nth-child(17) { left: 58%; animation-delay: 0.18s; animation-duration: 1.9s; }
.sparkles .p:nth-child(18) { left: 66%; animation-delay: 0.12s; animation-duration: 1.6s; }
.sparkles .p:nth-child(19) { left: 82%; animation-delay: 0.26s; animation-duration: 1.8s; }
.sparkles .p:nth-child(20) { left: 34%; animation-delay: 0.04s; animation-duration: 1.5s; }

/* Size variations for a more natural fire look */
.sparkles .p:nth-child(odd)  { width: 3px; height: 3px; }
.sparkles .p:nth-child(3n)   { width: 5px; height: 5px; }
.sparkles .p:nth-child(4n)   { width: 6px; height: 6px; }
.sparkles .p:nth-child(5n)   { width: 7px; height: 7px; }

@keyframes rise {
  0%   { transform: translate(0, 0) scale(0.8); opacity: 0; }
  10%  { opacity: .95; }
  50%  { opacity: .95; }
  100% { transform: translate(var(--dx, 6px), -180% ) scale(1); opacity: 0; }
}

/* Different horizontal drift per particle */
.sparkles .p:nth-child(odd)  { --dx: -8px; }
.sparkles .p:nth-child(even) { --dx: 10px; }
.sparkles .p:nth-child(3n)   { --dx: -12px; }
.sparkles .p:nth-child(5n)   { --dx: 14px; }

.btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #2a2e52;
  margin-top: .75rem;
  background: #1a1c30;
  color: #fff;
  box-shadow: 0 2px 0 #1a1c30;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.footer { display:flex; justify-content:center; margin-top: 12px; }

/* XP Roadmap Styles */
.xp-roadmap-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto 20px;
  background: rgba(23, 25, 44, 0.6);
  border: 1px solid #2a2e52;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.xp-roadmap-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2e52;
}

.current-level-badge {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3);
  position: relative;
  flex-shrink: 0;
}

.current-level-badge::before {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  opacity: 0.3;
  filter: blur(8px);
  z-index: -1;
}

.badge-inner {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.xp-info {
  flex: 1;
  min-width: 0;
}

.xp-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}

.xp-bar {
  width: 100%;
  height: 12px;
  background: rgba(42, 46, 82, 0.6);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  margin-bottom: 4px;
}

.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);
}

.xp-bar-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.xp-numbers {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.xp-roadmap-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 4px;
  scrollbar-width: thin;
  scrollbar-color: #8b5cf6 rgba(42, 46, 82, 0.4);
}

.xp-roadmap-scroll::-webkit-scrollbar {
  width: 8px;
}

.xp-roadmap-scroll::-webkit-scrollbar-track {
  background: rgba(42, 46, 82, 0.4);
  border-radius: 4px;
}

.xp-roadmap-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #ec4899);
  border-radius: 4px;
}

.xp-roadmap-track {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.level-milestone {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  padding: 12px;
  background: rgba(31, 34, 56, 0.4);
  border: 1px solid #2a2e52;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.level-milestone.completed {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.level-milestone.current {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

.level-milestone.locked {
  opacity: 0.5;
}

.milestone-connector {
  position: absolute;
  left: 30px;
  top: -12px;
  width: 2px;
  height: 12px;
  background: linear-gradient(180deg, transparent, #2a2e52);
}

.level-milestone.completed .milestone-connector {
  background: linear-gradient(180deg, transparent, #8b5cf6);
}

.milestone-node {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1f2238;
  border: 2px solid #2a2e52;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.level-milestone.completed .milestone-node {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-color: #8b5cf6;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
}

.level-milestone.current .milestone-node {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-color: #fbbf24;
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.node-inner {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.milestone-rewards {
  flex: 1;
  min-width: 0;
}

.reward-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(42, 46, 82, 0.6);
  border: 1px solid #2a2e52;
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  transition: all 0.2s ease;
}

.reward-item:hover {
  background: rgba(42, 46, 82, 0.9);
  border-color: #8b5cf6;
  transform: translateY(-2px);
}

.reward-item.special {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
  border-color: #8b5cf6;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
}

.reward-icon {
  font-size: 16px;
  line-height: 1;
}

.reward-xp {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
}

.level-milestone.completed .reward-xp {
  color: rgba(139, 92, 246, 0.8);
}

/* Champion Info Overlay */
.champion-info {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 100%);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 6px 8px;
  z-index: 2;
  pointer-events: none;
}

.champion-level {
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
  margin-bottom: 4px;
}

.champion-xp-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 3px;
}

.champion-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.8);
}

.champion-xp-text {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  text-align: center;
}

/* Evolution Button */
.evolve-btn {
  position: absolute;
  bottom: 32px;
  left: 8px;
  right: 8px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: 2px solid #fbbf24;
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4), 0 0 16px rgba(251, 191, 36, 0.3);
  animation: evolve-pulse 2s ease-in-out infinite;
}

.evolve-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.6), 0 0 24px rgba(251, 191, 36, 0.5);
}

.evolve-btn:active {
  transform: translateY(0);
}

.evolve-btn.disabled {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  border-color: #6b7280;
  cursor: not-allowed;
  opacity: 0.6;
  animation: none;
  box-shadow: none;
}

.evolve-btn.disabled:hover {
  transform: none;
  box-shadow: none;
}

.evolve-icon {
  font-size: 14px;
  line-height: 1;
}

.evolve-text {
  font-size: 10px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.evolve-btn.disabled .evolve-text {
  color: rgba(255, 255, 255, 0.5);
}

.evolve-cost {
  display: flex;
  gap: 6px;
  font-size: 9px;
  font-weight: 600;
  color: #000;
}

.evolve-btn.disabled .evolve-cost {
  color: rgba(255, 255, 255, 0.5);
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

@keyframes evolve-pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4), 0 0 16px rgba(251, 191, 36, 0.3);
  }
  50% {
    box-shadow: 0 2px 12px rgba(251, 191, 36, 0.6), 0 0 24px rgba(251, 191, 36, 0.5);
  }
}
</style>
