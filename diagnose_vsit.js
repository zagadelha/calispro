// Diagnostic script to analyze V-Sit mastery issue
// Run this in browser console

const analyzeVSit = async () => {
    const userId = 'Q8TwkL6F7hcsvUaqffOESqBfx1U2'; // Your user ID from logs

    console.log('🔍 ANALYZING V-SIT MASTERY ISSUE...\n');

    // Import Firebase
    const { collection, query, where, getDocs } = window.firebaseFirestore;
    const { db } = window.firebaseConfig;

    // 1. Get all completed workouts
    const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('status', '==', 'completed')
    );

    const wSnap = await getDocs(q);
    const workouts = wSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    console.log(`✅ Found ${workouts.length} total completed workouts\n`);

    // 2. Find all V-Sit sessions
    const vSitSessions = [];

    for (const workout of workouts) {
        const eq = query(
            collection(db, 'workout_exercises'),
            where('workout_id', '==', workout.id),
            where('original_id', '==', 'v_sit')
        );
        const eSnap = await getDocs(eq);

        eSnap.docs.forEach(doc => {
            const exData = doc.data();
            const rpe = exData.rpe || workout.feedback_rpe || 3;

            vSitSessions.push({
                date: workout.date,
                workoutId: workout.id,
                targetReps: exData.target_reps || 0,
                targetSeconds: exData.target_seconds || 0,
                performedReps: exData.performed_reps || 0,
                performedSeconds: exData.performed_seconds || 0,
                rpe: rpe,
                goalMet: exData.goalMet !== false,
                completed: exData.completed,
                workoutCompleted: workout.status === 'completed'
            });
        });
    }

    console.log(`📊 Found ${vSitSessions.length} V-Sit sessions:\n`);

    // 3. Analyze each session
    vSitSessions.forEach((session, idx) => {
        const { date, targetReps, targetSeconds, performedReps, performedSeconds, rpe, goalMet } = session;

        // Determine valmetric (same logic as progressionSystem.js)
        const metric = targetSeconds > 0 ? 'seconds' : 'reps';
        const val = metric === 'seconds' ? performedSeconds : performedReps;
        const target = metric === 'seconds' ? targetSeconds : targetReps;

        // Check validity (same logic as line 69)
        const valid = val >= target && rpe <= 4 && goalMet;

        console.log(`Session ${idx + 1} [${date}]:`);
        console.log(`  Metric: ${metric}`);
        console.log(`  Target: ${target} | Performed: ${val}`);
        console.log(`  RPE: ${rpe} ${rpe <= 4 ? '✅' : '❌ TOO HIGH'}`);
        console.log(`  Goal Met: ${goalMet ? '✅' : '❌'}`);
        console.log(`  Valid for Mastery: ${valid ? '✅ YES' : '❌ NO'}`);
        console.log('');
    });

    // 4. Count valid sessions
    const validCount = vSitSessions.filter(s => {
        const metric = s.targetSeconds > 0 ? 'seconds' : 'reps';
        const val = metric === 'seconds' ? s.performedSeconds : s.performedReps;
        const target = metric === 'seconds' ? s.targetSeconds : s.targetReps;
        return val >= target && s.rpe <= 4 && s.goalMet;
    }).length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`Total Sessions: ${vSitSessions.length}`);
    console.log(`Valid Sessions: ${validCount}/2 required`);
    console.log(`Mastered: ${validCount >= 2 ? '✅ YES' : '❌ NO (needs ' + (2 - validCount) + ' more valid sessions)'}`);

    if (validCount < 2) {
        console.log('\n⚠️ REASONS FOR INVALID SESSIONS:');
        vSitSessions.forEach((s, idx) => {
            const metric = s.targetSeconds > 0 ? 'seconds' : 'reps';
            const val = metric === 'seconds' ? s.performedSeconds : s.performedReps;
            const target = metric === 'seconds' ? s.targetSeconds : s.targetReps;

            if (!(val >= target && s.rpe <= 4 && s.goalMet)) {
                const reasons = [];
                if (val < target) reasons.push(`Performed ${val}/${target} ${metric} (below target)`);
                if (s.rpe > 4) reasons.push(`RPE ${s.rpe} (too high, must be ≤4)`);
                if (!s.goalMet) reasons.push('Goal not met');

                console.log(`Session ${idx + 1}: ${reasons.join(', ')}`);
            }
        });
    }
};

// Run analysis
analyzeVSit();
