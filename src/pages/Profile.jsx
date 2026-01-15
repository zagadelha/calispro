import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutPlan } from '../utils/workoutGenerator';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Header from '../components/Header';

const Profile = () => {
    const { t } = useTranslation();
    const { currentUser, userProfile, updateUserProfile, uploadProfilePhoto } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        experience_level: '',
        goal: '',
        days_per_week: '',
        equipment: [],
        limitations: ''
    });
    const navigate = useNavigate();

    // Sync formData when userProfile is loaded or updated
    useEffect(() => {
        console.log('[Profile] Syncing formData with userProfile:', userProfile?.email);
        if (userProfile && !editing) {
            // Map internal IDs back to labels if necessary
            const equipmentLabels = {
                'none': 'Peso corporal',
                'pull_up_bar': 'Barra fixa',
                'dip_bars': 'Paralelas',
                'resistance_bands': 'Elásticos'
            };

            const currentEquipment = Array.isArray(userProfile.equipment) ? userProfile.equipment : [];
            const mappedEquipment = currentEquipment.map(e => equipmentLabels[e] || e);

            setFormData({
                name: userProfile.name || '',
                experience_level: userProfile.experience_level || '',
                goal: userProfile.goal || '',
                days_per_week: userProfile.days_per_week || '',
                equipment: mappedEquipment,
                limitations: userProfile.limitations || ''
            });
        }
    }, [userProfile, editing]);

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
            alert(t('profile.success_update'));
        } catch (err) {
            console.error('Error updating profile:', err);
            alert(t('profile.error_update'));
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculatePlan = async () => {
        if (!confirm(t('profile.recalculate_confirm'))) {
            return;
        }

        try {
            setLoading(true);
            await generateWorkoutPlan(currentUser.uid, formData);
            alert(t('profile.plan_generated'));
            navigate('/dashboard');
        } catch (err) {
            console.error('Error generating plan:', err);
            alert(t('profile.error_update')); // Reusing error update for now
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert(t('profile.error_update')); // Better error needed in JSON
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(t('profile.error_update'));
            return;
        }

        try {
            setUploadingPhoto(true);
            await uploadProfilePhoto(currentUser.uid, file);
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert(t('profile.error_update'));
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleDeleteHistory = async () => {
        const confirm1 = confirm(t('profile.delete_confirm1'));
        if (!confirm1) return;

        const confirm2 = confirm(t('profile.delete_confirm2'));
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

            // Resetar perfil do usuário (campos de plano apenas)
            const userRef = doc(db, 'users', userId);
            batch.update(userRef, {
                current_plan_id: null,
                last_workout_date: null
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
            <Header />

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
                            <p className="text-secondary text-sm">
                                {userProfile?.email}
                                {currentUser?.email && userProfile?.email !== currentUser.email && (
                                    <span
                                        onClick={async () => {
                                            if (confirm('Sincronizar e-mail com sua conta de login?')) {
                                                await updateUserProfile(currentUser.uid, { email: currentUser.email });
                                            }
                                        }}
                                        style={{ marginLeft: '8px', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                    >
                                        (Corrigir)
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Profile Form */}
                        <div className="profile-form">
                            <div className="form-group">
                                <label className="form-label">{t('profile.name')}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    disabled={!editing}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('profile.experience')}</label>
                                {editing ? (
                                    <select
                                        className="form-select"
                                        value={formData.experience_level}
                                        onChange={(e) => handleChange('experience_level', e.target.value)}
                                    >
                                        <option value="">{t('profile.select')}</option>
                                        <option value="Iniciante">{t('common.beginner')}</option>
                                        <option value="Intermediário">{t('common.intermediate')}</option>
                                        <option value="Avançado">{t('common.advanced')}</option>
                                    </select>
                                ) : (
                                    <div className="form-value">
                                        {formData.experience_level === 'Iniciante' && t('common.beginner')}
                                        {formData.experience_level === 'Intermediário' && t('common.intermediate')}
                                        {formData.experience_level === 'Avançado' && t('common.advanced')}
                                        {!formData.experience_level && t('profile.none')}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('profile.goal')}</label>
                                {editing ? (
                                    <select
                                        className="form-select"
                                        value={formData.goal}
                                        onChange={(e) => handleChange('goal', e.target.value)}
                                    >
                                        <option value="">{t('profile.select')}</option>
                                        <option value="Ganhar força">{t('onboarding.goals.strength')}</option>
                                        <option value="Hipertrofia">{t('onboarding.goals.hypertrophy')}</option>
                                        <option value="Definição">{t('onboarding.goals.definition')}</option>
                                        <option value="Manutenção">{t('onboarding.goals.maintenance')}</option>
                                    </select>
                                ) : (
                                    <div className="form-value">
                                        {formData.goal === 'Ganhar força' && t('onboarding.goals.strength')}
                                        {formData.goal === 'Hipertrofia' && t('onboarding.goals.hypertrophy')}
                                        {formData.goal === 'Definição' && t('onboarding.goals.definition')}
                                        {formData.goal === 'Manutenção' && t('onboarding.goals.maintenance')}
                                        {!formData.goal && t('profile.none')}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('profile.frequency')}</label>
                                {editing ? (
                                    <select
                                        className="form-select"
                                        value={formData.days_per_week}
                                        onChange={(e) => handleChange('days_per_week', e.target.value)}
                                    >
                                        <option value="">{t('profile.select')}</option>
                                        <option value="2x">2x {t('profile.per_week')}</option>
                                        <option value="3x">3x {t('profile.per_week')}</option>
                                        <option value="4x">4x {t('profile.per_week')}</option>
                                        <option value="5x+">5x+ {t('profile.per_week')}</option>
                                    </select>
                                ) : (
                                    <div className="form-value">
                                        {formData.days_per_week ? `${formData.days_per_week} ${t('profile.per_week')}` : t('profile.none')}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('profile.equipment')}</label>
                                {editing ? (
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
                                ) : (
                                    <div className="form-value">
                                        {formData.equipment.map(e => {
                                            const labels = {
                                                'Peso corporal': t('onboarding.equipment_list.bodyweight'),
                                                'Barra fixa': t('onboarding.equipment_list.pullup_bar'),
                                                'Paralelas': t('onboarding.equipment_list.dip_bars'),
                                                'Elásticos': t('onboarding.equipment_list.bands'),
                                                'none': t('onboarding.equipment_list.bodyweight'),
                                                'pull_up_bar': t('onboarding.equipment_list.pullup_bar'),
                                                'dip_bars': t('onboarding.equipment_list.dip_bars'),
                                                'resistance_bands': t('onboarding.equipment_list.bands')
                                            };
                                            return labels[e] || e;
                                        }).join(', ') || t('profile.none')}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('profile.limitations')}</label>
                                {editing ? (
                                    <textarea
                                        className="form-textarea"
                                        value={formData.limitations}
                                        onChange={(e) => handleChange('limitations', e.target.value)}
                                        rows={4}
                                    />
                                ) : (
                                    <div className="form-value">
                                        {formData.limitations || t('profile.none')}
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
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="btn btn-primary flex-1"
                                        disabled={loading}
                                    >
                                        {loading ? t('common.loading') : t('common.save')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="btn btn-primary btn-full mb-md"
                                    >
                                        ✏️ {t('profile.edit_profile')}
                                    </button>
                                    <button
                                        onClick={handleRecalculatePlan}
                                        className="btn btn-secondary btn-full mb-md"
                                        disabled={loading}
                                    >
                                        🔄 {t('profile.recalculate')}
                                    </button>
                                    <button
                                        onClick={handleDeleteHistory}
                                        className="btn btn-error btn-full"
                                        disabled={loading}
                                    >
                                        🗑️ {t('profile.delete_history')}
                                    </button>

                                    <div className="mt-lg text-center">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="text-secondary text-xs btn-link"
                                        >
                                            🔄 {t('profile.force_refresh')}
                                        </button>
                                    </div>
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
