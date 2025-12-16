import exercisesData from './src/assets/exercises/exercises_v1_1.json';

const exercises = exercisesData.exercises;
const maxDiff = Math.max(...exercises.map(e => e.difficulty_score || 0));
console.log("Max Difficulty found:", maxDiff);
