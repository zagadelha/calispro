import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import logo from '../assets/logo2.png';
import InstallButton from '../components/InstallButton';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            setError('Por favor, preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password, name);
            navigate('/onboarding');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este email já está em uso');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email inválido');
            } else if (err.code === 'auth/weak-password') {
                setError('Senha muito fraca');
            } else {
                setError('Erro ao criar conta. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/onboarding');
        } catch (err) {
            console.error(err);
            setError('Erro ao cadastrar com Google. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="container container-sm">
                <div className="auth-card card animate-fadeIn">
                    <div className="auth-header text-center mb-xl">
                        <img src={logo} alt="CalisPro" className="auth-logo mb-md" />
                        <p className="text-secondary">Crie sua conta e comece hoje</p>
                        <div className="mt-md">
                            <InstallButton className="btn-sm btn-outline" />
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error mb-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nome</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
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
                            <label className="form-label">Senha</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmar Senha</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full mb-lg"
                            disabled={loading}
                        >
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </button>
                    </form>

                    <div className="divider-text">ou</div>

                    <button
                        onClick={handleGoogleSignup}
                        className="btn btn-google btn-full mb-lg"
                        disabled={loading}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                        </svg>
                        Continuar com Google
                    </button>

                    <p className="text-center text-secondary">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="link-primary">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
