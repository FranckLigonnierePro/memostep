/**
 * Composable pour la logique de jeu (clic sur cellules, validation, etc.)
 */

import { ref } from 'vue';
import { COLS, ROWS, FLIP_BACK_STEP, FLIP_BACK_DUR } from '../config/gameConfig.js';
import { randomPath } from '../utils/pathGenerator.js';
import { pickHeartForPath, applyEnrichedGrid } from '../utils/gridHelpers.js';

export function useGameLogic() {
  const chronoMs = ref(0);
  let chronoIntervalId = null;

  /**
   * Démarre le chronomètre
   */
  function startChrono(versusStartAtMs = null, revealDuration = 0) {
    if (chronoIntervalId) clearInterval(chronoIntervalId);
    
    if (versusStartAtMs && typeof versusStartAtMs === 'number') {
      // Mode versus: chrono partagé
      const baseStart = versusStartAtMs + revealDuration;
      chronoIntervalId = setInterval(() => {
        chronoMs.value = Math.max(0, Date.now() - baseStart);
      }, 250);
    } else {
      // Mode solo: chrono local
      const startAt = Date.now();
      const base = chronoMs.value;
      chronoIntervalId = setInterval(() => {
        chronoMs.value = base + (Date.now() - startAt);
      }, 250);
    }
  }

  /**
   * Arrête le chronomètre
   */
  function stopChrono() {
    if (chronoIntervalId) {
      clearInterval(chronoIntervalId);
      chronoIntervalId = null;
    }
  }

  /**
   * Gère le clic sur une cellule
   */
  function onCellClick(r, c, context) {
    const {
      state,
      mirrorColumns,
      clickBlocked,
      shakeActive,
      stunActive,
      justLost,
      flipBackActive,
      faceDownActive,
      soloLivesUsed,
      playerGold,
      playerEssence,
      playerGems,
      t,
      handleMatchWin,
      handleMatchLose,
      versusMode,
    } = context;

    if (!state.inPlay) return;
    if (clickBlocked.value) return;

    const keyAlready = `${r}-${c}`;
    const effectiveC = mirrorColumns.value ? (COLS - 1 - c) : c;

    // Check bonus cells
    if (state.gridContent && state.gridContent[r] && state.gridContent[r][c]) {
      const cell = state.gridContent[r][c];
      const isBonusCell = (cell.type === 'gold' || cell.type === 'gem' || cell.type === 'essence' || cell.type === 'potion');

      if (isBonusCell && !state.collectedBonuses.has(keyAlready)) {
        const expect = state.path[state.nextIndex];
        if (expect && expect.r === r) {
          state.correctSet.add(keyAlready);
          state.collectedBonuses.add(keyAlready);
          state.nextIndex++;

          // Apply bonus effects
          if (cell.type === 'gold') {
            playerGold.value += cell.value || 5;
          } else if (cell.type === 'gem') {
            playerGems.value += 1;
          } else if (cell.type === 'essence') {
            playerEssence.value += 1;
          } else if (cell.type === 'potion') {
            soloLivesUsed.value = Math.max(0, soloLivesUsed.value - 1);
          }

          // Check if path complete
          if (state.nextIndex === state.path.length) {
            completePathSuccess(state, flipBackActive, faceDownActive, t, handleMatchWin);
          }

          return;
        }
      }
    }

    // Ignore repeated clicks
    if (state.correctSet.has(keyAlready)) return;
    if (state.wrongSet.has(keyAlready)) return;

    // Check frozen grid (versus)
    if (versusMode && state.frozenGrid && state.frozenClicksLeft > 0) {
      state.frozenClicksLeft = Math.max(0, state.frozenClicksLeft - 1);
      if (state.frozenClicksLeft === 0) {
        state.frozenGrid = false;
      }
      return;
    }

    if (versusMode && state.frozenGrid) {
      return;
    }

    const expect = state.path[state.nextIndex];

    // DEBUG: Log pour diagnostiquer les erreurs de ligne
    console.log('[DEBUG Click]', {
      clicked: { r, c, effectiveC },
      expect,
      nextIndex: state.nextIndex,
      pathLength: state.path.length,
      mirrorColumns: mirrorColumns.value,
      pathOnThisRow: state.path.filter(cell => cell.r === r).map(cell => ({ r: cell.r, c: cell.c }))
    });

    // DÉSACTIVÉ: Auto-detect mirroring (causait des faux positifs)
    // if (expect && expect.r === r && expect.c !== c && expect.c === (COLS - 1 - c) && !mirrorColumns.value) {
    //   mirrorColumns.value = true;
    //   console.log('[DEBUG] Mirroring auto-detected');
    // }

    // Correct cell
    if (expect && expect.r === r && expect.c === effectiveC) {
      console.log('[DEBUG] ✓ Correct cell');
      state.correctSet.add(`${r}-${c}`);
      state.nextIndex++;

      // Heart pickup (solo)
      if (state.mode === 'solo' && state.heartCell && state.heartCell.r === r && state.heartCell.c === effectiveC) {
        soloLivesUsed.value = Math.max(0, (soloLivesUsed.value || 0) - 1);
        state.heartCell = null;
      }

      // Check if path complete
      if (state.nextIndex === state.path.length) {
        completePathSuccess(state, flipBackActive, faceDownActive, t, handleMatchWin);
      }
    } else {
      // Wrong cell
      handleWrongCell(r, c, {
        state,
        keyAlready,
        shakeActive,
        stunActive,
        clickBlocked,
        justLost,
        soloLivesUsed,
        flipBackActive,
        faceDownActive,
        t,
        handleMatchLose,
        versusMode,
      });
    }
  }

  /**
   * Gère la complétion réussie du chemin
   */
  function completePathSuccess(state, flipBackActive, faceDownActive, t, handleMatchWin) {
    state.statusText = t('status.bravo');
    state.inPlay = false;
    stopChrono();
    state.revealed = true;

    const backTotal = ROWS * FLIP_BACK_STEP + FLIP_BACK_DUR;
    flipBackActive.value = true;

    setTimeout(() => {
      flipBackActive.value = false;
      faceDownActive.value = false;
      handleMatchWin();
    }, backTotal);
  }

  /**
   * Gère un clic sur une mauvaise cellule
   */
  function handleWrongCell(r, c, context) {
    const {
      state,
      keyAlready,
      shakeActive,
      stunActive,
      clickBlocked,
      justLost,
      soloLivesUsed,
      flipBackActive,
      faceDownActive,
      t,
      handleMatchLose,
      versusMode,
    } = context;

    // Decoy handling (solo)
    if (state.mode === 'solo' && state.decoys.has(keyAlready)) {
      const prevIndex = state.nextIndex;
      const newIndex = Math.max(0, prevIndex - 3);
      for (let i = prevIndex - 1; i >= newIndex; i--) {
        const p = state.path[i];
        if (!p) break;
        state.correctSet.delete(`${p.r}-${p.c}`);
      }
      state.nextIndex = newIndex;
      state.statusText = t('status.miss');
      return;
    }

    state.wrongSet.add(keyAlready);
    state.statusText = t('status.miss');

    // Stun cell
    const isStunCell = state.stun.has(keyAlready);
    if (isStunCell && !versusMode) {
      clickBlocked.value = true;
      stunActive.value = true;
      setTimeout(() => {
        clickBlocked.value = false;
        stunActive.value = false;
      }, 1000);
      return;
    }

    // Shake animation
    shakeActive.value = true;
    clickBlocked.value = true;
    setTimeout(() => { shakeActive.value = false; }, 500);
    setTimeout(() => { clickBlocked.value = false; }, 500);

    // Heart animation
    justLost.value = true;
    setTimeout(() => { justLost.value = false; }, 900);

    // Rollback cell
    if (state.rollback.has(keyAlready)) {
      const prevIndex = state.nextIndex;
      const newIndex = Math.max(0, prevIndex - 2);
      for (let i = prevIndex - 1; i >= newIndex; i--) {
        const p = state.path[i];
        if (!p) break;
        state.correctSet.delete(`${p.r}-${p.c}`);
      }
      state.nextIndex = newIndex;
      return;
    }

    // Neutral cell
    const isNeutralCell = state.gridContent &&
      state.gridContent[r] &&
      state.gridContent[r][c] &&
      state.gridContent[r][c].type === 'neutral';

    if (isNeutralCell) {
      return;
    }

    // Check if out of hearts (solo)
    if (state.mode === 'solo') {
      soloLivesUsed.value++;
      
      if (soloLivesUsed.value >= 3) {
        state.inPlay = false;
        stopChrono();
        state.revealed = true;

        const backTotal = ROWS * FLIP_BACK_STEP + FLIP_BACK_DUR;
        flipBackActive.value = true;

        setTimeout(() => {
          flipBackActive.value = false;
          faceDownActive.value = false;
          handleMatchLose();
        }, backTotal);
      }
    }
  }

  /**
   * Prépare le prochain niveau solo
   */
  function prepareNextSoloLevel(state, soloLevel, soloLivesUsed, runCounters) {
    const nextPath = randomPath();
    state.soloPath = nextPath;
    state.preparedHeart = (soloLivesUsed.value > 0) ? pickHeartForPath(nextPath) : null;

    // Apply enriched grid
    const currentFloor = Math.max(1, (soloLevel.value || 0) + 1);
    const result = applyEnrichedGrid(nextPath, currentFloor, runCounters.value);
    
    state.gridContent = result.grid;
    state.rollback = result.rollback;
    state.stun = result.stun;
    state.lifeLoss = result.lifeLoss;
    runCounters.value = result.newCounters;
  }

  return {
    chronoMs,
    startChrono,
    stopChrono,
    onCellClick,
    prepareNextSoloLevel,
  };
}
