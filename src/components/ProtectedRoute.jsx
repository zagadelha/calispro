import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
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

    // Se o usuário está logado mas não completou o perfil, redireciona para onboarding
    if (!userProfile.profile_completed) {
        return <Navigate to="/onboarding" />;
    }

    return children;
};

export default ProtectedRoute;

