import fs from 'fs';

// Ler o arquivo JSON
const data = JSON.parse(fs.readFileSync('./src/assets/exercises/exercises_v1_1.json', 'utf8'));
const exercises = data.exercises;

// Armazenar problemas encontrados
const issues = {
    noPrerequisites: [],
    noProgressions: [],
    invalidPrerequisites: [],
    invalidProgressions: [],
    orphanedExercises: [],
    circularDependencies: [],
    levelMismatches: [],
    patternMismatches: []
};

// Criar mapa de exercícios para busca rápida
const exerciseMap = new Map();
exercises.forEach(ex => exerciseMap.set(ex.id, ex));

// Função para verificar se um exercício é de entrada (iniciante sem pré-requisitos)
function isEntryExercise(exercise) {
    return exercise.level === 'beginner' && exercise.prerequisites.length === 0;
}

// 1. Verificar exercícios sem pré-requisitos (exceto iniciantes de entrada)
console.log('=== ANÁLISE DE PRÉ-REQUISITOS ===\n');
exercises.forEach(ex => {
    if (ex.prerequisites.length === 0 && ex.level !== 'beginner') {
        issues.noPrerequisites.push({
            id: ex.id,
            name: ex.name,
            level: ex.level,
            pattern: ex.pattern
        });
    }
});

// 2. Verificar exercícios sem progressões (exceto avançados)
console.log('=== ANÁLISE DE PROGRESSÕES ===\n');
exercises.forEach(ex => {
    if (ex.progresses_to.length === 0 && ex.level !== 'advanced') {
        issues.noProgressions.push({
            id: ex.id,
            name: ex.name,
            level: ex.level,
            pattern: ex.pattern
        });
    }
});

// 3. Verificar pré-requisitos inválidos (exercícios que não existem)
console.log('=== ANÁLISE DE PRÉ-REQUISITOS INVÁLIDOS ===\n');
exercises.forEach(ex => {
    ex.prerequisites.forEach(prereqId => {
        if (!exerciseMap.has(prereqId)) {
            issues.invalidPrerequisites.push({
                exercise: ex.id,
                invalid_prerequisite: prereqId
            });
        }
    });
});

// 4. Verificar progressões inválidas (exercícios que não existem)
console.log('=== ANÁLISE DE PROGRESSÕES INVÁLIDAS ===\n');
exercises.forEach(ex => {
    ex.progresses_to.forEach(progId => {
        if (!exerciseMap.has(progId)) {
            issues.invalidProgressions.push({
                exercise: ex.id,
                invalid_progression: progId
            });
        }
    });
});

// 5. Verificar exercícios órfãos (não são pré-requisito nem progressão de nenhum outro)
console.log('=== ANÁLISE DE EXERCÍCIOS ÓRFÃOS ===\n');
const referenced = new Set();
exercises.forEach(ex => {
    ex.prerequisites.forEach(id => referenced.add(id));
    ex.progresses_to.forEach(id => referenced.add(id));
});

exercises.forEach(ex => {
    const isReferenced = referenced.has(ex.id);
    const hasConnections = ex.prerequisites.length > 0 || ex.progresses_to.length > 0;

    if (!isReferenced && !hasConnections && !isEntryExercise(ex)) {
        issues.orphanedExercises.push({
            id: ex.id,
            name: ex.name,
            level: ex.level,
            pattern: ex.pattern
        });
    }
});

// 6. Verificar inconsistências de nível
console.log('=== ANÁLISE DE NÍVEIS ===\n');
const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
exercises.forEach(ex => {
    ex.progresses_to.forEach(progId => {
        const progression = exerciseMap.get(progId);
        if (progression && levelOrder[progression.level] < levelOrder[ex.level]) {
            issues.levelMismatches.push({
                exercise: ex.id,
                exercise_level: ex.level,
                progression: progId,
                progression_level: progression.level,
                problem: 'Progressão tem nível inferior ao exercício base'
            });
        }
    });

    ex.prerequisites.forEach(prereqId => {
        const prereq = exerciseMap.get(prereqId);
        if (prereq && levelOrder[prereq.level] > levelOrder[ex.level]) {
            issues.levelMismatches.push({
                exercise: ex.id,
                exercise_level: ex.level,
                prerequisite: prereqId,
                prerequisite_level: prereq.level,
                problem: 'Pré-requisito tem nível superior ao exercício'
            });
        }
    });
});

// 7. Verificar padrões incompatíveis
console.log('=== ANÁLISE DE PADRÕES ===\n');
exercises.forEach(ex => {
    ex.progresses_to.forEach(progId => {
        const progression = exerciseMap.get(progId);
        if (progression && progression.pattern !== ex.pattern) {
            issues.patternMismatches.push({
                exercise: ex.id,
                exercise_pattern: ex.pattern,
                progression: progId,
                progression_pattern: progression.pattern
            });
        }
    });
});

