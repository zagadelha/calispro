import { generateSkillWorkout, getAllSkills } from './src/utils/progressionSystem.js';
import fs from 'fs';

console.log('='.repeat(80));
console.log('🧪 TESTE DE REGRESSÃO - DUPLICAÇÃO DE EXERCÍCIOS');
console.log('='.repeat(80));

// Mock user history (empty for testing beginner scenarios)
const mockHistory = {};

// Get all available skills
const allSkills = getAllSkills();
console.log(`\n📋 Total de skills a testar: ${allSkills.length}`);
console.log(`   Skills: ${allSkills.join(', ')}\n`);

// Mock equipment (simulating user has basic equipment)
const mockEquipment = ['none', 'bar', 'floor'];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

// Test each skill multiple times
allSkills.forEach(skill => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Testando skill: ${skill.toUpperCase()}`);
    console.log('='.repeat(60));

    // Generate 5 workouts per skill to test consistency
    for (let i = 1; i <= 5; i++) {
        totalTests++;
        console.log(`\n  Test #${i}:`);

        try {
            const workout = generateSkillWorkout(skill, mockHistory, mockEquipment);

            if (workout.error) {
                console.log(`  ⚠️  Workout gerado com erro: ${workout.error}`);
                continue;
            }

            if (!workout.exercises || workout.exercises.length === 0) {
                console.log(`  ⚠️  Workout sem exercícios`);
                continue;
            }

            // Extract exercise IDs
            const exerciseIds = workout.exercises
                .filter(ex => ex.original_id) // Only consider valid exercises
                .map(ex => ex.original_id);

            // Check for duplicates
            const uniqueIds = new Set(exerciseIds);
            const hasDuplicates = uniqueIds.size !== exerciseIds.size;

            if (hasDuplicates) {
                failedTests++;
                console.log(`  ❌ FALHA - Duplicação detectada!`);
                console.log(`     Total exercícios: ${exerciseIds.length}`);
                console.log(`     Únicos: ${uniqueIds.size}`);
                console.log(`     Exercícios: ${exerciseIds.join(', ')}`);

                // Find duplicates
                const counts = {};
                exerciseIds.forEach(id => {
                    counts[id] = (counts[id] || 0) + 1;
                });
                const duplicates = Object.entries(counts)
                    .filter(([_, count]) => count > 1)
                    .map(([id, count]) => `${id} (${count}x)`);

                console.log(`     Duplicados: ${duplicates.join(', ')}`);

                failures.push({
                    skill,
                    test: i,
                    exerciseIds,
                    duplicates: duplicates
                });
            } else {
                passedTests++;
                console.log(`  ✅ PASSOU - ${exerciseIds.length} exercícios únicos`);
                console.log(`     Exercícios: ${exerciseIds.join(', ')}`);
            }

        } catch (error) {
            failedTests++;
            console.log(`  ❌ ERRO - ${error.message}`);
            failures.push({
                skill,
                test: i,
                error: error.message
            });
        }
    }
});

// Final Report
console.log('\n' + '='.repeat(80));
console.log('📊 RELATÓRIO FINAL DE TESTES');
console.log('='.repeat(80));

console.log(`\n✅ Testes passados: ${passedTests}/${totalTests}`);
console.log(`❌ Testes falhados: ${failedTests}/${totalTests}`);
console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failures.length > 0) {
    console.log(`\n🔴 FALHAS DETALHADAS:\n`);
    failures.forEach((failure, i) => {
        console.log(`${i + 1}. Skill: ${failure.skill}, Test #${failure.test}`);
        if (failure.error) {
            console.log(`   Erro: ${failure.error}`);
        } else if (failure.duplicates) {
            console.log(`   Duplicados: ${failure.duplicates.join(', ')}`);
        }
    });
}

// Save report
const report = {
    timestamp: new Date().toISOString(),
    total_tests: totalTests,
    passed: passedTests,
    failed: failedTests,
    success_rate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
    failures: failures
};

fs.writeFileSync('test_duplication_report.json', JSON.stringify(report, null, 2));

console.log(`\n💾 Relatório salvo em: test_duplication_report.json`);
console.log('='.repeat(80));

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
