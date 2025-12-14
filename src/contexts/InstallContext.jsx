import React, { createContext, useContext, useState, useEffect } from 'react';

const InstallContext = createContext({
    isInstallable: false,
    promptInstall: () => { },
    hidePrompt: () => { }
});

export const useInstall = () => useContext(InstallContext);

export const InstallProvider = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    const value = {
        isInstallable,
        promptInstall
    };

    return (
        <InstallContext.Provider value={value}>
            {children}
        </InstallContext.Provider>
    );
};
