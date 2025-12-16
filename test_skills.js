import { getUserSkillStage, getAllSkills } from './src/utils/progressionSystem.js';

// Mock User History
// User has mastered pike_push_up_beginner (let's say they did 15 reps, max is 15)
const userHistory = {
    'pike_push_up_beginner': { reps: 15 },
    'pike_push_up_advanced': { reps: 5 } // Attempted, but not mastered (sets/reps logic?)
};

console.log("--- Testing Skill Stages ---");
const skills = getAllSkills();
console.log("Available Skills:", skills);

skills.forEach(skill => {
    const stage = getUserSkillStage(skill, userHistory);
    if (stage) {
        console.log(`Current Stage for ${skill}: ${stage.name} (ID: ${stage.id})`);
    } else {
        console.log(`No exercises found for skill: ${skill}`);
    }
});

// Test case: user has NO history
console.log("\n--- Testing Empty History ---");
const stageEmpty = getUserSkillStage('handstand', {});
console.log(`Start Stage for handstand (Empty History): ${stageEmpty ? stageEmpty.name : 'None'}`);
