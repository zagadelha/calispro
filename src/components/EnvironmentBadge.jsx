import React from 'react';

/**
 * Componente que mostra um indicador visual do ambiente atual.
 * Apenas visível em ambientes de desenvolvimento.
 */
const EnvironmentBadge = () => {
    const env = import.meta.env.VITE_APP_ENV || 'unknown';
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'unknown';
    const isDev = import.meta.env.DEV;

    // Só mostra em desenvolvimento
    if (!isDev) return null;

    const isDevProject = projectId.includes('-dev') || projectId.includes('dev');

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '80px',
                left: '10px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 9999,
                backgroundColor: isDevProject ? '#22c55e' : '#ef4444',
                color: 'white',
                opacity: 0.8,
                pointerEvents: 'none',
                fontFamily: 'monospace'
            }}
        >
            {isDevProject ? '🔧 DEV DB' : '⚠️ PROD DB'}
            <br />
            <span style={{ fontSize: '8px', opacity: 0.8 }}>
                {projectId}
            </span>
        </div>
    );
};

export default EnvironmentBadge;
