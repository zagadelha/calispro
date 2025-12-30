
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Aggregates user history from completed workouts.
 * Returns a map compatible with progressionSystem.js.
 * @param {string} userId 
 * @param {string} beforeDate - Optional. Only include workouts ON or BEFORE this date (YYYY-MM-DD).
 * @returns {Promise<object>} { [exerciseId]: { history: [{ date, reps, ... }] } }
 */
export const getUserHistory = async (userId, beforeDate = null) => {
    try {
        console.log('[getUserHistory] Fetching for user:', userId);

        // 1. Get recent completed workouts
        // ⚠️ REMOVED orderBy to avoid Firestore composite index requirement
        const q = query(
            collection(db, 'workouts'),
            where('user_id', '==', userId),
            where('status', '==', 'completed')
        );

        const wSnap = await getDocs(q);

        // Filter and Sort in memory instead
        const workouts = wSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            // Filter by date if provided (important for test environment/time travel)
            .filter(w => !beforeDate || (w.date || '') <= beforeDate)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .slice(0, 50); // Limit to last 50

        console.log(`[getUserHistory] Found ${workouts.length} completed workouts`);

        if (workouts.length === 0) return {};

        const historyMap = {};

        // 2. Fetch exercises for these workouts in parallel
        const promises = workouts.map(async (workout) => {
            const eq = query(
                collection(db, 'workout_exercises'),
                where('workout_id', '==', workout.id)
            );
            const eSnap = await getDocs(eq);

            eSnap.docs.forEach(doc => {
                const exData = doc.data();
                if (!exData.original_id) return; // Need ID to track mastery

                if (!historyMap[exData.original_id]) {
                    historyMap[exData.original_id] = { history: [] };
                }

                // If logged as completed OR parent workout is completed
                if (exData.completed || workout.status === 'completed') {
                    // Determine values
                    // Use Per-Exercise RPE if exists, else Global Workout RPE, else 3 (default)
                    const rpe = exData.rpe || workout.feedback_rpe || 3;

                    // Use Per-Exercise goalMet if exists, else Global Workout goalMet, else true (for backwards compatibility)
                    const goalMet = exData.goalMet !== undefined ? exData.goalMet : (workout.feedback_goal_met !== undefined ? workout.feedback_goal_met : true);

                    historyMap[exData.original_id].history.push({
                        date: workout.date,
                        reps: exData.performed_reps || exData.target_reps || 0, // Fallback to target if synced
                        seconds: exData.performed_seconds || exData.target_seconds || 0, // 🆕 ADDED FALLBACK FOR SECONDS
                        rpe: rpe,
                        goalMet: goalMet
                    });
                }
            });
        });

        await Promise.all(promises);

        /* console.log(`[getUserHistory] Aggregated ${Object.keys(historyMap).length} unique exercises`);
        console.log('[getUserHistory] Sample:', Object.keys(historyMap).slice(0, 5).map(id => ({
            id,
            sessions: historyMap[id].history.length
        }))); */

        return historyMap;

    } catch (error) {
        console.error("Error fetching user history:", error);
        return {};
    }
};
