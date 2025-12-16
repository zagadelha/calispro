
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./src/assets/exercises/exercises_v1_1.json', 'utf8'));

const skills = ['handstand', 'planche', 'front_lever', 'back_lever', 'muscle_up', 'l_sit', 'human_flag'];

skills.forEach(skill => {
    // Find all exercises for this skill
    const exercises = data.exercises.filter(ex => ex.skill === skill);

    // Find "root" exercises (no required prerequisites that are also skill-related? Or just empty prereqs?)
    // The logic in progressionSystem is check unlocked. 
    // Unlocked = all prerequisites met.
    // If empty history, ONLY exercises with empty prerequisites are unlocked.

    const roots = exercises.filter(ex => !ex.prerequisites || ex.prerequisites.length === 0);

    console.log(`\nSkill: ${skill}`);
    if (roots.length === 0) {
        console.log("  No root exercises found (all have prerequisites).");
        // Print the one with fewest prereqs maybe?
    } else {
        roots.forEach(r => console.log(`  - ${r.name} (ID: ${r.id}, Diff: ${r.difficulty_score})`));
    }
});
