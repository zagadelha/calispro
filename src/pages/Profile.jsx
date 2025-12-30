import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutPlan } from '../utils/workoutGenerator';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

    const handleDeleteHistory = async () => {
        const confirm1 = confirm('⚠️ ATENÇÃO: Isso irá apagar TODO o seu histórico de treinos, recordes e evolução. Esta ação NÃO pode ser desfeita e você perderá todo o seu progresso.');
        if (!confirm1) return;

        const confirm2 = confirm('Você tem CERTEZA absoluta? Todos os seus dados de progresso sumirão para sempre.');
        if (!confirm2) return;

        try {
            setLoading(true);
            const userId = currentUser.uid;

            console.log('[DeleteHistory] Iniciando limpeza total para:', userId);

            // 1. Buscar documentos - Cada um em seu próprio try/catch para não travar o processo todo
            let historySnap = { docs: [], size: 0 };
            let plansSnap = { docs: [], size: 0 };
            let workoutsSnapshot = { docs: [], size: 0 };

            try {
                const historyQ = query(collection(db, 'history'), where('user_id', '==', userId));
                console.log('[DeleteHistory] Buscando History...');
                historySnap = await getDocs(historyQ);
            } catch (e) {
                console.warn('[DeleteHistory] Falha ao buscar History:', e.message);
            }

            try {
                const plansQ = query(collection(db, 'plans'), where('user_id', '==', userId));
                console.log('[DeleteHistory] Buscando Plans...');
                plansSnap = await getDocs(plansQ);
            } catch (e) {
                console.warn('[DeleteHistory] Falha ao buscar Plans:', e.message);
            }

            try {
                const workoutsQ = query(collection(db, 'workouts'), where('user_id', '==', userId));
                console.log('[DeleteHistory] Buscando Workouts...');
                workoutsSnapshot = await getDocs(workoutsQ);
            } catch (e) {
                console.error('[DeleteHistory] Erro Crítico ao buscar Workouts:', e.message);
                throw e;
            }

            console.log(`[DeleteHistory] Documentos encontrados: History(${historySnap.size}), Plans(${plansSnap.size}), Workouts(${workoutsSnapshot.size})`);

            let batch = writeBatch(db);
            let count = 0;

            const commitBatch = async () => {
                if (count > 0) {
                    console.log(`[DeleteHistory] Commitando lote de ${count} operações...`);
                    await batch.commit();
                    batch = writeBatch(db);
                    count = 0;
                }
            };

            // Deletar Histórico (Progressões e Recordes)
            for (const docSnap of historySnap.docs) {
                batch.delete(docSnap.ref);
                count++;
                if (count >= 500) await commitBatch();
            }

            // Deletar Planos
            for (const docSnap of plansSnap.docs) {
                batch.delete(docSnap.ref);
                count++;
                if (count >= 500) await commitBatch();
            }

            // Deletar Exercícios de Treinos e os próprios Treinos
            for (const workoutDoc of workoutsSnapshot.docs) {
                console.log(`[DeleteHistory] Deletando treino: ${workoutDoc.id} (${workoutDoc.data().status})`);

                // Buscar exercícios deste treino específico
                const exQ = query(collection(db, 'workout_exercises'), where('workout_id', '==', workoutDoc.id));
                const exSnap = await getDocs(exQ);

                for (const exDoc of exSnap.docs) {
                    batch.delete(exDoc.ref);
                    count++;
                    if (count >= 500) await commitBatch();
                }

                batch.delete(workoutDoc.ref);
                count++;
                if (count >= 500) await commitBatch();
            }

            // Resetar perfil do usuário (campos de plano)
            const userRef = doc(db, 'users', userId);
            batch.update(userRef, {
                current_plan_id: null,
                last_workout_date: null,
                experience_level: null, // Resetar também para forçar novo onboarding/perfil se necessário
                goal: null
            });
            count++;

            await commitBatch();

            console.log('[DeleteHistory] Limpeza concluída com sucesso!');
            alert('Histórico e progresso apagados com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            console.error('[DeleteHistory] Erro Crítico:', err);
            alert('Ocorreu um erro ao apagar seu histórico. Detalhes: ' + err.message);
        } finally {
            setLoading(false);
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
                                        className="btn btn-secondary btn-full mb-md"
                                        disabled={loading}
                                    >
                                        🔄 Recalcular Plano de Treino
                                    </button>
                                    <button
                                        onClick={handleDeleteHistory}
                                        className="btn btn-error btn-full"
                                        disabled={loading}
                                    >
                                        🗑️ Apagar Histórico de Treino
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
