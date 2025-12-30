
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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

async function investigate() {
    console.log(`Authenticating...`);
    await signInAnonymously(auth);
    console.log(`Authenticated as anonymous user.`);

    console.log(`Investigating history for user: ${userId}`);

    const exercisesToCheck = ['wall_handstand_hold', 'v_sit', 'windshield_wipers_partial', 'jump_squat', 'archer_squat', 'front_lever_pull_up'];

    // 1. Get all completed workouts
    // Note: If rules restrict by user_id, anonymous user might still be blocked 
    // depending on the exact rules. Let's see.
    const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('status', '==', 'completed')
    );

    const wSnap = await getDocs(q);
    const workouts = wSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    console.log(`Total completed workouts found: ${workouts.length}`);

    const exerciseHistory = [];

    // 2. Fetch exercises for all these workouts
    for (const workout of workouts) {
        const eq = query(
            collection(db, 'workout_exercises'),
            where('workout_id', '==', workout.id)
        );
        const eSnap = await getDocs(eq);

        eSnap.docs.forEach(doc => {
            const exData = doc.data();
            if (exercisesToCheck.includes(exData.original_id)) {
                exerciseHistory.push({
                    workoutId: workout.id,
                    date: workout.date,
                    exerciseId: exData.original_id,
                    performed_reps: exData.performed_reps,
                    performed_seconds: exData.performed_seconds,
                    target_reps: exData.target_reps,
                    target_seconds: exData.target_seconds,
                    rpe: exData.rpe || workout.feedback_rpe,
                    goalMet: exData.goalMet !== undefined ? exData.goalMet : (workout.feedback_goal_met !== undefined ? workout.feedback_goal_met : true),
                    completed: exData.completed
                });
            }
        });
    }

    exercisesToCheck.forEach(exId => {
        console.log(`\nHistory for ${exId}:`);
        const history = exerciseHistory.filter(h => h.exerciseId === exId);
        if (history.length === 0) {
            console.log('No history found.');
        } else {
            // Sort by date descending
            history.sort((a, b) => b.date.localeCompare(a.date));
            history.forEach(h => {
                const val = h.performed_seconds || h.performed_reps || 0;
                console.log(`Date: ${h.date}, Performed: ${val}, RPE: ${h.rpe}, GoalMet: ${h.goalMet}, WorkoutID: ${h.workoutId}`);
            });
        }
    });

    process.exit(0);
}

investigate().catch(err => {
    console.error(err);
    process.exit(1);
});
