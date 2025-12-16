
import { getUserSkillStage, getAllSkills } from './src/utils/progressionSystem.js';

const emptyHistory = {};
const skills = getAllSkills();

console.log("All Skills:", skills);

skills.forEach(skill => {
    const stage = getUserSkillStage(skill, emptyHistory);
    console.log(`Skill: ${skill}, Stage 1: ${stage ? stage.name : 'None'} (ID: ${stage ? stage.id : 'N/A'})`);
});
