
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');
const fs = require('fs');
const path = require('path');

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

// Load exercises
const exercisesData = JSON.parse(fs.readFileSync('src/assets/exercises/exercises_v1_1.json', 'utf8'));
const exercises = exercisesData.exercises;

async function checkMasteryForUser() {
    console.log(`Authenticating...`);
    await signInAnonymously(auth);

    console.log(`Fetching history for user: ${userId}`);

    // 1. Get all completed workouts
    const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('status', '==', 'completed')
    );

    const wSnap = await getDocs(q);
    const workouts = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Found ${workouts.length} completed workouts.`);

    const historyMap = {};

    // 2. Fetch all exercise records for these workouts
    for (const workout of workouts) {
        const eq = query(
            collection(db, 'workout_exercises'),
            where('workout_id', '==', workout.id)
        );
        const eSnap = await getDocs(eq);

        eSnap.docs.forEach(doc => {
            const exData = doc.data();
            const id = exData.original_id;
            if (!id) return;

            if (!historyMap[id]) historyMap[id] = [];

            const rpe = exData.rpe || workout.feedback_rpe || 3;
            const goalMet = exData.goalMet !== undefined ? exData.goalMet : (workout.feedback_goal_met !== undefined ? workout.feedback_goal_met : true);

            historyMap[id].push({
                date: workout.date,
                performed_reps: exData.performed_reps || 0,
                performed_seconds: exData.performed_seconds || 0,
                target_reps: exData.target_reps || 0,
                target_seconds: exData.target_seconds || 0,
                rpe: rpe,
                goalMet: goalMet
            });
        });
    }

    // 3. Evaluate Mastery for each exercise in the DB
    const mastered = [];
    const notMasteredInHistory = [];
    const neverTrained = [];

    exercises.forEach(ex => {
        const history = historyMap[ex.id];

        if (!history || history.length === 0) {
            neverTrained.push(ex);
            return;
        }

        // Mastery Logic (Sync with progressionSystem.js)
        const validSessions = history.filter(h => {
            const isSeconds = ex.metric_type === 'seconds';
            const val = isSeconds ? h.performed_seconds : h.performed_reps;
            const target = isSeconds ? (h.target_seconds || ex.default_prescription.seconds_min) : (h.target_reps || ex.default_prescription.reps_min);

            const reachedTarget = val >= target;
            const goodRPE = h.rpe <= 4;
            const metGoal = h.goalMet !== false;

            return reachedTarget && goodRPE && metGoal;
        });

        if (validSessions.length >= 2) {
            mastered.push({ id: ex.id, name: ex.name, sessions: history.length, valid: validSessions.length });
        } else {
            notMasteredInHistory.push({ id: ex.id, name: ex.name, sessions: history.length, valid: validSessions.length });
        }
    });

    console.log('\n--- MASTREIZADOS ✅ ---');
    mastered.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
        console.log(`${m.name} (${m.id}) - ${m.valid}/${m.sessions} sessões válidas`);
    });

    console.log('\n--- EM PROGRESSO (NÃO MASTERIZADOS) 🏗️ ---');
    notMasteredInHistory.sort((a, b) => a.name.localeCompare(b.name)).forEach(nm => {
        console.log(`${nm.name} (${nm.id}) - ${nm.valid}/${nm.sessions} sessões válidas`);
    });

    console.log('\n--- NUNCA TREINADOS 🌑 ---');
    console.log(`(Total: ${neverTrained.length} exercícios)`);

    process.exit(0);
}

checkMasteryForUser().catch(err => {
    console.error(err);
    process.exit(1);
});
