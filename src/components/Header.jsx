import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, User, LogOut, BarChart2, Menu, X, Home, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo2.png';
import LanguageSelector from './LanguageSelector';
import Tutorial from './Tutorial';

const Header = () => {
    const { t } = useTranslation();
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    const handleOpenTutorial = () => {
        setShowTutorial(true);
        setMenuOpen(false);
    };

    return (
        <header className="dashboard-header">
            <div className="container">
                <div className="flex justify-between items-center">
                    <img
                        src={logo}
                        alt="CalisPro"
                        className="app-logo"
                        onClick={() => navigate('/dashboard')}
                        style={{ cursor: 'pointer' }}
                    />

                    <div className="flex items-center gap-md">
                        {/* Hamburger Menu Toggle */}
                        <button
                            className="menu-toggle"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Menu"
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                        <div className="header-menu-dropdown animate-fadeIn">
                            <div className="menu-items">
                                <button className="menu-item" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
                                    <Home size={18} />
                                    <span>{t('nav.dashboard')}</span>
                                </button>
                                <button className="menu-item" onClick={() => { navigate('/progress'); setMenuOpen(false); }}>
                                    <BarChart2 size={18} />
                                    <span>{t('nav.progress')}</span>
                                </button>
                                <button className="menu-item" onClick={() => { navigate('/evolution'); setMenuOpen(false); }}>
                                    <TrendingUp size={18} />
                                    <span>{t('nav.evolution')}</span>
                                </button>
                                <button className="menu-item" onClick={() => { navigate('/profile'); setMenuOpen(false); }}>
                                    <User size={18} />
                                    <span>{t('nav.profile')}</span>
                                </button>

                                <div className="menu-divider"></div>

                                <button className="menu-item" onClick={handleOpenTutorial}>
                                    <HelpCircle size={18} />
                                    <span>{t('nav.tutorial')}</span>
                                </button>

                                <div className="menu-divider"></div>

                                <div className="menu-section">
                                    <span className="menu-label">{t('common.language')}</span>
                                    <LanguageSelector />
                                </div>

                                <div className="menu-divider"></div>

                                <button className="menu-item logout" onClick={handleLogout}>
                                    <LogOut size={18} />
                                    <span>{t('nav.logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay to close menu when clicking outside - rendered outside container for full screen coverage */}
            {menuOpen && (
                <div
                    className="menu-overlay"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Tutorial Modal */}
            {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} autoShow={false} userId={currentUser?.uid} />}
        </header>
    );
};

export default Header;
