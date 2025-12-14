import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, userProfile } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // If user hasn't completed profile, redirect to onboarding
    if (userProfile && !userProfile.profile_completed) {
        return <Navigate to="/onboarding" />;
    }

    return children;
};

export default ProtectedRoute;