// Gerar relatório
console.log('\n============================================');
console.log('RELATÓRIO DE ANÁLISE DO BANCO DE EXERCÍCIOS');
console.log('============================================\n');

console.log(`Total de exercícios: ${exercises.length}\n`);

if (issues.noPrerequisites.length > 0) {
    console.log(`\n⚠️  ${issues.noPrerequisites.length} exercícios intermediários/avançados SEM pré-requisitos:`);
    issues.noPrerequisites.forEach(ex => {
        console.log(`   - ${ex.id} (${ex.name}) - Level: ${ex.level}, Pattern: ${ex.pattern}`);
    });
}

if (issues.noProgressions.length > 0) {
    console.log(`\n⚠️  ${issues.noProgressions.length} exercícios iniciantes/intermediários SEM progressões:`);
    issues.noProgressions.forEach(ex => {
        console.log(`   - ${ex.id} (${ex.name}) - Level: ${ex.level}, Pattern: ${ex.pattern}`);
    });
}

if (issues.invalidPrerequisites.length > 0) {
    console.log(`\n❌ ${issues.invalidPrerequisites.length} pré-requisitos INVÁLIDOS (não existem):`);
    issues.invalidPrerequisites.forEach(issue => {
        console.log(`   - ${issue.exercise} referencia pré-requisito inexistente: ${issue.invalid_prerequisite}`);
    });
}

if (issues.invalidProgressions.length > 0) {
    console.log(`\n❌ ${issues.invalidProgressions.length} progressões INVÁLIDAS (não existem):`);
    issues.invalidProgressions.forEach(issue => {
        console.log(`   - ${issue.exercise} referencia progressão inexistente: ${issue.invalid_progression}`);
    });
}

if (issues.orphanedExercises.length > 0) {
    console.log(`\n⚠️  ${issues.orphanedExercises.length} exercícios ÓRFÃOS (isolados da cadeia de progressão):`);
    issues.orphanedExercises.forEach(ex => {
        console.log(`   - ${ex.id} (${ex.name}) - Level: ${ex.level}, Pattern: ${ex.pattern}`);
    });
}

if (issues.levelMismatches.length > 0) {
    console.log(`\n⚠️  ${issues.levelMismatches.length} INCONSISTÊNCIAS de nível:`);
    issues.levelMismatches.forEach(issue => {
        console.log(`   - ${issue.exercise} (${issue.exercise_level}): ${issue.problem}`);
        if (issue.progression) {
            console.log(`     Progressão: ${issue.progression} (${issue.progression_level})`);
        }
        if (issue.prerequisite) {
            console.log(`     Pré-requisito: ${issue.prerequisite} (${issue.prerequisite_level})`);
        }
    });
}

if (issues.patternMismatches.length > 0) {
    console.log(`\n⚠️  ${issues.patternMismatches.length} PADRÕES incompatíveis:`);
    issues.patternMismatches.forEach(issue => {
        console.log(`   - ${issue.exercise} (${issue.exercise_pattern}) -> ${issue.progression} (${issue.progression_pattern})`);
    });
}

// Estatísticas por nível e padrão
console.log('\n\n============================================');
console.log('ESTATÍSTICAS');
console.log('============================================\n');

const byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
const byPattern = {};

exercises.forEach(ex => {
    byLevel[ex.level]++;
    byPattern[ex.pattern] = (byPattern[ex.pattern] || 0) + 1;
});

console.log('Por nível:');
Object.entries(byLevel).forEach(([level, count]) => {
    console.log(`  ${level}: ${count}`);
});

console.log('\nPor padrão:');
Object.entries(byPattern).forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${count}`);
});

// Exercícios de entrada
const entryExercises = exercises.filter(isEntryExercise);
console.log(`\nExercícios de entrada (iniciantes sem pré-requisitos): ${entryExercises.length}`);
entryExercises.forEach(ex => {
    console.log(`  - ${ex.id} (${ex.name}) - Pattern: ${ex.pattern}`);
});

console.log('\n============================================');
console.log('FIM DO RELATÓRIO');
console.log('============================================\n');

// Salvar relatório em arquivo
const report = {
    timestamp: new Date().toISOString(),
    total_exercises: exercises.length,
    statistics: {
        by_level: byLevel,
        by_pattern: byPattern,
        entry_exercises: entryExercises.length
    },
    issues: issues,
    entry_exercises: entryExercises.map(ex => ({ id: ex.id, name: ex.name, pattern: ex.pattern }))
};

fs.writeFileSync('./exercise_analysis_report.json', JSON.stringify(report, null, 2));
console.log('📄 Relatório detalhado salvo em: exercise_analysis_report.json\n');
