import React, { useState, useEffect, useRef } from 'react';
import '../styles/DebugPanel.css';

const DebugPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all'); // all, log, error, warn, info
    const [copySuccess, setCopySuccess] = useState(false);
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef(null);
    const logsEndRef = useRef(null);

    // Interceptar console methods e armazenar logs
    useEffect(() => {
        // Carregar logs salvos do localStorage
        const savedLogs = localStorage.getItem('debug_logs');
        if (savedLogs) {
            try {
                setLogs(JSON.parse(savedLogs));
            } catch (e) {
                console.error('Failed to load saved logs', e);
            }
        }

        // Salvar referências originais
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        const addLog = (type, args) => {
            const timestamp = new Date().toISOString();
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            const newLog = { type, message, timestamp };

            setLogs(prevLogs => {
                const updatedLogs = [...prevLogs, newLog];
                // Limitar a 1000 logs para não sobrecarregar
                const trimmedLogs = updatedLogs.slice(-1000);

                // Salvar no localStorage
                try {
                    localStorage.setItem('debug_logs', JSON.stringify(trimmedLogs));
                } catch (e) {
                    // Se localStorage estiver cheio, limpar logs antigos
                    const recentLogs = trimmedLogs.slice(-100);
                    localStorage.setItem('debug_logs', JSON.stringify(recentLogs));
                }

                return trimmedLogs;
            });
        };

        // Interceptar métodos do console
        console.log = (...args) => {
            originalLog.apply(console, args);
            addLog('log', args);
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            addLog('error', args);
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            addLog('warn', args);
        };

        console.info = (...args) => {
            originalInfo.apply(console, args);
            addLog('info', args);
        };

        // Capturar erros não tratados
        const handleError = (event) => {
            addLog('error', [`Uncaught Error: ${event.error?.message || event.message}`, event.error?.stack]);
        };

        const handleUnhandledRejection = (event) => {
            addLog('error', [`Unhandled Promise Rejection: ${event.reason}`]);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        // Cleanup
        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Auto-scroll para o final quando novos logs aparecem
    useEffect(() => {
        if (isOpen && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    // Detector de "toque secreto" - 5 toques rápidos no canto superior direito
    useEffect(() => {
        const handleTap = (e) => {
            const { clientX, clientY } = e.type.startsWith('touch') ? e.touches[0] : e;
            const { innerWidth, innerHeight } = window;

            // Área de ativação: 20% do canto superior direito
            const isInActivationZone =
                clientX > innerWidth * 0.8 &&
                clientY < innerHeight * 0.2;

            if (isInActivationZone) {
                tapCountRef.current++;

                if (tapCountRef.current === 5) {
                    setIsOpen(prev => !prev);
                    tapCountRef.current = 0;
                }

                // Reset após 1 segundo
                clearTimeout(tapTimerRef.current);
                tapTimerRef.current = setTimeout(() => {
                    tapCountRef.current = 0;
                }, 1000);
            }
        };

        document.addEventListener('touchstart', handleTap);
        document.addEventListener('click', handleTap);

        return () => {
            document.removeEventListener('touchstart', handleTap);
            document.removeEventListener('click', handleTap);
            clearTimeout(tapTimerRef.current);
        };
    }, []);

    const filteredLogs = logs.filter(log =>
        filter === 'all' || log.type === filter
    );

    const copyLogsToClipboard = async () => {
        const logsText = logs.map(log =>
            `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
        ).join('\n\n');

        try {
            await navigator.clipboard.writeText(logsText);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            // Fallback para mobile antigo
            const textArea = document.createElement('textarea');
            textArea.value = logsText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy logs', err);
            }
            document.body.removeChild(textArea);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        localStorage.removeItem('debug_logs');
    };

    const downloadLogs = () => {
        const logsText = logs.map(log =>
            `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
        ).join('\n\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calispro-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="debug-panel">
            <div className="debug-panel-header">
                <h3>🐛 Debug Console</h3>
                <button
                    className="debug-panel-close"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fechar painel de debug"
                >
                    ✕
                </button>
            </div>

            <div className="debug-panel-filters">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    Todos ({logs.length})
                </button>
                <button
                    className={filter === 'log' ? 'active' : ''}
                    onClick={() => setFilter('log')}
                >
                    Log ({logs.filter(l => l.type === 'log').length})
                </button>
                <button
                    className={filter === 'error' ? 'active' : ''}
                    onClick={() => setFilter('error')}
                >
                    Erros ({logs.filter(l => l.type === 'error').length})
                </button>
                <button
                    className={filter === 'warn' ? 'active' : ''}
                    onClick={() => setFilter('warn')}
                >
                    Avisos ({logs.filter(l => l.type === 'warn').length})
                </button>
            </div>

            <div className="debug-panel-actions">
                <button onClick={copyLogsToClipboard} className="btn-copy">
                    {copySuccess ? '✅ Copiado!' : '📋 Copiar Logs'}
                </button>
                <button onClick={downloadLogs} className="btn-download">
                    💾 Download
                </button>
                <button onClick={clearLogs} className="btn-clear">
                    🗑️ Limpar
                </button>
            </div>

            <div className="debug-panel-logs">
                {filteredLogs.length === 0 ? (
                    <div className="debug-panel-empty">
                        Nenhum log encontrado
                    </div>
                ) : (
                    filteredLogs.map((log, index) => (
                        <div key={index} className={`debug-log debug-log-${log.type}`}>
                            <div className="debug-log-header">
                                <span className="debug-log-type">{log.type.toUpperCase()}</span>
                                <span className="debug-log-time">
                                    {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                                </span>
                            </div>
                            <div className="debug-log-message">
                                {log.message}
                            </div>
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>

            <div className="debug-panel-info">
                💡 Toque 5x no canto superior direito para abrir/fechar
            </div>
        </div>
    );
};

export default DebugPanel;
