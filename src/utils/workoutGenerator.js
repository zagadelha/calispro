import { collection, addDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Exercise database
const exerciseDatabase = {
    beginner: {
        'Ganhar força': [
            { name: 'Flexões', muscle_group: 'Peito/Tríceps', sets: 3, reps: 8, difficulty: 'beginner' },
            { name: 'Agachamento', muscle_group: 'Pernas', sets: 3, reps: 12, difficulty: 'beginner' },
            { name: 'Prancha', muscle_group: 'Core', sets: 3, reps: 30, difficulty: 'beginner' },
            { name: 'Remada Invertida', muscle_group: 'Costas', sets: 3, reps: 8, difficulty: 'beginner' },
            { name: 'Afundo', muscle_group: 'Pernas', sets: 3, reps: 10, difficulty: 'beginner' },
        ],
        'Hipertrofia': [
            { name: 'Flexões', muscle_group: 'Peito/Tríceps', sets: 4, reps: 12, difficulty: 'beginner' },
            { name: 'Agachamento', muscle_group: 'Pernas', sets: 4, reps: 15, difficulty: 'beginner' },
            { name: 'Prancha', muscle_group: 'Core', sets: 3, reps: 45, difficulty: 'beginner' },
            { name: 'Pike Push-up', muscle_group: 'Ombros', sets: 3, reps: 10, difficulty: 'beginner' },
            { name: 'Glute Bridge', muscle_group: 'Glúteos', sets: 4, reps: 15, difficulty: 'beginner' },
        ],
        'Definição': [
            { name: 'Burpees', muscle_group: 'Full Body', sets: 3, reps: 10, difficulty: 'beginner' },
            { name: 'Mountain Climbers', muscle_group: 'Core', sets: 3, reps: 20, difficulty: 'beginner' },
            { name: 'Jumping Jacks', muscle_group: 'Cardio', sets: 3, reps: 30, difficulty: 'beginner' },
            { name: 'Flexões', muscle_group: 'Peito', sets: 3, reps: 10, difficulty: 'beginner' },
            { name: 'Agachamento Jump', muscle_group: 'Pernas', sets: 3, reps: 12, difficulty: 'beginner' },
        ],
        'Manutenção': [
            { name: 'Flexões', muscle_group: 'Peito', sets: 3, reps: 10, difficulty: 'beginner' },
            { name: 'Agachamento', muscle_group: 'Pernas', sets: 3, reps: 12, difficulty: 'beginner' },
            { name: 'Prancha', muscle_group: 'Core', sets: 3, reps: 30, difficulty: 'beginner' },
            { name: 'Superman', muscle_group: 'Costas', sets: 3, reps: 12, difficulty: 'beginner' },
        ]
    },
    intermediate: {
        'Ganhar força': [
            { name: 'Pull-ups', muscle_group: 'Costas', sets: 4, reps: 6, difficulty: 'intermediate' },
            { name: 'Dips', muscle_group: 'Tríceps/Peito', sets: 4, reps: 8, difficulty: 'intermediate' },
            { name: 'Pistol Squat (assistido)', muscle_group: 'Pernas', sets: 3, reps: 6, difficulty: 'intermediate' },
            { name: 'Handstand Hold', muscle_group: 'Ombros', sets: 3, reps: 20, difficulty: 'intermediate' },
            { name: 'L-Sit', muscle_group: 'Core', sets: 3, reps: 15, difficulty: 'intermediate' },
        ],
        'Hipertrofia': [
            { name: 'Pull-ups', muscle_group: 'Costas', sets: 4, reps: 10, difficulty: 'intermediate' },
            { name: 'Dips', muscle_group: 'Tríceps/Peito', sets: 4, reps: 12, difficulty: 'intermediate' },
            { name: 'Bulgarian Split Squat', muscle_group: 'Pernas', sets: 4, reps: 12, difficulty: 'intermediate' },
            { name: 'Pike Push-ups', muscle_group: 'Ombros', sets: 4, reps: 12, difficulty: 'intermediate' },
            { name: 'Hanging Leg Raises', muscle_group: 'Core', sets: 4, reps: 12, difficulty: 'intermediate' },
        ],
        'Definição': [
            { name: 'Burpees', muscle_group: 'Full Body', sets: 4, reps: 15, difficulty: 'intermediate' },
            { name: 'Pull-ups', muscle_group: 'Costas', sets: 3, reps: 8, difficulty: 'intermediate' },
            { name: 'Jump Squats', muscle_group: 'Pernas', sets: 4, reps: 15, difficulty: 'intermediate' },
            { name: 'Mountain Climbers', muscle_group: 'Core', sets: 4, reps: 30, difficulty: 'intermediate' },
            { name: 'Dips', muscle_group: 'Tríceps', sets: 3, reps: 10, difficulty: 'intermediate' },
        ],
        'Manutenção': [
            { name: 'Pull-ups', muscle_group: 'Costas', sets: 3, reps: 8, difficulty: 'intermediate' },
            { name: 'Dips', muscle_group: 'Tríceps/Peito', sets: 3, reps: 10, difficulty: 'intermediate' },
            { name: 'Pistol Squat', muscle_group: 'Pernas', sets: 3, reps: 6, difficulty: 'intermediate' },
            { name: 'Hanging Leg Raises', muscle_group: 'Core', sets: 3, reps: 10, difficulty: 'intermediate' },
        ]
    },
    advanced: {
        'Ganhar força': [
            { name: 'Muscle-ups', muscle_group: 'Costas/Tríceps', sets: 5, reps: 5, difficulty: 'advanced' },
            { name: 'One-Arm Push-up', muscle_group: 'Peito', sets: 4, reps: 5, difficulty: 'advanced' },
            { name: 'Pistol Squat', muscle_group: 'Pernas', sets: 4, reps: 8, difficulty: 'advanced' },
            { name: 'Front Lever Hold', muscle_group: 'Core/Costas', sets: 4, reps: 10, difficulty: 'advanced' },
            { name: 'Planche Lean', muscle_group: 'Ombros/Core', sets: 4, reps: 15, difficulty: 'advanced' },
        ],
        'Hipertrofia': [
            { name: 'Weighted Pull-ups', muscle_group: 'Costas', sets: 5, reps: 8, difficulty: 'advanced' },
            { name: 'Weighted Dips', muscle_group: 'Tríceps/Peito', sets: 5, reps: 10, difficulty: 'advanced' },
            { name: 'Pistol Squat', muscle_group: 'Pernas', sets: 4, reps: 10, difficulty: 'advanced' },
            { name: 'Handstand Push-ups', muscle_group: 'Ombros', sets: 4, reps: 8, difficulty: 'advanced' },
            { name: 'Dragon Flag', muscle_group: 'Core', sets: 4, reps: 8, difficulty: 'advanced' },
        ],
        'Definição': [
            { name: 'Muscle-ups', muscle_group: 'Full Body', sets: 4, reps: 6, difficulty: 'advanced' },
            { name: 'Burpee Pull-ups', muscle_group: 'Full Body', sets: 4, reps: 12, difficulty: 'advanced' },
            { name: 'Pistol Squat Jump', muscle_group: 'Pernas', sets: 4, reps: 8, difficulty: 'advanced' },
            { name: 'Toes to Bar', muscle_group: 'Core', sets: 4, reps: 15, difficulty: 'advanced' },
            { name: 'Clapping Push-ups', muscle_group: 'Peito', sets: 4, reps: 10, difficulty: 'advanced' },
        ],
        'Manutenção': [
            { name: 'Muscle-ups', muscle_group: 'Full Body', sets: 3, reps: 5, difficulty: 'advanced' },
            { name: 'Pistol Squat', muscle_group: 'Pernas', sets: 3, reps: 8, difficulty: 'advanced' },
            { name: 'Handstand Push-ups', muscle_group: 'Ombros', sets: 3, reps: 6, difficulty: 'advanced' },
            { name: 'Front Lever Hold', muscle_group: 'Core', sets: 3, reps: 10, difficulty: 'advanced' },
        ]
    }
};

// Generate workout plan based on user profile
export const generateWorkoutPlan = async (userId, profile) => {
    const { experience_level, goal, days_per_week, equipment } = profile;

    // Map experience level to database key
    const levelMap = {
        'Iniciante': 'beginner',
        'Intermediário': 'intermediate',
        'Avançado': 'advanced'
    };

    const level = levelMap[experience_level];
    const exercises = exerciseDatabase[level][goal] || exerciseDatabase[level]['Manutenção'];

    // Determine number of workout days
    const daysCount = parseInt(days_per_week) || 3;

    // Create workout splits
    const workoutDays = [];

    if (daysCount <= 3) {
        // Full body workouts
        workoutDays.push({
            day_label: 'A',
            name: 'Treino Full Body A',
            exercises: exercises.slice(0, 5)
        });
        if (daysCount >= 2) {
            workoutDays.push({
                day_label: 'B',
                name: 'Treino Full Body B',
                exercises: exercises.slice(2, 7)
            });
        }
        if (daysCount >= 3) {
            workoutDays.push({
                day_label: 'C',
                name: 'Treino Full Body C',
                exercises: exercises.slice(1, 6)
            });
        }
    } else {
        // Split workouts
        workoutDays.push({
            day_label: 'A',
            name: 'Treino A - Empurrar + Core',
            exercises: exercises.filter(e =>
                e.muscle_group.includes('Peito') ||
                e.muscle_group.includes('Ombros') ||
                e.muscle_group.includes('Tríceps') ||
                e.muscle_group.includes('Core')
            )
        });
        workoutDays.push({
            day_label: 'B',
            name: 'Treino B - Puxar',
            exercises: exercises.filter(e =>
                e.muscle_group.includes('Costas') ||
                e.muscle_group.includes('Full Body')
            )
        });
        workoutDays.push({
            day_label: 'C',
            name: 'Treino C - Pernas',
            exercises: exercises.filter(e =>
                e.muscle_group.includes('Pernas') ||
                e.muscle_group.includes('Glúteos')
            )
        });
        if (daysCount >= 5) {
            workoutDays.push({
                day_label: 'D',
                name: 'Treino D - Cardio/Condicionamento',
                exercises: exercises.filter(e =>
                    e.muscle_group.includes('Cardio') ||
                    e.muscle_group.includes('Full Body')
                )
            });
        }
    }

    // Save plan to Firestore
    const planRef = await addDoc(collection(db, 'plans'), {
        user_id: userId,
        name: `Plano ${experience_level} - ${goal}`,
        level: experience_level,
        goal: goal,
        days_per_week: days_per_week,
        created_at: new Date().toISOString(),
        active: true
    });

    // Create initial workouts for the week
    const today = new Date();
    for (let i = 0; i < workoutDays.length; i++) {
        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() + i);

        const workoutRef = await addDoc(collection(db, 'workouts'), {
            user_id: userId,
            plan_id: planRef.id,
            date: workoutDate.toISOString().split('T')[0],
            day_label: workoutDays[i].day_label,
            name: workoutDays[i].name,
            status: 'pending',
            difficulty_feedback: null,
            notes: ''
        });

        // Add exercises to workout
        for (let j = 0; j < workoutDays[i].exercises.length; j++) {
            const exercise = workoutDays[i].exercises[j];
            await addDoc(collection(db, 'workout_exercises'), {
                workout_id: workoutRef.id,
                exercise_name: exercise.name,
                muscle_group: exercise.muscle_group,
                target_sets: exercise.sets,
                target_reps: exercise.reps,
                order_index: j,
                completed: false
            });
        }
    }

    // Update user's current plan
    await setDoc(doc(db, 'users', userId), {
        current_plan_id: planRef.id
    }, { merge: true });

    return planRef.id;
};

// Get today's workout
export const getTodayWorkout = async (userId) => {
    const today = new Date().toISOString().split('T')[0];

    const q = query(
        collection(db, 'workouts'),
        where('user_id', '==', userId),
        where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const workoutDoc = querySnapshot.docs[0];
    const workout = { id: workoutDoc.id, ...workoutDoc.data() };

    // Get exercises for this workout
    const exercisesQuery = query(
        collection(db, 'workout_exercises'),
        where('workout_id', '==', workout.id)
    );

    const exercisesSnapshot = await getDocs(exercisesQuery);
    workout.exercises = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })).sort((a, b) => a.order_index - b.order_index);

    return workout;
};
