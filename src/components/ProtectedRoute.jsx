import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { currentUser, userProfile, loading } = useAuth();

    // Aguarda o carregamento da autenticação
    if (loading) {
        return null; // ou um componente de loading
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Se o usuário está logado mas o perfil ainda não carregou,
    // aguarda (isso é raro, mas pode acontecer)
    if (userProfile === null) {
        return null; // ou um componente de loading
    }

    // Se a rota é exclusiva para admin e o usuário não é admin
    if (adminOnly && userProfile.is_admin !== true) {
        return <Navigate to="/dashboard" />;
    }

    // Se o usuário está logado mas não completou o perfil e não é admin
    // (admins podem pular onboarding para manutenção)
    if (!userProfile.profile_completed && !userProfile.is_admin) {
        return <Navigate to="/onboarding" />;
    }

    return children;
};

export default ProtectedRoute;

