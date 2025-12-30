import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, AlertCircle, Lightbulb, Bug, CheckCircle2, Circle, Clock, User, Filter } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

const FeedbackReport = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, bug, question, suggestion, contact
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const navigate = useNavigate();

    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, 'feedback'), orderBy('created_at', 'desc'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const fbList = [];
                querySnapshot.forEach((doc) => {
                    fbList.push({ id: doc.id, ...doc.data() });
                });
                setFeedbacks(fbList);
                setLoading(false);
            },
            (error) => {
                console.error("[FeedbackReport] Snapshot error:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'read' ? 'pending' : 'read';
            await updateDoc(doc(db, 'feedback', id), {
                status: newStatus
            });
            if (selectedFeedback && selectedFeedback.id === id) {
                setSelectedFeedback(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'bug': return <Bug size={18} className="text-red-400" />;
            case 'suggestion': return <Lightbulb size={18} className="text-amber-400" />;
            case 'question': return <AlertCircle size={18} className="text-blue-400" />;
            case 'contact': return <Mail size={18} className="text-green-400" />;
            default: return <MessageSquare size={18} className="text-gray-400" />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'bug': return 'Erro';
            case 'suggestion': return 'Sugestão';
            case 'question': return 'Dúvida';
            case 'contact': return 'Contato';
            default: return 'Geral';
        }
    };

    const filteredFeedbacks = feedbacks.filter(fb => {
        if (filter === 'all') return true;
        if (filter === 'unread') return fb.status !== 'read';
        return fb.type === filter;
    });

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return format(date, "dd MMM, HH:mm", { locale: ptBR });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="feedback-report-page">
            <header className="page-header">
                <div className="container flex items-center justify-between">
                    <div className="flex items-center gap-md">
                        <button onClick={() => navigate('/admin')} className="btn-back">
                            <ArrowLeft size={24} />
                        </button>
                        <h1>Feedbacks dos Usuários</h1>
                    </div>
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Todos
                        </button>
                        <button
                            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Não Lidos
                        </button>
                        <button
                            className={`filter-tab ${filter === 'bug' ? 'active' : ''}`}
                            onClick={() => setFilter('bug')}
                        >
                            Bugs
                        </button>
                    </div>
                </div>
            </header>

            <main className="container py-lg">
                <div className="inbox-container">
                    {/* List */}
                    <div className="inbox-list">
                        {loading ? (
                            <div className="loading-state">Carregando mensagens...</div>
                        ) : filteredFeedbacks.length === 0 ? (
                            <div className="empty-state">Nenhuma mensagem encontrada.</div>
                        ) : (
                            filteredFeedbacks.map((fb) => (
                                <div
                                    key={fb.id}
                                    className={`inbox-item ${selectedFeedback?.id === fb.id ? 'selected' : ''} ${fb.status === 'read' ? 'read' : 'unread'}`}
                                    onClick={() => setSelectedFeedback(fb)}
                                >
                                    <div className="inbox-item-header">
                                        <div className="type-badge">
                                            {getTypeIcon(fb.type)}
                                            <span>{getTypeLabel(fb.type)}</span>
                                        </div>
                                        <span className="date-text">{formatDate(fb.created_at)}</span>
                                    </div>
                                    <div className="inbox-item-user">
                                        <User size={14} />
                                        <span>{fb.user_name || 'Anônimo'}</span>
                                    </div>
                                    <p className="inbox-item-preview">{fb.message}</p>
                                    <div className="inbox-item-footer">
                                        <button
                                            className="mark-read-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(fb.id, fb.status);
                                            }}
                                            title={fb.status === 'read' ? 'Marcar como não lida' : 'Marcar como lida'}
                                        >
                                            {fb.status === 'read' ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Content Detail */}
                    <div className="inbox-content">
                        {selectedFeedback ? (
                            <div className="feedback-detail">
                                <div className="detail-header">
                                    <div className="flex items-center justify-between mb-md">
                                        <div className="type-badge-large">
                                            {getTypeIcon(selectedFeedback.type)}
                                            <span>{getTypeLabel(selectedFeedback.type)}</span>
                                        </div>
                                        <button
                                            className={`btn-action ${selectedFeedback.status === 'read' ? 'read' : ''}`}
                                            onClick={() => markAsRead(selectedFeedback.id, selectedFeedback.status)}
                                        >
                                            {selectedFeedback.status === 'read' ? 'Marcar como não lido' : 'Marcar como lido'}
                                        </button>
                                    </div>
                                    <h2>De: {selectedFeedback.user_name || 'Usuário Anônimo'}</h2>
                                    <div className="user-meta">
                                        <div className="meta-item"><Mail size={14} /> {selectedFeedback.user_email || 'N/A'}</div>
                                        <div className="meta-item"><Clock size={14} /> {formatDate(selectedFeedback.created_at)}</div>
                                        <div className="meta-item">ID: {selectedFeedback.user_id}</div>
                                    </div>
                                </div>
                                <div className="detail-body">
                                    <p>{selectedFeedback.message}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="no-selection">
                                <MessageSquare size={48} />
                                <p>Selecione uma mensagem para ler o conteúdo completo</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .feedback-report-page {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background-color: var(--bg-color, #0f172a);
                    color: white;
                    overflow: hidden;
                }
                .page-header {
                    background: rgba(30, 41, 59, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 1rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    flex-shrink: 0;
                }
                .filter-tabs {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(0,0,0,0.2);
                    padding: 0.25rem;
                    border-radius: 8px;
                }
                .filter-tab {
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: none;
                    background: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                .filter-tab.active {
                    background: #3b82f6;
                    color: white;
                }
                .inbox-container {
                    display: flex;
                    gap: 1.5rem;
                    height: calc(100vh - 120px);
                    padding-bottom: 1rem;
                }
                .inbox-list {
                    width: 380px;
                    background: #1e293b;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .inbox-item {
                    padding: 1.25rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: background 0.2s;
                    position: relative;
                }
                .inbox-item:hover {
                    background: rgba(255,255,255,0.03);
                }
                .inbox-item.selected {
                    background: rgba(59, 130, 246, 0.1);
                    border-left: 4px solid #3b82f6;
                }
                .inbox-item.unread::before {
                    content: '';
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 8px;
                    height: 8px;
                    background: #3b82f6;
                    border-radius: 50%;
                }
                .inbox-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .type-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #94a3b8;
                }
                .date-text {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .inbox-item-user {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 0.4rem;
                }
                .inbox-item-preview {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    margin: 0;
                }
                .inbox-item-footer {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 0.5rem;
                }
                .mark-read-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 2px;
                }
                .inbox-content {
                    flex: 1;
                    background: #1e293b;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }
                .no-selection {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #64748b;
                    text-align: center;
                    padding: 2rem;
                }
                .no-selection p { margin-top: 1rem; }
                .feedback-detail {
                    padding: 2rem;
                }
                .detail-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .type-badge-large {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #94a3b8;
                }
                .user-meta {
                    margin-top: 1rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                }
                .detail-body {
                    line-height: 1.6;
                    font-size: 1.1rem;
                    color: #e2e8f0;
                    white-space: pre-wrap;
                }
                .btn-action {
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                .btn-action:hover {
                    background: #3b82f6;
                    color: white;
                }
                .btn-action.read {
                    border-color: #64748b;
                    background: rgba(100, 116, 139, 0.1);
                    color: #64748b;
                }
                .loading-state, .empty-state {
                    padding: 3rem;
                    text-align: center;
                    color: #64748b;
                }
                @media (max-width: 768px) {
                    .inbox-list { width: 100%; }
                    .inbox-content { display: none; }
                    .inbox-list.has-selection { display: none; }
                    .inbox-content.has-selection { display: flex; }
                }
                ` }} />
        </div>
    );
};

export default FeedbackReport;
