import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InstallProvider } from './contexts/InstallContext';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';
import FeedbackButton from './components/FeedbackButton';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import WorkoutExecution from './pages/WorkoutExecution';
import WorkoutPlan from './pages/WorkoutPlan';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import Evolution from './pages/Evolution';

function App() {
  return (
    <Router>
      <InstallProvider>
        <AuthProvider>
          <InstallPrompt />
          <FeedbackButton />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout"
              element={
                <ProtectedRoute>
                  <WorkoutExecution />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <WorkoutPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evolution"
              element={
                <ProtectedRoute>
                  <Evolution />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </InstallProvider>
    </Router>
  );
}

export default App;
