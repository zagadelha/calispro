import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateReadinessScore, getUserSkillStage, getAllSkills } from '../utils/progressionSystem';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import bgEvolution from '../assets/bg-evolution.png'; // Imported new background

import { getUserHistory } from '../utils/historyManager';
import { getVirtualDate } from '../utils/timeTravel';

const Evolution = () => {
    const [readiness, setReadiness] = useState(null);
    const [skillStages, setSkillStages] = useState([]);
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
            const skills = getAllSkills();
            const stages = skills.map(skill => {
                const stage = getUserSkillStage(skill, userHistory);
                if (!stage) return null;

                // Get most recent stats for display (PR)
                const stats = userHistory[stage.id] || { reps: 0, seconds: 0 };
                // If history exists, pick 'reps' from last entry? or max?
                // Logic above uses raw object. getUserHistory returns { history: [] }
                // We need to extract a simple { reps } object for the UI display if it expects it.
                // Let's verify what UI expects.
                // Line 86 original: const stats = mockHistory[stage.id] || { reps: 0, seconds: 0 };

                // We'll flatten the history to find PR (Personal Record)
                let displayStats = { reps: 0, seconds: 0 };
                if (stats.history && stats.history.length > 0) {
                    // Find max reps
                    const maxReps = Math.max(...stats.history.map(h => h.reps || 0));
                    const maxSecs = Math.max(...stats.history.map(h => h.seconds || 0));
                    displayStats = { reps: maxReps, seconds: maxSecs };
                }

                return { skill, stage, stats: displayStats };
            }).filter(s => s); // Filter out nulls

            setSkillStages(stages);

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
                        <h2>Evolução</h2>
                        <div style={{ width: '80px' }}></div>
                    </div>
                </div>
            </header>

            <main className="progress-main container">
                {/* Readiness Score Card */}
                <section className="mb-xl">
                    <div className="card text-center" style={{
                        background: `linear-gradient(135deg, rgba(30, 58, 95, 0.9), rgba(30, 58, 95, 0.7)), url(${bgEvolution})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}>
                        <h3 className="mb-sm text-primary">Nível de Preparação</h3>
                        <div className="flex items-center justify-center">
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%',
                                border: '8px solid var(--primary-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '3rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(5px)'
                            }}>
                                {readiness?.totalScore}
                            </div>
                        </div>
                        <p className="mt-md text-secondary">Seu nível de preparação atual</p>

                        {/* Breakdown Mini-Grid */}
                        <div className="grid grid-4 mt-lg gap-sm">
                            {Object.entries(readiness?.breakdown || {}).map(([key, val]) => {
                                const categoryMap = {
                                    push: 'Empurrar',
                                    pull: 'Puxar',
                                    legs: 'Pernas',
                                    core: 'Core',
                                    skills: 'Habilidade'
                                };
                                return (
                                    <div key={key} className="p-2 bg-tertiary rounded text-sm">
                                        <div className="font-bold capitalize">{categoryMap[key] || key}</div>
                                        <div className="text-primary">{val}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Skills Section */}
                <section>
                    <h3 className="mb-lg">Minhas Habilidades</h3>
                    <div className="grid grid-2">
                        {skillStages.map(({ skill, stage, stats }) => {
                            const isReps = stage.metric_type === 'reps';
                            const goal = isReps ? stage.default_prescription.reps_max : stage.default_prescription.seconds_max;
                            const current = isReps ? (stats.reps || 0) : (stats.seconds || 0);
                            const percent = Math.min(100, Math.max(0, (current / goal) * 100));
                            const missing = Math.max(0, goal - current);
                            const unit = isReps ? 'reps' : 's';

                            let message = `Faltam ${missing} ${unit}. Quase lá! 🔥`;
                            if (current >= goal) {
                                message = "Pronto para desbloquear! 🔓";
                            } else if (current === 0) {
                                message = "Comece agora para evoluir! 🚀";
                            }

                            return (
                                <div key={skill} className="card relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 text-9xl font-bold capitalize pointer-events-none">
                                        {skill.charAt(0)}
                                    </div>
                                    <h4 className="capitalize mb-sm relative z-10">{skill.replace('_', ' ')}</h4>
                                    <div className="mb-md relative z-10">
                                        <span className="text-secondary text-sm">Foco Atual:</span>
                                        <div className="text-xl font-bold text-primary mt-1">
                                            {stage.name}
                                        </div>
                                    </div>

                                    {/* Progress Bar / Next Milestone */}
                                    <div className="relative z-10">
                                        <div className="flex justify-between text-xs text-secondary mb-1">
                                            <span>
                                                PR: <span className="text-white font-bold">{current} {unit}</span>
                                            </span>
                                            <span>
                                                Meta: <span className="text-white font-bold">{goal} {unit}</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${current >= goal ? 'bg-green-500' : 'bg-primary'}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <p className={`text-xs mt-2 font-medium ${current >= goal ? 'text-green-400' : 'text-secondary'}`}>
                                            {message}
                                        </p>
                                    </div>
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
