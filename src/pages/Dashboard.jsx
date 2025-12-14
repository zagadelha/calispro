import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTodayWorkout } from '../utils/workoutGenerator';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '../assets/logo2.png';

const Dashboard = () => {
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadTodayWorkout();
    }, [currentUser]);

    const loadTodayWorkout = async () => {
        try {
            setLoading(true);
            const todayWorkout = await getTodayWorkout(currentUser.uid);
            setWorkout(todayWorkout);
            setIsWorkoutActive(todayWorkout?.status === 'in_progress');
        } catch (err) {
            console.error('Error loading workout:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartWorkout = async () => {
        try {
            await updateDoc(doc(db, 'workouts', workout.id), {
                status: 'in_progress',
                started_at: new Date().toISOString()
            });
            setIsWorkoutActive(true);
            navigate('/workout');
        } catch (err) {
            console.error('Error starting workout:', err);
        }
    };

    const handleEditWorkout = () => {
        navigate('/workout/edit');
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

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <img src={logo} alt="CalisProgress" className="app-logo" />
                        <div className="flex items-center gap-md">
                            <button
                                onClick={() => navigate('/plan')}
                                className="btn btn-secondary btn-sm"
                            >
                                <span className="btn-icon">📋</span>
                                <span className="btn-text">Plano</span>
                            </button>
                            <button
                                onClick={() => navigate('/profile')}
                                className="btn btn-secondary btn-sm"
                            >
                                <span className="btn-icon">👤</span>
                                <span className="btn-text">Perfil</span>
                            </button>
                            <button
                                onClick={() => navigate('/progress')}
                                className="btn btn-secondary btn-sm"
                            >
                                <span className="btn-icon">📊</span>
                                <span className="btn-text">Progresso</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-outline btn-sm"
                            >
                                <span className="btn-icon">🚪</span>
                                <span className="btn-text">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="container">
                    {/* Welcome Section */}
                    <section className="welcome-section mb-xl">
                        <h2 className="mb-sm">
                            Olá, {userProfile?.name || 'Atleta'}! 👋
                        </h2>
                        <p className="text-secondary">
                            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                    </section>

                    {/* Today's Workout */}
                    {workout ? (
                        <section className="workout-section">
                            <div className="card workout-card">
                                <div className="card-header">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="card-title">Treino de Hoje</h3>
                                            <p className="card-subtitle">{workout.name}</p>
                                        </div>
                                        <span className="badge badge-primary">
                                            Dia {workout.day_label}
                                        </span>
                                    </div>
                                </div>

                                {/* Exercise List */}
                                <div className="exercise-list">
                                    {workout.exercises?.map((exercise, index) => (
                                        <div key={exercise.id} className="exercise-item">
                                            <div className="exercise-number">{index + 1}</div>
                                            <div className="exercise-info">
                                                <h4 className="exercise-name">{exercise.exercise_name}</h4>
                                                <p className="exercise-meta text-secondary text-sm">
                                                    {exercise.muscle_group} • {exercise.target_sets}x{exercise.target_reps}
                                                </p>
                                            </div>
                                            {exercise.completed && (
                                                <span className="badge badge-success">✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="workout-actions flex gap-md mt-xl">
                                    {workout.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={handleStartWorkout}
                                                className="btn btn-primary btn-full"
                                            >
                                                🚀 Iniciar Treino
                                            </button>
                                            <button
                                                onClick={handleEditWorkout}
                                                className="btn btn-secondary"
                                            >
                                                ✏️ Editar
                                            </button>
                                        </>
                                    ) : workout.status === 'in_progress' ? (
                                        <button
                                            onClick={() => navigate('/workout')}
                                            className="btn btn-primary btn-full"
                                        >
                                            Continuar Treino
                                        </button>
                                    ) : (
                                        <div className="workout-completed">
                                            <div className="success-message">
                                                <span className="success-icon">✅</span>
                                                <div>
                                                    <h4>Treino Concluído!</h4>
                                                    <p className="text-secondary text-sm">
                                                        Ótimo trabalho hoje!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="no-workout-section">
                            <div className="card text-center">
                                <div className="empty-state">
                                    <div className="empty-icon">📅</div>
                                    <h3 className="mb-md">Nenhum treino para hoje</h3>
                                    <p className="text-secondary mb-lg">
                                        Você pode criar um novo treino ou descansar hoje.
                                    </p>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="btn btn-primary"
                                    >
                                        Ver Perfil
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Quick Stats */}
                    <section className="stats-section mt-xl">
                        <div className="grid grid-3">
                            <div className="stat-card card">
                                <div className="stat-icon">🔥</div>
                                <div className="stat-value">0</div>
                                <div className="stat-label text-secondary">Sequência</div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-icon">💪</div>
                                <div className="stat-value">0</div>
                                <div className="stat-label text-secondary">Esta Semana</div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-icon">⭐</div>
                                <div className="stat-value">0</div>
                                <div className="stat-label text-secondary">Total</div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
