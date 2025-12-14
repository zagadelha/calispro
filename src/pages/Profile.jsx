import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutPlan } from '../utils/workoutGenerator';

const Profile = () => {
    const { currentUser, userProfile, updateUserProfile, uploadProfilePhoto } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [formData, setFormData] = useState({
        name: userProfile?.name || '',
        experience_level: userProfile?.experience_level || '',
        goal: userProfile?.goal || '',
        days_per_week: userProfile?.days_per_week || '',
        equipment: userProfile?.equipment || [],
        limitations: userProfile?.limitations || ''
    });
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

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateUserProfile(currentUser.uid, formData);
            setEditing(false);
            alert('Perfil atualizado com sucesso!');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculatePlan = async () => {
        if (!confirm('Isso irá gerar um novo plano de treino. Deseja continuar?')) {
            return;
        }

        try {
            setLoading(true);
            await generateWorkoutPlan(currentUser.uid, formData);
            alert('Novo plano de treino gerado!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error generating plan:', err);
            alert('Erro ao gerar novo plano');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB');
            return;
        }

        try {
            setUploadingPhoto(true);
            await uploadProfilePhoto(currentUser.uid, file);
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Erro ao fazer upload da foto');
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <div className="profile-container">
            {/* Header */}
            <header className="profile-header">
                <div className="container">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-secondary btn-sm"
                        >
                            ← Voltar
                        </button>
                        <h2>Meu Perfil</h2>
                        <div style={{ width: '80px' }}></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="profile-main">
                <div className="container container-sm">
                    <div className="card">
                        {/* User Info */}
                        <div className="profile-avatar-section text-center mb-xl">
                            <div className="profile-avatar-wrapper">
                                {userProfile?.photoURL ? (
                                    <img
                                        src={userProfile.photoURL}
                                        alt="Profile"
                                        className="profile-avatar-image"
                                    />
                                ) : (
                                    <div className="profile-avatar">
                                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <label className="profile-avatar-upload" htmlFor="photo-upload">
                                    {uploadingPhoto ? (
                                        <div className="spinner-sm"></div>
                                    ) : (
                                        <span>📷</span>
                                    )}
                                </label>
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploadingPhoto}
                                />
                            </div>
                            <h3 className="mt-md">{userProfile?.name}</h3>
                            <p className="text-secondary text-sm">{userProfile?.email}</p>
                        </div>

                        {/* Profile Form */}
                        <div className="profile-form">
                            <div className="form-group">
                                <label className="form-label">Nome</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    disabled={!editing}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nível de Experiência</label>
                                {editing ? (
                                    <select
                                        className="form-select"
                                        value={formData.experience_level}
                                        onChange={(e) => handleChange('experience_level', e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Iniciante">Iniciante</option>
                                        <option value="Intermediário">Intermediário</option>
                                        <option value="Avançado">Avançado</option>
                                    </select>
                                ) : (
                                    <div className="form-value">{formData.experience_level}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Objetivo Principal</label>
                                {editing ? (
                                    <select
                                        className="form-select"
                                        value={formData.goal}
                                        onChange={(e) => handleChange('goal', e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Ganhar força">Ganhar força</option>
                                        <option value="Hipertrofia">Hipertrofia</option>
                                        <option value="Definição">Definição</option>
                                        <option value="Manutenção">Manutenção</option>
                                    </select>
                                ) : (
                                    <div className="form-value">{formData.goal}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Frequência Semanal</label>
                                {editing ? (
                                    <select
                                        className="form-select"
                                        value={formData.days_per_week}
                                        onChange={(e) => handleChange('days_per_week', e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="2x">2x por semana</option>
                                        <option value="3x">3x por semana</option>
                                        <option value="4x">4x por semana</option>
                                        <option value="5x+">5x+ por semana</option>
                                    </select>
                                ) : (
                                    <div className="form-value">{formData.days_per_week}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Equipamentos Disponíveis</label>
                                {editing ? (
                                    <div className="checkbox-grid">
                                        {['Peso corporal', 'Barra fixa', 'Paralelas', 'Elásticos'].map(equipment => (
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
                                ) : (
                                    <div className="form-value">
                                        {formData.equipment.join(', ') || 'Nenhum'}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Restrições Físicas</label>
                                {editing ? (
                                    <textarea
                                        className="form-textarea"
                                        value={formData.limitations}
                                        onChange={(e) => handleChange('limitations', e.target.value)}
                                        rows={4}
                                    />
                                ) : (
                                    <div className="form-value">
                                        {formData.limitations || 'Nenhuma'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions mt-xl">
                            {editing ? (
                                <div className="flex gap-md">
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({
                                                name: userProfile?.name || '',
                                                experience_level: userProfile?.experience_level || '',
                                                goal: userProfile?.goal || '',
                                                days_per_week: userProfile?.days_per_week || '',
                                                equipment: userProfile?.equipment || [],
                                                limitations: userProfile?.limitations || ''
                                            });
                                        }}
                                        className="btn btn-secondary flex-1"
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="btn btn-primary flex-1"
                                        disabled={loading}
                                    >
                                        {loading ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="btn btn-primary btn-full mb-md"
                                    >
                                        ✏️ Editar Perfil
                                    </button>
                                    <button
                                        onClick={handleRecalculatePlan}
                                        className="btn btn-secondary btn-full"
                                        disabled={loading}
                                    >
                                        🔄 Recalcular Plano de Treino
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
