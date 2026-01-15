import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import logo from '../assets/logo2.png';
import hero1 from '../assets/hero1.png';
import hero2 from '../assets/hero2.png';
import hero3 from '../assets/hero3.png';
import transformationManWeightLoss from '../assets/transformation_man_weight_loss.png';
import transformationWomanWeightLoss from '../assets/transformation_woman_weight_loss.png';
import transformationManMuscleGain from '../assets/transformation_man_muscle_gain.png';
import transformationManStrength from '../assets/transformation_man_strength.png';
import transformationWomanMuscle from '../assets/transformation_woman_muscle.png';
import infoStrength from '../assets/info_strength.png';
import infoWomanHandstand from '../assets/info_woman_handstand.png';
import infoVSitBars from '../assets/info_vsit_bars.png';
import infoWomanFullPlancheBeach from '../assets/info_woman_full_planche_beach.png';

function LandingPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);
    const [currentTransformation, setCurrentTransformation] = useState(0);
    const images = [hero1, hero2, hero3];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTransformation((prev) => (prev + 1) % transformations.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const transformations = [
        {
            image: transformationManWeightLoss,
            title: t('landing.transformations.fat_burn.title'),
            description: t('landing.transformations.fat_burn.desc')
        },
        {
            image: transformationWomanWeightLoss,
            title: t('landing.transformations.healthy_loss.title'),
            description: t('landing.transformations.healthy_loss.desc')
        },
        {
            image: transformationManMuscleGain,
            title: t('landing.transformations.muscle_gain.title'),
            description: t('landing.transformations.muscle_gain.desc')
        },
        {
            image: transformationManStrength,
            title: t('landing.transformations.complete.title'),
            description: t('landing.transformations.complete.desc')
        },
        {
            image: transformationWomanMuscle,
            title: t('landing.transformations.definition_strength.title'),
            description: t('landing.transformations.definition_strength.desc')
        }
    ];

    const benefits = [
        {
            icon: '🎯',
            title: t('landing.benefits.personalized.title'),
            description: t('landing.benefits.personalized.desc')
        },
        {
            icon: '📊',
            title: t('landing.benefits.tracking.title'),
            description: t('landing.benefits.tracking.desc')
        },
        {
            icon: '🚀',
            title: t('landing.benefits.intelligent.title'),
            description: t('landing.benefits.intelligent.desc')
        },
        {
            icon: '💪',
            title: t('landing.benefits.library.title'),
            description: t('landing.benefits.library.desc')
        },
        {
            icon: '⏱️',
            title: t('landing.benefits.flexible.title'),
            description: t('landing.benefits.flexible.desc')
        },
        {
            icon: '🎓',
            title: t('landing.benefits.guides.title'),
            description: t('landing.benefits.guides.desc')
        }
    ];

    const calisthenicsInfo = [
        {
            image: infoStrength,
            title: t('landing.info.strength.title'),
            description: t('landing.info.strength.desc')
        },
        {
            image: infoWomanHandstand,
            title: t('landing.info.flexibility.title'),
            description: t('landing.info.flexibility.desc')
        },
        {
            image: infoVSitBars,
            title: t('landing.info.balanced.title'),
            description: t('landing.info.balanced.desc')
        },
        {
            image: infoWomanFullPlancheBeach,
            title: t('landing.info.challenging.title'),
            description: t('landing.info.challenging.desc')
        }
    ];

    return (
        <div className="landing-page">
            <LanguageSelector floating />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay" />
                <div className="hero-images">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`hero-image ${idx === currentImage ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                </div>

                <div className="hero-content">
                    <div className="container">
                        <img src={logo} alt="CalisPro" className="hero-logo" />
                        <h1 className="hero-title">
                            {(() => {
                                const title = t('landing.title');
                                const keyword = i18n.language.startsWith('en') ? 'Calisthenics' : 'Calistenia';
                                const parts = title.split(keyword);
                                if (parts.length > 1) {
                                    return (
                                        <>
                                            {parts[0]}<span className="orange-text">{keyword}</span>{parts[1]}
                                        </>
                                    );
                                }
                                return title;
                            })()}
                        </h1>
                        <p className="hero-subtitle">
                            {t('landing.subtitle')}
                        </p>
                        <div className="hero-cta">
                            <button onClick={() => navigate('/signup')} className="btn btn-primary btn-lg cta-button">
                                {t('landing.start_now')}
                            </button>
                            <button onClick={() => navigate('/login')} className="btn btn-outline btn-lg">
                                {t('landing.have_account')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="scroll-indicator">
                    <div className="scroll-arrow"></div>
                </div>
            </section>

            {/* What is Calisthenics Section */}
            <section className="section calisthenics-section">
                <div className="container">
                    <h2 className="section-title text-center">{t('landing.what_is_calisthenics')}</h2>
                    <p className="section-intro text-center">
                        {t('landing.section_intro')}
                    </p>

                    <div className="info-grid">
                        {calisthenicsInfo.map((info, idx) => (
                            <div key={idx} className="info-card">
                                {info.image ? (
                                    <div className="info-image-container">
                                        <img src={info.image} alt={info.title} className="info-image" />
                                    </div>
                                ) : (
                                    <div className="info-icon">{info.icon}</div>
                                )}
                                <div className="info-card-content">
                                    <h3 className="info-title">{info.title}</h3>
                                    <p className="info-description">{info.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="section benefits-section">
                <div className="container">
                    <h2 className="section-title text-center">{t('landing.why_calispro')}</h2>
                    <p className="section-intro text-center">
                        {t('landing.why_calispro_intro')}
                    </p>

                    <div className="benefits-grid">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="benefit-card">
                                <div className="benefit-icon">{benefit.icon}</div>
                                <h3 className="benefit-title">{benefit.title}</h3>
                                <p className="benefit-description">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For Everyone Section */}
            <section className="section for-everyone-section">
                <div className="container">
                    <h2 className="section-title text-center">{t('landing.for_everyone')}</h2>

                    <div className="levels-container">
                        <div className="level-card">
                            <div className="level-badge badge-beginner">{t('common.beginner')}</div>
                            <h3 className="level-title">{t('landing.levels.beginner.title')}</h3>
                            <p className="level-description">
                                {t('landing.levels.beginner.desc')}
                            </p>
                            <ul className="level-features">
                                <li>{t('landing.levels.beginner.f1')}</li>
                                <li>{t('landing.levels.beginner.f2')}</li>
                                <li>{t('landing.levels.beginner.f3')}</li>
                                <li>{t('landing.levels.beginner.f4')}</li>
                            </ul>
                        </div>

                        <div className="level-card level-card-highlight">
                            <div className="level-badge badge-intermediate">{t('common.intermediate')}</div>
                            <h3 className="level-title">{t('landing.levels.intermediate.title')}</h3>
                            <p className="level-description">
                                {t('landing.levels.intermediate.desc')}
                            </p>
                            <ul className="level-features">
                                <li>{t('landing.levels.intermediate.f1')}</li>
                                <li>{t('landing.levels.intermediate.f2')}</li>
                                <li>{t('landing.levels.intermediate.f3')}</li>
                                <li>{t('landing.levels.intermediate.f4')}</li>
                            </ul>
                        </div>

                        <div className="level-card">
                            <div className="level-badge badge-advanced">{t('common.advanced')}</div>
                            <h3 className="level-title">{t('landing.levels.advanced.title')}</h3>
                            <p className="level-description">
                                {t('landing.levels.advanced.desc')}
                            </p>
                            <ul className="level-features">
                                <li>{t('landing.levels.advanced.f1')}</li>
                                <li>{t('landing.levels.advanced.f2')}</li>
                                <li>{t('landing.levels.advanced.f3')}</li>
                                <li>{t('landing.levels.advanced.f4')}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transformations Carousel Section */}
            <section className="section transformations-section">
                <div className="container">
                    <h2 className="section-title text-center">{t('landing.results_title')}</h2>
                    <p className="section-intro text-center">
                        {t('landing.results_intro')}
                    </p>

                    <div className="transformations-carousel">
                        <div className="transformations-track" style={{ transform: `translateX(-${currentTransformation * 100}%)` }}>
                            {transformations.map((transformation, idx) => (
                                <div key={idx} className="transformation-slide">
                                    <div className="transformation-card">
                                        <img
                                            src={transformation.image}
                                            alt={transformation.title}
                                            className="transformation-image"
                                        />
                                        <div className="transformation-info">
                                            <h3 className="transformation-title">{transformation.title}</h3>
                                            <p className="transformation-description">{transformation.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="carousel-indicators">
                        {transformations.map((_, idx) => (
                            <button
                                key={idx}
                                className={`carousel-indicator ${idx === currentTransformation ? 'active' : ''}`}
                                onClick={() => setCurrentTransformation(idx)}
                                aria-label={`${t('landing.results_title')} ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <div className="carousel-navigation">
                        <button
                            className="carousel-nav-btn prev"
                            onClick={() => setCurrentTransformation((prev) => prev === 0 ? transformations.length - 1 : prev - 1)}
                            aria-label={t('common.back')}
                        >
                            ‹
                        </button>
                        <button
                            className="carousel-nav-btn next"
                            onClick={() => setCurrentTransformation((prev) => (prev + 1) % transformations.length)}
                            aria-label={t('common.next')}
                        >
                            ›
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">{t('landing.ready_to_start')}</h2>
                        <p className="cta-description">
                            {t('landing.ready_to_start_desc')}
                        </p>
                        <button onClick={() => navigate('/signup')} className="btn btn-primary btn-lg cta-button">
                            {t('landing.create_free_account')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <img src={logo} alt="CalisPro" className="footer-logo" />
                        <p className="footer-text">{t('landing.rights_reserved')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
