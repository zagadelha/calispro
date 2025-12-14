import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutPlan } from '../utils/workoutGenerator';

const Onboarding = () => {
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
            <div className="container container-sm">
                <div className="card animate-fadeIn">
                    <div className="onboarding-header mb-xl">
                        <h2 className="text-center gradient-text">Configure seu Perfil</h2>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                        <p className="text-center text-secondary text-sm mt-md">
                            Passo {step} de 3
                        </p>
                    </div>

                    {/* Step 1: Experience & Goal */}
                    {step === 1 && (
                        <div className="onboarding-step animate-fadeIn">
                            <h3 className="mb-lg">Qual seu nível e objetivo?</h3>

                            <div className="form-group">
                                <label className="form-label">Nível de Experiência</label>
                                <div className="option-grid">
                                    {['Iniciante', 'Intermediário', 'Avançado'].map(level => (
                                        <button
                                            key={level}
                                            type="button"
                                            className={`option-card ${formData.experience_level === level ? 'active' : ''}`}
                                            onClick={() => handleChange('experience_level', level)}
                                        >
                                            <div className="option-icon">
                                                {level === 'Iniciante' && '🌱'}
                                                {level === 'Intermediário' && '💪'}
                                                {level === 'Avançado' && '🔥'}
                                            </div>
                                            <div className="option-label">{level}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Objetivo Principal</label>
                                <div className="option-grid">
                                    {[
                                        { value: 'Ganhar força', icon: '💪' },
                                        { value: 'Hipertrofia', icon: '🏋️' },
                                        { value: 'Definição', icon: '✨' },
                                        { value: 'Manutenção', icon: '⚖️' }
                                    ].map(goal => (
                                        <button
                                            key={goal.value}
                                            type="button"
                                            className={`option-card ${formData.goal === goal.value ? 'active' : ''}`}
                                            onClick={() => handleChange('goal', goal.value)}
                                        >
                                            <div className="option-icon">{goal.icon}</div>
                                            <div className="option-label">{goal.value}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Frequency & Equipment */}
                    {step === 2 && (
                        <div className="onboarding-step animate-fadeIn">
                            <h3 className="mb-lg">Frequência e Equipamentos</h3>

                            <div className="form-group">
                                <label className="form-label">Quantas vezes por semana?</label>
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
                                <label className="form-label">Equipamentos Disponíveis</label>
                                <div className="checkbox-grid">
                                    {[
                                        'Peso corporal',
                                        'Barra fixa',
                                        'Paralelas',
                                        'Elásticos'
                                    ].map(equipment => (
                                        <label key={equipment} className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.equipment.includes(equipment)}
                                                onChange={() => handleEquipmentToggle(equipment)}
                                            />
                                            <span>{equipment}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Limitations */}
                    {step === 3 && (
                        <div className="onboarding-step animate-fadeIn">
                            <h3 className="mb-lg">Alguma restrição física?</h3>

                            <div className="form-group">
                                <label className="form-label">
                                    Restrições ou Lesões (opcional)
                                </label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Ex: dor no ombro direito, problema no joelho..."
                                    value={formData.limitations}
                                    onChange={(e) => handleChange('limitations', e.target.value)}
                                    rows={5}
                                />
                                <p className="text-sm text-muted mt-sm">
                                    Isso nos ajuda a personalizar seu treino e evitar exercícios inadequados
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
                                Voltar
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
                                Próximo
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading || !canProceed()}
                                style={{ marginLeft: 'auto' }}
                            >
                                {loading ? 'Criando plano...' : 'Finalizar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
