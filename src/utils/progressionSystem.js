import exercisesData from '../assets/exercises/exercises_v1_1.json';

const exercises = exercisesData.exercises;
const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));

/**
 * Checks if an exercise is unlocked for a user based on their mastery history.
 * @param {string} exerciseId - The ID of the exercise to check.
 * @param {string[]} masteredExerciseIds - Array of exercise IDs the user has mastered.
 * @returns {boolean} - True if all prerequisites are mastered.
 */
export const isExerciseUnlocked = (exerciseId, masteredExerciseIds) => {
    const exercise = exerciseMap.get(exerciseId);
    if (!exercise) {
        console.warn(`[isExerciseUnlocked] ❌ Exercise not found: ${exerciseId}`);
        return false;
    }

    // Advanced exercises locked until prerequisites are fulfilled
    if (!exercise.prerequisites || exercise.prerequisites.length === 0) {
        return true;
    }

    // Check if ALL prerequisites are in the mastered list
    return exercise.prerequisites.every(prereqId => masteredExerciseIds.includes(prereqId));
};

/**
 * Checks if existing stats satisfy the mastery criteria.
 * Now requires consistency (2 sessions with RPE <= 4).
 * @param {object} exercise 
 * @param {object} stats - { reps: number, seconds: number, history: array }
 */
export const checkMastery = (exercise, stats) => {
    if (!stats) return false;
    const { metric_type, default_prescription } = exercise;
    const { reps_max, seconds_max } = default_prescription;
    const target = metric_type === 'reps' ? reps_max : seconds_max;

    // Consistency Check (New Logic)
    if (stats.history && Array.isArray(stats.history)) {
        // Find sessions that meet criteria:
        // 1. Value >= Target
        // 2. RPE <= 4 (Easy to Hard, but not Max Effort which is 5)
        // 3. Explicitly Goal Met
        const validSessions = stats.history.filter(session => {
            const val = metric_type === 'reps' ? (session.reps || 0) : (session.seconds || 0);
            // If RPE is missing, assume it was okay (safe default for older data), unless explicit fail
            const rpe = session.rpe !== undefined ? session.rpe : 3;
            const met = session.goalMet !== false; // Assume true unless marked false

            const valid = val >= target && rpe <= 4 && met;

            if (!valid && val > 0) {
                console.log(`  ❌ [${exercise.id}] Invalid session: val=${val}/${target}, rpe=${rpe}, met=${met}`);
            }

            return valid;
        });

        const mastered = validSessions.length >= 2;

        if (stats.history.length > 0) {
            console.log(`[Mastery] ${exercise.id}: ${validSessions.length}/2 valid (${stats.history.length} total) => ${mastered ? '✅ MASTERED' : '❌ not yet'}`);
        }

        return mastered;
    }

    // Fallback for simple stats object (Legacy/Mock)
    if (metric_type === 'reps') {
        return (stats.reps || 0) >= reps_max;
    } else if (metric_type === 'seconds') {
        return (stats.seconds || 0) >= seconds_max;
    }
    return false;
};

/**
 * Evaluates the user's performance and determines the next step.
 * @param {string} exerciseId 
 * @param {object} performance - { reps: number, metric... history: [] }
 * @returns {object}
 */
