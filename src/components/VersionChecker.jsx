import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Version is automatically injected from package.json during build
const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.2';
const VERSION_CHECK_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes
const VERSION_STORAGE_KEY = 'calispro_version_dismissed';

const VersionChecker = () => {
    const { t } = useTranslation();
    const [newVersionAvailable, setNewVersionAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState(null);
    const [isDismissed, setIsDismissed] = useState(false);

    const checkVersion = async () => {
        // Only check in production
        if (import.meta.env.DEV) {
            console.log('[VersionChecker] Skipping version check in development');
            return;
        }

        try {
            // Fetch the package.json from the production server
            // Add timestamp to prevent caching
            const response = await fetch(`/package.json?t=${Date.now()}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                console.warn('[VersionChecker] Failed to fetch package.json');
                return;
            }

            const data = await response.json();
            const remoteVersion = data.version;

            console.log('[VersionChecker] Current version:', CURRENT_VERSION);
            console.log('[VersionChecker] Remote version:', remoteVersion);

            // Check if dismissed version matches the latest version
            const dismissedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

            if (remoteVersion !== CURRENT_VERSION) {
                setLatestVersion(remoteVersion);

                // Only show notification if user hasn't dismissed this version
                if (dismissedVersion !== remoteVersion) {
                    setNewVersionAvailable(true);
                    setIsDismissed(false);
                }
            } else {
                setNewVersionAvailable(false);
                // Clear dismissed flag if we're on the latest version
                localStorage.removeItem(VERSION_STORAGE_KEY);
            }
        } catch (error) {
            console.error('[VersionChecker] Error checking version:', error);
        }
    };

    useEffect(() => {
        // Check on mount
        checkVersion();

        // Set up periodic checking
        const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => {
        // Clear all caches and reload
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.unregister());
            });
        }

        // Clear browser cache and reload
        window.location.reload(true);
    };

    const handleDismiss = () => {
        // Store the dismissed version
        if (latestVersion) {
            localStorage.setItem(VERSION_STORAGE_KEY, latestVersion);
        }
        setIsDismissed(true);
        setNewVersionAvailable(false);
    };

    if (!newVersionAvailable || isDismissed) {
        return null;
    }

    return (
        <div className="version-notification" role="alert">
            <div className="version-notification-content">
                <div className="version-notification-icon">🎉</div>
                <div className="version-notification-text">
                    <strong>{t('version.new_version_available')}</strong>
                    <p className="text-sm text-secondary mt-xs">
                        {t('version.update_message', { version: latestVersion || 'nova' })}
                    </p>
                </div>
                <div className="version-notification-actions">
                    <button
                        onClick={handleRefresh}
                        className="btn btn-primary btn-sm"
                    >
                        {t('version.update_now')}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="btn btn-ghost btn-sm"
                        aria-label={t('common.dismiss')}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VersionChecker;
export { CURRENT_VERSION };
