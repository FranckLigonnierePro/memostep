/**
 * Script de test console pour vérifier la génération de grilles
 * Exécuter avec: node test_console.js
 */

import { generateEnrichedGrid, generateRandomPath, debugGrid } from './src/lib/gridGenerator.js';

console.log('🎮 TEST DE GÉNÉRATION DE GRILLES MEMOSTEP 🎮\n');
console.log('='.repeat(60));

const runCounters = { gem: 0, potion: 0 };

// Test étage 1
console.log('\n📍 GÉNÉRATION ÉTAGE 1');
const path1 = generateRandomPath();
const { grid: grid1, runCounters: counters1 } = generateEnrichedGrid(path1, 1, { ...runCounters });
debugGrid(grid1, 1);

// Test étage 10
console.log('\n📍 GÉNÉRATION ÉTAGE 10');
const path10 = generateRandomPath();
const { grid: grid10, runCounters: counters10 } = generateEnrichedGrid(path10, 10, counters1);
debugGrid(grid10, 10);

// Test étage 25
console.log('\n📍 GÉNÉRATION ÉTAGE 25');
const path25 = generateRandomPath();
const { grid: grid25, runCounters: counters25 } = generateEnrichedGrid(path25, 25, counters10);
debugGrid(grid25, 25);

console.log('\n' + '='.repeat(60));
console.log('✅ TESTS TERMINÉS !');
console.log('\nCompteurs finaux:');
console.log(`  - Gemmes: ${counters25.gem}/1`);
console.log(`  - Potions: ${counters25.potion}/1`);
console.log('\n💡 Vérifiez que:');
console.log('  1. Chaque ligne a exactement 1 case de chemin');
console.log('  2. Maximum 1 piège par ligne');
console.log('  3. Les pièges sont adjacents au chemin');
console.log('  4. Les probabilités augmentent avec l\'étage');
console.log('  5. Les limites maxPerFloor et maxPerRun sont respectées');