export const evaluateProgression = (exerciseId, performance) => {
    const exercise = exerciseMap.get(exerciseId);
    if (!exercise) {
        return { action: 'error', message: 'Exercício não encontrado' };
    }

    const { metric_type, default_prescription, progresses_to, name } = exercise;
    const { reps_min, reps_max, seconds_min, seconds_max } = default_prescription;

    let performedValue = 0;
    let targetMax = 0;
    let targetMin = 0;

    if (metric_type === 'reps') {
        performedValue = performance.reps || 0;
        targetMax = reps_max;
        targetMin = reps_min;
    } else if (metric_type === 'seconds') {
        performedValue = performance.seconds || 0;
        targetMax = seconds_max;
        targetMin = seconds_min;
    }

    // 1. Check Regression (Protection Rule)
    // If failed meta in 2 consecutive sessions
    if (performance.history && Array.isArray(performance.history) && performance.history.length >= 2) {
        const lastTwo = performance.history.slice(-2);
        // Check if both failed goal
        const failedBoth = lastTwo.every(s => s.goalMet === false);

        if (failedBoth) {
            return {
                action: 'regress',
                nextExerciseId: null,
                message: `O desafio está alto. Que tal recuar um degrau para ganhar impulso? 🛡️`
            };
        }
    }

    // 2. Check Promotion
    if (checkMastery(exercise, performance)) {
        if (progresses_to && progresses_to.length > 0) {
            const nextId = progresses_to[0];
            const nextExercise = exerciseMap.get(nextId);
            return {
                action: 'promote',
                nextExerciseId: nextId,
                message: `Sensacional! ${name} dominado. Próximo desafio: ${nextExercise ? nextExercise.name : 'Nível Superior'}! 🚀`
            };
        } else {
            return {
                action: 'maintain',
                nextExerciseId: null,
                message: `Você é uma lenda! Zerou a progressão de ${name}. 🏆`
            };
        }
    }

    // 3. Maintain / Encouragement
    if (performedValue >= targetMin) {
        return {
            action: 'maintain',
            nextExerciseId: null,
            message: `Boa consistência! Faltam apenas alguns detalhes para o próximo nível. 🔥`
        };
    }

    return {
        action: 'maintain',
        nextExerciseId: null,
        message: `Começo sólido! Continue praticando para ganhar força. 💪`
    };
};

/**
 * Existing helper
 */
export const getExercise = (id) => exerciseMap.get(id);

/**
 * Existing helper
 */
export const getAvailableExercisesByPattern = (pattern, masteredExerciseIds) => {
    return exercises
        .filter(ex => ex.pattern === pattern)
        .filter(ex => isExerciseUnlocked(ex.id, masteredExerciseIds))
        .sort((a, b) => a.difficulty_score - b.difficulty_score);
};

// --- NEW SKILL LOGIC ---

/**
 * Gets the current stage for a user in a specific skill.
 * Steps:
 * 1. Find all exercises for the skill.
 * 2. Identify which are mastered based on history.
 * 3. Find the first UNLOCKED but NOT MASTERED exercise in the chain.
 * 
 * @param {string} skillName - e.g. "handstand", "front_lever"
 * @param {object} userHistory - { exerciseId: { reps: 10, seconds: 30 } }
 * @returns {object|null} - The current exercise object or null if none found.
 */
