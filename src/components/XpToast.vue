<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="xp-toast"
        :class="{ 'toast-levelup': toast.isLevelUp }"
      >
        <div class="toast-icon">
          <span v-if="toast.isLevelUp">⭐</span>
          <span v-else>✨</span>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <div class="toast-xp">+{{ toast.xp }}</div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  notifications: { type: Array, default: () => [] },
});

const toasts = ref([]);
let toastId = 0;

// Watch for new notifications
watch(() => props.notifications, (newNotifications) => {
  newNotifications.forEach(notification => {
    const id = toastId++;
    const toast = {
      id,
      ...notification,
    };
    
    toasts.value.push(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      const index = toasts.value.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.value.splice(index, 1);
      }
    }, 3000);
  });
}, { deep: true });
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.xp-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1a1c30 0%, #2a2e52 100%);
  border-radius: 12px;
  border: 1px solid #7b2cff;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(123, 44, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-width: 280px;
  pointer-events: auto;
  animation: toast-glow 2s ease-in-out infinite;
}

@keyframes toast-glow {
  0%, 100% {
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(123, 44, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 30px rgba(123, 44, 255, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

.xp-toast.toast-levelup {
  border-color: #ffd700;
  animation: toast-glow-gold 2s ease-in-out infinite;
}

@keyframes toast-glow-gold {
  0%, 100% {
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(255, 215, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 30px rgba(255, 215, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

.toast-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7b2cff 0%, #a78bfa 100%);
  border-radius: 10px;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toast-levelup .toast-icon {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.toast-message {
  font-size: 12px;
  color: #a0a5c8;
  line-height: 1.2;
}

.toast-xp {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 900;
  color: #7b2cff;
  text-shadow: 0 0 10px rgba(123, 44, 255, 0.5);
}

.toast-levelup .toast-xp {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* Transitions */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.3s ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
