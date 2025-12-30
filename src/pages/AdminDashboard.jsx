import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, MessageSquare, List } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const reports = [
        {
            id: 'exercises',
            title: 'Árvore de Exercícios',
            description: 'Visualize a progressão e dependências entre exercícios e habilidades.',
            icon: List,
            path: '/admin/exercises',
            color: '#3b82f6'
        },
        {
            id: 'feedback',
            title: 'Feedback dos Usuários',
            description: 'Veja sugestões, bugs e contatos enviados pelos usuários.',
            icon: MessageSquare,
            path: '/admin/feedback',
            color: '#10b981'
        },
        /* Future reports can be added here
        {
            id: 'usage',
            title: 'Métricas de Uso',
            description: 'Estatísticas de acesso e atividade dos usuários.',
            icon: BarChart2,
            path: '/admin/usage',
            color: '#8b5cf6'
        }
        */
    ];

    return (
        <div className="admin-dashboard-page">
            <header className="page-header">
                <div className="container flex items-center gap-md">
                    <button onClick={() => navigate('/dashboard')} className="btn-back">
                        <ArrowLeft size={24} />
                    </button>
                    <h1>Painel Administrativo</h1>
                </div>
            </header>

            <main className="container py-xl">
                <div className="admin-grid">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="report-card interactive"
                            onClick={() => navigate(report.path)}
                        >
                            <div className="report-icon-wrapper" style={{ backgroundColor: `${report.color}20` }}>
                                <report.icon size={32} style={{ color: report.color }} />
                            </div>
                            <div className="report-info">
                                <h3>{report.title}</h3>
                                <p>{report.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .admin-dashboard-page {
                    min-height: 100vh;
                    background-color: var(--bg-color, #0f172a);
                    color: white;
                }
                .page-header {
                    background: rgba(30, 41, 59, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 1rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .btn-back {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .btn-back:hover {
                    background: rgba(255,255,255,0.1);
                }
                .admin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .report-card {
                    background: #1e293b;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                }
                .report-card:hover {
                    transform: translateY(-4px);
                    background: #243147;
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.3);
                }
                .report-icon-wrapper {
                    width: 64px;
                    height: 64px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .report-info h3 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.25rem;
                }
                .report-info p {
                    margin: 0;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                @media (max-width: 640px) {
                    .admin-grid {
                        grid-template-columns: 1fr;
                    }
                }
            ` }} />
        </div>
    );
};

export default AdminDashboard;
