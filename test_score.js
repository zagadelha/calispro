import { calculateReadinessScore, checkMastery } from './src/utils/progressionSystem.js';

// Mock History
// Assume Max Difficulty is around 10.
// User mastered Push Lvl 3, Pull Lvl 2, Legs Lvl 3, Core Lvl 3.
const userHistory = {
    'push_up': { reps: 20 }, // Lvl 3 (Mastered)
    'pull_up': { reps: 5 }, // Lvl ~4? No, pull_up might be higher. Let's say user has 'australian_row' (Lvl 3)
    'australian_row': { reps: 15 }, // Lvl 3 (Mastered)
    'bodyweight_squat': { reps: 20 }, // Lvl 3
    'plank': { seconds: 60 } // Lvl 3
};

console.log("--- Testing Readiness Score ---");
const scoreData = calculateReadinessScore(userHistory);
console.log("Total Score:", scoreData.totalScore);
console.log("Breakdown:", scoreData.breakdown);