export const getUserSkillStage = (skillName, userHistory) => {
    // 1. Get all exercises for this skill
    const skillExercises = exercises
        .filter(ex => ex.skill === skillName)
        .sort((a, b) => a.difficulty_score - b.difficulty_score); // Simple difficulty sort

    if (skillExercises.length === 0) return null;

    console.log(`[Skill: ${skillName}] Total exercises:`, skillExercises.length);

    // 2. Calculate mastered IDs for THIS SKILL (for display/logging)
    const skillMasteredIds = skillExercises
        .filter(ex => {
            const stats = userHistory[ex.id];
            if (!stats) return false;
            return checkMastery(ex, stats);
        })
        .map(ex => ex.id);

    console.log(`[Skill: ${skillName}] Mastered:`, skillMasteredIds);

    // 🔥 FIX: Calculate ALL mastered exercises globally (for prerequisite checking)
    const allMasteredIds = exercises
        .filter(ex => {
            const stats = userHistory[ex.id];
            if (!stats) return false;
            return checkMastery(ex, stats);
        })
        .map(ex => ex.id);

    // 3. Find the first candidate
    // A candidate is "Unlocked" (prereqs met) AND "Not Mastered".
    // Since we sorted by difficulty, the first such candidate is the current stage.
    for (const ex of skillExercises) {
        const unlocked = isExerciseUnlocked(ex.id, allMasteredIds); // 🔥 Use global mastered list
        const mastered = skillMasteredIds.includes(ex.id);

        console.log(`  - ${ex.id} (diff:${ex.difficulty_score}): unlocked=${unlocked}, mastered=${mastered}`);

        if (unlocked && !mastered) {
            console.log(`  ✅ [Skill: ${skillName}] Selected: ${ex.id}`);
            return ex;
        }
    }

    // ✅ FIXED: Check if skill is maxed (no unlocked non-mastered exercises remain)
    // OLD: Check if ALL mastered (wrong - doesn't account for locked exercises)
    // NEW: Check if there are NO unlocked exercises that are NOT mastered
    const hasUnlockedNonMastered = skillExercises.some(ex => {
        const unlocked = isExerciseUnlocked(ex.id, allMasteredIds); // 🔥 Use global mastered list
        const mastered = skillMasteredIds.includes(ex.id);
        return unlocked && !mastered; // Has at least one unlocked non-mastered
    });

    if (!hasUnlockedNonMastered) {
        console.log(`  ⚠️ [Skill: ${skillName}] NO MORE UNLOCKED EXERCISES! Signaling rotation...`);
        return null; // Signal that rotation is needed
    }

    // If all unlocked are mastered, user is waiting for something harder (or at max).
    // If nothing found (e.g. everything mastered), return the hardest mastered one (maintenance).
    console.log(`  ✅ [Skill: ${skillName}] Using hardest:`, skillExercises[skillExercises.length - 1]?.id);
    return skillExercises[skillExercises.length - 1];
};

/**
 * Returns all exercises grouped by skill.
 */
export const getAllSkills = () => {
    const skills = new Set(exercises.map(ex => ex.skill).filter(Boolean));
    return Array.from(skills);
};

// --- READINESS / ATHLETE SCORE LOGIC ---

/**
 * Calculates a global "Readiness Score" (0-100) based on mastered exercises.
 * Formula: Weighted average of sub-scores for Push, Pull, Legs, Core, Skills.
 * Sub-score = (Max Difficulty Mastered / Max Possible Difficulty) * 100
 * 
 * @param {object} userHistory - { exerciseId: { reps: number, seconds: number } }
 * @returns {object} - { totalScore: number, breakdown: { push: number, pull: number, ... } }
 */
/**
 * Calculates a global "Readiness Score" (0-100) based on mastered exercises,
 * modulated by recent performance (RPE) and consistency.
 * 
 * Formula:
 * 1. Category Base: (Max Difficulty Mastered / Max Possible Difficulty) * 100
 * 2. Category Adjustment: Penalty if moving average of RPE (last 3) >= 4.
 * 3. Global Adjustment: Bonus for consistency (workouts in last 7 days).
 * 
 * @param {object} userHistory - { exerciseId: { reps: number, history: [{date, rpe, ...}] } }
 * @returns {object} - { totalScore: number, breakdown: { push: number, pull: number, ... } }
 */
