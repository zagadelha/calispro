import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load exercises database
const dbPath = path.join(__dirname, 'src', 'assets', 'exercises', 'exercises_v1_1.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const exercises = data.exercises;

console.log('='.repeat(80));
console.log('VALIDAÇÃO DO BANCO DE DADOS DE EXERCÍCIOS');
console.log('='.repeat(80));
console.log(`Total de exercícios: ${exercises.length}\n`);

// Create a map for quick lookup
const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));

let errors = [];
let warnings = [];
let skillIssues = new Map();

// 1. Validate progresses_to references
console.log('1️⃣  VALIDANDO REFERÊNCIAS "progresses_to"...\n');
exercises.forEach(ex => {
    if (ex.progresses_to && ex.progresses_to.length > 0) {
        ex.progresses_to.forEach(targetId => {
            if (!exerciseMap.has(targetId)) {
                errors.push({
                    type: 'BROKEN_PROGRESSION',
                    exercise: ex.id,
                    message: `❌ "${ex.id}" progride para "${targetId}" mas este exercício NÃO EXISTE`
                });

                // Track skill issues
                if (ex.skill) {
                    if (!skillIssues.has(ex.skill)) {
                        skillIssues.set(ex.skill, []);
                    }
                    skillIssues.get(ex.skill).push({
                        from: ex.id,
                        missing: targetId,
                        type: 'missing_progression'
                    });
                }
            }
        });
    }
});

// 2. Validate prerequisites references
console.log('2️⃣  VALIDANDO REFERÊNCIAS "prerequisites"...\n');
exercises.forEach(ex => {
    if (ex.prerequisites && ex.prerequisites.length > 0) {
        ex.prerequisites.forEach(prereqId => {
            if (!exerciseMap.has(prereqId)) {
                errors.push({
                    type: 'BROKEN_PREREQUISITE',
                    exercise: ex.id,
                    message: `❌ "${ex.id}" requer "${prereqId}" mas este pré-requisito NÃO EXISTE`
                });
            }
        });
    }
});

// 3. Check for circular dependencies
console.log('3️⃣  VERIFICANDO DEPENDÊNCIAS CIRCULARES...\n');
function hasCircularDependency(startId, visited = new Set()) {
    if (visited.has(startId)) return true;
    visited.add(startId);

    const ex = exerciseMap.get(startId);
    if (!ex || !ex.progresses_to) return false;

    for (const nextId of ex.progresses_to) {
        if (exerciseMap.has(nextId) && hasCircularDependency(nextId, new Set(visited))) {
            return true;
        }
    }
    return false;
}

exercises.forEach(ex => {
    if (hasCircularDependency(ex.id)) {
        errors.push({
            type: 'CIRCULAR_DEPENDENCY',
            exercise: ex.id,
            message: `⚠️ "${ex.id}" tem dependência circular na cadeia de progressão`
        });
    }
});

// 4. Validate skills completeness
console.log('4️⃣  ANALISANDO COMPLETUDE DAS SKILLS...\n');
const skills = {};

exercises.forEach(ex => {
    if (ex.skill) {
        if (!skills[ex.skill]) {
            skills[ex.skill] = [];
        }
        skills[ex.skill].push(ex);
    }
});

Object.keys(skills).forEach(skillName => {
    const skillExercises = skills[skillName];
    console.log(`\n  📌 Skill: ${skillName.toUpperCase()}`);
    console.log(`     Exercícios: ${skillExercises.length}`);

    skillExercises.forEach(ex => {
        console.log(`     - ${ex.id} (difficulty: ${ex.difficulty_score}, stage: ${ex.skill_stage || 'n/a'})`);

        // Check if has progression
        if (!ex.progresses_to || ex.progresses_to.length === 0) {
            console.log(`       ⚠️ SEM PROGRESSÃO (skill pode estar incompleta)`);
        } else {
            const allExist = ex.progresses_to.every(id => exerciseMap.has(id));
            if (!allExist) {
                console.log(`       ❌ PROGRESSÃO QUEBRADA: ${ex.progresses_to.join(', ')}`);
            }
        }
    });

    // Minimum 3 stages recommended for a complete skill
    if (skillExercises.length < 3) {
        warnings.push({
            type: 'INCOMPLETE_SKILL',
            skill: skillName,
            message: `⚠️ Skill "${skillName}" tem apenas ${skillExercises.length} exercício(s). Recomendado: mínimo 3 estágios`
        });
    }
});

