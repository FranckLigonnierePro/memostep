/**
 * Composable pour gérer l'audio du jeu
 */

import { ref } from 'vue';
import { getAudioMuted, setAudioMuted } from '../lib/storage.js';

export function useAudio(audioRef) {
  const audioMuted = ref(true);

  function ensureAudio() {
    const el = audioRef.value;
    if (!el) return;
    el.muted = audioMuted.value;
    el.loop = true;
  }

  async function tryPlay() {
    const el = audioRef.value;
    if (!el) return;
    try {
      await el.play();
    } catch (_) {
      // Autoplay might be blocked until user gesture
    }
  }

  function toggleAudio() {
    audioMuted.value = !audioMuted.value;
    setAudioMuted(audioMuted.value);
    ensureAudio();
    if (!audioMuted.value) {
      tryPlay();
    } else {
      const el = audioRef.value;
      if (el) el.pause();
    }
  }

  function pauseMainMusic() {
    const el = audioRef.value;
    if (el) {
      try {
        el.pause();
        el.currentTime = 0;
      } catch (_) {}
    }
  }

  function resumeMainMusic() {
    const el = audioRef.value;
    if (el && el.paused && !audioMuted.value) {
      tryPlay();
    }
  }

  function initAudio() {
    audioMuted.value = getAudioMuted();
    ensureAudio();
    if (!audioMuted.value) tryPlay();
    
    // Fallback: start playback on first user interaction if unmuted
    function onFirstInteract() {
      if (!audioMuted.value) tryPlay();
      window.removeEventListener('pointerdown', onFirstInteract, { capture: true });
      window.removeEventListener('keydown', onFirstInteract, { capture: true });
    }
    window.addEventListener('pointerdown', onFirstInteract, { capture: true, once: true });
    window.addEventListener('keydown', onFirstInteract, { capture: true, once: true });
  }

  return {
    audioMuted,
    ensureAudio,
    tryPlay,
    toggleAudio,
    pauseMainMusic,
    resumeMainMusic,
    initAudio,
  };
}
