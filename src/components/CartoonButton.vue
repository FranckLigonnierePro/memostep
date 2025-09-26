<template>
  <button
    class="cartoon-btn"
    :class="{ pressed }"
    :aria-label="ariaLabel || label"
    @mousedown="pressed = true"
    @mouseup="pressed = false"
    @mouseleave="pressed = false"
    @touchstart.prevent="pressed = true"
    @touchend.prevent="pressed = false"
    @click="$emit('click')"
  >
    <slot>
      <span class="label">{{ label }}</span>
    </slot>
  </button>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  label: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
});

const pressed = ref(false);
</script>

<style scoped>
.cartoon-btn {
  --btn-size: 64px;
  --btn-radius: 16px;
  --btn-bg: #ffd166;
  --btn-border: #c8a03c;
  --btn-top: #fff2c2;
  --btn-shadow: #b06b25;
  --btn-text: #3a2d14;

  width: var(--btn-size);
  height: var(--btn-size);
  border-radius: var(--btn-radius);
  border: 3px solid var(--btn-border);
  background: radial-gradient(120% 120% at 30% 20%, var(--btn-top) 0%, var(--btn-bg) 55%);
  color: var(--btn-text);
  font-weight: 900;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform .08s ease, box-shadow .08s ease, filter .08s ease;
  box-shadow:
    0 8px 0 0 var(--btn-shadow),   /* profondeur */
    0 8px 16px rgba(0,0,0,.35);    /* flou */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.cartoon-btn::after {
  /* bord noir cartoon */
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: calc(var(--btn-radius) + 3px);
  box-shadow: inset 0 0 0 3px rgba(0,0,0,.65);
  pointer-events: none;
}

.cartoon-btn .label {
  font-size: 12px;
}

.cartoon-btn:focus-visible {
  outline: 3px dashed #000;
  outline-offset: 4px;
}

.cartoon-btn.pressed,
.cartoon-btn:active {
  transform: translateY(6px);
  box-shadow:
    0 2px 0 0 var(--btn-shadow),
    0 6px 10px rgba(0,0,0,.25);
  filter: brightness(.98);
}
</style>
