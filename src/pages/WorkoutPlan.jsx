import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const WorkoutPlan = () => {
    const [plan, setPlan] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadWorkoutPlan();
    }, [currentUser]);

    const loadWorkoutPlan = async () => {
        try {
            setLoading(true);

            // Get current plan ID from user profile
            const planId = userProfile?.current_plan_id;
            if (!planId) {
                setLoading(false);
                return;
            }

            // Get plan details
            const planDoc = await getDoc(doc(db, 'plans', planId));
            if (planDoc.exists()) {
                setPlan({ id: planDoc.id, ...planDoc.data() });
            }

            // Get all workouts for this plan
            const workoutsQuery = query(
                collection(db, 'workouts'),
                where('plan_id', '==', planId),
                where('user_id', '==', currentUser.uid)
            );

            const workoutsSnapshot = await getDocs(workoutsQuery);
            const workoutsData = [];

            for (const workoutDoc of workoutsSnapshot.docs) {
                const workoutData = { id: workoutDoc.id, ...workoutDoc.data() };

                // Get exercises for this workout
                const exercisesQuery = query(
                    collection(db, 'workout_exercises'),
                    where('workout_id', '==', workoutDoc.id)
                );

                const exercisesSnapshot = await getDocs(exercisesQuery);
                workoutData.exercises = exercisesSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => a.order_index - b.order_index);

                workoutsData.push(workoutData);
            }

            // Group workouts by day_label
            const groupedWorkouts = workoutsData.reduce((acc, workout) => {
                const existing = acc.find(w => w.day_label === workout.day_label);
                if (!existing) {
                    acc.push(workout);
                }
                return acc;
            }, []);

            // Sort by day_label
            groupedWorkouts.sort((a, b) => a.day_label.localeCompare(b.day_label));

            setWorkouts(groupedWorkouts);
        } catch (err) {
            console.error('Error loading workout plan:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="workout-plan-container">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p className="text-secondary mt-md">Carregando plano...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="workout-plan-container">
                <header className="workout-plan-header">
                    <div className="container">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-secondary btn-sm"
                            >
                                ← Voltar
                            </button>
                            <h2>Plano de Treino</h2>
                            <div style={{ width: '80px' }}></div>
                        </div>
                    </div>
                </header>

                <main className="workout-plan-main">
                    <div className="container">
                        <div className="card text-center">
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <h3 className="mb-md">Nenhum plano ativo</h3>
                                <p className="text-secondary mb-lg">
                                    Complete seu perfil para gerar um plano de treino personalizado.
                                </p>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="btn btn-primary"
                                >
                                    Ir para Perfil
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="workout-plan-container">
            {/* Header */}
            <header className="workout-plan-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-secondary btn-sm"
                        >
                            ← Voltar
                        </button>
                        <h2>Meu Plano de Treino</h2>
                        <div style={{ width: '80px' }}></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="workout-plan-main">
                <div className="container">
                    {/* Plan Info */}
                    <section className="plan-info-section mb-xl">
                        <div className="card">
                            <h3 className="mb-md">{plan.name}</h3>
                            <div className="plan-meta">
                                <div className="plan-meta-item">
                                    <span className="plan-meta-label">Nível:</span>
                                    <span className="badge badge-primary">{plan.level}</span>
                                </div>
                                <div className="plan-meta-item">
                                    <span className="plan-meta-label">Objetivo:</span>
                                    <span className="text-primary">{plan.goal}</span>
                                </div>
                                <div className="plan-meta-item">
                                    <span className="plan-meta-label">Frequência:</span>
                                    <span className="text-primary">{plan.days_per_week}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Workouts List */}
                    <section className="workouts-list-section">
                        <h3 className="mb-lg">Treinos do Plano</h3>

                        {workouts.length === 0 ? (
                            <div className="card text-center">
                                <p className="text-secondary">Nenhum treino encontrado neste plano.</p>
                            </div>
                        ) : (
                            <div className="workouts-grid">
                                {workouts.map((workout) => (
                                    <div key={workout.id} className="workout-plan-card card">
                                        <div className="workout-plan-header-card">
                                            <div className="flex justify-between items-center">
                                                <h4 className="workout-plan-title">
                                                    <span className="workout-day-badge">Dia {workout.day_label}</span>
                                                    {workout.name}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="workout-plan-exercises">
                                            {workout.exercises && workout.exercises.length > 0 ? (
                                                workout.exercises.map((exercise, index) => (
                                                    <div key={exercise.id} className="plan-exercise-item">
                                                        <div className="plan-exercise-number">{index + 1}</div>
                                                        <div className="plan-exercise-info">
                                                            <h5 className="plan-exercise-name">{exercise.exercise_name}</h5>
                                                            <p className="plan-exercise-meta">
                                                                {exercise.muscle_group}
                                                            </p>
                                                        </div>
                                                        <div className="plan-exercise-sets">
                                                            <span className="badge badge-primary">
                                                                {exercise.target_sets}×{exercise.target_reps}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-secondary text-sm">Nenhum exercício neste treino</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Action Button */}
                    <section className="plan-actions mt-xl">
                        <button
                            onClick={() => navigate('/profile')}
                            className="btn btn-secondary btn-full"
                        >
                            🔄 Editar Perfil e Recalcular Plano
                        </button>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default WorkoutPlan;
