import React, { useState } from 'react';
import { MessageCircle, X, Send, Bug, Lightbulb, HelpCircle, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs';
import { getVirtualNow } from '../utils/timeTravel';

const FeedbackButton = () => {
    const { t } = useTranslation();
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
        { id: 'bug', label: t('support.types.bug'), icon: Bug, color: '#ef4444' },
        { id: 'question', label: t('support.types.question'), icon: HelpCircle, color: '#3b82f6' },
        { id: 'suggestion', label: t('support.types.suggestion'), icon: Lightbulb, color: '#f59e0b' },
        { id: 'contact', label: t('support.types.contact'), icon: Mail, color: '#10b981' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!feedbackType || !message.trim()) {
            alert(t('support.errors.fill_all'));
            return;
        }

        setLoading(true);

        try {
            // Prepare email template parameters
            const templateParams = {
                user_id: currentUser?.uid || 'anonymous',
                user_email: currentUser?.email || 'N/A',
                user_name: userProfile?.name || t('common.athlete'),
                feedback_type: feedbackTypes.find(type => type.id === feedbackType)?.label || feedbackType,
                message: message,
                created_at: getVirtualNow().toISOString(),
                to_email: EMAILJS_CONFIG.recipientEmail
            };

            // Send email via EmailJS
            await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                templateParams,
                EMAILJS_CONFIG.publicKey
            );

            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setFeedbackType('');
                setMessage('');
            }, 2000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert(t('support.errors.submit_error'));
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
                title={t('support.button_title')}
                aria-label={t('support.button_title')}
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
                                {t('support.title')}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="feedback-close-btn"
                                aria-label={t('common.cancel')}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {submitted ? (
                            // Success State
                            <div className="feedback-success">
                                <div className="feedback-success-icon">✓</div>
                                <h4>{t('support.success.title')}</h4>
                                <p>{t('support.success.message')}</p>
                            </div>
                        ) : (
                            // Form
                            <form onSubmit={handleSubmit} className="feedback-form">
                                {/* Type Selection */}
                                <div className="form-group">
                                    <label className="form-label">{t('support.help_label')}</label>
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
                                    <label className="form-label">{t('support.message_label')}</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={t('support.placeholder')}
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
                                            {t('support.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            {t('support.submit')}
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
