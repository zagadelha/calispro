
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
    }
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const userId = 'Q8TwkL6F7hcsvUaqffOESqBfx1U2'; // Marcio10

async function reportMastery() {
    console.log(`Authenticating...`);
    await signInAnonymously(auth);

    // Load Exercise List
    const exercisesPath = path.resolve('src/assets/exercises/exercises_v1_1.json');
    const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
    const allExercises = exercisesData.exercises;
    const exerciseMap = {};
    allExercises.forEach(ex => { exerciseMap[ex.id] = ex; });

    console.log(`Fetching workouts for Marcio10...`);
    const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('status', '==', 'completed')
    );

    const wSnap = await getDocs(q);
    const workouts = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${workouts.length} completed workouts.`);

    const exerciseHistory = [];

    for (const workout of workouts) {
        const eq = query(
            collection(db, 'workout_exercises'),
            where('workout_id', '==', workout.id)
        );
        const eSnap = await getDocs(eq);

        eSnap.docs.forEach(doc => {
            const exData = doc.data();
            const exId = exData.original_id;
            if (!exId) return;

            const rpe = exData.rpe || workout.feedback_rpe;
            const goalMet = exData.goalMet !== undefined ? exData.goalMet : (workout.feedback_goal_met !== undefined ? workout.feedback_goal_met : true);

            const targetVal = exData.target_seconds || exData.target_reps || 0;
            const performedVal = exData.performed_seconds || exData.performed_reps || 0;

            const isValid = performedVal >= targetVal && rpe <= 4 && goalMet === true;

            exerciseHistory.push({
                id: exId,
                date: workout.date,
                isValid,
                performedVal,
                targetVal,
                rpe,
                goalMet
            });
        });
    }

    // Group by exercise
    const stats = {};
    exerciseHistory.forEach(h => {
        if (!stats[h.id]) {
            stats[h.id] = {
                attempts: 0,
                validSessions: 0,
                history: []
            };
        }
        stats[h.id].attempts += 1;
        if (h.isValid) stats[h.id].validSessions += 1;
        stats[h.id].history.push(h);
    });

    console.log('\n--- MASTERY REPORT FOR MARCIO10 ---\n');

    const notMastered = [];
    const mastered = [];

    Object.keys(stats).forEach(exId => {
        const s = stats[exId];
        const name = exerciseMap[exId]?.name || exId;
        if (s.validSessions >= 2) {
            mastered.push({ id: exId, name, ...s });
        } else {
            notMastered.push({ id: exId, name, ...s });
        }
    });

    console.log('UNMASTERED EXERCISES (Attempted but < 2 valid sessions):');
    if (notMastered.length === 0) {
        console.log('None.');
    } else {
        notMastered.sort((a, b) => b.validSessions - a.validSessions);
        notMastered.forEach(ex => {
            console.log(`- ${ex.name} (${ex.id}): ${ex.validSessions}/2 valid sessions. Total attempts: ${ex.attempts}`);
            // Show why it's not valid if they have attempts but 0 valid
            if (ex.validSessions === 0 && ex.attempts > 0) {
                const latest = ex.history.sort((a, b) => b.date.localeCompare(a.date))[0];
                console.log(`  Last attempt (${latest.date}): Performed ${latest.performedVal}/${latest.targetVal}, RPE ${latest.rpe}, GoalMet: ${latest.goalMet}`);
            }
        });
    }

    console.log('\nMASTERED EXERCISES:');
    mastered.forEach(ex => {
        console.log(`- ${ex.name} (${ex.id}): ${ex.validSessions} valid sessions.`);
    });

    process.exit(0);
}

reportMastery().catch(err => {
    console.error(err);
    process.exit(1);
});
