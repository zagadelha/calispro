/**
 * Hook e utilitários para facilitar debugging com o DebugPanel
 * Especialmente útil para rastrear problemas de EmailJS no mobile
 */

// Flag para desativar logs em produção
const IS_PROD = import.meta.env.PROD;

// Logger centralizado para problemas de EmailJS
export const emailJSLogger = {
    logAttempt: (data) => {
        if (IS_PROD) return;
        console.log('📧 EmailJS: Tentando enviar email', {
            templateId: data.templateId,
            serviceId: data.serviceId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            online: navigator.onLine
        });
    },

    logSuccess: (data) => {
        if (IS_PROD) return;
        console.log('✅ EmailJS: Email enviado com sucesso', {
            ...data,
            timestamp: new Date().toISOString()
        });
    },

    logError: (error, context = {}) => {
        // Erros sempre logamos, mas podemos ser mais sutis em produção
        console.error('❌ EmailJS: Erro ao enviar email', {
            errorMessage: error?.message || 'Unknown error',
            errorText: error?.text || '',
            errorStatus: error?.status || '',
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            stack: IS_PROD ? undefined : error?.stack
        });
    },

    logConfig: (config) => {
        if (IS_PROD) return;
        console.log('⚙️ EmailJS: Configuração carregada', {
            hasServiceId: !!config.serviceId,
            hasTemplateId: !!config.templateId,
            hasPublicKey: !!config.publicKey,
            serviceIdLength: config.serviceId?.length,
            timestamp: new Date().toISOString()
        });
    },

    logEnvironment: () => {
        if (IS_PROD) return;
        console.log('🌍 EmailJS: Informações do ambiente', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            online: navigator.onLine,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }
};

// Logger para eventos gerais
export const appLogger = {
    log: (category, message, data = {}) => {
        if (IS_PROD) return;
        console.log(`[${category}] ${message}`, data);
    },

    error: (category, message, error = {}) => {
        console.error(`[${category}] ${message}`, {
            error: error?.message || error,
            stack: IS_PROD ? undefined : error?.stack,
            timestamp: new Date().toISOString()
        });
    },

    warn: (category, message, data = {}) => {
        if (IS_PROD) return;
        console.warn(`[${category}] ${message}`, data);
    }
};

// Utilitário para formatar logs para compartilhamento
export const formatLogsForSharing = (logs) => {
    const header = `
═══════════════════════════════════════════
    CALISPRO DEBUG LOGS
═══════════════════════════════════════════
Gerado em: ${new Date().toISOString()}
Total de logs: ${logs.length}
═══════════════════════════════════════════

`;

    const formattedLogs = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleString('pt-BR');
        const separator = '─'.repeat(50);

        return `
${separator}
⏰ ${time} | 📊 ${log.type.toUpperCase()}
${separator}
${log.message}
`;
    }).join('\n');

    return header + formattedLogs;
};

export default {
    emailJSLogger,
    appLogger,
    formatLogsForSharing
};
