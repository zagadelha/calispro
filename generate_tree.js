import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'src/assets/exercises/exercises_v1_1.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const exercises = data.exercises;
const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));

function buildTree() {
    const patterns = [...new Set(exercises.map(ex => ex.pattern))];
    let output = "EXERCISE PROGRESSION TREE (By Pattern)\n";
    output += "======================================\n\n";

    patterns.forEach(pattern => {
        output += `PATTERN: ${pattern.toUpperCase()}\n`;
        output += "-".repeat(pattern.length + 9) + "\n";

        const patternExercises = exercises.filter(ex => ex.pattern === pattern);

        const roots = patternExercises.filter(ex =>
            !ex.prerequisites ||
            ex.prerequisites.length === 0 ||
            ex.prerequisites.every(pId => !exerciseMap.has(pId))
        );

        const visited = new Set();

        function printNode(nodeId, indent = "") {
            const ex = exerciseMap.get(nodeId);
            if (!ex) return;

            // Prevent infinite loops if there are circular refs
            if (visited.has(nodeId)) {
                output += `${indent}└─ ${ex.name} (${ex.id}) [ALREADY LISTED]\n`;
                return;
            }
            visited.add(nodeId);

            const skillTag = ex.skill ? ` [Skill: ${ex.skill}]` : "";
            const diffTag = ` (Diff: ${ex.difficulty_score})`;
            output += `${indent}└─ ${ex.name} (${ex.id})${skillTag}${diffTag}\n`;

            if (ex.progresses_to && ex.progresses_to.length > 0) {
                ex.progresses_to.forEach(childId => {
                    printNode(childId, indent + "   ");
                });
            }
        }

        roots.sort((a, b) => a.difficulty_score - b.difficulty_score).forEach(root => {
            printNode(root.id);
        });

        output += "\n";
    });

    // Group by Skill as well
    const skills = [...new Set(exercises.map(ex => ex.skill).filter(Boolean))];
    output += "\nSKILL PROGRESSION TREE (By Skill)\n";
    output += "=================================\n\n";

    skills.forEach(skill => {
        output += `SKILL: ${skill.toUpperCase()}\n`;
        output += "-".repeat(skill.length + 7) + "\n";

        const skillExercises = exercises.filter(ex => ex.skill === skill);
        const skillVisited = new Set();

        const roots = skillExercises.filter(ex =>
            !ex.prerequisites ||
            ex.prerequisites.length === 0 ||
            ex.prerequisites.every(pId => {
                const pEx = exerciseMap.get(pId);
                return !pEx || pEx.skill !== skill;
            })
        );

        function printSkillNode(nodeId, indent = "") {
            const ex = exerciseMap.get(nodeId);
            if (!ex) return;

            if (skillVisited.has(nodeId)) {
                output += `${indent}└─ ${ex.name} (${ex.id}) [ALREADY LISTED]\n`;
                return;
            }
            skillVisited.add(nodeId);

            const diffTag = ` (Diff: ${ex.difficulty_score})`;
            output += `${indent}└─ ${ex.name} (${ex.id})${diffTag}\n`;

            const children = skillExercises.filter(c => c.prerequisites && c.prerequisites.includes(nodeId));

            children.forEach(child => {
                printSkillNode(child.id, indent + "   ");
            });
        }

        roots.sort((a, b) => a.difficulty_score - b.difficulty_score).forEach(root => {
            printSkillNode(root.id);
        });

        output += "\n";
    });

    return output;
}

const tree = buildTree();
fs.writeFileSync('exercise_tree.txt', tree);
console.log('Exercise tree generated in exercise_tree.txt');
