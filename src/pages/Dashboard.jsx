import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getTodayWorkout } from '../utils/workoutGenerator';
import { generateSkillWorkout, getAllSkills, getUserSkillStage, calculateReadinessScore, generatePatternWorkout, formatSkillName, getSkillRotation, exerciseMap } from '../utils/progressionSystem';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import logo from '../assets/logo2.png';
import Header from '../components/Header';
import InstallButton from '../components/InstallButton';
import Tutorial from '../components/Tutorial';
import { getVirtualDate, getVirtualNow, addDays, resetDate } from '../utils/timeTravel';
import { getUserHistory } from '../utils/historyManager';
import EmailJSDiagnostic from '../components/EmailJSDiagnostic';


const localesMap = {
    pt: ptBR,
    en: enUS,
    es: es
};


const Dashboard = () => {
    console.log('[Dashboard] Component function called');

    const { t, i18n } = useTranslation();
    const currentLocale = localesMap[i18n.language.split('-')[0]] || ptBR;
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
    const [showTutorial, setShowTutorial] = useState(false);
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    // Debug: Log component mount
    useEffect(() => {
        console.log('[Dashboard] Component mounted');
        return () => console.log('[Dashboard] Component unmounted');
    }, []);

    // Debug: Log state changes
    useEffect(() => {
        console.log('[Dashboard] State - Loading:', loading, 'CurrentUser:', !!currentUser, 'ShowTutorial:', showTutorial);
    }, [loading, currentUser, showTutorial]);

    useEffect(() => {
        loadData();
    }, [currentUser]);

    // Separate useEffect for tutorial to ensure it runs after page is loaded
    useEffect(() => {
        console.log('[Tutorial useEffect] Running - Loading:', loading, 'User:', !!currentUser);

        if (!loading && currentUser) {
            // Check if tutorial should be shown - USE USER-SPECIFIC KEY
            const tutorialKey = `calispro_tutorial_completed_${currentUser.uid}`;
            const tutorialCompleted = localStorage.getItem(tutorialKey);
            console.log('[Tutorial] Loading:', loading, 'User:', !!currentUser, 'Key:', tutorialKey, 'Completed:', tutorialCompleted);

            if (!tutorialCompleted) {
                console.log('[Tutorial] Will show tutorial in 1.5s');
                // Show tutorial after page is fully loaded
                const timer = setTimeout(() => {
                    console.log('[Tutorial] Showing tutorial now');
                    setShowTutorial(true);
                }, 1500);
                return () => clearTimeout(timer);
            } else {
                console.log('[Tutorial] Tutorial already completed for this user, not showing');
            }
        } else {
            console.log('[Tutorial] Conditions not met - Loading:', loading, 'User:', !!currentUser);
        }
    }, [loading, currentUser]);

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
            <>
                <div className="dashboard-container">
                    <div className="container">
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p className="text-secondary mt-md">{t('common.loading')}</p>
                        </div>
                    </div>
                </div>

                {/* Tutorial Modal - can show even during loading */}
                {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} autoShow={true} userId={currentUser?.uid} />}
            </>
        );
    }

    const displayWorkout = workout || generatedWorkout;
    const isGenerated = !workout && !!generatedWorkout;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="container">
                    {/* Welcome Section */}
                    <section className="welcome-section mb-xl">
                        <div className="glass p-lg rounded-2xl border border-white/10 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)' }}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
                                {/* Greeting */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-4xl">👋</span>
                                        <h1 className="text-2xl md:text-3xl font-bold" style={{
                                            background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            margin: 0,
                                            lineHeight: 1.2
                                        }}>
                                            {t('dashboard.welcome', { name: userProfile?.name?.split(' ')[0] || t('common.athlete') })}
                                        </h1>
                                    </div>
                                    <p className="text-sm text-secondary opacity-90 font-medium" style={{ textTransform: 'capitalize' }}>
                                        {format(getVirtualNow(), i18n.language.startsWith('en') ? "EEEE, MMMM d" : "EEEE, d 'de' MMMM", { locale: currentLocale })}
                                    </p>
                                </div>

                                {/* Readiness Score Card */}
                                {readiness && (
                                    <div className="w-full md:w-auto" style={{ minWidth: '260px', maxWidth: '100%' }}>
                                        <div className="glass-dark rounded-xl border border-white/10 overflow-hidden shadow-xl" style={{
                                            background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
                                            padding: '4px'
                                        }}>
                                            {/* Header with label and badge */}
                                            <div className="px-5 pt-4 pb-3 border-b border-white/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-secondary opacity-80" style={{ letterSpacing: '0.05em' }}>
                                                        {t('dashboard.readiness_score')}
                                                    </span>
                                                    <div className={`px-2 py-1 rounded-md text-xs font-bold`} style={{
                                                        backgroundColor: 'transparent',
                                                        color: readiness.totalScore > 70 ? '#4ade80' : readiness.totalScore > 30 ? '#a5b4fc' : '#f87171'
                                                    }}>
                                                        {readiness.totalScore >= 90 ? t('common.excellent') :
                                                            readiness.totalScore >= 60 ? t('common.high') :
                                                                readiness.totalScore >= 30 ? t('common.medium') : t('common.low')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score Display */}
                                            <div className="px-5 py-5 flex items-center justify-between">
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`font-black tabular-nums`} style={{
                                                        fontSize: '3.5rem',
                                                        lineHeight: 1,
                                                        background: readiness.totalScore > 70
                                                            ? 'linear-gradient(135deg, #4ade80 0%, #10b981 100%)'
                                                            : readiness.totalScore > 30
                                                                ? 'linear-gradient(135deg, #a5b4fc 0%, #7c8ef7 100%)'
                                                                : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        backgroundClip: 'text',
                                                        textShadow: '0 0 20px rgba(255,255,255,0.1)'
                                                    }}>
                                                        {readiness.totalScore}
                                                    </span>
                                                    <span className="text-secondary text-sm font-semibold" style={{ marginBottom: '0.5rem' }}>/100</span>
                                                </div>
                                                <div className="flex items-center justify-center" style={{
                                                    width: '56px',
                                                    height: '56px',
                                                    borderRadius: '12px',
                                                    background: 'transparent'
                                                }}>
                                                    <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                                                        {readiness.totalScore >= 90 ? '🌟' :
                                                            readiness.totalScore >= 60 ? '💪' :
                                                                readiness.totalScore >= 30 ? '😐' : '😴'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Today's Workout Card */}
                    {displayWorkout && (
                        <div className="mb-md flex items-center gap-sm px-sm">
                            <div className="w-1 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(102,126,234,0.5)]"></div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic">{t('dashboard.today_workout')}</h3>
                        </div>
                    )}
                    {displayWorkout ? (
                        <section className="workout-section">
                            <div className="card workout-card animate-fadeIn">
                                <div className="card-header mb-lg border-b border-gray-700 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-sm mb-1">
                                                <span className="badge badge-primary">{t('landing.transformations.today')}</span>
                                                {displayWorkout.readiness_score && (
                                                    <span className="badge badge-secondary">
                                                        {t('common.score')}: {displayWorkout.readiness_score}
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
                                                    <h4 className="font-bold text-base">
                                                        {t(`dashboard.exercises.${exercise.original_id}`, { defaultValue: exercise.exercise_name || exercise.name })}
                                                    </h4>
                                                    {exercise.type && (
                                                        <span className="text-xs text-primary uppercase font-bold tracking-wider">
                                                            {exercise.type === 'Skill' ? t('common.skill') :
                                                                exercise.type === 'Strength' ? t('common.strength') :
                                                                    exercise.type === 'Core' ? t('common.core') : t('common.accessory')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-secondary">
                                                    {exercise.target_sets} {t('common.sets')} × {
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
                                    {workout && workout.status === 'completed' ? '✅ ' + t('dashboard.workout_done') :
                                        isWorkoutActive ? '▶️ ' + t('dashboard.continue_workout') : '🚀 ' + t('dashboard.start_workout')}
                                </button>

                                {workout && workout.status === 'completed' && (
                                    <p className="text-center text-sm text-secondary mt-md">
                                        {t('landing.cta.ready')}
                                    </p>
                                )}
                            </div>
                        </section>
                    ) : (
                        <div className="card text-center p-xl">
                            <div className="text-4xl mb-md">🎉</div>
                            <h3>{t('dashboard.no_workout')}</h3>
                            <p className="text-secondary">{t('landing.cta.description')}</p>
                        </div>
                    )}

                    {/* Specialized Workout Section */}
                    {!isWorkoutActive && (!workout || workout.status !== 'completed') && (
                        <section className="specialized-section mt-xl">
                            <div className="card specialized-card overflow-hidden">
                                <div className="flex justify-between items-center mb-md">
                                    <h3 className="text-lg font-bold">{t('dashboard.off_plan_title')}</h3>
                                    <button
                                        onClick={() => setShowSpecialized(!showSpecialized)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        {showSpecialized ? t('profile.recalculate').split(' ')[0] : t('landing.calisthenics_info.more').split(' ')[0]}
                                    </button>
                                </div>

                                {showSpecialized ? (
                                    <div className="animate-fadeIn">
                                        <p className="text-secondary text-sm mb-lg">
                                            {t('dashboard.off_plan_desc')}
                                        </p>

                                        <div className="flex gap-md mb-lg">
                                            <button
                                                onClick={() => setSpecializedMode('pattern')}
                                                className={`btn btn-sm flex-1 ${specializedMode === 'pattern' ? 'btn-primary' : 'btn-outline'}`}
                                            >
                                                {t('dashboard.by_category')}
                                            </button>
                                            <button
                                                onClick={() => setSpecializedMode('skill')}
                                                className={`btn btn-sm flex-1 ${specializedMode === 'skill' ? 'btn-primary' : 'btn-outline'}`}
                                            >
                                                {t('dashboard.by_skill')}
                                            </button>
                                        </div>

                                        {specializedMode === 'pattern' ? (
                                            <div className="grid grid-2 gap-sm mb-lg">
                                                {[
                                                    { id: 'push', label: t('common.push'), icon: '💪' },
                                                    { id: 'pull', label: t('common.pull'), icon: '🧗' },
                                                    { id: 'legs', label: t('common.legs'), icon: '🦵' },
                                                    { id: 'core', label: t('common.core'), icon: '🧘' }
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
                                                    <option value="">{t('profile.select')}...</option>
                                                    {getAllSkills().map(skill => (
                                                        <option key={skill} value={skill}>
                                                            {formatSkillName(skill)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="mb-lg">
                                            <p className="text-secondary text-xs mb-sm uppercase tracking-wider font-bold">{t('profile.experience')}</p>
                                            <div className="flex gap-sm">
                                                {[
                                                    { id: 'beginner', label: t('common.beginner') },
                                                    { id: 'intermediate', label: t('common.intermediate') },
                                                    { id: 'advanced', label: t('common.advanced') }
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
                                            {t('dashboard.generate_now')} ⚡
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-secondary text-sm flex flex-col gap-sm">
                                        <div className="flex gap-sm">
                                            <span>•</span>
                                            <span>{t('dashboard.off_plan_note1')}</span>
                                        </div>
                                        <div className="flex gap-sm">
                                            <span>•</span>
                                            <span>{t('dashboard.off_plan_note2')}</span>
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

            {/* Tutorial Modal */}
            {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} autoShow={true} userId={currentUser?.uid} />}

            {/* EmailJS Diagnostic - Development Only */}
            {import.meta.env.DEV && <EmailJSDiagnostic />}
        </div>
    );
};

export default Dashboard;
