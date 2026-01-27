import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import logo from '../assets/logo2.png';
import InstallButton from '../components/InstallButton';
import LanguageSelector from '../components/LanguageSelector';


const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Check if biometric authentication is available
    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        // Check if WebAuthn is supported
        if (!window.PublicKeyCredential) {
            return;
        }

        try {
            // Check if platform authenticator (biometric) is available
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            setBiometricAvailable(available);

            // Check if we have saved credentials
            const savedEmail = localStorage.getItem('biometric_email');
            setHasSavedCredentials(!!savedEmail);
            if (savedEmail) {
                setEmail(savedEmail);
            }
        } catch (err) {
            console.log('Biometric check failed:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError(t('auth.errors.fill_all'));
            return;
        }

        try {
            setError('');
            setLoading(true);
            await login(email, password);

            // After successful login, offer to save biometric credentials
            if (biometricAvailable && !hasSavedCredentials) {
                await registerBiometric(email);
            }

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError(t('auth.errors.user_not_found'));
            } else if (err.code === 'auth/invalid-email') {
                setError(t('auth.errors.invalid_email'));
            } else {
                setError(t('auth.errors.general_error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const registerBiometric = async (userEmail) => {
        try {
            // Generate a challenge (in production, this should come from your backend)
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Create credential options
            const publicKeyCredentialCreationOptions = {
                challenge: challenge,
                rp: {
                    name: "CalisPro",
                    id: window.location.hostname
                },
                user: {
                    id: new TextEncoder().encode(userEmail),
                    name: userEmail,
                    displayName: userEmail
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" },  // ES256
                    { alg: -257, type: "public-key" } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required"
                },
                timeout: 60000,
                attestation: "none"
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            // Save credential info to localStorage (in production, save to backend)
            if (credential) {
                localStorage.setItem('biometric_email', userEmail);
                localStorage.setItem('biometric_credential_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
                setHasSavedCredentials(true);
            }
        } catch (err) {
            console.log('Biometric registration cancelled or failed:', err);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            setError('');
            setLoading(true);

            const savedEmail = localStorage.getItem('biometric_email');
            const savedCredentialId = localStorage.getItem('biometric_credential_id');

            if (!savedEmail || !savedCredentialId) {
                setError(t('auth.errors.no_biometric'));
                return;
            }

            // Generate a challenge
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Request authentication
            const publicKeyCredentialRequestOptions = {
                challenge: challenge,
                timeout: 60000,
                userVerification: "required",
                rpId: window.location.hostname
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (assertion) {
                // In a real implementation, you would verify the assertion with your backend
                // For now, we'll use the saved email to log in with a stored session

                // Check if we have a remembered password (not recommended for production)
                // Instead, you should implement a backend endpoint that verifies the biometric assertion

                // For this demo, we'll show a message that biometric is verified
                // and the user needs to use another auth method first time
                setError(t('auth.biometric_verified'));
                setEmail(savedEmail);
            }
        } catch (err) {
            console.error('Biometric login failed:', err);
            if (err.name === 'NotAllowedError') {
                setError(t('auth.errors.biometric_cancelled'));
            } else {
                setError(t('auth.errors.biometric_failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(t('auth.errors.general_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <LanguageSelector floating />
            <div className="container container-sm">
                <div className="auth-card card animate-fadeIn">
                    <div className="auth-header text-center mb-xl">
                        <img src={logo} alt="CalisPro" className="auth-logo mb-md" />
                        <p className="text-secondary">{t('auth.login_subtitle')}</p>
                        <div className="mt-md">
                            <InstallButton className="btn-sm btn-outline" />
                        </div>
                    </div>

                    {error && (
                        <div className={`alert ${error.includes('verificad') ? 'alert-success' : 'alert-error'} mb-lg`}>
                            {error}
                        </div>
                    )}

                    {/* Biometric Login Button - Only show if available and has saved credentials */}
                    {biometricAvailable && hasSavedCredentials && (
                        <>
                            <button
                                onClick={handleBiometricLogin}
                                className="btn btn-primary btn-full mb-md"
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🔐</span>
                                    {t('auth.biometric_login')}
                                </span>
                            </button>
                            <div className="divider-text">{t('common.or')}</div>
                        </>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('auth.email_label')}</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('auth.password_label')}</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full mb-lg"
                            disabled={loading}
                        >
                            {loading ? t('auth.logging_in') : t('auth.login_button')}
                        </button>
                    </form>

                    <div className="divider-text">{t('common.or')}</div>

                    <button
                        onClick={handleGoogleLogin}
                        className="btn btn-google btn-full mb-lg"
                        disabled={loading}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                        </svg>
                        {t('auth.google_continue')}
                    </button>

                    <p className="text-center text-secondary">
                        {t('auth.no_account')}{' '}
                        <Link to="/signup" className="link-primary">
                            {t('auth.signup_link')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