// 5. Check for duplicate exercise names
console.log('\n5️⃣  VERIFICANDO NOMES DUPLICADOS...\n');
const nameCount = new Map();
exercises.forEach(ex => {
    const count = nameCount.get(ex.name) || 0;
    nameCount.set(ex.name, count + 1);
});

nameCount.forEach((count, name) => {
    if (count > 1) {
        warnings.push({
            type: 'DUPLICATE_NAME',
            name: name,
            message: `⚠️ Nome duplicado: "${name}" aparece ${count} vezes`
        });
    }
});

// 6. Validate pattern consistency
console.log('6️⃣  VALIDANDO PADRÕES DE MOVIMENTO...\n');
const validPatterns = ['push', 'pull', 'legs', 'core', 'skill_full_body'];
exercises.forEach(ex => {
    if (!validPatterns.includes(ex.pattern)) {
        warnings.push({
            type: 'INVALID_PATTERN',
            exercise: ex.id,
            message: `⚠️ "${ex.id}" tem padrão inválido: "${ex.pattern}"`
        });
    }
});

// 7. Check for orphaned exercises (no prerequisites and not progressed to)
console.log('7️⃣  VERIFICANDO EXERCÍCIOS ÓRFÃOS...\n');
const progressTargets = new Set();
exercises.forEach(ex => {
    if (ex.progresses_to) {
        ex.progresses_to.forEach(id => progressTargets.add(id));
    }
});

exercises.forEach(ex => {
    const hasPrereqs = ex.prerequisites && ex.prerequisites.length > 0;
    const isTarget = progressTargets.has(ex.id);
    const hasProgression = ex.progresses_to && ex.progresses_to.length > 0;

    if (!hasPrereqs && !isTarget && !hasProgression && !ex.skill) {
        warnings.push({
            type: 'ORPHANED_EXERCISE',
            exercise: ex.id,
            message: `⚠️ "${ex.id}" está isolado (sem pré-requisitos, progressão ou skill)`
        });
    }
});

// FINAL REPORT
console.log('\n' + '='.repeat(80));
console.log('📊 RELATÓRIO FINAL');
console.log('='.repeat(80));

console.log(`\n✅ Total de exercícios validados: ${exercises.length}`);
console.log(`❌ Erros críticos encontrados: ${errors.length}`);
console.log(`⚠️  Avisos encontrados: ${warnings.length}\n`);

if (errors.length > 0) {
    console.log('🔴 ERROS CRÍTICOS:\n');
    errors.forEach((err, i) => {
        console.log(`${i + 1}. [${err.type}] ${err.message}`);
    });
}

if (warnings.length > 0) {
    console.log('\n🟡 AVISOS:\n');
    warnings.forEach((warn, i) => {
        console.log(`${i + 1}. [${warn.type}] ${warn.message}`);
    });
}

// Skill-specific issues report
if (skillIssues.size > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PROBLEMAS POR SKILL');
    console.log('='.repeat(80));

    skillIssues.forEach((issues, skillName) => {
        console.log(`\n📌 ${skillName.toUpperCase()}:`);
        issues.forEach(issue => {
            console.log(`   - ${issue.from} → ${issue.missing} (${issue.type})`);
        });
    });
}

// Generate summary JSON
const summary = {
    total_exercises: exercises.length,
    total_skills: Object.keys(skills).length,
    errors: errors,
    warnings: warnings,
    skill_issues: Array.from(skillIssues.entries()).map(([skill, issues]) => ({
        skill,
        issues
    })),
    validation_timestamp: new Date().toISOString()
};

const summaryPath = path.join(__dirname, 'exercise_validation_report.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log('\n' + '='.repeat(80));
console.log(`💾 Relatório completo salvo em: ${summaryPath}`);
console.log('='.repeat(80));

// Exit code
process.exit(errors.length > 0 ? 1 : 0);
