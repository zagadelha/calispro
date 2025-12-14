import React from 'react';
import { useInstall } from '../contexts/InstallContext';

const InstallButton = ({ className = '', children }) => {
    const { isInstallable, promptInstall } = useInstall();

    if (!isInstallable) return null;

    return (
        <button
            onClick={promptInstall}
            className={`btn btn-primary ${className}`}
        >
            {children || (
                <>
                    <span className="btn-icon">⬇️</span>
                    <span className="btn-text">Instalar App</span>
                </>
            )}
        </button>
    );
};

export default InstallButton;
