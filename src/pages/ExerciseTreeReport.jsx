import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronDown, CheckCircle, Circle, Lock, Award, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserHistory } from '../utils/historyManager';
import { checkMastery, formatSkillName } from '../utils/progressionSystem';
import exercisesData from '../assets/exercises/exercises_v1_1.json';

const ExerciseTreeReport = () => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState({});
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const exercises = exercisesData.exercises;
    const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));

    useEffect(() => {
        const loadHistory = async () => {
            if (currentUser) {
                const h = await getUserHistory(currentUser.uid);
                setHistory(h);
            }
            setLoading(false);
        };
        loadHistory();
    }, [currentUser]);

    const toggleNode = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const toggleAll = (type) => {
        const isAllExpanded = Array.from(expandedNodes).some(id => id.startsWith(`${type}-`));
        const newExpanded = new Set(expandedNodes);

        if (isAllExpanded) {
            // Collapse all of this type
            Array.from(newExpanded).forEach(id => {
                if (id.startsWith(`${type}-`)) {
                    newExpanded.delete(id);
                }
            });
        } else {
            // Expand all of this type
            exercises.forEach(ex => {
                if (type === 'pattern') {
                    const children = ex.progresses_to || [];
                    if (children.length > 0) {
                        newExpanded.add(`pattern-${ex.id}`);
                    }
                } else if (type === 'skill' && ex.skill) {
                    const children = exercises.filter(c =>
                        c.skill === ex.skill &&
                        c.prerequisites &&
                        c.prerequisites.includes(ex.id)
                    );
                    if (children.length > 0) {
                        newExpanded.add(`skill-${ex.id}`);
                    }
                }
            });
        }
        setExpandedNodes(newExpanded);
    };

    const isTypeExpanded = (type) => {
        return Array.from(expandedNodes).some(id => id.startsWith(`${type}-`));
    };

    const getStatus = (exId) => {
        const ex = exerciseMap.get(exId);
        if (!ex) return 'locked';

        const stats = history[exId];
        const mastered = stats && checkMastery(ex, stats);

        const prereqs = ex.prerequisites || [];
        const allPrereqsMastered = prereqs.every(pId => {
            const pEx = exerciseMap.get(pId);
            const pStats = history[pId];
            return pEx && pStats && checkMastery(pEx, pStats);
        });

        if (mastered) {
            return allPrereqsMastered ? 'mastered' : 'skipped';
        }

        return allPrereqsMastered ? 'available' : 'locked';
    };

    const renderTreeNode = (exId, level = 0, type = 'pattern') => {
        const ex = exerciseMap.get(exId);
        if (!ex) return null;

        const status = getStatus(exId);
        const isExpanded = expandedNodes.has(`${type}-${exId}`);

        // Children logic
        let children = [];
        if (type === 'pattern') {
            children = ex.progresses_to || [];
        } else {
            // Skill tree finds children based on prerequisites within the same skill
            children = exercises
                .filter(c => c.skill === ex.skill && c.prerequisites && c.prerequisites.includes(exId))
                .map(c => c.id);
        }

        const hasChildren = children.length > 0;

        return (
            <div key={`${type}-${exId}`} className="tree-node-wrapper">
                <div
                    className={`tree-node level-${level} status-${status} ${hasChildren ? 'has-children' : ''}`}
                    onClick={() => hasChildren && toggleNode(`${type}-${exId}`)}
                >
                    <div className="node-content">
                        <div className="status-icon">
                            {status === 'mastered' ? <CheckCircle className="text-green-400" size={18} /> :
                                status === 'skipped' ? <AlertTriangle className="text-amber-500" size={18} /> :
                                    status === 'available' ? <Circle className="text-blue-400" size={18} /> :
                                        <Lock className="text-gray-600" size={18} />}
                        </div>

                        <div className="node-info">
                            <div className="flex items-center gap-xs">
                                <span className="node-name">{ex.name}</span>
                                {status === 'skipped' && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                        Salto
                                    </span>
                                )}
                            </div>
                            <span className="node-meta">
                                Diff: {ex.difficulty_score}
                                {history[exId]?.history?.length > 0 && ` • Logged: ${history[exId].history.length}`}
                                {status === 'skipped' && ` • ⚠️ Pré-requisitos não dominados`}
                            </span>
                        </div>

                        {hasChildren && (
                            <div className="expand-icon">
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="node-children">
                        {children.map(childId => renderTreeNode(childId, level + 1, type))}
                    </div>
                )}
            </div>
        );
    };

    const renderPatternTrees = () => {
        const patterns = [...new Set(exercises.map(ex => ex.pattern))];
        return patterns.map(pattern => {
            const roots = exercises.filter(ex =>
                ex.pattern === pattern &&
                (!ex.prerequisites || ex.prerequisites.length === 0 || ex.prerequisites.every(pId => !exerciseMap.has(pId)))
            ).sort((a, b) => a.difficulty_score - b.difficulty_score);

            if (roots.length === 0) return null;

            return (
                <div key={pattern} className="tree-section">
                    <h3 className="section-title">
                        <Zap size={18} className="mr-2 text-primary" />
                        {pattern.toUpperCase()}
                    </h3>
                    <div className="tree-container">
                        {roots.map(root => renderTreeNode(root.id, 0, 'pattern'))}
                    </div>
                </div>
            );
        });
    };

    const renderSkillTrees = () => {
        const skills = [...new Set(exercises.map(ex => ex.skill).filter(Boolean))];
        return skills.map(skill => {
            const roots = exercises.filter(ex =>
                ex.skill === skill &&
                (!ex.prerequisites || ex.prerequisites.length === 0 || ex.prerequisites.every(pId => {
                    const pEx = exerciseMap.get(pId);
                    return !pEx || pEx.skill !== skill;
                }))
            ).sort((a, b) => a.difficulty_score - b.difficulty_score);

            if (roots.length === 0) return null;

            return (
                <div key={skill} className="tree-section">
                    <h3 className="section-title">
                        <Award size={18} className="mr-2 text-primary" />
                        {formatSkillName(skill)}
                    </h3>
                    <div className="tree-container">
                        {roots.map(root => renderTreeNode(root.id, 0, 'skill'))}
                    </div>
                </div>
            );
        });
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="test-reports-page">
            <header className="page-header">
                <div className="container flex items-center gap-md">
                    <button onClick={() => navigate('/admin')} className="btn-back">
                        <ArrowLeft size={24} />
                    </button>
                    <h1>Relatórios de Teste</h1>
                </div>
            </header>

            <main className="container py-xl">
                <div className="admin-notice mb-xl">
                    <p>Esta tela é visível apenas em ambiente de desenvolvimento.</p>
                </div>

                <div className="reports-grid">
                    <section className="report-card">
                        <div className="report-header">
                            <h2 className="report-title">Árvore de Exercícios (Padrões)</h2>
                            <button
                                onClick={() => toggleAll('pattern')}
                                className="btn-toggle-all"
                            >
                                {isTypeExpanded('pattern') ? 'Recolher Tudo' : 'Expandir Tudo'}
                            </button>
                        </div>
                        <div className="trees-wrapper">
                            {renderPatternTrees()}
                        </div>
                    </section>

                    <section className="report-card">
                        <div className="report-header">
                            <h2 className="report-title">Árvore de Habilidades</h2>
                            <button
                                onClick={() => toggleAll('skill')}
                                className="btn-toggle-all"
                            >
                                {isTypeExpanded('skill') ? 'Recolher Tudo' : 'Expandir Tudo'}
                            </button>
                        </div>
                        <div className="trees-wrapper">
                            {renderSkillTrees()}
                        </div>
                    </section>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .test-reports-page {
                    min-height: 100vh;
                    background-color: var(--bg-color, #0f172a);
                    color: white;
                }
                .page-header {
                    background: rgba(30, 41, 59, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 1rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .btn-back {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .btn-back:hover {
                    background: rgba(255,255,255,0.1);
                }
                .btn-toggle-all {
                    background: var(--primary-color, #3b82f6);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-toggle-all:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                .btn-toggle-all:active {
                    transform: translateY(0);
                }
                .admin-notice {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                    color: #93c5fd;
                    font-size: 0.9rem;
                }
                .reports-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }
                @media (max-width: 1024px) {
                    .reports-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .report-card {
                    background: #1e293b;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .report-title {
                    font-size: 1.25rem;
                    margin-bottom: 0;
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .tree-section {
                    margin-bottom: 2rem;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #94a3b8;
                    margin-bottom: 1rem;
                }
                .tree-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .tree-node-wrapper {
                    display: flex;
                    flex-direction: column;
                }
                .tree-node {
                    padding: 0.75rem;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.03);
                    cursor: default;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .tree-node.has-children {
                    cursor: pointer;
                }
                .tree-node.has-children:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.1);
                }
                .tree-node.status-mastered {
                    background: rgba(34, 197, 94, 0.05);
                    border-left: 3px solid #22c55e;
                }
                .tree-node.status-available {
                    background: rgba(59, 130, 246, 0.05);
                    border-left: 3px solid #3b82f6;
                }
                .tree-node.status-skipped {
                    background: rgba(245, 158, 11, 0.05);
                    border-left: 3px solid #f59e0b;
                }
                .tree-node.status-locked {
                    opacity: 0.6;
                }
                .node-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .node-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .node-name {
                    font-size: 0.95rem;
                    font-weight: 500;
                }
                .node-meta {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .node-children {
                    margin-left: 1.25rem;
                    padding-left: 1rem;
                    border-left: 1px dashed rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .level-1 { margin-left: 0; }
                .loading-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                ` }} />
        </div>
    );
};

export default ExerciseTreeReport;
