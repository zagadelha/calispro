import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Progress = () => {
    const [workouts, setWorkouts] = useState([]);
    const [stats, setStats] = useState({
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        try {
            setLoading(true);

            // Get all completed workouts
            const q = query(
                collection(db, 'workouts'),
                where('user_id', '==', currentUser.uid),
                where('status', '==', 'completed')
            );

            const querySnapshot = await getDocs(q);
            const workoutData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by date in JavaScript (descending)
            workoutData.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });

            setWorkouts(workoutData);

            // Calculate stats
            const now = new Date();
            const weekStart = startOfWeek(now, { locale: ptBR });
            const weekEnd = endOfWeek(now, { locale: ptBR });
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);

            const thisWeekCount = workoutData.filter(w => {
                const workoutDate = new Date(w.date);
                return workoutDate >= weekStart && workoutDate <= weekEnd;
            }).length;

            const thisMonthCount = workoutData.filter(w => {
                const workoutDate = new Date(w.date);
                return workoutDate >= monthStart && workoutDate <= monthEnd;
            }).length;

            // Calculate streak
            let streak = 0;
            const sortedDates = [...new Set(workoutData.map(w => w.date))].sort().reverse();

            for (let i = 0; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i]);
                const expectedDate = new Date();
                expectedDate.setDate(expectedDate.getDate() - i);

                if (currentDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                    streak++;
                } else {
                    break;
                }
            }

            setStats({
                thisWeek: thisWeekCount,
                thisMonth: thisMonthCount,
                total: workoutData.length,
                streak: streak
            });

        } catch (err) {
            console.error('Error loading progress:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="progress-container">
                <div className="container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="progress-container">
            {/* Header */}
            <header className="progress-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-secondary btn-sm"
                        >
                            ← Voltar
                        </button>
                        <h2>Meu Progresso</h2>
                        <div style={{ width: '80px' }}></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="progress-main">
                <div className="container">
                    {/* Stats Cards */}
                    <section className="stats-grid mb-xl">
                        <div className="grid grid-2">
                            <div className="stat-card-large card">
                                <div className="stat-icon-large">🔥</div>
                                <div className="stat-value-large">{stats.streak}</div>
                                <div className="stat-label-large">Dias Consecutivos</div>
                            </div>

                            <div className="stat-card-large card">
                                <div className="stat-icon-large">⭐</div>
                                <div className="stat-value-large">{stats.total}</div>
                                <div className="stat-label-large">Treinos Totais</div>
                            </div>

                            <div className="stat-card-large card">
                                <div className="stat-icon-large">📅</div>
                                <div className="stat-value-large">{stats.thisWeek}</div>
                                <div className="stat-label-large">Esta Semana</div>
                            </div>

                            <div className="stat-card-large card">
                                <div className="stat-icon-large">📊</div>
                                <div className="stat-value-large">{stats.thisMonth}</div>
                                <div className="stat-label-large">Este Mês</div>
                            </div>
                        </div>
                    </section>

                    {/* Workout History */}
                    <section className="history-section">
                        <h3 className="mb-lg">Histórico de Treinos</h3>

                        {workouts.length === 0 ? (
                            <div className="card text-center">
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <h4 className="mb-sm">Nenhum treino concluído ainda</h4>
                                    <p className="text-secondary">
                                        Complete seu primeiro treino para ver seu progresso aqui!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="workout-history-list">
                                {workouts.map(workout => (
                                    <div key={workout.id} className="workout-history-item card">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="workout-history-name">{workout.name}</h4>
                                                <p className="text-secondary text-sm">
                                                    {format(new Date(workout.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-md">
                                                {workout.difficulty_feedback && (
                                                    <span className={`badge badge-${workout.difficulty_feedback === 'easy' ? 'success' :
                                                        workout.difficulty_feedback === 'ok' ? 'primary' :
                                                            'warning'
                                                        }`}>
                                                        {workout.difficulty_feedback === 'easy' ? '😊 Fácil' :
                                                            workout.difficulty_feedback === 'ok' ? '😐 Ok' :
                                                                '😰 Difícil'}
                                                    </span>
                                                )}
                                                <span className="badge badge-success">✓ Concluído</span>
                                            </div>
                                        </div>

                                        {workout.notes && (
                                            <div className="workout-notes mt-md">
                                                <p className="text-sm text-secondary">
                                                    <strong>Observações:</strong> {workout.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Progress;
