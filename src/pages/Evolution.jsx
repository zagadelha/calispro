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

            // Prepare Radar Data - Movement Patterns
            const categoryMap = {
                push: t('evolution.patterns.push'),
                pull: t('evolution.patterns.pull'),
                legs: t('evolution.patterns.legs'),
                core: t('evolution.patterns.core'),
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
                                <div className="flex flex-row gap-1.5 p-1.5 bg-[#1a1f2e] rounded-2xl border border-white border-opacity-10 shadow-inner">
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
                                                font-bold tracking-wider whitespace-nowrap uppercase
                                                transition-all duration-200 ease-out
                                                ${activeTab === tab.id
                                                    ? 'text-white shadow-lg scale-[1.02]'
                                                    : 'text-white hover:bg-white hover:bg-opacity-5'
                                                }
                                            `}
                                            style={{
                                                background: activeTab === tab.id
                                                    ? tab.color
                                                        ? `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`
                                                        : 'linear-gradient(135deg, var(--primary-light), var(--primary-dark))'
                                                    : '#1a1f2e',
                                                fontSize: '11px',
                                                letterSpacing: '0.08em',
                                                minWidth: '100px',
                                                border: '1px solid',
                                                borderColor: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'
                                            }}
                                        >
                                            <span style={{ fontSize: '16px', filter: activeTab === tab.id ? 'brightness(1)' : 'grayscale(1) opacity(0.7)' }}>{tab.icon}</span>
                                            <span style={{
                                                color: activeTab === tab.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                                                textShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                            }}>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Indicator */}
                        {activeTab !== 'all' && (
                            <div className="mt-3 text-sm text-secondary animate-fadeIn">
                                <span className="opacity-60">{t('dashboard.focus_prefix')}: </span>
                                <span className="font-bold text-white">
                                    {activeTab === 'beginner' ? t('common.beginner') :
                                        activeTab === 'intermediate' ? t('common.intermediate') :
                                            t('common.advanced')}
                                </span>
                                <span className="opacity-40">
                                    {' '}({skillStages.filter(s => {
                                        const diff = s.stage.difficulty_score;
                                        if (activeTab === 'beginner') return diff <= 3;
                                        if (activeTab === 'intermediate') return diff > 3 && diff <= 6;
                                        if (activeTab === 'advanced') return diff > 6;
                                        return true;
                                    }).length} {t('evolution.skills').toLowerCase()})
                                </span>
                            </div>
                        )}

                        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
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
                                            className={`group relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${status === 'locked' ? 'opacity-50' : ''}`}
                                            style={{
                                                background: 'linear-gradient(180deg, #1e2433 0%, #151922 100%)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '16px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* Compact Image Section */}
                                            <div className="relative h-40 w-full">
                                                {stage.media?.url ? (
                                                    <img
                                                        src={stage.media.url}
                                                        alt={stage.name}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                        <span className="text-4xl font-black text-white/10 uppercase italic">
                                                            {skill.slice(0, 2)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#151922] via-transparent to-transparent opacity-90" />

                                                {/* Status Badge - Top Right */}
                                                <div
                                                    className="absolute top-3 right-3 h-7 w-7 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                                                            status === 'locked' ? 'rgba(255,255,255,0.05)' :
                                                                'rgba(102, 126, 234, 0.2)',
                                                        border: `1px solid ${status === 'completed' ? 'rgba(16, 185, 129, 0.3)' :
                                                            status === 'locked' ? 'rgba(255,255,255,0.1)' :
                                                                'rgba(102, 126, 234, 0.3)'}`
                                                    }}
                                                >
                                                    {status === 'completed' ? (
                                                        <Trophy size={14} className="text-emerald-400" />
                                                    ) : status === 'locked' ? (
                                                        <Lock size={14} className="text-white/30" />
                                                    ) : (
                                                        <TrendingUp size={14} className="text-primary" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="p-6 flex flex-col gap-4">
                                                {/* Header: Skill Name + Level */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-bold text-white truncate mb-1">
                                                            {formatSkillName(skill)}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full"
                                                                style={{ backgroundColor: levelColor }}
                                                            />
                                                            <span className="text-xs text-white/50 font-medium">
                                                                {levelLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-white tabular-nums">
                                                            {masteredCount}
                                                        </span>
                                                        <span className="text-sm text-white/30 font-medium">/{totalCount}</span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${(masteredCount / totalCount) * 100}%`,
                                                            background: status === 'completed'
                                                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                                : 'linear-gradient(90deg, var(--primary-light), var(--primary-dark))'
                                                        }}
                                                    />
                                                </div>

                                                {/* Current Exercise Focus */}
                                                <div className="flex items-center justify-between py-3 px-4 rounded-xl"
                                                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider mb-0.5">
                                                            {status === 'completed' ? t('evolution.max_achievement') : t('evolution.current_focus')}
                                                        </p>
                                                        <p className={`text-sm font-medium truncate ${status === 'locked' ? 'text-white/30 italic' : 'text-white/90'}`}>
                                                            {t(`dashboard.exercises.${stage.id}`, { defaultValue: stage.name })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stats Row */}
                                                <div className="grid grid-cols-3 gap-2 items-center">
                                                    <div className="text-left">
                                                        <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mb-1">{t('evolution.pr')}</p>
                                                        <p className="text-lg font-bold text-white">{current}<span className="text-xs text-white/40 ml-0.5">{unit}</span></p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mb-1">{t('evolution.objective')}</p>
                                                        <p className="text-lg font-bold text-white/50">{goal}<span className="text-xs text-white/30 ml-0.5">{unit}</span></p>
                                                    </div>

                                                    {/* Mini Progress Circle */}
                                                    <div className="flex justify-end">
                                                        <div
                                                            className="relative h-10 w-10 rounded-full flex items-center justify-center"
                                                            style={{
                                                                background: `conic-gradient(${status === 'completed' ? '#10B981' : 'var(--primary-light)'} ${status === 'completed' ? 100 : percent}%, rgba(255,255,255,0.05) 0%)`,
                                                            }}
                                                        >
                                                            <div className="h-7 w-7 rounded-full bg-[#151922] flex items-center justify-center">
                                                                <span className="text-[10px] font-bold text-white/70">{Math.round(status === 'completed' ? 100 : percent)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Locked Overlay */}
                                            {status === 'locked' && (
                                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />
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
