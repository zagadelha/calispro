import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, User, LogOut, BarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTodayWorkout } from '../utils/workoutGenerator';
import { generateSkillWorkout, getAllSkills, getUserSkillStage, calculateReadinessScore, generatePatternWorkout, formatSkillName, getSkillRotation, exerciseMap } from '../utils/progressionSystem';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '../assets/logo2.png';
import InstallButton from '../components/InstallButton';
import { getVirtualDate, getVirtualNow, addDays, resetDate } from '../utils/timeTravel';
import { getUserHistory } from '../utils/historyManager';


const Dashboard = () => {
    const [workout, setWorkout] = useState(null);
    const [generatedWorkout, setGeneratedWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [readiness, setReadiness] = useState(null);
    const [showSpecialized, setShowSpecialized] = useState(false);
    const [specializedMode, setSpecializedMode] = useState('skill'); // 'skill' or 'pattern'
    const [selectedSkill, setSelectedSkill] = useState('');
    const [selectedPattern, setSelectedPattern] = useState('push');
    const [workoutLevel, setWorkoutLevel] = useState('beginner');
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
                        completed_at: getVirtualNow().toISOString(),
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

    // Handle adding days and reloading
    const handleAddDays = (days) => {
        addDays(days);
        loadData();
    };

    // Reset date to today
    const handleResetDate = () => {
        resetDate();
        loadData();
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 0. Auto-complete abandoned workouts from previous days
            await autoCompleteOldWorkouts(currentUser.uid);

            // 1. Always calculate Readiness first
            const history = await getUserHistory(currentUser.uid, getVirtualDate());
            const readinessData = calculateReadinessScore(history, getVirtualDate());
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
        // 🔄 PHASE 1: Rotate daily between Handstand, FL, BL, Planche
        const targetSkill = getSkillRotation(mockHistory);
        console.log('[generateDailyWorkout] Target skill (Fase 1):', targetSkill);

        console.log('[generateDailyWorkout] Target skill:', targetSkill);
        console.log('[generateDailyWorkout] Calling generateSkillWorkout...');

        const genWorkout = generateSkillWorkout(targetSkill, mockHistory, userProfile?.equipment || [], getVirtualDate(), true);

        console.log('[generateDailyWorkout] Workout generated:', !!genWorkout);
        console.log('[generateDailyWorkout] Exercises:', genWorkout?.exercises?.length);

        setGeneratedWorkout(genWorkout);
    };

    const handleGenerateSpecializedWorkout = async () => {
        setLoading(true);
        try {
            const history = await getUserHistory(currentUser.uid, getVirtualDate());
            let genWorkout;

            if (specializedMode === 'skill') {
                if (!selectedSkill) {
                    alert('Por favor, selecione uma habilidade.');
                    setLoading(false);
                    return;
                }
                genWorkout = generateSkillWorkout(selectedSkill, history, userProfile?.equipment || [], getVirtualDate(), false, workoutLevel);
            } else {
                genWorkout = generatePatternWorkout(selectedPattern, history, userProfile?.equipment || [], getVirtualDate(), workoutLevel);
            }

            if (genWorkout && genWorkout.exercises && genWorkout.exercises.length > 0) {
                // Save and start immediately
                await startSpecializedWorkout(genWorkout);
            } else {
                alert('Não foi possível gerar este treino com seu nível atual.');
            }
        } catch (err) {
            console.error('Error generating specialized workout:', err);
            alert('Erro ao gerar treino.');
        } finally {
            setLoading(false);
        }
    };

    const startSpecializedWorkout = async (genWorkout) => {
        try {
            const workoutData = {
                user_id: currentUser.uid,
                plan_id: 'specialized_workout',
                day_label: 'Extra',
                name: genWorkout.name,
                date: getVirtualDate(),
                status: 'in_progress',
                created_at: getVirtualNow().toISOString(),
                started_at: getVirtualNow().toISOString(),
                readiness_score: genWorkout.readiness_score,
                skill_id: genWorkout.skill_id || null,
                skill_media_url: genWorkout.skill_media_url || null
            };

            const workoutRef = await addDoc(collection(db, 'workouts'), workoutData);

            const exercises = genWorkout.exercises || [];
            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];
                await addDoc(collection(db, 'workout_exercises'), {
                    workout_id: workoutRef.id,
                    exercise_name: ex.exercise_name || ex.name,
                    muscle_group: ex.muscle_group,
                    target_sets: ex.target_sets,
                    target_reps: ex.target_reps,
                    target_seconds: ex.target_seconds || null,
                    metric_type: ex.metric_type || 'reps',
                    type: ex.type,
                    original_id: ex.original_id,
                    difficulty_score: ex.difficulty_score || 0,
                    order_index: i,
                    completed: false
                });
            }

            navigate('/workout');
        } catch (err) {
            console.error("Error saving specialized workout:", err);
            throw err;
        }
    };

    const handleStartWorkout = async () => {
        // If workout exists in DB, just go
        if (workout) {
            try {
                if (workout.status === 'pending') {
                    await updateDoc(doc(db, 'workouts', workout.id), {
                        status: 'in_progress',
                        started_at: getVirtualNow().toISOString()
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
                    created_at: getVirtualNow().toISOString(),
                    started_at: getVirtualNow().toISOString(),
                    readiness_score: generatedWorkout.readiness_score,
                    skill_id: generatedWorkout.skill_id || null,
                    skill_media_url: generatedWorkout.skill_media_url || null
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
                        target_seconds: ex.target_seconds || null, // Use null instead of undefined
                        metric_type: ex.metric_type || 'reps', // Default to reps
                        type: ex.type, // Store the type (Skill, Strength...)
                        original_id: ex.original_id, // Important for tracking
                        difficulty_score: ex.difficulty_score || 0,
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

    // Jump to next day without workout
    const jumpToNextMissingWorkout = async () => {
        try {
            const currentDate = getVirtualDate();
            const maxDaysToCheck = 365; // Limit search to 1 year ahead

            // Get all completed workouts for the user
            const q = query(
                collection(db, 'workouts'),
                where('user_id', '==', currentUser.uid)
            );
            const snapshot = await getDocs(q);

            // Create a Set of dates that have workouts
            const workoutDates = new Set(
                snapshot.docs.map(doc => doc.data().date)
            );

            // Find the next day without a workout
            let daysToAdd = 1;
            let found = false;

            while (daysToAdd <= maxDaysToCheck && !found) {
                // Calculate the next date
                const checkDate = new Date(currentDate);
                checkDate.setDate(checkDate.getDate() + daysToAdd);
                const checkDateStr = checkDate.toISOString().split('T')[0];

                // If this date doesn't have a workout, we found it!
                if (!workoutDates.has(checkDateStr)) {
                    found = true;
                    addDays(daysToAdd);
                    console.log(`Jumped ${daysToAdd} days forward to ${checkDateStr} (no workout found)`);
                    break;
                }

                daysToAdd++;
            }

            if (!found) {
                alert('Todos os próximos 365 dias têm treinos registrados! 🏆');
            }
        } catch (err) {
            console.error('Error jumping to next missing workout:', err);
            alert('Erro ao buscar próximo dia sem treino');
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
                            <button onClick={() => navigate('/progress')} className="btn btn-secondary btn-sm flex items-center" title="Progresso">
                                <BarChart2 size={18} className="mr-1" />
                                <span className="btn-text">Progresso</span>
                            </button>
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
                                {format(getVirtualNow(), "EEEE, d 'de' MMMM", { locale: ptBR })}
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
                    {displayWorkout && (
                        <div className="mb-md">
                            <h3 className="text-lg font-bold">Seu Plano de Treino</h3>
                        </div>
                    )}
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

                                {/* Skill Preview Image */}
                                {displayWorkout.skill_media_url && (
                                    <div className="skill-preview mb-lg">
                                        <img
                                            src={displayWorkout.skill_media_url}
                                            alt={displayWorkout.name}
                                            className="skill-preview-image"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}

                                {/* Exercise List Preview */}
                                <div className="exercise-list mb-xl">
                                    {[...(displayWorkout.exercises || [])].sort((a, b) => {
                                        const scoreA = a.difficulty_score !== undefined ? a.difficulty_score : (exerciseMap.get(a.original_id)?.difficulty_score || 0);
                                        const scoreB = b.difficulty_score !== undefined ? b.difficulty_score : (exerciseMap.get(b.original_id)?.difficulty_score || 0);
                                        return scoreA - scoreB;
                                    }).map((exercise, index) => (
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
                                                    {exercise.target_sets} séries × {
                                                        exercise.prescription ||
                                                        (exercise.metric_type === 'seconds' || (!exercise.metric_type && !exercise.target_reps && exercise.target_seconds) ?
                                                            `${exercise.target_seconds || 0}s` :
                                                            `${exercise.target_reps || exercise.reps || 0} reps`)
                                                    }
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

                    {/* Specialized Workout Section */}
                    {!isWorkoutActive && (!workout || workout.status !== 'completed') && (
                        <section className="specialized-section mt-xl">
                            <div className="card specialized-card overflow-hidden">
                                <div className="flex justify-between items-center mb-md">
                                    <h3 className="text-lg font-bold">Gerar Treino Livre</h3>
                                    <button
                                        onClick={() => setShowSpecialized(!showSpecialized)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        {showSpecialized ? 'Ocultar' : 'Explorar'}
                                    </button>
                                </div>

                                {showSpecialized ? (
                                    <div className="animate-fadeIn">
                                        <p className="text-secondary text-sm mb-lg">
                                            Deseja focar em algo específico hoje? Escolha uma categoria ou habilidade.
                                        </p>

                                        <div className="flex gap-md mb-lg">
                                            <button
                                                onClick={() => setSpecializedMode('pattern')}
                                                className={`btn btn-sm flex-1 ${specializedMode === 'pattern' ? 'btn-primary' : 'btn-outline'}`}
                                            >
                                                Categoria
                                            </button>
                                            <button
                                                onClick={() => setSpecializedMode('skill')}
                                                className={`btn btn-sm flex-1 ${specializedMode === 'skill' ? 'btn-primary' : 'btn-outline'}`}
                                            >
                                                Habilidade
                                            </button>
                                        </div>

                                        {specializedMode === 'pattern' ? (
                                            <div className="grid grid-2 gap-sm mb-lg">
                                                {[
                                                    { id: 'push', label: 'Empurrar', icon: '💪' },
                                                    { id: 'pull', label: 'Puxar', icon: '🧗' },
                                                    { id: 'legs', label: 'Pernas', icon: '🦵' },
                                                    { id: 'core', label: 'Core', icon: '🧘' }
                                                ].map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setSelectedPattern(p.id)}
                                                        className={`option-card p-md ${selectedPattern === p.id ? 'active' : ''}`}
                                                    >
                                                        <div className="text-xl mb-xs">{p.icon}</div>
                                                        <div className="text-xs font-bold">{p.label}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="form-group mb-lg">
                                                <select
                                                    value={selectedSkill}
                                                    onChange={(e) => setSelectedSkill(e.target.value)}
                                                    className="form-select"
                                                >
                                                    <option value="">Selecione uma habilidade...</option>
                                                    {getAllSkills().map(skill => (
                                                        <option key={skill} value={skill}>
                                                            {formatSkillName(skill)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="mb-lg">
                                            <p className="text-secondary text-xs mb-sm uppercase tracking-wider font-bold">Nível do Treino</p>
                                            <div className="flex gap-sm">
                                                {[
                                                    { id: 'beginner', label: 'Iniciante' },
                                                    { id: 'intermediate', label: 'Intermediário' },
                                                    { id: 'advanced', label: 'Avançado' }
                                                ].map(level => (
                                                    <button
                                                        key={level.id}
                                                        onClick={() => setWorkoutLevel(level.id)}
                                                        className={`btn btn-sm flex-1 ${workoutLevel === level.id ? 'btn-primary' : 'btn-outline'} text-xs py-2`}
                                                    >
                                                        {level.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleGenerateSpecializedWorkout}
                                            className="btn btn-primary btn-full shadow-lg"
                                        >
                                            Gerar Treino ⚡
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-secondary text-sm flex flex-col gap-sm">
                                        <div className="flex gap-sm">
                                            <span>•</span>
                                            <span>Gere treinos focados em habilidades ou categorias musculares específicas.</span>
                                        </div>
                                        <div className="flex gap-sm">
                                            <span>•</span>
                                            <span>Este treino não é programado e não será contabilizado na sua evolução.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Debug Utility - Only visible in Development */}
            {import.meta.env.DEV && (
                <div className="text-center p-4 opacity-70 hover:opacity-100 transition-opacity mt-8 border-t border-white/5">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Ambiente de Teste</p>
                    <div className="flex flex-wrap justify-center gap-4 text-xs">
                        <button
                            onClick={() => handleAddDays(1)}
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            +1 Dia (Amanhã)
                        </button>
                        <button
                            onClick={jumpToNextMissingWorkout}
                            className="text-purple-400 hover:text-purple-300 underline font-bold"
                        >
                            ⏭️ Próximo Dia Sem Treino
                        </button>
                        <button
                            onClick={handleResetDate}
                            className="text-emerald-400 hover:text-emerald-300 underline"
                        >
                            Voltar para Hoje
                        </button>
                        <button
                            onClick={() => navigate('/admin')}
                            className="text-amber-400 hover:text-amber-300 underline font-bold"
                        >
                            📊 Painel Administrativo
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
