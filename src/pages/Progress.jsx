import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getVirtualNow } from '../utils/timeTravel';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

const Progress = () => {
    const [workouts, setWorkouts] = useState([]);
    const [stats, setStats] = useState({
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        streak: 0
    });
    const [chartData, setChartData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
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
            const today = getVirtualNow().toISOString().split('T')[0];
            const workoutData = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(w => (w.date || '') <= today);

            // Sort by date in JavaScript (descending)
            workoutData.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });

            setWorkouts(workoutData);

            // Calculate stats
            const now = getVirtualNow();
            const weekStart = startOfWeek(now, { locale: ptBR });
            const weekEnd = endOfWeek(now, { locale: ptBR });
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);

            const thisWeekCount = workoutData.filter(w => {
                const workoutDate = new Date(w.date + 'T12:00:00');
                return workoutDate >= weekStart && workoutDate <= weekEnd;
            }).length;

            const thisMonthCount = workoutData.filter(w => {
                const workoutDate = new Date(w.date + 'T12:00:00');
                return workoutDate >= monthStart && workoutDate <= monthEnd;
            }).length;

            // Calculate streak (improved logic)
            let streak = 0;
            const sortedDates = [...new Set(workoutData.map(w => w.date))].sort().reverse();

            if (sortedDates.length > 0) {
                const todayStr = format(getVirtualNow(), 'yyyy-MM-dd');
                const yesterday = getVirtualNow();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

                // Streak is active if the most recent workout was today OR yesterday
                if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
                    streak = 1;
                    // For subsequent dates, each must be exactly one day before the previous one
                    for (let i = 0; i < sortedDates.length - 1; i++) {
                        const d1 = new Date(sortedDates[i] + 'T12:00:00');
                        const d2 = new Date(sortedDates[i + 1] + 'T12:00:00');

                        const oneDayBeforeD1 = new Date(d1);
                        oneDayBeforeD1.setDate(oneDayBeforeD1.getDate() - 1);
                        const oneDayBeforeD1Str = format(oneDayBeforeD1, 'yyyy-MM-dd');

                        if (sortedDates[i + 1] === oneDayBeforeD1Str) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            setStats({
                thisWeek: thisWeekCount,
                thisMonth: thisMonthCount,
                total: workoutData.length,
                streak: streak
            });

            // Generate chart data for the last 6 months
            const last6Months = eachMonthOfInterval({
                start: subMonths(now, 5),
                end: now
            });

            const chartDataFormatted = last6Months.map(monthDate => {
                const mStart = startOfMonth(monthDate);
                const mEnd = endOfMonth(monthDate);
                const count = workoutData.filter(w => {
                    const workoutDate = new Date(w.date + 'T12:00:00');
                    return workoutDate >= mStart && workoutDate <= mEnd;
                }).length;

                return {
                    name: format(monthDate, 'MMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()),
                    count
                };
            });
            setChartData(chartDataFormatted);

            // Generate category/skill data
            const categoryLabels = {
                'handstand': 'Handstand',
                'front_lever': 'Front Lever',
                'back_lever': 'Back Lever',
                'planche': 'Planche',
                'push': 'Empurrar',
                'pull': 'Puxar',
                'legs': 'Pernas',
                'core': 'Core',
                'muscle_up': 'Muscle Up'
            };

            const catCounts = {};
            workoutData.forEach(w => {
                let category = 'Outros';
                if (w.skill_id) {
                    category = categoryLabels[w.skill_id] || w.skill_id.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
                } else if (w.name) {
                    const nameLower = w.name.toLowerCase();
                    if (nameLower.includes('empurrar')) category = 'Empurrar';
                    else if (nameLower.includes('puxar')) category = 'Puxar';
                    else if (nameLower.includes('pernas')) category = 'Pernas';
                    else if (nameLower.includes('core')) category = 'Core';
                    else if (nameLower.includes('handstand')) category = 'Handstand';
                    else if (nameLower.includes('front lever')) category = 'Front Lever';
                    else if (nameLower.includes('back lever')) category = 'Back Lever';
                    else if (nameLower.includes('planche')) category = 'Planche';
                }
                catCounts[category] = (catCounts[category] || 0) + 1;
            });

            const catDataFormatted = Object.entries(catCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setCategoryData(catDataFormatted);

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

                    {/* Monthly Progress Chart */}
                    <section className="history-section animate-fadeIn mb-xl">
                        <div className="card">
                            <h3 className="mb-lg">Treinos por Mês</h3>

                            {workouts.length === 0 ? (
                                <div className="text-center">
                                    <div className="empty-state">
                                        <div className="empty-icon">�</div>
                                        <h4 className="mb-sm">Nenhum treino concluído ainda</h4>
                                        <p className="text-secondary">
                                            Complete seu primeiro treino para ver seu progresso aqui!
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: 350, marginTop: '2rem' }}>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                        >
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary-light)" stopOpacity={1} />
                                                    <stop offset="95%" stopColor="var(--primary-dark)" stopOpacity={0.8} />
                                                </linearGradient>
                                                <linearGradient id="barGradientInactive" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary-dark)" stopOpacity={0.6} />
                                                    <stop offset="95%" stopColor="var(--primary-dark)" stopOpacity={0.3} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="rgba(255,255,255,0.05)"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                                allowDecimals={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-md)',
                                                    color: 'var(--text-primary)',
                                                    boxShadow: 'var(--shadow-lg)'
                                                }}
                                                itemStyle={{ color: 'white', fontWeight: 'bold' }}
                                                formatter={(value) => [`${value} treinos`, 'Quantidade']}
                                                labelStyle={{ marginBottom: '4px', color: 'var(--text-secondary)' }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                radius={[4, 4, 0, 0]}
                                                barSize={30}
                                            >
                                                <LabelList
                                                    dataKey="count"
                                                    position="top"
                                                    fill="var(--text-secondary)"
                                                    fontSize={12}
                                                    offset={10}
                                                    formatter={(value) => value > 0 ? value : ''}
                                                />
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={index === chartData.length - 1 ? 'url(#barGradient)' : 'url(#barGradientInactive)'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Workout Distribution Chart (Category/Skill) */}
                    <section className="history-section animate-fadeIn mt-xl">
                        <div className="card">
                            <h3 className="mb-lg">Treinos por Categoria</h3>

                            {workouts.length === 0 ? (
                                <div className="text-center">
                                    <div className="empty-state">
                                        <div className="empty-icon">📊</div>
                                        <h4 className="mb-sm">Sem dados suficientes</h4>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: categoryData.length * 50 + 40, minHeight: 200, marginTop: '1rem' }}>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={categoryData}
                                            layout="vertical"
                                            margin={{ top: 10, right: 40, left: 40, bottom: 10 }}
                                        >
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'white', fontSize: 13, fontWeight: 500 }}
                                                width={100}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: 'var(--radius-md)',
                                                    color: 'var(--text-primary)',
                                                    boxShadow: 'var(--shadow-lg)'
                                                }}
                                                itemStyle={{ color: 'white', fontWeight: 'bold' }}
                                                formatter={(value) => [`${value} treinos`, 'Total']}
                                            />
                                            <Bar
                                                dataKey="count"
                                                radius={[0, 4, 4, 0]}
                                                barSize={24}
                                            >
                                                <LabelList
                                                    dataKey="count"
                                                    position="right"
                                                    fill="var(--text-secondary)"
                                                    fontSize={12}
                                                    offset={10}
                                                />
                                                {categoryData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={index % 2 === 0 ? 'var(--primary-light)' : 'var(--primary-dark)'}
                                                        fillOpacity={0.8}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Progress;
