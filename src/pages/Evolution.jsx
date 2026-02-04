import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import Header from '../components/Header';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

const Evolution = () => {
    const { t } = useTranslation();
    const [readiness, setReadiness] = useState(null);
    const [skillStages, setSkillStages] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'beginner', 'intermediate', 'advanced'
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
                push: t('onboarding.equipment_list.dip_bars'),
                pull: t('onboarding.equipment_list.pullup_bar'),
                legs: t('onboarding.equipment_list.bodyweight'),
                core: t('common.core'),
                skills: t('evolution.skills')
            };

            const radarDataFormatted = ['push', 'pull', 'legs', 'core', 'skills'].map(key => ({
                subject: categoryMap[key] || key,
                value: scoreData.breakdown[key] || 0,
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
            {/* Header */}
            <Header />

            <main className="progress-main py-xl px-md md-px-0">
                <div className="container">
                    {/* Readiness Score & Radar Chart */}
                    <section className="mb-2xl">
                        <div className="grid grid-1 md-grid-2 gap-xl">
                            <div className="card text-center flex flex-col justify-center items-center overflow-hidden glass-dark p-2xl" style={{
                                background: `linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(30, 58, 95, 0.8)), url(${bgEvolution})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                minHeight: '400px'
                            }}>
                                <span className="mb-lg badge badge-primary py-xs px-md">{t('evolution.total_score')}</span>
                                <h3 className="mb-2xl text-primary uppercase tracking-tighter text-sm font-black" style={{ position: 'relative', zIndex: 10 }}>{t('dashboard.readiness_score')}</h3>
                                <div className="flex items-center justify-center relative" style={{ zIndex: 10 }}>
                                    <div style={{
                                        width: '180px', height: '180px', borderRadius: '50%',
                                        border: '12px solid var(--primary-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3.5rem', fontWeight: '900', background: 'rgba(0,0,0,0.8)',
                                        backdropFilter: 'blur(15px)',
                                        boxShadow: '0 0 50px rgba(102, 126, 234, 0.5)',
                                        paddingLeft: '12px',
                                        color: '#fff'
                                    }}>
                                        {readiness?.totalScore || 0}
                                        <span style={{ fontSize: '1.4rem', opacity: 0.6, marginLeft: '6px', fontWeight: '700' }}>/100</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-xl glass flex flex-col" style={{ minHeight: '400px' }}>
                                <div className="text-center mb-xl">
                                    <h3 className="uppercase tracking-widest text-xs font-black opacity-60">{t('evolution.athlete_balance')}</h3>
                                    <div className="badge badge-success mt-sm">{t('evolution.athlete_level')}</div>
                                </div>
                                <div className="flex-1 flex items-center justify-center" style={{ width: '100%', minHeight: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <PolarRadiusAxis
                                                angle={90}
                                                domain={[0, 100]}
                                                tick={false}
                                                axisLine={false}
                                            />
                                            <Radar
                                                name={t('evolution.result')}
                                                dataKey="value"
                                                stroke="var(--primary-light)"
                                                fill="var(--primary-light)"
                                                fillOpacity={0.3}
                                                strokeWidth={3}
                                                dot={{ r: 6, fill: 'var(--primary-light)', stroke: 'white', strokeWidth: 2 }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Skills Section */}
                    <section className="mb-2xl">
                        <div className="flex flex-col lg-flex-row justify-between items-start lg-items-center gap-xl mb-2xl px-sm">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-sm mb-xs">
                                    <div className="w-8 h-[2px] bg-primary"></div>
                                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{t('evolution.technical_mastery')}</span>
                                </div>
                                <h2 className="mb-sm text-4xl font-black uppercase tracking-tighter italic">{t('evolution.skills')}</h2>
                                <p className="text-secondary text-base leading-relaxed opacity-70">{t('landing.calisthenics_info.calisthenics_concept')}</p>
                            </div>

                            <div className="flex gap-lg items-center glass-dark p-xl rounded-2xl w-full lg-w-auto">
                                <div className="flex-1 lg-flex-initial text-center lg-text-right px-md">
                                    <div className="text-[9px] text-secondary uppercase font-black tracking-widest opacity-40 mb-1">{t('evolution.completed')}</div>
                                    <div className="flex items-center justify-center lg-justify-end gap-sm">
                                        <Trophy size={18} className="text-success" />
                                        <span className="text-3xl font-black text-white tabular-nums">
                                            {skillStages.filter(s => s.status === 'completed').length}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-[1px] h-12 bg-white opacity-10"></div>
                                <div className="flex-1 lg-flex-initial text-center lg-text-right px-md">
                                    <div className="text-[9px] text-secondary uppercase font-black tracking-widest opacity-40 mb-1">{t('evolution.in_focus')}</div>
                                    <div className="flex items-center justify-center lg-justify-end gap-sm">
                                        <TrendingUp size={18} className="text-primary" />
                                        <span className="text-3xl font-black text-white tabular-nums">
                                            {skillStages.filter(s => s.status === 'in_progress').length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Level Tabs */}
                        <div className="mb-xl">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('common.level')}</span>
                            </div>
                            <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <div className="flex flex-row gap-2 p-2 bg-black bg-opacity-40 backdrop-blur-md rounded-2xl border border-white border-opacity-10 shadow-lg">
                                    {[
                                        { id: 'all', label: t('dashboard.view_all'), icon: '📊' },
                                        { id: 'beginner', label: t('common.beginner'), icon: '🌱', color: '#10B981' },
                                        { id: 'intermediate', label: t('common.intermediate'), icon: '🔥', color: '#F59E0B' },
                                        { id: 'advanced', label: t('common.advanced'), icon: '⚡', color: '#EF4444' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                                                font-semibold tracking-wide whitespace-nowrap
                                                transition-all duration-200 ease-out
                                                ${activeTab === tab.id
                                                    ? 'text-white shadow-lg'
                                                    : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                                                }
                                            `}
                                            style={{
                                                background: activeTab === tab.id
                                                    ? tab.color
                                                        ? `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`
                                                        : 'linear-gradient(135deg, var(--primary-light), var(--primary-dark))'
                                                    : 'transparent',
                                                fontSize: '13px',
                                                letterSpacing: '0.03em',
                                                minWidth: '100px'
                                            }}
                                        >
                                            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Indicator */}
                        {activeTab !== 'all' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-secondary animate-fadeIn">
                                <span className="opacity-60">{t('dashboard.focus_prefix')}:</span>
                                <span className="font-bold text-white">
                                    {activeTab === 'beginner' ? t('common.beginner') :
                                        activeTab === 'intermediate' ? t('common.intermediate') :
                                            t('common.advanced')}
                                </span>
                                <span className="opacity-40">
                                    ({skillStages.filter(s => {
                                        const diff = s.stage.difficulty_score;
                                        if (activeTab === 'beginner') return diff <= 3;
                                        if (activeTab === 'intermediate') return diff > 3 && diff <= 6;
                                        if (activeTab === 'advanced') return diff > 6;
                                        return true;
                                    }).length} {t('evolution.skills').toLowerCase()})
                                </span>
                            </div>
                        )}

                        <div className="grid grid-1 md-grid-2 lg-grid-3 gap-xl">
                            {skillStages
                                .filter(({ stage }) => {
                                    const diff = stage.difficulty_score;
                                    if (activeTab === 'all') return true;
                                    if (activeTab === 'beginner') return diff <= 3;
                                    if (activeTab === 'intermediate') return diff > 3 && diff <= 6;
                                    if (activeTab === 'advanced') return diff > 6;
                                    return true;
                                })
                                .map(({ skill, stage, stats, status, masteredCount, totalCount }) => {
                                    const isReps = stage.metric_type === 'reps';
                                    const goal = isReps ? stage.default_prescription.reps_max : stage.default_prescription.seconds_max;
                                    const current = isReps ? (stats.reps || 0) : (stats.seconds || 0);
                                    const percent = Math.min(100, Math.max(0, (current / goal) * 100));
                                    const unit = isReps ? ' reps' : 's';

                                    const difficulty = stage.difficulty_score;
                                    const levelLabel = difficulty <= 3 ? t('common.beginner') : difficulty <= 6 ? t('common.intermediate') : t('common.advanced');
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
                                                            {t('evolution.mastery')} {masteredCount}/{totalCount}
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
                                                        {status === 'completed' ? t('evolution.max_achievement') : status === 'locked' ? t('evolution.locked') : t('evolution.current_focus')}
                                                    </p>
                                                    <h4 className={`text-base font-bold truncate ${status === 'locked' ? 'text-secondary font-normal italic' : 'text-primary'}`}>
                                                        {t(`dashboard.exercises.${stage.id}`, { defaultValue: stage.name })}
                                                    </h4>
                                                </div>

                                                {/* Progress Artifact */}
                                                <div className="bg-black bg-opacity-40 p-4 rounded-xl border border-white border-opacity-5 shadow-inner">
                                                    <div className="flex justify-between items-end mb-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-secondary uppercase font-black tracking-tighter opacity-70">{t('evolution.pr')}</span>
                                                            <span className="text-lg font-black text-white">{current}{unit}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-secondary uppercase font-black tracking-tighter opacity-70">{t('evolution.objective')}</span>
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
                                                                <CheckCircle2 size={12} /> {t('evolution.completed_msg')}!
                                                            </span>
                                                        ) : status === 'locked' ? (
                                                            <span className="text-secondary opacity-60 flex items-center gap-1.5">
                                                                <Lock size={12} /> {t('evolution.requirements_msg')}
                                                            </span>
                                                        ) : current >= goal ? (
                                                            <span className="text-primary flex items-center gap-1.5 ">
                                                                <Award size={12} /> {t('evolution.ready_msg')}!
                                                            </span>
                                                        ) : (
                                                            <span className="text-secondary flex items-center gap-1.5">
                                                                <TrendingUp size={12} /> {Math.round(percent)}% {t('evolution.evolution_msg')}
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
                </div>
            </main>
        </div>
    );
};

export default Evolution;
