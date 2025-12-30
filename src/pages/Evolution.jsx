import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    calculateReadinessScore,
    getUserSkillStage,
    getSkillProgression,
    exercises,
    formatSkillName
} from '../utils/progressionSystem';
import {
    Trophy,
    Lock,
    CheckCircle2,
    AlertCircle,
    Award,
    TrendingUp
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import bgEvolution from '../assets/bg-evolution.png'; // Imported new background

import { getUserHistory } from '../utils/historyManager';
import { getVirtualDate } from '../utils/timeTravel';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

const Evolution = () => {
    const [readiness, setReadiness] = useState(null);
    const [skillStages, setSkillStages] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch Real History
            const userHistory = await getUserHistory(currentUser.uid, getVirtualDate());

            // Calculate Readiness
            const scoreData = calculateReadinessScore(userHistory, getVirtualDate());
            setReadiness(scoreData);

            // Calculate Skills
            const skillProgress = getSkillProgression(userHistory);
            const stages = skillProgress.map(item => {
                // If in progress, show current stage
                // If completed, show hardest mastered
                // If locked, show first exercise of the skill
                const skillExercises = exercises
                    .filter(ex => ex.skill === item.skill)
                    .sort((a, b) => a.difficulty_score - b.difficulty_score);

                const stage = item.currentStage || item.hardestMastered || skillExercises[0];

                if (!stage) return null;

                const stats = userHistory[stage.id] || { reps: 0, seconds: 0 };
                let displayStats = { reps: 0, seconds: 0 };
                if (stats.history && stats.history.length > 0) {
                    const maxReps = Math.max(...stats.history.map(h => h.reps || 0));
                    const maxSecs = Math.max(...stats.history.map(h => h.seconds || 0));
                    displayStats = { reps: maxReps, seconds: maxSecs };
                }

                return { ...item, stage, stats: displayStats };
            }).filter(s => s);

            setSkillStages(stages);

            // Prepare Radar Data
            const categoryMap = {
                push: 'Empurrar',
                pull: 'Puxar',
                legs: 'Pernas',
                core: 'Core',
                skills: 'Habilidades'
            };

            const radarDataFormatted = Object.entries(scoreData.breakdown).map(([key, val]) => ({
                subject: categoryMap[key] || key,
                value: val,
                fullMark: 100
            }));
            setRadarData(radarDataFormatted);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-container flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="progress-container">
            <header className="progress-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">← Voltar</button>
                        <h2>Minha Evolução</h2>
                        <div style={{ width: '80px' }}></div>
                    </div>
                </div>
            </header>

            <main className="progress-main container">
                {/* Readiness Score & Radar Chart */}
                <section className="mb-xl">
                    <div className="grid grid-2 gap-lg items-stretch">
                        <div className="card text-center flex flex-col justify-center items-center overflow-hidden" style={{
                            background: `linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(30, 58, 95, 0.8)), url(${bgEvolution})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            minHeight: '350px'
                        }}>
                            <h3 className="mb-md text-primary" style={{ position: 'relative', zIndex: 10 }}>Nível de Preparação</h3>
                            <div className="flex items-center justify-center relative" style={{ zIndex: 10 }}>
                                <div style={{
                                    width: '160px', height: '160px', borderRadius: '50%',
                                    border: '10px solid var(--primary-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '3rem', fontWeight: '800', background: 'rgba(0,0,0,0.65)',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: '0 0 30px rgba(102, 126, 234, 0.4)',
                                    paddingLeft: '10px'
                                }}>
                                    {readiness?.totalScore || 0}
                                    <span style={{ fontSize: '1.2rem', opacity: 0.5, marginLeft: '4px', fontWeight: '600' }}>/100</span>
                                </div>
                            </div>
                            <p className="mt-xl text-secondary opacity-90 uppercase tracking-widest text-xs font-bold" style={{ position: 'relative', zIndex: 10 }}>Capacidade Atlética Global</p>
                        </div>

                        <div className="card" style={{ minHeight: '350px' }}>
                            <h3 className="mb-lg text-center" style={{ fontSize: '1.1rem' }}>Progresso por Categoria</h3>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.15)" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: 'white', fontSize: 13, fontWeight: 500 }}
                                        />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 100]}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Radar
                                            name="Resultado"
                                            dataKey="value"
                                            stroke="var(--primary-light)"
                                            fill="var(--primary-light)"
                                            fillOpacity={0.5}
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: 'var(--primary-light)', stroke: 'white', strokeWidth: 2 }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Skills Section */}
                <section>
                    <div className="flex justify-between items-end mb-xl">
                        <div>
                            <h2 className="mb-xs">Habilidades & Conquistas</h2>
                            <p className="text-secondary text-base">Acompanhe seu progresso e desbloqueie novas conquistas para elevar seu nível atlético.</p>
                        </div>
                        <div className="flex gap-lg items-center text-right">
                            <div className="hidden sm:block">
                                <div className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-60">Concluídas</div>
                                <div className="text-2xl font-black text-success">
                                    {skillStages.filter(s => s.status === 'completed').length}
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-60">Em Foco</div>
                                <div className="text-2xl font-black text-primary">
                                    {skillStages.filter(s => s.status === 'in_progress').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-1 md-grid-2 lg-grid-3 gap-xl">
                        {skillStages.map(({ skill, stage, stats, status, masteredCount, totalCount }) => {
                            const isReps = stage.metric_type === 'reps';
                            const goal = isReps ? stage.default_prescription.reps_max : stage.default_prescription.seconds_max;
                            const current = isReps ? (stats.reps || 0) : (stats.seconds || 0);
                            const percent = Math.min(100, Math.max(0, (current / goal) * 100));
                            const unit = isReps ? 'reps' : 's';

                            const difficulty = stage.difficulty_score;
                            const levelLabel = difficulty <= 3 ? 'Iniciante' : difficulty <= 6 ? 'Intermediário' : 'Avançado';
                            const levelColor = difficulty <= 3 ? '#10B981' : difficulty <= 6 ? '#F59E0B' : '#EF4444';

                            return (
                                <div
                                    key={skill}
                                    className={`card relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${status === 'completed' ? 'border-success border-opacity-40' : status === 'locked' ? 'opacity-60 grayscale-[0.3]' : 'hover:border-primary-light'}`}
                                    style={{
                                        background: status === 'completed'
                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(0, 0, 0, 0.5))'
                                            : 'var(--bg-card)',
                                        borderLeft: `6px solid ${levelColor}`
                                    }}
                                >
                                    {/* Background Decor */}
                                    <div className="absolute -top-6 -right-6 opacity-5 pointer-events-none rotate-12">
                                        {status === 'completed' ? <Trophy size={140} /> : <TrendingUp size={140} />}
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-lg">
                                            <div className="flex flex-col gap-1.5">
                                                <span
                                                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm w-fit"
                                                    style={{ backgroundColor: levelColor, color: '#fff' }}
                                                >
                                                    {levelLabel}
                                                </span>
                                                <div className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-white bg-opacity-5 px-2 py-0.5 rounded border border-white border-opacity-5 w-fit">
                                                    Domínio {masteredCount}/{totalCount}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                {status === 'completed' ? (
                                                    <div className="bg-success text-white p-2 rounded-full shadow-glow">
                                                        <Trophy size={20} />
                                                    </div>
                                                ) : status === 'locked' ? (
                                                    <div className="bg-gray-800 text-secondary p-2 rounded-full border border-white border-opacity-10 opacity-60">
                                                        <Lock size={20} />
                                                    </div>
                                                ) : current >= goal ? (
                                                    <div className="bg-primary text-white p-2 rounded-full shadow-glow animate-pulse">
                                                        <Award size={20} />
                                                    </div>
                                                ) : (
                                                    <div className="bg-white bg-opacity-5 text-secondary p-2 rounded-full border border-white border-opacity-5">
                                                        <TrendingUp size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black mb-1 capitalize tracking-tight flex items-center gap-2">
                                            {formatSkillName(skill)}
                                        </h3>

                                        <div className="w-full h-1 bg-white bg-opacity-5 rounded-full overflow-hidden mb-xl">
                                            <div
                                                className={`h-full transition-all duration-1000 ${status === 'completed' ? 'bg-success shadow-glow' : 'bg-primary'}`}
                                                style={{ width: `${(masteredCount / totalCount) * 100}%` }}
                                            />
                                        </div>

                                        <div className="mb-lg">
                                            <p className="text-[10px] text-secondary uppercase font-black tracking-widest opacity-50 mb-2">
                                                {status === 'completed' ? 'CONQUISTA MÁXIMA' : status === 'locked' ? 'BLOQUEADO' : 'FOCO ATUAL'}
                                            </p>
                                            <h4 className={`text-base font-bold truncate ${status === 'locked' ? 'text-secondary font-normal italic' : 'text-primary'}`}>
                                                {stage.name}
                                            </h4>
                                        </div>

                                        {/* Progress Artifact */}
                                        <div className="bg-black bg-opacity-40 p-4 rounded-xl border border-white border-opacity-5 shadow-inner">
                                            <div className="flex justify-between items-end mb-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-secondary uppercase font-black tracking-tighter opacity-70">Personal Record</span>
                                                    <span className="text-lg font-black text-white">{current}{unit}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-secondary uppercase font-black tracking-tighter opacity-70">Objetivo</span>
                                                    <div className="text-sm font-bold text-white opacity-80">{goal}{unit}</div>
                                                </div>
                                            </div>

                                            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden shadow-inner border border-white border-opacity-5">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out shadow-glow ${status === 'completed' ? 'bg-success' : current >= goal ? 'bg-primary' : 'bg-primary bg-opacity-60'}`}
                                                    style={{ width: `${status === 'completed' ? 100 : percent}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest">
                                                {status === 'completed' ? (
                                                    <span className="text-success flex items-center gap-1.5 animate-bounce">
                                                        <CheckCircle2 size={12} /> Desafio Concluído!
                                                    </span>
                                                ) : status === 'locked' ? (
                                                    <span className="text-secondary opacity-60 flex items-center gap-1.5">
                                                        <Lock size={12} /> Requer Pré-requisitos
                                                    </span>
                                                ) : current >= goal ? (
                                                    <span className="text-primary flex items-center gap-1.5 ">
                                                        <Award size={12} /> Pronto para Evoluir!
                                                    </span>
                                                ) : (
                                                    <span className="text-secondary flex items-center gap-1.5">
                                                        <TrendingUp size={12} /> {Math.round(percent)}% concluído
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Locked Mask */}
                                    {status === 'locked' && (
                                        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-[1px] pointer-events-none" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Evolution;
