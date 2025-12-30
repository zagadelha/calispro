import React, { useState } from 'react';
import { MessageCircle, X, Send, Bug, Lightbulb, HelpCircle, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getVirtualNow } from '../utils/timeTravel';

const FeedbackButton = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { currentUser, userProfile } = useAuth();

    // Don't show on landing, login, or signup pages
    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
        return null;
    }

    const feedbackTypes = [
        { id: 'bug', label: 'Reportar Erro', icon: Bug, color: '#ef4444' },
        { id: 'question', label: 'Dúvida', icon: HelpCircle, color: '#3b82f6' },
        { id: 'suggestion', label: 'Sugestão', icon: Lightbulb, color: '#f59e0b' },
        { id: 'contact', label: 'Contato', icon: Mail, color: '#10b981' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!feedbackType || !message.trim()) {
            alert('Por favor, selecione um tipo e escreva sua mensagem.');
            return;
        }

        setLoading(true);

        try {
            // Save feedback to Firestore
            await addDoc(collection(db, 'feedback'), {
                user_id: currentUser?.uid || 'anonymous',
                user_email: currentUser?.email || 'N/A',
                user_name: userProfile?.name || 'Usuário Anônimo',
                type: feedbackType,
                message: message,
                created_at: getVirtualNow().toISOString(),
                status: 'pending'
            });

            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setFeedbackType('');
                setMessage('');
            }, 2000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Erro ao enviar feedback. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setFeedbackType('');
        setMessage('');
        setSubmitted(false);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="feedback-floating-btn"
                title="Enviar Feedback"
                aria-label="Enviar Feedback"
            >
                <MessageCircle size={24} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="feedback-modal-overlay" onClick={handleClose}>
                    <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="feedback-modal-header">
                            <h3 className="feedback-modal-title">
                                <MessageCircle size={24} />
                                Fale Conosco
                            </h3>
                            <button
                                onClick={handleClose}
                                className="feedback-close-btn"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {submitted ? (
                            // Success State
                            <div className="feedback-success">
                                <div className="feedback-success-icon">✓</div>
                                <h4>Obrigado!</h4>
                                <p>Sua mensagem foi enviada com sucesso.</p>
                            </div>
                        ) : (
                            // Form
                            <form onSubmit={handleSubmit} className="feedback-form">
                                {/* Type Selection */}
                                <div className="form-group">
                                    <label className="form-label">Como podemos ajudar?</label>
                                    <div className="feedback-type-grid">
                                        {feedbackTypes.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setFeedbackType(type.id)}
                                                    className={`feedback-type-card ${feedbackType === type.id ? 'active' : ''}`}
                                                    style={{
                                                        borderColor: feedbackType === type.id ? type.color : undefined
                                                    }}
                                                >
                                                    <Icon size={24} style={{ color: type.color }} />
                                                    <span>{type.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="form-group">
                                    <label className="form-label">Sua mensagem</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Descreva sua dúvida, bug, sugestão ou mensagem..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={5}
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-full"
                                    disabled={loading || !feedbackType || !message.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Enviar Mensagem
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackButton;
