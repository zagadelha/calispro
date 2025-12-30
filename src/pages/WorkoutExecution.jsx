import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTodayWorkout } from '../utils/workoutGenerator';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getVirtualNow } from '../utils/timeTravel';
import exercisesData from '../assets/exercises/exercises_v1_1.json';

const WorkoutExecution = () => {
    // Normalization helper handles accents and case
    const normalize = (str) => {
        if (!str) return '';
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    };

    // Create maps for quick lookup
    const { idMap, nameMap } = useMemo(() => {
        const iMap = new Map();
        const nMap = new Map();

        // Populate base maps from JSON
        exercisesData.exercises.forEach(ex => {
            iMap.set(ex.id, ex);
            nMap.set(normalize(ex.name), ex);
            if (ex.i18n_key) nMap.set(normalize(ex.i18n_key), ex);
        });

        // Helper to link legacy name to existing entry safely
        const link = (legacyName, targetName) => {
            const target = nMap.get(normalize(targetName));
            if (target) {
                nMap.set(normalize(legacyName), target);
            }
        };

        // Manual Portuguese Mapping (Legacy -> JSON English Name)
        link('Flexões', 'Push-up');
        link('Agachamento', 'Bodyweight Squat');
        link('Prancha', 'Plank');
        link('Remada Invertida', 'Australian Row (Inverted Row)');
        link('Afundo', 'Static Lunge');

        // Variants & Plurals
        link('Pike Push-ups', 'Pike Push-up (Beginner)');
        link('Handstand Push-ups', 'Handstand Push-up');
        link('Pull-ups', 'Pull-up');
        link('Chin-ups', 'Chin-up');
        link('Muscle-ups', 'Muscle-up');
        link('Dips', 'Bench Dip');

        link('Agachamento Jump', 'Jump Squat');
        link('Burpees', 'Burpee');
        link('Mountain Climbers', 'Mountain Climber');
        link('Jumping Jacks', 'Jumping Jack');
        link('Pistol Squat (assistido)', 'Assisted Pistol Squat');
        link('Hanging Leg Raises', 'Hanging Leg Raises');

        return { idMap: iMap, nameMap: nMap };
    }, []);

    const WARMUP_STEPS = [
        {
            title: 'Pulso',
            info: 'Círculos (30s)',
            icon: '🔄',
            description: 'Entrelace os dedos e gire os punhos em círculos lentos. Mude o sentido após 15s.'
        },
        {
            title: 'Braços',
            info: 'Círculos (10x)',
            icon: '🙆',
            description: 'Com braços esticados, descreva círculos amplos: 10 para frente e 10 para trás.'
        },
        {
            title: 'Coluna',
            info: 'Cat-Cow (10x)',
            icon: '🐈',
            description: 'Em 4 apoios, alterne entre arquear as costas para cima e para baixo respirando calmamente.'
        },
        {
            title: 'Escápulas',
            info: 'Ativação (10x)',
            icon: '🛡️',
            description: 'Na prancha alta, afaste e junte as escápulas sem dobrar os cotovelos.'
        },
        {
            title: 'Pernas',
            info: 'Agachamento (15x)',
            icon: '🦵',
            description: 'Agache mantendo calcanhares no chão e peito aberto. Suba de forma controlada.'
        },
        {
            title: 'Cardio',
            info: 'Polichinelos (30s)',
            icon: '⚡',
            description: 'Salte afastando braços e pernas simultaneamente para aquecer o corpo todo.'
        }
    ];

    const [workout, setWorkout] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [showWarmup, setShowWarmup] = useState(true);

    // Helper to get media URL
    const getExerciseGif = (originalId, name) => {
        let ex = null;
        if (originalId) ex = idMap.get(originalId);

        // Fallback to name if ID lookup failed
        if (!ex && name) {
            ex = nameMap.get(normalize(name));
        }

        return ex?.media?.url || null;
    };

    // Per-exercise details
    const [performanceData, setPerformanceData] = useState({});

    // Session Feedback
    const [feedback, setFeedback] = useState({
        goalMet: null, // boolean
        rpe: null, // 1-5
        pain: null // 'none', 'mild', 'moderate'
    });

    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
        loadWorkout();
    }, []);


    const loadWorkout = async () => {
        try {
            // Import exercise database for fallback data
            const exerciseData = await import('../assets/exercises/exercises_v1_1.json');
            console.log('[loadWorkout] Exercise data keys:', Object.keys(exerciseData));

            // Access exercises from default export
            const exerciseList = exerciseData.default?.exercises || exerciseData.exercises;
            console.log('[loadWorkout] Exercise list length:', exerciseList?.length);

            const exerciseMap = new Map(exerciseList.map(ex => [ex.id, ex]));
            console.log('[loadWorkout] Exercise map size:', exerciseMap.size);

            const todayWorkout = await getTodayWorkout(currentUser.uid);
            if (!todayWorkout) {
                navigate('/dashboard');
                return;
            }

            // Enrich exercises with missing metric_type from database
            const enrichedExercises = (todayWorkout.exercises || []).map(exercise => {
                const dbExercise = exerciseMap.get(exercise.original_id);
                console.log(`[Enrich] ${exercise.exercise_name}:`, {
                    original_id: exercise.original_id,
                    dbFound: !!dbExercise,
                    dbMetricType: dbExercise?.metric_type,
                    currentMetricType: exercise.metric_type
                });

                return {
                    ...exercise,
                    metric_type: dbExercise?.metric_type || exercise.metric_type || 'reps',
                    target_seconds: exercise.target_seconds || dbExercise?.default_prescription?.seconds_max || null,
                    difficulty_score: dbExercise?.difficulty_score || 0
                };
            }).sort((a, b) => a.difficulty_score - b.difficulty_score);

            setWorkout(todayWorkout);
            setExercises(enrichedExercises);

            // Carregar feedback salvo anteriormente (se o treino já foi concluído)
            if (todayWorkout.status === 'completed' && todayWorkout.feedback_goal_met !== undefined) {
                setFeedback({
                    goalMet: todayWorkout.feedback_goal_met,
                    rpe: todayWorkout.feedback_rpe,
                    pain: todayWorkout.feedback_pain
                });
            }

            // Carregar performance data salva anteriormente
            const savedPerformanceData = {};
            enrichedExercises.forEach(exercise => {
                if (exercise.performed_reps !== undefined || exercise.performed_seconds !== undefined) {
                    savedPerformanceData[exercise.id] = {
                        reps: exercise.performed_reps,
                        seconds: exercise.performed_seconds,
                        rpe: exercise.rpe
                    };
                }
            });

            if (Object.keys(savedPerformanceData).length > 0) {
                setPerformanceData(savedPerformanceData);
            }
        } catch (err) {
            console.error('Error loading workout:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExerciseComplete = async (exerciseId, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            await updateDoc(doc(db, 'workout_exercises', exerciseId), {
                completed: newStatus
            });
            setExercises(prev =>
                prev.map(ex => ex.id === exerciseId ? { ...ex, completed: newStatus } : ex)
            );
        } catch (err) {
            console.error('Error updating exercise:', err);
        }
    };

    const handlePerformanceChange = (exerciseId, field, value) => {
        setPerformanceData(prev => ({
            ...prev,
            [exerciseId]: { ...prev[exerciseId], [field]: value }
        }));
    };

    const handleFeedbackChange = (field, value) => {
        setFeedback(prev => ({ ...prev, [field]: value }));
    };

    // Validação do feedback completo
    const isFeedbackComplete = () => {
        return feedback.goalMet !== null && feedback.rpe !== null && feedback.pain !== null;
    };

    // Validação de performance data completo
    const isPerformanceComplete = () => {
        for (const exercise of exercises) {
            const data = performanceData[exercise.id];

            // Check if exercise has data
            if (!data) {
                return { complete: false, exercise };
            }

            // Check if appropriate metric is filled
            if (exercise.metric_type === 'seconds') {
                if (!data.seconds || data.seconds <= 0) {
                    return { complete: false, exercise };
                }
            } else {
                if (!data.reps || data.reps <= 0) {
                    return { complete: false, exercise };
                }
            }
        }
        return { complete: true };
    };

    const handleFinishWorkout = async () => {
        // Validar se performance está completa
        const perfCheck = isPerformanceComplete();
        if (!perfCheck.complete) {
            alert('⚠️ Por favor, preencha os dados de performance (reps ou segundos) para todos os exercícios antes de finalizar o treino.');
            return;
        }

        // Validar se o feedback está completo
        if (!isFeedbackComplete()) {
            alert('Por favor, preencha todo o feedback do treino antes de finalizar.');
            return;
        }

        try {
            // Save global workout data
            await updateDoc(doc(db, 'workouts', workout.id), {
                status: 'completed',
                completed_at: getVirtualNow().toISOString(),
                feedback_goal_met: feedback.goalMet,
                feedback_rpe: feedback.rpe,
                feedback_pain: feedback.pain
            });

            // Save performance data for all exercises (already validated above)
            for (const exercise of exercises) {
                const data = performanceData[exercise.id];

                console.log(`[Saving] ${exercise.original_id}: reps=${data.reps || 0}, seconds=${data.seconds || 0}, rpe=${data.rpe || 'global'}, goalMet=${feedback.goalMet}`);

                await updateDoc(doc(db, 'workout_exercises', exercise.id), {
                    performed_reps: data.reps || 0,
                    performed_seconds: data.seconds || 0,
                    rpe: data.rpe || null,
                    goalMet: feedback.goalMet,
                    completed: true
                });
            }

            navigate('/dashboard');
        } catch (err) {
            console.error('Error finishing workout:', err);
            alert('Erro ao finalizar treino');
        }
    };

    if (loading) {
        return (
            <div className="workout-execution-container">
                <div className="container"><div className="spinner"></div></div>
            </div>
        );
    }

    const completedCount = exercises.filter(e => e.completed).length;
    const progress = (completedCount / exercises.length) * 100;

    return (
        <div className="workout-execution-container">
            {/* Header */}
            <header className="workout-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">← Voltar</button>
                        <h2 className="workout-title">{workout.name}</h2>
                        <div className="workout-progress-badge">{completedCount}/{exercises.length}</div>
                    </div>
                    <div className="progress-bar mt-md">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            <main className="workout-main">
                <div className="container">
                    {/* Warm-up Suggestion Section */}
                    {showWarmup && (
                        <section className="warmup-section mb-xl animate-fadeIn">
                            <div className="card" style={{
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                borderColor: 'rgba(102, 126, 234, 0.3)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div className="flex justify-between items-center mb-md">
                                    <div className="flex items-center gap-sm">
                                        <span className="text-2xl">🔥</span>
                                        <h3 className="m-0">Sugestão de Aquecimento</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowWarmup(false)}
                                        className="btn btn-sm btn-outline"
                                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                    >
                                        Pular
                                    </button>
                                </div>

                                <p className="text-secondary text-sm mb-lg">
                                    Recomendado para prevenir lesões e preparar suas articulações para o treino de hoje.
                                </p>

                                {/* Visual Demo GIF */}
                                <div className="warmup-visual-demo mb-lg" style={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(0,0,0,0.2)',
                                    maxWidth: '400px',
                                    margin: '0 auto 24px'
                                }}>
                                    <img
                                        src="https://i.pinimg.com/originals/0f/59/99/0f5999285c02a718b8b7f1cd75336356.gif"
                                        alt="Demonstração de Aquecimento"
                                        style={{ width: '100%', display: 'block' }}
                                    />
                                </div>

                                <div className="warmup-steps-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '24px'
                                }}>
                                    {WARMUP_STEPS.map((step, idx) => (
                                        <div key={idx} className="warmup-step-item" style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            transition: 'transform 0.2s ease',
                                            cursor: 'default'
                                        }}>
                                            <span style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{step.icon}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>{step.title}</span>
                                            <span style={{ color: 'var(--primary-light)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '10px' }}>{step.info}</span>
                                            <p style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.75rem',
                                                lineHeight: '1.4',
                                                margin: 0,
                                                opacity: 0.9
                                            }}>
                                                {step.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowWarmup(false)}
                                    className="btn btn-primary btn-full"
                                    style={{ background: 'var(--primary-gradient)' }}
                                >
                                    Tudo Pronto, Começar Treino! 🚀
                                </button>
                            </div>
                        </section>
                    )}

                    {!showWarmup && (
                        <>
                            <section className="exercises-section mb-xl">
                                <h3 className="mb-lg">Exercícios do Treino</h3>
                                <div className="exercise-list-execution">
                                    {exercises.map((exercise) => (
                                        <div key={exercise.id} className={`exercise-card card ${exercise.completed ? 'completed' : ''}`}>
                                            <div className="flex flex-col gap-md">
                                                <div className="flex items-center gap-md">
                                                    <button
                                                        onClick={() => toggleExerciseComplete(exercise.id, exercise.completed)}
                                                        className={`checkbox-btn ${exercise.completed ? 'checked' : ''}`}
                                                    >
                                                        {exercise.completed && '✓'}
                                                    </button>
                                                    <div className="exercise-details flex-1 min-w-0">
                                                        <h4 className="exercise-name">{exercise.exercise_name}</h4>
                                                        <p className="exercise-meta text-secondary text-sm">
                                                            {exercise.muscle_group} • Meta: {exercise.target_sets}x{exercise.prescription || (exercise.metric_type === 'reps' ? exercise.target_reps : `${exercise.target_seconds}s`)}
                                                        </p>
                                                        {/* GIF Display */}
                                                        {!exercise.completed && getExerciseGif(exercise.original_id, exercise.exercise_name) && (
                                                            <div
                                                                className="mt-3 rounded-lg overflow-hidden border border-white/10 bg-black/20 shadow-sm"
                                                                role="img"
                                                                aria-label={exercise.exercise_name}
                                                                style={{
                                                                    width: '100%',
                                                                    maxWidth: '220px',
                                                                    height: '140px',
                                                                    backgroundImage: `url(${getExerciseGif(exercise.original_id, exercise.exercise_name)})`,
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center',
                                                                    backgroundRepeat: 'no-repeat'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                {exercise.completed && (
                                                    <div className="mt-sm p-3 bg-tertiary rounded flex items-center justify-between gap-md animate-fadeIn">
                                                        <div className="flex-1">
                                                            <label className="text-xs text-secondary mb-1 block">
                                                                {exercise.metric_type === 'reps' ? 'Reps Realizados' : 'Segundos Realizados'}
                                                                <span className="text-red-500 ml-1">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                className="form-input py-1 px-2 text-sm"
                                                                placeholder={exercise.metric_type === 'reps' ? (exercise.target_reps || "0") : (exercise.target_seconds || "0")}
                                                                value={performanceData[exercise.id]?.[exercise.metric_type === 'reps' ? 'reps' : 'seconds'] || ''}
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value);
                                                                    const field = exercise.metric_type === 'reps' ? 'reps' : 'seconds';
                                                                    handlePerformanceChange(exercise.id, field, value);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Quick Feedback Card (Visible when at least one exercise checked, or always) */}
                            <section className="feedback-section mb-xl">
                                <div className="card animate-fadeIn">
                                    <div className="flex items-center justify-between mb-md">
                                        <h3>Feedback do Treino</h3>
                                        <span className="font-semibold" style={{ color: '#ff6b6b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>* Obrigatório</span>
                                    </div>

                                    {/* Q1: Goal Met */}
                                    <div className="mb-lg">
                                        <label className="block text-sm font-bold text-secondary mb-2">1. Meta do treino atingida?</label>
                                        <div className="flex gap-md">
                                            <button
                                                onClick={() => handleFeedbackChange('goalMet', true)}
                                                className={`btn flex-1 ${feedback.goalMet === true ? 'btn-success' : 'btn-outline'}`}
                                            >Sim 👍</button>
                                            <button
                                                onClick={() => handleFeedbackChange('goalMet', false)}
                                                className={`btn flex-1 ${feedback.goalMet === false ? 'btn-error' : 'btn-outline'}`}
                                            >Não 👎</button>
                                        </div>
                                    </div>

                                    {/* Q2: Difficulty 1-5 */}
                                    <div className="mb-lg">
                                        <label className="block text-sm font-bold text-secondary mb-2">2. Dificuldade Geral (1-5)</label>
                                        <div className="difficulty-btn-container">
                                            {[1, 2, 3, 4, 5].map(rating => (
                                                <button
                                                    key={rating}
                                                    onClick={() => handleFeedbackChange('rpe', rating)}
                                                    className={`difficulty-btn ${feedback.rpe === rating ? 'selected' : ''}`}
                                                >
                                                    {rating}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-xs text-secondary mt-2 px-1">
                                            <span>Muito Fácil</span>
                                            <span>Exaustivo</span>
                                        </div>
                                    </div>

                                    {/* Q3: Pain */}
                                    <div className="mb-sm">
                                        <label className="block text-sm font-bold text-secondary mb-2">3. Dor ou Desconforto?</label>
                                        <div className="pain-btn-container">
                                            <button
                                                onClick={() => handleFeedbackChange('pain', 'none')}
                                                className={`pain-btn pain-none ${feedback.pain === 'none' ? 'selected' : ''}`}
                                            >Nenhuma</button>
                                            <button
                                                onClick={() => handleFeedbackChange('pain', 'mild')}
                                                className={`pain-btn pain-mild ${feedback.pain === 'mild' ? 'selected' : ''}`}
                                            >Leve</button>
                                            <button
                                                onClick={() => handleFeedbackChange('pain', 'moderate')}
                                                className={`pain-btn pain-moderate ${feedback.pain === 'moderate' ? 'selected' : ''}`}
                                            >Moderada+</button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={handleFinishWorkout}
                                className="btn btn-primary btn-full btn-lg"
                                disabled={completedCount === 0 || !isFeedbackComplete()}
                            >
                                ✅ Finalizar Treino
                            </button>
                            {!isFeedbackComplete() && completedCount > 0 && (
                                <p className="text-center text-error text-sm mt-md">
                                    ⚠️ Preencha todo o feedback para finalizar o treino
                                </p>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WorkoutExecution;