export const calculateReadinessScore = (userHistory) => {
    const categories = [
        { key: 'push', weight: 0.20, filter: ex => ex.pattern === 'push' },
        { key: 'pull', weight: 0.20, filter: ex => ex.pattern === 'pull' },
        { key: 'legs', weight: 0.20, filter: ex => ex.pattern === 'legs' },
        { key: 'core', weight: 0.20, filter: ex => ex.pattern === 'core' },
        { key: 'skills', weight: 0.20, filter: ex => ex.skill !== null || ex.pattern.includes('skill') }
    ];

    const breakdown = {};
    let totalWeightedScore = 0;

    // 1. Gather all logs for consistency check
    let allLogs = [];
    Object.values(userHistory).forEach(stat => {
        if (stat.history && Array.isArray(stat.history)) {
            allLogs = allLogs.concat(stat.history);
        }
    });
    // Sort logs by date descending
    allLogs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Consistency Bonus Calculation
    // Count unique days with workouts in the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentDates = new Set();
    allLogs.forEach(log => {
        const logDate = new Date(log.date || 0);
        if (logDate >= sevenDaysAgo && logDate <= now) {
            recentDates.add(logDate.toDateString());
        }
    });

    // Bonus: +2 points per day trained in last week, max +10
    const consistencyBonus = Math.min(10, recentDates.size * 2);

    // Helper: Max Mastered Difficulty
    const getMaxMasteredDifficulty = (categoryExercises) => {
        let maxDiff = 0;
        categoryExercises.forEach(ex => {
            const stats = userHistory[ex.id];
            if (stats && checkMastery(ex, stats)) {
                if (ex.difficulty_score > maxDiff) {
                    maxDiff = ex.difficulty_score;
                }
            }
        });
        return maxDiff;
    };

    // Helper: Moving Average RPE for Category
    const getCategoryRpePenalty = (categoryExercises) => {
        let catLogs = [];
        categoryExercises.forEach(ex => {
            const stats = userHistory[ex.id];
            if (stats && stats.history) {
                catLogs = catLogs.concat(stats.history);
            }
        });
        // Sort descenting
        catLogs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        // Take last 3 relevant logs for this category
        const last3 = catLogs.slice(0, 3);
        if (last3.length === 0) return 0;

        const sumRpe = last3.reduce((sum, log) => sum + (log.rpe || 3), 0); // Default 3 if missing
        const avgRpe = sumRpe / last3.length;

        // Penalty logic: If avg > 3.5, start penalizing
        // If Avg is 5 (Max effort/fail), score reduces significantly?
        // Let's say: If Avg >= 4, apply 10% reduction.
        if (avgRpe >= 4) return 0.9;
        return 1.0;
    };

    categories.forEach(cat => {
        const catExercises = exercises.filter(cat.filter);
        if (catExercises.length === 0) {
            breakdown[cat.key] = 0;
            return;
        }

        // 1. Base Score (Proficiency)
        const maxPossible = Math.max(...catExercises.map(e => e.difficulty_score || 0));
        const maxMastered = getMaxMasteredDifficulty(catExercises);
        let score = maxPossible > 0 ? (maxMastered / maxPossible) * 100 : 0;

        // 2. RPE Penalty (Recovery)
        const penaltyFactor = getCategoryRpePenalty(catExercises);
        score *= penaltyFactor;

        breakdown[cat.key] = Math.round(score);
        totalWeightedScore += score * cat.weight;
    });

    // Final Global Score
    let finalScore = totalWeightedScore + consistencyBonus;

    // Clamp 0-100
    finalScore = Math.min(100, Math.max(0, finalScore));

    return {
        totalScore: Math.round(finalScore),
        breakdown
    };
};

// --- WORKOUT GENERATION LOGIC ---

/**
 * Generates a focused workout based on a target skill and user readiness.
 * Structure:
 * 1. Skill Work (The current stage of the target skill)
 * 2. Strength Work (A compound movement supporting the skill's pattern)
 * 3. Core Work (Essential for all calisthenics)
 * 4. Accessory (Complementary work)
 * 
 * Volume Adjustment based on Readiness:
 * - Low (<40): Min reps, 2 sets.
 * - Medium (40-70): Avg reps, 3 sets.
 * - High (>70): Max reps, 4 sets.
 * 
 * @param {string} targetSkill - e.g. 'handstand'
 * @param {object} userHistory - { exercise_id: stats }
 * @returns {object} - Workout plan object
 */
