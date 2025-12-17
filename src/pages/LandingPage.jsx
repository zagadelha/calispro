import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo2.png';
import hero1 from '../assets/hero1.png';
import hero2 from '../assets/hero2.png';
import hero3 from '../assets/hero3.png';

function LandingPage() {
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState(0);
    const images = [hero1, hero2, hero3];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const benefits = [
        {
            icon: '🎯',
            title: 'Treinos Personalizados',
            description: 'Planos de treino adaptados ao seu nível e objetivos individuais'
        },
        {
            icon: '📊',
            title: 'Acompanhamento de Progresso',
            description: 'Monitore sua evolução com métricas detalhadas e gráficos intuitivos'
        },
        {
            icon: '🚀',
            title: 'Progressão Inteligente',
            description: 'Sistema automático que ajusta a dificuldade conforme você evolui'
        },
        {
            icon: '💪',
            title: 'Biblioteca de Exercícios',
            description: 'Centenas de exercícios com instruções detalhadas e demonstrações'
        },
        {
            icon: '⏱️',
            title: 'Treinos Flexíveis',
            description: 'Adapte seus treinos ao tempo disponível, de 15 a 60 minutos'
        },
        {
            icon: '🎓',
            title: 'Guias para Iniciantes',
            description: 'Comece do zero com orientações passo a passo para segurança'
        }
    ];

    const calisthenicsInfo = [
        {
            title: 'Força Funcional',
            description: 'Desenvolva força real aplicável ao dia a dia, não apenas músculos isolados'
        },
        {
            title: 'Flexibilidade Total',
            description: 'Treine em qualquer lugar - parque, casa ou academia. Sem equipamentos caros'
        },
        {
            title: 'Corpo Equilibrado',
            description: 'Construa um físico harmonioso trabalhando todo o corpo de forma integrada'
        },
        {
            title: 'Sempre Desafiador',
            description: 'Progressões infinitas - do básico ao avançado, sempre há um novo desafio'
        }
    ];

    return (
        <div className="landing-page">
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
                            Transforme Seu Corpo com <span className="orange-text">Calistenia</span>
                        </h1>
                        <p className="hero-subtitle">
                            O aplicativo inteligente que guia sua jornada na calistenia,
                            do primeiro exercício aos movimentos mais avançados
                        </p>
                        <div className="hero-cta">
                            <button onClick={() => navigate('/signup')} className="btn btn-primary btn-lg cta-button">
                                Começar Agora
                            </button>
                            <button onClick={() => navigate('/login')} className="btn btn-outline btn-lg">
                                Já Tenho Conta
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
                    <h2 className="section-title text-center">O que é Calistenia?</h2>
                    <p className="section-intro text-center">
                        A calistenia é uma forma de treinamento que utiliza apenas o peso corporal para desenvolver
                        força, flexibilidade, coordenação e resistência. Do grego "kalos" (beleza) e "sthenos" (força),
                        esta arte milenar cria corpos fortes, ágeis e esteticamente harmoniosos.
                    </p>

                    <div className="info-grid">
                        {calisthenicsInfo.map((info, idx) => (
                            <div key={idx} className="info-card">
                                <h3 className="info-title">{info.title}</h3>
                                <p className="info-description">{info.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="section benefits-section">
                <div className="container">
                    <h2 className="section-title text-center">Por Que CalisPro?</h2>
                    <p className="section-intro text-center">
                        Seu guia completo para dominar a calistenia, independente do seu nível
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
                    <h2 className="section-title text-center">Para Todos os Níveis</h2>

                    <div className="levels-container">
                        <div className="level-card">
                            <div className="level-badge badge-beginner">Iniciante</div>
                            <h3 className="level-title">Começando do Zero</h3>
                            <p className="level-description">
                                Sem experiência? Sem problema! Nosso sistema começa com exercícios básicos e
                                te guia com segurança pelos fundamentos da calistenia.
                            </p>
                            <ul className="level-features">
                                <li>Exercícios básicos e seguros</li>
                                <li>Instrução passo a passo</li>
                                <li>Progressão gradual e controlada</li>
                                <li>Foco em técnica e postura</li>
                            </ul>
                        </div>

                        <div className="level-card level-card-highlight">
                            <div className="level-badge badge-intermediate">Intermediário</div>
                            <h3 className="level-title">Evoluindo Constantemente</h3>
                            <p className="level-description">
                                Já tem uma base? Acelere seu progresso com treinos desafiadores que
                                expandem seus limites de forma inteligente.
                            </p>
                            <ul className="level-features">
                                <li>Variações mais complexas</li>
                                <li>Combinações dinâmicas</li>
                                <li>Treinos de resistência</li>
                                <li>Preparação para skills avançadas</li>
                            </ul>
                        </div>

                        <div className="level-card">
                            <div className="level-badge badge-advanced">Avançado</div>
                            <h3 className="level-title">Dominando Skills</h3>
                            <p className="level-description">
                                Busca dominar movimentos impressionantes? Treine skills complexas como
                                muscle-ups, handstands, front lever e muito mais.
                            </p>
                            <ul className="level-features">
                                <li>Skills avançadas</li>
                                <li>Progressões específicas</li>
                                <li>Treinos de alta intensidade</li>
                                <li>Refinamento de técnica</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Pronto para Começar Sua Transformação?</h2>
                        <p className="cta-description">
                            Junte-se a milhares de atletas que já estão transformando seus corpos com o CalisPro
                        </p>
                        <button onClick={() => navigate('/signup')} className="btn btn-primary btn-lg cta-button">
                            Criar Conta Grátis
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <img src={logo} alt="CalisPro" className="footer-logo" />
                        <p className="footer-text">© 2025 CalisPro. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
