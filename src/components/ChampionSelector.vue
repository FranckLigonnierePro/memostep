<template>
  <div class="profile-view">
    <div class="profile-body mt-4" style="height: 100%;">
      <p class="profile-title">Choisis ton personnage</p>
      <div v-if="secondsLeft != null" style="margin-bottom:8px; color:#cbd5e1; font-weight:600;">Départ dans {{ secondsLeft }}s</div>
      <div class="cards-grid">
        <button
          v-for="(card, idx) in cards"
          :key="idx"
          class="char-card"
          :style="{ '--accent': card.color, '--glow': card.glow, opacity: isTaken(card) ? .4 : 1 }"
          :disabled="isTaken(card)"
          @click="$emit('select', card)"
        >
          <div class="card-media">
            <img class="char-img" :src="card.img" :alt="card.name" />
          </div>
          <div class="card-label">{{ card.name }}</div>
          <div class="sparkles" aria-hidden="true">
            <span v-for="n in 20" :key="n" class="p"></span>
          </div>
        </button>
      </div>
      <div class="footer">
        <button class="btn" @click="$emit('close')">Fermer</button>
      </div>
    </div>
  </div>
  
</template>

<script setup>
const props = defineProps({
  cards: { type: Array, default: () => [] },
  taken: { type: Array, default: () => [] }, // array of avatar_url strings taken (match against card.img)
  secondsLeft: { type: Number, default: null },
});

function isTaken(card) {
  try { return Array.isArray(props.taken) && props.taken.includes(card.img); } catch (_) { return false; }
}
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
  min-height: 0; /* allow children to shrink for scrolling */
  justify-content: center;
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
  /* Make the grid scrollable within the available space */
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 25px; /* tighter sides, keep vertical space for shadows */
  box-sizing: border-box;
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
</style>