/**
 * Generates a focused workout based on a target skill and user readiness.
 * 
 * Rules:
 * 1. Blocks: Skill, Strength, Core, Accessory.
 * 2. Readiness (<30: Tech, 30-59: Mod, >60: Str).
 * 3. No Repeats: Main exercises shouldn't be same as last 2 sessions (if possible).
 * 4. Equipment: Must filter by available equipment.
 * 
 * @param {string} targetSkill - e.g. 'handstand' (if null/empty, generates prep)
 * @param {object} userHistory - { exercise_id: stats }
 * @param {string[]} availableEquipment - e.g. ['pull_up_bar', 'dip_bars']
 * @returns {object} - Workout plan object
 */
export const generateSkillWorkout = (targetSkill, userHistory, availableEquipment = []) => {
    console.log('='.repeat(60));
    console.log('[generateSkillWorkout] START');
    console.log('[History] Total exercises:', Object.keys(userHistory).length);
    console.log('[History] Sample:', Object.keys(userHistory).slice(0, 5));
    console.log('[Target Skill]:', targetSkill || '(none - prep mode)');

    const readiness = calculateReadinessScore(userHistory);
    const score = readiness.totalScore;

    console.log('[Readiness] Score:', score, readiness.breakdown);

    // Helper: Filter by equipment
    const isEquipmentMet = (ex) => {
        if (!ex.equipment || ex.equipment.includes('none')) return true;
        // If ex.equipment has items, at least one match? Or all?
        // Usually database implies "requires X". Logic: user needs ALL required.
        // But our DB format is array [option1], or maybe [req1, req2]?
        // Let's assume ex.equipment is an array of REQUIRED items.
        // Actually, JSON says: "equipment": ["pull_up_bar"].
        return ex.equipment.every(req =>
            req === 'none' || availableEquipment.includes(req)
        );
    };

    // Helper: Global Dates
    const allDates = new Set();
    Object.values(userHistory).forEach(st => {
        if (st.history) st.history.forEach(h => allDates.add(h.date));
    });
    const globalDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));

    console.log('[Progression] Global workout dates:', globalDates);
    console.log('[Progression] User history keys:', Object.keys(userHistory));

    // Helper: Check if repeated recently (last 2 sessions)
    // Rule: "Nunca repetir o mesmo exercício principal por mais de 2 sessões seguidas."
    const isRepeatedRecently = (exId) => {
        if (globalDates.length < 2) return false;
        const stats = userHistory[exId];
        if (!stats || !stats.history) return false;

        const myDates = new Set(stats.history.map(h => h.date));
        // Check if performed in Both of the last 2 Global Sessions
        const repeated = myDates.has(globalDates[0]) && myDates.has(globalDates[1]);

        if (repeated) {
            console.log(`[No-Repeat] Blocking ${exId} - done in last 2 sessions:`, globalDates[0], globalDates[1]);
        }

        return repeated;
    };

    const selectExercise = (candidates) => {
        if (!candidates || candidates.length === 0) return null;

        console.log(`[Selection] Evaluating ${candidates.length} candidates:`, candidates.map(c => c.id));

        // Filter out those repeated > 2 times recently
        const fresh = candidates.filter(ex => !isRepeatedRecently(ex.id));

        console.log(`[Selection] Fresh options (not repeated):`, fresh.map(f => f.id));

        // Fallback to candidates if all are repeated (to avoid empty workout)
        const pool = fresh.length > 0 ? fresh : candidates;

        // Pick hardest (last one sorted by difficulty)
        const maxDifficulty = Math.max(...pool.map(ex => ex.difficulty_score || 0));

        // Get all exercises with max difficulty (there might be ties)
        const hardest = pool.filter(ex => (ex.difficulty_score || 0) === maxDifficulty);

        // If there are multiple with same difficulty, randomize to add variety
        let selected;
        if (hardest.length > 1) {
            const randomIndex = Math.floor(Math.random() * hardest.length);
            selected = hardest[randomIndex];
            console.log(`[Selection] Multiple exercises with difficulty ${maxDifficulty}, randomly chose:`, selected.id);
        } else {
            selected = hardest[0];
            console.log(`[Selection] Selected hardest:`, selected?.id, `(difficulty ${maxDifficulty})`);
        }

        return selected;
    };

    // 1. Skill Component
    let skillStage = null;
    let skillNameForTitle = "Condicionamento";


    if (targetSkill) {
        skillStage = getUserSkillStage(targetSkill, userHistory);

        // ✅ NEW: If skill is maxed (returns null), try rotating to another skill
        if (!skillStage) {
            console.log(`[Rotation] ${targetSkill} is maxed out. Trying other skills...`);
            const allSkills = getAllSkills().filter(s => s !== targetSkill);

            for (const altSkill of allSkills) {
                const altStage = getUserSkillStage(altSkill, userHistory);
                if (altStage) {
                    console.log(`[Rotation] ✅ Switched from ${targetSkill} to ${altSkill}`);
                    skillStage = altStage;
                    targetSkill = altSkill;
                    skillNameForTitle = altSkill.charAt(0).toUpperCase() + altSkill.slice(1);
                    break;
                }
            }

            // If still no skillStage, all skills maxed - will fall through to fallback
            if (!skillStage) {
                console.log(`[Rotation] ⚠️ ALL SKILLS MAXED! Using fallback...`);
            }
        } else {
            skillNameForTitle = targetSkill.charAt(0).toUpperCase() + targetSkill.slice(1);
        }
    }

    // Identify user's mastered IDs 
    const masteredIds = exercises
        .filter(ex => {
            const stats = userHistory[ex.id];
            return stats && checkMastery(ex, stats);
        })
        .map(ex => ex.id);

    console.log('[Mastered] Total:', masteredIds.length, '/', exercises.length);
    console.log('[Mastered] IDs:', masteredIds.slice(0, 10), masteredIds.length > 10 ? '...' : '');

    // Filter available exercises (Unlocked + Equipment)
    const getCandidates = (pattern) => {
        return getAvailableExercisesByPattern(pattern, masteredIds)
            .filter(isEquipmentMet);
    };

    // Fallback if no skill stage (e.g. no skills unlocked or passed)
    if (!skillStage) {
        // Prioritize preparatory (Push/Pull basics)
        const cands = getCandidates('push').concat(getCandidates('pull'));

        console.log('[Fallback] No skill stage. Push/Pull candidates:', cands.map(c => `${c.id}(${c.difficulty_score})`));

        // ✅ FIX: Pick HARDEST unlocked, not first
        if (cands.length > 0) {
            const maxDiff = Math.max(...cands.map(c => c.difficulty_score || 0));
            const hardest = cands.filter(c => (c.difficulty_score || 0) === maxDiff);
            skillStage = hardest[Math.floor(Math.random() * hardest.length)];
            console.log('[Fallback] Selected hardest:', skillStage?.id, `(diff:${skillStage?.difficulty_score})`);
        } else {
            skillStage = null;
        }
    }

    if (!skillStage) return { error: "Nenhum exercício disponível." };

    // ✅ ANTI-DUPLICATION: Track used exercise IDs
    const usedExerciseIds = new Set([skillStage.id]);
    console.log('[Anti-Duplication] Initial used IDs:', Array.from(usedExerciseIds));

    // 2. Strength Component
    // Related to skill pattern.
    const strengthPattern = skillStage.pattern === 'skill_full_body' ? 'push' : skillStage.pattern;
    const strengthCandidates = getCandidates(strengthPattern)
        .filter(ex => ex.id !== skillStage.id && !usedExerciseIds.has(ex.id)); // ✅ No duplicates

    console.log(`[Strength Block] Pattern: "${strengthPattern}", Candidates: ${strengthCandidates.length}`);

    // Pick hardest available, preferring fresh
    const strengthEx = selectExercise(strengthCandidates);
    if (strengthEx) {
        usedExerciseIds.add(strengthEx.id);
        console.log(`[Strength Block] ✅ Selected: ${strengthEx.id}`);
    } else {
        console.log('[Strength Block] ⚠️ No exercise selected');
    }

    // 3. Core Component
    const coreCandidates = getCandidates('core')
        .filter(ex => !usedExerciseIds.has(ex.id)); // ✅ Filter already used IDs

    console.log(`[Core Block] Candidates: ${coreCandidates.length} (after filtering ${usedExerciseIds.size} used)`);

    const coreEx = selectExercise(coreCandidates);
    if (coreEx) {
        usedExerciseIds.add(coreEx.id);
        console.log(`[Core Block] ✅ Selected: ${coreEx.id}`);
    } else {
        console.log('[Core Block] ⚠️ No exercise selected');
    }

    // 4. Accessory Component
    // Antagonist
    const accessoryPattern = strengthPattern === 'push' ? 'pull' :
        strengthPattern === 'pull' ? 'push' : 'legs';
    const accCandidates = getCandidates(accessoryPattern)
        .filter(ex => !usedExerciseIds.has(ex.id)); // ✅ Filter already used IDs

    console.log(`[Accessory Block] Pattern: "${accessoryPattern}", Candidates: ${accCandidates.length}`);

    const accessoryEx = selectExercise(accCandidates);
    if (accessoryEx) {
        usedExerciseIds.add(accessoryEx.id);
        console.log(`[Accessory Block] ✅ Selected: ${accessoryEx.id}`);
    } else {
        console.log('[Accessory Block] ⚠️ No exercise selected');
    }

    console.log('[Anti-Duplication] Final used IDs:', Array.from(usedExerciseIds));
    console.log('[Anti-Duplication] ✅ Total unique exercises:', usedExerciseIds.size);

    // Volume & Type Adjustment based on Readiness
    let sets = 3;
    let typeLabel = "Treino Moderado";
    let repsMode = 'avg'; // min, avg, max

    if (score < 30) {
        // Recovery / Tech
        sets = 2;
        repsMode = 'min';
        typeLabel = "Foco Técnico (Recuperação)";
    } else if (score >= 60) {
        // Strength / Progression
        sets = 4;
        repsMode = 'max';
        typeLabel = "Foco em Força (Progressão)";
    }

    const buildPrescription = (ex) => {
        if (!ex) return null;
        let pReps = "";

        if (ex.metric_type === 'reps') {
            const min = ex.default_prescription.reps_min;
            const max = ex.default_prescription.reps_max;
            if (repsMode === 'min') pReps = `${min}`;
            else if (repsMode === 'max') pReps = `${max}`;
            else pReps = `${Math.floor((min + max) / 2)}-${max}`;
        } else {
            const min = ex.default_prescription.seconds_min;
            const max = ex.default_prescription.seconds_max;
            if (repsMode === 'min') pReps = `${min}s`;
            else if (repsMode === 'max') pReps = `${max}s`;
            else pReps = `${min}-${max}s`;
        }

        return {
            ...formatExerciseForUI(ex),
            target_sets: sets,
            target_reps: pReps
        };
    };

    return {
        name: `Foco em ${skillNameForTitle}`,
        description: typeLabel,
        readiness_score: score,
        exercises: [
            { type: 'Skill', ...buildPrescription(skillStage) },
            { type: 'Strength', ...buildPrescription(strengthEx) },
            { type: 'Core', ...buildPrescription(coreEx) },
            { type: 'Accessory', ...buildPrescription(accessoryEx) }
        ].filter(e => e.original_id)
    };
};

export const formatExerciseForUI = (exercise) => {
    if (!exercise) return null;
    return {
        exercise_name: exercise.name,
        name: exercise.name,
        muscle_group: exercise.primary_muscles.join('/'),
        target_sets: exercise.default_prescription.sets,
        target_reps: `${exercise.default_prescription.reps_min}-${exercise.default_prescription.reps_max}`,
        difficulty: `Lvl ${exercise.difficulty_score}`,
        original_id: exercise.id,
        media: exercise.media // Ensure media is passed
    };
};
