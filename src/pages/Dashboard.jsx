import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTodayWorkout } from '../utils/workoutGenerator';
import { generateSkillWorkout, getAllSkills, getUserSkillStage, calculateReadinessScore } from '../utils/progressionSystem';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '../assets/logo2.png';
import InstallButton from '../components/InstallButton';
import { getVirtualDate, addDays, resetDate } from '../utils/timeTravel';
import { getUserHistory } from '../utils/historyManager';


const Dashboard = () => {
    const [workout, setWorkout] = useState(null);
    const [generatedWorkout, setGeneratedWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [readiness, setReadiness] = useState(null);
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [currentUser]);

    // Auto-complete old 'in_progress' workouts from previous days
    const autoCompleteOldWorkouts = async (userId) => {
        try {
            const today = getVirtualDate();
            const q = query(
                collection(db, 'workouts'),
                where('user_id', '==', userId),
                where('status', '==', 'in_progress')
            );
            const snapshot = await getDocs(q);

            for (const docSnap of snapshot.docs) {
                const workoutData = docSnap.data();
                // If workout is from a previous day, mark it as completed
                if (workoutData.date && workoutData.date < today) {
                    await updateDoc(doc(db, 'workouts', docSnap.id), {
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        feedback_goal_met: true,
                        feedback_rpe: 3,
                        feedback_pain: 'Nenhuma'
                    });

                    // Also mark all exercises as completed
                    const exQuery = query(
                        collection(db, 'workout_exercises'),
                        where('workout_id', '==', docSnap.id)
                    );
                    const exSnapshot = await getDocs(exQuery);
                    for (const exDoc of exSnapshot.docs) {
                        await updateDoc(doc(db, 'workout_exercises', exDoc.id), {
                            completed: true
                        });
                    }

                    console.log(`Auto-completed old workout: ${docSnap.id}`);
                }
            }
        } catch (error) {
            console.error('Error auto-completing old workouts:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 0. Auto-complete abandoned workouts from previous days
            await autoCompleteOldWorkouts(currentUser.uid);

            // 1. Always calculate Readiness first
            const history = await getUserHistory(currentUser.uid);
            const readinessData = calculateReadinessScore(history);
            setReadiness(readinessData);

            // Pass history to generator to avoid re-fetching or empty logic
            const todayWorkout = await getTodayWorkout(currentUser.uid);

            if (todayWorkout && todayWorkout.exercises && todayWorkout.exercises.length > 0) {
                setWorkout(todayWorkout);
                setIsWorkoutActive(todayWorkout?.status === 'in_progress');
            } else {
                // Self-Healing: If workout exists but has no exercises (Legacy Bug), delete and regenerate
                if (todayWorkout) {
                    console.warn("Empty workout detected. Deleting and regenerating...");
                    await deleteDoc(doc(db, 'workouts', todayWorkout.id));
                }
                // 2. Generate one dynamically
                await generateDailyWorkout(history);
            }

        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateDailyWorkout = async (history) => {
        console.log('='.repeat(60));
        console.log('[generateDailyWorkout] CALLED');
        console.log('[generateDailyWorkout] History passed?', !!history);
        console.log('[generateDailyWorkout] History keys:', Object.keys(history || {}).length);

        // MOCK HISTORY fallback if not passed (consistency)
        const mockHistory = history || {};

        // Determine Readiness (Redundant for display but needed for generator context inside logic)
        // const readinessData = calculateReadinessScore(mockHistory); 
        // setReadiness(readinessData); // Already set in loadData

        // Determine Target Skill
        // ✅ NEW: Rotate skills based on workout count for variety
        const skills = getAllSkills(); // ['handstand', 'planche', etc]
        let targetSkill = 'handstand'; // Default

        if (skills.length > 0) {
            // Count total workout sessions from history
            const totalWorkouts = Object.values(mockHistory).reduce((acc, exData) => {
                const sessions = exData?.history?.length || 0;
                return acc + sessions;
            }, 0);

            // Rotate skill every ~10 workouts to add variety
            const skillIndex = Math.floor(totalWorkouts / 10) % skills.length;
            targetSkill = skills[skillIndex];

            console.log('[Skill Rotation]', {
                totalWorkouts,
                skillIndex,
                selectedSkill: targetSkill,
                allSkills: skills
            });
        }

        console.log('[generateDailyWorkout] Target skill:', targetSkill);
        console.log('[generateDailyWorkout] Calling generateSkillWorkout...');

        const genWorkout = generateSkillWorkout(targetSkill, mockHistory, userProfile?.equipment || []);

        console.log('[generateDailyWorkout] Workout generated:', !!genWorkout);
        console.log('[generateDailyWorkout] Exercises:', genWorkout?.exercises?.length);

        setGeneratedWorkout(genWorkout);
    };

    const handleStartWorkout = async () => {
        // If workout exists in DB, just go
        if (workout) {
            try {
                if (workout.status === 'pending') {
                    await updateDoc(doc(db, 'workouts', workout.id), {
                        status: 'in_progress',
                        started_at: new Date().toISOString()
                    });
                }
                navigate('/workout');
            } catch (err) {
                console.error('Error starting existing workout:', err);
            }
            return;
        }

        // If generated, SAVE it first
        if (generatedWorkout) {
            try {
                // 1. Create Workout Doc
                const workoutData = {
                    user_id: currentUser.uid,
                    plan_id: 'dynamic_progression', // Placeholder
                    day_label: 'Skill', // Label for the day
                    name: generatedWorkout.name,
                    date: getVirtualDate(),
                    status: 'in_progress',
                    created_at: new Date().toISOString(),
                    started_at: new Date().toISOString(),
                    readiness_score: generatedWorkout.readiness_score
                };

                const workoutRef = await addDoc(collection(db, 'workouts'), workoutData);

                // 2. Create Exercise Docs
                const exercises = generatedWorkout.exercises || [];
                for (let i = 0; i < exercises.length; i++) {
                    const ex = exercises[i];
                    await addDoc(collection(db, 'workout_exercises'), {
                        workout_id: workoutRef.id,
                        exercise_name: ex.exercise_name || ex.name, // Handle both formats
                        muscle_group: ex.muscle_group,
                        target_sets: ex.target_sets,
                        target_reps: ex.target_reps, // String "8-12" or number
                        type: ex.type, // Store the type (Skill, Strength...)
                        original_id: ex.original_id, // Important for tracking
                        order_index: i,
                        completed: false
                    });
                }

                navigate('/workout');

            } catch (err) {
                console.error("Error saving generated workout:", err);
                alert("Erro ao iniciar treino.");
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p className="text-secondary mt-md">Carregando...</p>
                    </div>
                </div>
            </div>
        );
    }

    const displayWorkout = workout || generatedWorkout;
    const isGenerated = !workout && !!generatedWorkout;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <img src={logo} alt="CalisPro" className="app-logo" />
                        <div className="flex items-center gap-md">
                            <button onClick={() => navigate('/evolution')} className="btn btn-secondary btn-sm flex items-center" title="Evolução">
                                <TrendingUp size={18} className="mr-1" />
                                <span className="btn-text">Evolução</span>
                            </button>
                            <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm flex items-center" title="Perfil">
                                <User size={18} className="mr-1" />
                                <span className="btn-text">Perfil</span>
                            </button>
                            <button onClick={handleLogout} className="btn btn-outline btn-sm flex items-center" title="Sair">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="container">
                    {/* Welcome Section */}
                    <section className="welcome-section mb-xl flex justify-between items-center">
                        <div>
                            <h2 className="mb-sm">
                                Olá, {userProfile?.name?.split(' ')[0] || 'Atleta'}! 👋
                            </h2>
                            <p className="text-secondary">
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </p>
                        </div>
                        {readiness && (
                            <div className="text-right">
                                <div className="text-xs text-secondary">Nível de Preparação</div>
                                <div className={`text-xl font-bold ${readiness.totalScore > 70 ? 'text-green-400' : 'text-primary'}`}>
                                    {readiness.totalScore}
                                </div>
                                <div className="text-xs text-secondary mt-1">
                                    {readiness.totalScore >= 90 ? 'Excelente 🌟' :
                                        readiness.totalScore >= 60 ? 'Alto 💪' :
                                            readiness.totalScore >= 30 ? 'Médio 😐' : 'Baixo 😴'}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Today's Workout Card */}
                    {displayWorkout ? (
                        <section className="workout-section">
                            <div className="card workout-card animate-fadeIn">
                                <div className="card-header mb-lg border-b border-gray-700 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-sm mb-1">
                                                <span className="badge badge-primary">Hoje</span>
                                                {displayWorkout.readiness_score && (
                                                    <span className="badge badge-secondary">
                                                        Score: {displayWorkout.readiness_score}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="card-title text-xl">{displayWorkout.name}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Exercise List Preview */}
                                <div className="exercise-list mb-xl">
                                    {displayWorkout.exercises?.map((exercise, index) => (
                                        <div key={index} className="flex items-center gap-md py-3 border-b border-gray-800 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-sm font-bold text-secondary">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-base">{exercise.exercise_name || exercise.name}</h4>
                                                    {exercise.type && (
                                                        <span className="text-xs text-primary uppercase font-bold tracking-wider">
                                                            {exercise.type === 'Skill' ? 'Habilidade' :
                                                                exercise.type === 'Strength' ? 'Força' :
                                                                    exercise.type === 'Core' ? 'Core' : 'Acessório'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-secondary">
                                                    {exercise.target_sets} séries × {exercise.target_reps} reps
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main CTA */}
                                <button
                                    onClick={handleStartWorkout}
                                    className="btn btn-primary btn-full btn-lg py-4 text-lg shadow-lg hover:transform hover:scale-[1.02] transition-all"
                                >
                                    {workout && workout.status === 'completed' ? '✅ Treino Concluído' :
                                        isWorkoutActive ? '▶️ Continuar Treino' : '🚀 Iniciar Treino'}
                                </button>

                                {workout && workout.status === 'completed' && (
                                    <p className="text-center text-sm text-secondary mt-md">
                                        Bom descanso! Volte amanhã para mais.
                                    </p>
                                )}
                            </div>
                        </section>
                    ) : (
                        <div className="card text-center p-xl">
                            <div className="text-4xl mb-md">🎉</div>
                            <h3>Tudo feito por hoje!</h3>
                            <p className="text-secondary">Aproveite seu descanso.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Debug Utility - Only visible in Development */}
            {import.meta.env.DEV && (
                <div className="text-center p-4 opacity-70 hover:opacity-100 transition-opacity mt-8 border-t border-white/5">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Ambiente de Teste</p>
                    <div className="flex flex-wrap justify-center gap-4 text-xs">
                        <button
                            onClick={() => addDays(1)}
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            +1 Dia (Amanhã)
                        </button>
                        <button
                            onClick={() => resetDate()}
                            className="text-emerald-400 hover:text-emerald-300 underline"
                        >
                            Voltar para Hoje
                        </button>

                        {workout && workout.id && (
                            <button
                                onClick={async () => {
                                    if (window.confirm("Resetar treino de hoje? (Debug)")) {
                                        try {
                                            await deleteDoc(doc(db, 'workouts', workout.id));
                                            window.location.reload();
                                        } catch (e) { alert("Erro ao deletar: " + e.message); }
                                    }
                                }}
                                className="text-red-500 hover:text-red-400 underline"
                            >
                                Resetar Treino
                            </button>
                        )}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2">
                        Sistema operando em: {format(new Date(getVirtualDate() + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
