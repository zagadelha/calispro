import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight, ChevronLeft, Home, BarChart2, TrendingUp, User, Dumbbell, CheckCircle } from 'lucide-react';
import './Tutorial.css';

const Tutorial = ({ onClose, autoShow = false, userId = null }) => {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const tutorialSteps = [
        {
            icon: Home,
            title: t('tutorial.welcome.title'),
            description: t('tutorial.welcome.description'),
            image: 'dashboard',
            highlights: [
                t('tutorial.welcome.highlight1'),
                t('tutorial.welcome.highlight2'),
                t('tutorial.welcome.highlight3')
            ]
        },
        {
            icon: Dumbbell,
            title: t('tutorial.workout.title'),
            description: t('tutorial.workout.description'),
            image: 'workout',
            highlights: [
                t('tutorial.workout.highlight1'),
                t('tutorial.workout.highlight2'),
                t('tutorial.workout.highlight3')
            ]
        },
        {
            icon: TrendingUp,
            title: t('tutorial.evolution.title'),
            description: t('tutorial.evolution.description'),
            image: 'evolution',
            highlights: [
                t('tutorial.evolution.highlight1'),
                t('tutorial.evolution.highlight2'),
                t('tutorial.evolution.highlight3')
            ]
        },
        {
            icon: BarChart2,
            title: t('tutorial.progress.title'),
            description: t('tutorial.progress.description'),
            image: 'progress',
            highlights: [
                t('tutorial.progress.highlight1'),
                t('tutorial.progress.highlight2'),
                t('tutorial.progress.highlight3')
            ]
        },
        {
            icon: User,
            title: t('tutorial.profile.title'),
            description: t('tutorial.profile.description'),
            image: 'profile',
            highlights: [
                t('tutorial.profile.highlight1'),
                t('tutorial.profile.highlight2'),
                t('tutorial.profile.highlight3')
            ]
        },
        {
            icon: CheckCircle,
            title: t('tutorial.finish.title'),
            description: t('tutorial.finish.description'),
            image: 'finish',
            highlights: [
                t('tutorial.finish.highlight1'),
                t('tutorial.finish.highlight2'),
                t('tutorial.finish.highlight3')
            ]
        }
    ];

    const handleClose = () => {
        if (dontShowAgain && autoShow && userId) {
            // Use user-specific key
            localStorage.setItem(`calispro_tutorial_completed_${userId}`, 'true');
            console.log('[Tutorial] Saved completion flag for user:', userId);
        }
        onClose();
    };

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = tutorialSteps[currentStep];
    const StepIcon = step.icon;
    const isLastStep = currentStep === tutorialSteps.length - 1;

    const tutorialContent = (
        <div className="tutorial-overlay">
            <div className="tutorial-modal animate-fadeIn">
                <button className="tutorial-close" onClick={handleClose} aria-label="Fechar">
                    <X size={24} />
                </button>

                <div className="tutorial-content">
                    {/* Header */}
                    <div className="tutorial-header">
                        <div className="tutorial-icon">
                            <StepIcon size={32} />
                        </div>
                        <h2>{step.title}</h2>
                        <p className="tutorial-step-indicator">
                            {t('tutorial.step_indicator', { current: currentStep + 1, total: tutorialSteps.length })}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="tutorial-body">
                        <div className="tutorial-image-placeholder">
                            <div className="tutorial-placeholder-content">
                                <StepIcon size={64} />
                                <span>{step.image}</span>
                            </div>
                        </div>

                        <p className="tutorial-description">{step.description}</p>

                        <div className="tutorial-highlights">
                            {step.highlights.map((highlight, index) => (
                                <div key={index} className="tutorial-highlight-item">
                                    <CheckCircle size={18} className="highlight-icon" />
                                    <span>{highlight}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="tutorial-footer">
                        {autoShow && (
                            <label className="tutorial-checkbox">
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                />
                                <span>{t('tutorial.dont_show_again')}</span>
                            </label>
                        )}

                        <div className="tutorial-buttons">
                            {currentStep > 0 && (
                                <button className="btn-secondary" onClick={handlePrevious}>
                                    <ChevronLeft size={20} />
                                    {t('common.back')}
                                </button>
                            )}

                            <button className="btn-primary" onClick={handleNext}>
                                {isLastStep ? t('common.finish') : t('common.next')}
                                {!isLastStep && <ChevronRight size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="tutorial-dots">
                        {tutorialSteps.map((_, index) => (
                            <button
                                key={index}
                                className={`tutorial-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(index)}
                                aria-label={`Ir para passo ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // Use Portal to render outside of parent hierarchy - this ensures z-index works correctly
    return ReactDOM.createPortal(tutorialContent, document.body);
};

export default Tutorial;
