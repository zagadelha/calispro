import React, { useState } from 'react';
import { EMAILJS_CONFIG } from '../config/emailjs';
import emailjs from '@emailjs/browser';

/**
 * Componente de diagnóstico do EmailJS
 * Use este componente temporariamente para testar a configuração em produção
 * 
 * Para usar:
 * 1. Importe em Dashboard.jsx: import EmailJSDiagnostic from '../components/EmailJSDiagnostic';
 * 2. Adicione no JSX: {import.meta.env.DEV && <EmailJSDiagnostic />}
 * 3. Acesse o dashboard e clique em "Testar EmailJS"
 * 
 * REMOVA após resolver o problema!
 */
const EmailJSDiagnostic = () => {
    const [result, setResult] = useState(null);
    const [testing, setTesting] = useState(false);

    const runDiagnostic = async () => {
        setTesting(true);
        const diagnosticResult = {
            timestamp: new Date().toISOString(),
            environment: import.meta.env.MODE,
            config: {
                serviceId: EMAILJS_CONFIG.serviceId,
                templateId: EMAILJS_CONFIG.templateId,
                publicKey: EMAILJS_CONFIG.publicKey ? '***' + EMAILJS_CONFIG.publicKey.slice(-4) : 'missing',
                recipientEmail: EMAILJS_CONFIG.recipientEmail,
            },
            validation: {
                hasServiceId: !!EMAILJS_CONFIG.serviceId,
                hasTemplateId: !!EMAILJS_CONFIG.templateId,
                hasPublicKey: !!EMAILJS_CONFIG.publicKey,
                serviceIdValid: !EMAILJS_CONFIG.serviceId?.includes('YOUR_'),
                templateIdValid: !EMAILJS_CONFIG.templateId?.includes('YOUR_'),
                publicKeyValid: !EMAILJS_CONFIG.publicKey?.includes('YOUR_'),
            },
            network: {
                online: navigator.onLine,
                connectionType: navigator.connection?.effectiveType || 'unknown',
            }
        };

        try {
            const testParams = {
                user_name: 'Teste de Diagnóstico',
                user_email: 'diagnostic@test.com',
                user_id: 'diagnostic_test',
                feedback_type: 'Teste',
                message: `Teste automático de diagnóstico\nAmbiente: ${import.meta.env.MODE}\nTimestamp: ${new Date().toISOString()}`,
                created_at: new Date().toISOString(),
                to_email: EMAILJS_CONFIG.recipientEmail
            };

            console.log('🔍 Iniciando teste do EmailJS...', testParams);

            const response = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                testParams,
                EMAILJS_CONFIG.publicKey
            );

            diagnosticResult.test = {
                success: true,
                response: {
                    status: response.status,
                    text: response.text
                }
            };

            console.log('✅ Teste bem-sucedido!', response);
        } catch (error) {
            diagnosticResult.test = {
                success: false,
                error: {
                    message: error.message,
                    status: error.status,
                    text: error.text,
                    name: error.name
                }
            };

            console.error('❌ Teste falhou:', error);
        }

        setResult(diagnosticResult);
        setTesting(false);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            background: '#1e293b',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 9999,
            color: 'white',
            fontSize: '12px',
            fontFamily: 'monospace'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#3b82f6' }}>
                🔍 EmailJS Diagnostic
            </h3>

            <button
                onClick={runDiagnostic}
                disabled={testing}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: testing ? '#64748b' : '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: testing ? 'not-allowed' : 'pointer',
                    marginBottom: '15px',
                    fontWeight: 'bold'
                }}
            >
                {testing ? 'Testando...' : 'Testar EmailJS'}
            </button>

            {result && (
                <div>
                    <div style={{
                        padding: '10px',
                        background: result.test.success ? '#065f46' : '#991b1b',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontWeight: 'bold'
                    }}>
                        {result.test.success ? '✅ TESTE PASSOU' : '❌ TESTE FALHOU'}
                    </div>

                    <details style={{ marginBottom: '10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '5px' }}>
                            📋 Configuração
                        </summary>
                        <pre style={{
                            background: '#0f172a',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '10px'
                        }}>
                            {JSON.stringify(result.config, null, 2)}
                        </pre>
                    </details>

                    <details style={{ marginBottom: '10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '5px' }}>
                            ✓ Validação
                        </summary>
                        <pre style={{
                            background: '#0f172a',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '10px'
                        }}>
                            {JSON.stringify(result.validation, null, 2)}
                        </pre>
                    </details>

                    <details style={{ marginBottom: '10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '5px' }}>
                            {result.test.success ? '📨 Resposta' : '⚠️ Erro'}
                        </summary>
                        <pre style={{
                            background: '#0f172a',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '10px'
                        }}>
                            {JSON.stringify(result.test.success ? result.test.response : result.test.error, null, 2)}
                        </pre>
                    </details>

                    <details>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '5px' }}>
                            📡 Rede
                        </summary>
                        <pre style={{
                            background: '#0f172a',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            fontSize: '10px'
                        }}>
                            {JSON.stringify(result.network, null, 2)}
                        </pre>
                    </details>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                            alert('Diagnóstico copiado!');
                        }}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        📋 Copiar Resultado
                    </button>
                </div>
            )}

            <p style={{ marginTop: '15px', fontSize: '10px', color: '#94a3b8' }}>
                ⚠️ Componente de debug - remover em produção
            </p>
        </div>
    );
};

export default EmailJSDiagnostic;
