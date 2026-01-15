import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import { generateWorkoutPlan } from '../utils/workoutGenerator';

const Onboarding = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        experience_level: '',
        goal: '',
        days_per_week: '',
        equipment: [],
        limitations: ''
    });
    const [loading, setLoading] = useState(false);
    const { currentUser, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEquipmentToggle = (equipment) => {
        setFormData(prev => ({
            ...prev,
            equipment: prev.equipment.includes(equipment)
                ? prev.equipment.filter(e => e !== equipment)
                : [...prev.equipment, equipment]
        }));
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Update user profile
            await updateUserProfile(currentUser.uid, {
                ...formData,
                profile_completed: true
            });

            // Generate initial workout plan
            await generateWorkoutPlan(currentUser.uid, formData);

            navigate('/dashboard');
        } catch (err) {
            console.error('Error completing onboarding:', err);
            alert('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return formData.experience_level && formData.goal;
        if (step === 2) return formData.days_per_week && formData.equipment.length > 0;
        return true;
    };

    return (
        <div className="onboarding-container">
            <LanguageSelector floating />
            <div className="container container-sm">
                <div className="card animate-fadeIn">
                    <div className="onboarding-header mb-xl">
                        <h2 className="text-center gradient-text">{t('onboarding.setup_profile')}</h2>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                        <p className="text-center text-secondary text-sm mt-md">
                            {t('onboarding.step_of', { step })}
                        </p>
                    </div>

                    {/* Step 1: Experience & Goal */}
                    {step === 1 && (
                        <div className="onboarding-step animate-fadeIn">
                            <h3 className="mb-lg">{t('onboarding.step1_title')}</h3>

                            <div className="form-group">
                                <label className="form-label">{t('onboarding.experience_level')}</label>
                                <div className="option-grid">
                                    {[
                                        { id: 'Iniciante', label: t('common.beginner'), icon: '🌱' },
                                        { id: 'Intermediário', label: t('common.intermediate'), icon: '💪' },
                                        { id: 'Avançado', label: t('common.advanced'), icon: '🔥' }
                                    ].map(level => (
                                        <button
                                            key={level.id}
                                            type="button"
                                            className={`option-card ${formData.experience_level === level.id ? 'active' : ''}`}
                                            onClick={() => handleChange('experience_level', level.id)}
                                        >
                                            <div className="option-icon">{level.icon}</div>
                                            <div className="option-label">{level.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('onboarding.main_goal')}</label>
                                <div className="option-grid">
                                    {[
                                        { value: 'Ganhar força', label: t('onboarding.goals.strength'), icon: '💪' },
                                        { value: 'Hipertrofia', label: t('onboarding.goals.hypertrophy'), icon: '🏋️' },
                                        { value: 'Definição', label: t('onboarding.goals.definition'), icon: '✨' },
                                        { value: 'Manutenção', label: t('onboarding.goals.maintenance'), icon: '⚖️' }
                                    ].map(goal => (
                                        <button
                                            key={goal.value}
                                            type="button"
                                            className={`option-card ${formData.goal === goal.value ? 'active' : ''}`}
                                            onClick={() => handleChange('goal', goal.value)}
                                        >
                                            <div className="option-icon">{goal.icon}</div>
                                            <div className="option-label">{goal.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Frequency & Equipment */}
                    {step === 2 && (
                        <div className="onboarding-step animate-fadeIn">
                            <h3 className="mb-lg">{t('onboarding.step2_title')}</h3>

                            <div className="form-group">
                                <label className="form-label">{t('onboarding.times_per_week')}</label>
                                <div className="option-grid grid-4">
                                    {['2x', '3x', '4x', '5x+'].map(freq => (
                                        <button
                                            key={freq}
                                            type="button"
                                            className={`option-card ${formData.days_per_week === freq ? 'active' : ''}`}
                                            onClick={() => handleChange('days_per_week', freq)}
                                        >
                                            <div className="option-label">{freq}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('onboarding.available_equipment')}</label>
                                <div className="checkbox-grid">
                                    {[
                                        { id: 'Peso corporal', label: t('onboarding.equipment_list.bodyweight') },
                                        { id: 'Barra fixa', label: t('onboarding.equipment_list.pullup_bar') },
                                        { id: 'Paralelas', label: t('onboarding.equipment_list.dip_bars') },
                                        { id: 'Elásticos', label: t('onboarding.equipment_list.bands') }
                                    ].map(item => (
                                        <label key={item.id} className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.equipment.includes(item.id)}
                                                onChange={() => handleEquipmentToggle(item.id)}
                                            />
                                            <span>{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Limitations */}
                    {step === 3 && (
                        <div className="onboarding-step animate-fadeIn">
                            <h3 className="mb-lg">{t('onboarding.step3_title')}</h3>

                            <div className="form-group">
                                <label className="form-label">
                                    {t('onboarding.limitations_label')}
                                </label>
                                <textarea
                                    className="form-textarea"
                                    placeholder={t('onboarding.limitations_placeholder')}
                                    value={formData.limitations}
                                    onChange={(e) => handleChange('limitations', e.target.value)}
                                    rows={5}
                                />
                                <p className="text-sm text-muted mt-sm">
                                    {t('onboarding.limitations_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="onboarding-actions flex justify-between gap-md mt-xl">
                        {step > 1 && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                {t('common.back')}
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={!canProceed()}
                                style={{ marginLeft: step === 1 ? 'auto' : '0' }}
                            >
                                {t('common.next')}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading || !canProceed()}
                                style={{ marginLeft: 'auto' }}
                            >
                                {loading ? t('onboarding.creating_plan') : t('common.finish')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Onboarding;
