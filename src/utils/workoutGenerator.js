import { collection, addDoc, doc, setDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getVirtualDate, getVirtualNow } from './timeTravel';
import {
    generateSkillWorkout,
    generatePatternWorkout,
    checkMastery,
    formatSkillName
} from './progressionSystem';
import exercisesData from '../assets/exercises/exercises_v1_1.json';

const exercises = exercisesData.exercises;

// Mapping for equipment from UI (Onboarding/Profile) to internal IDs
const EQUIPMENT_MAP = {
    'Peso corporal': 'none',
    'Barra fixa': 'pull_up_bar',
    'Paralelas': 'dip_bars',
    'Elásticos': 'resistance_bands'
};

/**
 * Maps UI equipment list to internal IDs.
 * @param {string[]} uiEquipment 
 * @returns {string[]}
 */
const mapEquipment = (uiEquipment) => {
    if (!uiEquipment || !Array.isArray(uiEquipment)) return ['none'];
    const mapped = uiEquipment.map(item => EQUIPMENT_MAP[item]).filter(Boolean);
    return mapped.length > 0 ? mapped : ['none'];
};

/**
 * Initializes a user's mastery history based on their experience level.
 * This avoids forcing experienced users to start from level 1.
 * 
 * @param {string} userId 
 * @param {string} level - 'Iniciante', 'Intermediário', 'Avançado'
 */
const initializeMastery = async (userId, level) => {
    if (level === 'Iniciante') return {};

    const maxDifficultyToSeed = level === 'Intermediário' ? 2 : 4;
    const history = {};
    const batch = writeBatch(db);

    // Filter exercises to seed
    const toSeed = exercises.filter(ex => (ex.difficulty_score || 0) <= maxDifficultyToSeed);

    const yesterday = new Date(getVirtualNow());
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    for (const ex of toSeed) {
        // Create 2 "perfect" logs to satisfy mastery criteria (2 sessions with RPE <= 4)
        const stats = {
            exercise_id: ex.id,
            reps: ex.metric_type === 'reps' ? ex.default_prescription.reps_max : 0,
            seconds: ex.metric_type === 'seconds' ? ex.default_prescription.seconds_max : 0,
            history: [
                {
                    date: dateStr,
                    reps: ex.metric_type === 'reps' ? ex.default_prescription.reps_max : 0,
                    seconds: ex.metric_type === 'seconds' ? ex.default_prescription.seconds_max : 0,
                    rpe: 3,
                    goalMet: true,
                    isInitialSeed: true
                },
                {
                    date: dateStr,
                    reps: ex.metric_type === 'reps' ? ex.default_prescription.reps_max : 0,
                    seconds: ex.metric_type === 'seconds' ? ex.default_prescription.seconds_max : 0,
                    rpe: 2,
                    goalMet: true,
                    isInitialSeed: true
                }
            ]
        };

        history[ex.id] = stats;

        // Optionally save to Firestore to make it persistent for other logic
        // For simplicity and performance, we'll just return it for the initial generation
        // But the user might want to see them in stats.
    }

    return history;
};

/**
 * Simplified helper to fetch full user history for generator use
 */
const getFullUserHistory = async (userId) => {
    const q = query(collection(db, 'history'), where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    const history = {};
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (!history[data.exercise_id]) {
            history[data.exercise_id] = {
                exercise_id: data.exercise_id,
                history: []
            };
        }
        history[data.exercise_id].history.push(data);
    });

    return history;
};

// Generate workout plan based on user profile
export const generateWorkoutPlan = async (userId, profile) => {
    console.log('[workoutGenerator] Generating NEW plan for:', userId, profile);
    const { experience_level, goal, days_per_week, equipment } = profile;

    const internalEquipment = mapEquipment(equipment);

    // 1. Initialize Mastery (Virtual for generation)
    // We don't write to DB yet to avoid cluttering history with fake logs
    // unless the user specifically wants that. 
    // Here we'll use it to seed the generator.
    const virtualHistory = await initializeMastery(userId, experience_level);

    // 2. Determine Plan Details
    const daysCount = parseInt(days_per_week) || 3;
    const skillRotation = ['handstand', 'front_lever', 'planche', 'back_lever'];

    // Save plan to Firestore
    const planRef = await addDoc(collection(db, 'plans'), {
        user_id: userId,
        name: `Plano CalisPro - ${experience_level}`,
        level: experience_level,
        goal: goal,
        days_per_week: days_per_week,
        created_at: getVirtualNow().toISOString(),
        active: true,
        version: '1.1' // New system version
    });

    // 3. Create initial workouts for the week
    const today = getVirtualNow();

    for (let i = 0; i < daysCount; i++) {
        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() + i);
        const dateStr = workoutDate.toISOString().split('T')[0];

        // Pick skill based on rotation
        const targetSkill = skillRotation[i % skillRotation.length];

        // Generate workout using new system logic
        const genWorkout = generateSkillWorkout(targetSkill, virtualHistory, internalEquipment, dateStr, true);

        if (genWorkout.error) {
            console.warn(`[workoutGenerator] Skip day ${i}: ${genWorkout.error}`);
            continue;
        }

        // Save Workout Doc
        const workoutRef = await addDoc(collection(db, 'workouts'), {
            user_id: userId,
            plan_id: planRef.id,
            date: dateStr,
            day_label: String.fromCharCode(65 + i), // A, B, C...
            name: genWorkout.name,
            status: 'pending',
            difficulty_feedback: null,
            notes: '',
            readiness_score: genWorkout.readiness_score || 0,
            skill_id: targetSkill,
            skill_media_url: genWorkout.skill_media_url || null
        });

        // Add exercises to workout
        const exercisesToAdd = genWorkout.exercises || [];
        for (let j = 0; j < exercisesToAdd.length; j++) {
            const ex = exercisesToAdd[j];
            await addDoc(collection(db, 'workout_exercises'), {
                workout_id: workoutRef.id,
                exercise_name: ex.exercise_name || ex.name,
                muscle_group: ex.muscle_group,
                target_sets: ex.target_sets,
                target_reps: ex.target_reps,
                target_seconds: ex.target_seconds || null,
                metric_type: ex.metric_type || 'reps',
                type: ex.type,
                original_id: ex.original_id,
                difficulty_score: ex.difficulty_score || 0,
                order_index: j,
                completed: false
            });
        }
    }

    // Update user's current plan
    await setDoc(doc(db, 'users', userId), {
        current_plan_id: planRef.id,
        experience_level: experience_level,
        goal: goal,
        equipment: internalEquipment // Store mapped equipment
    }, { merge: true });

    return planRef.id;
};


// Get today's workout (Updated to support new format)
export const getTodayWorkout = async (userId) => {
    const today = getVirtualDate();

    const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    // If multiple found (e.g. specialized + plan), pick most recent or plan
    const workoutDoc = querySnapshot.docs[0];
    const workout = { id: workoutDoc.id, ...workoutDoc.data() };

    // Get exercises for this workout
    const exercisesQuery = query(
        collection(db, 'workout_exercises'),
        where('workout_id', '==', workout.id)
    );

    const exercisesSnapshot = await getDocs(exercisesQuery);
    workout.exercises = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })).sort((a, b) => a.order_index - b.order_index);

    return workout;
};

