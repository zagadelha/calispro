import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTodayWorkout } from '../utils/workoutGenerator';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const WorkoutExecution = () => {
    const [workout, setWorkout] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [notes, setNotes] = useState('');
    const [difficulty, setDifficulty] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadWorkout();
    }, []);

    const loadWorkout = async () => {
        try {
            const todayWorkout = await getTodayWorkout(currentUser.uid);
            if (!todayWorkout) {
                navigate('/dashboard');
                return;
            }
            setWorkout(todayWorkout);
            setExercises(todayWorkout.exercises || []);
            setNotes(todayWorkout.notes || '');
        } catch (err) {
            console.error('Error loading workout:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExerciseComplete = async (exerciseId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'workout_exercises', exerciseId), {
                completed: !currentStatus
            });

            setExercises(prev =>
                prev.map(ex =>
                    ex.id === exerciseId
                        ? { ...ex, completed: !currentStatus }
                        : ex
                )
            );
        } catch (err) {
            console.error('Error updating exercise:', err);
        }
    };

    const handleFinishWorkout = async () => {
        if (!difficulty) {
            alert('Por favor, selecione o nível de dificuldade');
            return;
        }

        try {
            await updateDoc(doc(db, 'workouts', workout.id), {
                status: 'completed',
                completed_at: new Date().toISOString(),
                difficulty_feedback: difficulty,
                notes: notes
            });

            navigate('/dashboard');
        } catch (err) {
            console.error('Error finishing workout:', err);
            alert('Erro ao finalizar treino');
        }
    };

    if (loading) {
        return (
            <div className="workout-execution-container">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                </div>
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
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-secondary btn-sm"
                        >
                            ← Voltar
                        </button>
                        <h2 className="workout-title">{workout.name}</h2>
                        <div className="workout-progress-badge">
                            {completedCount}/{exercises.length}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-bar mt-md">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="workout-main">
                <div className="container">
                    {/* Exercise List */}
                    <section className="exercises-section mb-xl">
                        <h3 className="mb-lg">Exercícios</h3>
                        <div className="exercise-list-execution">
                            {exercises.map((exercise, index) => (
                                <div
                                    key={exercise.id}
                                    className={`exercise-card card ${exercise.completed ? 'completed' : ''}`}
                                >
                                    <div className="flex items-center gap-md">
                                        <button
                                            onClick={() => toggleExerciseComplete(exercise.id, exercise.completed)}
                                            className={`checkbox-btn ${exercise.completed ? 'checked' : ''}`}
                                        >
                                            {exercise.completed && '✓'}
                                        </button>

                                        <div className="exercise-details flex-1">
                                            <h4 className="exercise-name">{exercise.exercise_name}</h4>
                                            <p className="exercise-meta text-secondary text-sm">
                                                {exercise.muscle_group}
                                            </p>
                                            <div className="exercise-sets mt-sm">
                                                <span className="badge badge-primary">
                                                    {exercise.target_sets} séries × {exercise.target_reps} reps
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Notes Section */}
                    <section className="notes-section mb-xl">
                        <div className="card">
                            <h3 className="mb-md">Observações</h3>
                            <textarea
                                className="form-textarea"
                                placeholder="Como foi o treino? Alguma observação?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </section>

                    {/* Difficulty Feedback */}
                    <section className="difficulty-section mb-xl">
                        <div className="card">
                            <h3 className="mb-md">Como foi o treino?</h3>
                            <div className="difficulty-options">
                                <button
                                    onClick={() => setDifficulty('easy')}
                                    className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                                >
                                    <span className="difficulty-icon">😊</span>
                                    <span className="difficulty-label">Fácil</span>
                                </button>
                                <button
                                    onClick={() => setDifficulty('ok')}
                                    className={`difficulty-btn ${difficulty === 'ok' ? 'active' : ''}`}
                                >
                                    <span className="difficulty-icon">😐</span>
                                    <span className="difficulty-label">Ok</span>
                                </button>
                                <button
                                    onClick={() => setDifficulty('hard')}
                                    className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                                >
                                    <span className="difficulty-icon">😰</span>
                                    <span className="difficulty-label">Difícil</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Finish Button */}
                    <button
                        onClick={handleFinishWorkout}
                        className="btn btn-primary btn-full btn-lg"
                        disabled={completedCount === 0}
                    >
                        ✅ Finalizar Treino
                    </button>
                </div>
            </main>
        </div>
    );
};

export default WorkoutExecution;
