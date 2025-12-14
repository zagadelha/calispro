import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Check if user has already seen the prompt
            const hasSeenPrompt = localStorage.getItem('installPromptSeen');
            if (!hasSeenPrompt) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        setShowPrompt(false);
        localStorage.setItem('installPromptSeen', 'true');
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptSeen', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="install-prompt-overlay">
            <div className="card install-prompt-card animate-slideIn">
                <div className="flex justify-between items-center mb-md">
                    <h3 className="card-title text-lg m-0">Instalar App</h3>
                    <button onClick={handleDismiss} className="btn-icon text-secondary">
                        ✕
                    </button>
                </div>
                <p className="text-secondary mb-lg">
                    Instale o CalisProgress na sua tela inicial para uma melhor experiência!
                </p>
                <div className="flex gap-md">
                    <button onClick={handleDismiss} className="btn btn-secondary flex-1">
                        Agora não
                    </button>
                    <button onClick={handleInstallClick} className="btn btn-primary flex-1">
                        Instalar
                    </button>
                </div>
            </div>
            <style>{`
                .install-prompt-overlay {
                    position: fixed;
                    bottom: 2rem;
                    left: 0;
                    right: 0;
                    padding: 0 1rem;
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    pointer-events: none;
                }
                .install-prompt-card {
                    pointer-events: auto;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--primary-light);
                }
            `}</style>
        </div>
    );
};

export default InstallPrompt;
