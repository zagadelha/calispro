# 🐛 Debug Panel - Guia de Uso

## O que é?

O Debug Panel é uma ferramenta de debugging que permite capturar e visualizar logs diretamente no celular, facilitando a investigação de problemas em produção (especialmente útil para problemas do EmailJS no mobile).

## Como Ativar

### Método 1: Toque Secreto (Padrão)
1. **Toque 5 vezes rapidamente** no canto superior direito da tela (área de 20%)
2. O painel abrirá automaticamente
3. Para fechar: toque 5x novamente ou clique no botão ✕

### Método 2: Programático
```javascript
// Em qualquer componente, você pode forçar a abertura
window.openDebugPanel && window.openDebugPanel();
```

## Recursos

### 📋 Visualização de Logs
- **Todos os tipos**: `console.log`, `console.error`, `console.warn`, `console.info`
- **Erros não tratados**: Captura automática de erros globais
- **Promise rejections**: Captura automática de promises rejeitadas
- **Timestamp**: Data/hora de cada log
- **Filtros**: Filtre por tipo de log (Todos, Log, Erros, Avisos)

### 🎯 Funcionalidades Especiais

#### 1. Copiar Logs
- Clique em **"📋 Copiar Logs"**
- Todos os logs serão copiados para o clipboard
- Cole em WhatsApp, email, ou qualquer editor de texto
- Formato estruturado e legível

#### 2. Download de Logs
- Clique em **"💾 Download"**
- Baixa um arquivo `.txt` com todos os logs
- Nome do arquivo: `calispro-logs-YYYY-MM-DD.txt`
- Envie o arquivo para investigação no PC

#### 3. Limpar Logs
- Clique em **"🗑️ Limpar"**
- Remove todos os logs salvos
- Limpa também o localStorage

### 💾 Persistência
- Os logs são salvos automaticamente no **localStorage**
- Limite de **1000 logs** (os mais antigos são removidos)
- Logs persistem entre sessões (mesmo fechando o app)

## Logs Estruturados do EmailJS

O sistema captura logs detalhados do EmailJS:

### Antes de Enviar
```
🌍 EmailJS: Informações do ambiente
- User Agent
- Plataforma
- Status da conexão (online/offline)
- Tamanho da viewport
- URL atual
```

### Durante o Envio
```
📧 EmailJS: Tentando enviar email
- Service ID
- Template ID
- Timestamp
- Status da conexão
```

### Sucesso
```
✅ EmailJS: Email enviado com sucesso
- Status HTTP
- Mensagem de resposta
```

### Erro
```
❌ EmailJS: Erro ao enviar email
- Mensagem de erro
- Status HTTP
- Stack trace
- Informações do ambiente
- Contexto (tipo de feedback, usuário, etc)
```

## Como Investigar Problemas no Mobile

### Passo 1: Reproduzir o Problema
1. Abra o app no celular
2. Ative o Debug Panel (5 toques)
3. Limpe os logs antigos (🗑️ Limpar)
4. Execute a ação que causa o problema (ex: enviar feedback)

### Passo 2: Capturar os Logs
Escolha um dos métodos:

**Opção A: Copiar e Colar**
1. Clique em "📋 Copiar Logs"
2. Abra WhatsApp/Email
3. Cole os logs
4. Envie para você mesmo ou equipe

**Opção B: Download**
1. Clique em "💾 Download"
2. Arquivo será salvo no dispositivo
3. Compartilhe via WhatsApp/Email/Drive

### Passo 3: Analisar no PC
1. Abra os logs no editor de texto
2. Procure por linhas com `❌` (erros)
3. Analise o stack trace e contexto
4. Identifique padrões (ex: sempre falha no mobile, sempre em 4G, etc)

## Exemplo de Logs do EmailJS

```
═══════════════════════════════════════════
    CALISPRO DEBUG LOGS
═══════════════════════════════════════════

──────────────────────────────────────────
⏰ 27/01/2026 14:30:15 | 📊 LOG
──────────────────────────────────────────
🌍 EmailJS: Informações do ambiente {
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
  "platform": "iPhone",
  "online": true,
  "language": "pt-BR",
  "screenWidth": 390,
  "screenHeight": 844,
  "url": "https://calispro.app/dashboard"
}

──────────────────────────────────────────
⏰ 27/01/2026 14:30:16 | 📊 LOG
──────────────────────────────────────────
📧 EmailJS: Tentando enviar email {
  "serviceId": "service_xyz",
  "templateId": "template_abc",
  "timestamp": "2026-01-27T14:30:16.123Z",
  "online": true
}

──────────────────────────────────────────
⏰ 27/01/2026 14:30:20 | 📊 ERROR
──────────────────────────────────────────
❌ EmailJS: Erro ao enviar email {
  "errorMessage": "Failed to fetch",
  "errorStatus": "",
  "context": {
    "feedbackType": "bug",
    "messageLength": 150,
    "userId": "abc123"
  },
  "userAgent": "Mozilla/5.0 (iPhone...)",
  "online": true
}
```

## Dicas

### 🔍 Debug em Produção
- **Sempre ative o painel ANTES** de reproduzir o problema
- **Limpe logs antigos** para ver apenas logs relevantes
- **Copie imediatamente** após o erro (antes que seja perdido)

### 📱 Mobile vs Desktop
- Desktop: Você pode usar DevTools diretamente (`F12`)
- Mobile: Use o Debug Panel (não tem DevTools nativo)

### 🚀 Performance
- O painel NÃO afeta performance em produção
- Logs são salvos assincronamente
- Limite de 1000 logs evita sobrecarga de memória

### 🔒 Privacidade
- Logs ficam **apenas no dispositivo** (localStorage)
- **Não são enviados automaticamente** para servidor
- Você controla quando compartilhar

## Troubleshooting

### Painel não abre
- Verifique se está tocando na área correta (canto superior direito)
- Tente tocar mais rápido (5 toques em <1 segundo)
- Recarregue a página (`Ctrl+R` ou `Cmd+R`)

### Botão "Copiar" não funciona
- Use o botão "💾 Download" como fallback
- Alguns navegadores bloqueiam clipboard em HTTP (use HTTPS)

### Logs não aparecem
- Verifique se o localStorage está habilitado
- Limpe o cache do navegador
- Verifique se há espaço de armazenamento disponível

## Código de Exemplo

### Usar o Logger Personalizado

```javascript
import { emailJSLogger, appLogger } from '../utils/debugLogger';

// Log de EmailJS
emailJSLogger.logAttempt({ serviceId, templateId });
emailJSLogger.logSuccess({ status: 200 });
emailJSLogger.logError(error, { context: 'additional info' });
emailJSLogger.logEnvironment();

// Log geral da aplicação
appLogger.log('WORKOUT', 'Treino iniciado', { exerciseId: 123 });
appLogger.error('AUTH', 'Erro no login', error);
appLogger.warn('STORAGE', 'Quase sem espaço', { available: '10MB' });
```

## Atualizações Futuras

Funcionalidades planejadas:
- [ ] Exportar logs em formato JSON
- [ ] Enviar logs automaticamente por email
- [ ] Filtros avançados (por texto, data, categoria)
- [ ] Estatísticas de erros
- [ ] Modo "sempre ativo" para desenvolvedores

---

**Versão**: 1.0.0  
**Última atualização**: 27/01/2026
