# Migração do Sistema de Feedback: Firestore → EmailJS

## Resumo das Alterações

O sistema de feedback foi migrado de salvar dados no Firestore para enviar emails diretamente usando o serviço EmailJS. Todas as mensagens de feedback agora serão enviadas para **calisproapp@gmail.com**.

## Arquivos Modificados

### 1. `package.json`
- **Adicionado**: `@emailjs/browser` (para envio de emails)

### 2. `src/components/FeedbackButton.jsx`
- **Removido**: Imports do Firestore (`collection`, `addDoc`, `db`)
- **Adicionado**: Import do EmailJS e configuração
- **Modificado**: Função `handleSubmit()` agora envia emails ao invés de salvar no banco de dados

### 3. `src/config/emailjs.js` (NOVO)
- Arquivo de configuração do EmailJS
- Define IDs de serviço, template e chave pública
- Email de destino: `calisproapp@gmail.com`

### 4. `.env.example`
- **Adicionado**: Variáveis de ambiente do EmailJS:
  - `VITE_EMAILJS_SERVICE_ID`
  - `VITE_EMAILJS_TEMPLATE_ID`
  - `VITE_EMAILJS_PUBLIC_KEY`

### 5. `EMAILJS_SETUP.md` (NOVO)
- Guia completo de configuração do EmailJS
- Instruções passo a passo
- Template de email recomendado
- Solução de problemas

## Próximos Passos

### ⚠️ CONFIGURAÇÃO OBRIGATÓRIA

Para que o sistema de feedback funcione, você **DEVE** configurar o EmailJS:

1. **Leia o guia**: Abra `EMAILJS_SETUP.md` e siga todas as instruções
2. **Configure o serviço**: Crie uma conta no EmailJS e configure o serviço de Gmail
3. **Crie o template**: Use o template fornecido no guia
4. **Configure variáveis**: Adicione as credenciais no arquivo `.env.local`
5. **Teste**: Envie um feedback de teste para verificar

### Template de Email Recomendado

```
Subject: CalisPro - Novo Feedback: {{feedback_type}}

Novo feedback recebido do CalisPro App

--------------------------------------------------
INFORMAÇÕES DO USUÁRIO
--------------------------------------------------
Nome: {{user_name}}
Email: {{user_email}}
ID: {{user_id}}
Data: {{created_at}}

--------------------------------------------------
TIPO DE FEEDBACK
--------------------------------------------------
{{feedback_type}}

--------------------------------------------------
MENSAGEM
--------------------------------------------------
{{message}}
```

## Benefícios da Mudança

✅ **Notificação Imediata**: Emails chegam instantaneamente  
✅ **Sem Banco de Dados**: Reduz custos e complexidade  
✅ **Centralizado**: Tudo em um único email  
✅ **Fácil Gestão**: Use o Gmail para organizar feedbacks  
✅ **Sem Dependências**: Não precisa de painel admin no app  

## Limitações

⚠️ **Plano Gratuito**: 200 emails/mês  
⚠️ **Configuração Manual**: Requer configuração do EmailJS  
⚠️ **Não Rastreável no App**: Feedbacks não ficam salvos no Firebase  

## Variáveis Enviadas no Email

Cada feedback inclui as seguintes informações:

- `user_id`: ID do usuário no Firebase (ou 'anonymous')
- `user_email`: Email do usuário (ou 'N/A')
- `user_name`: Nome do usuário (ou 'Atleta')
- `feedback_type`: Tipo de feedback (Bug, Pergunta, Sugestão, Contato)
- `message`: Mensagem do feedback
- `created_at`: Data e hora de criação
- `to_email`: Email de destino (calisproapp@gmail.com)

## Status da Migração

- ✅ Dependências instaladas
- ✅ Código migrado
- ✅ Arquivos de configuração criados
- ✅ Documentação completa
- ⏳ **AGUARDANDO**: Configuração do EmailJS
- ⏳ **AGUARDANDO**: Testes de envio de email

## Suporte

Se tiver problemas durante a configuração:

1. Verifique o arquivo `EMAILJS_SETUP.md` para soluções
2. Confirme que todas as variáveis de ambiente estão corretas
3. Teste o envio de email diretamente no dashboard do EmailJS
4. Verifique o console do navegador para mensagens de erro

---

**Data da Migração**: 27 de Janeiro de 2026  
**Desenvolvedor**: Antigravity AI  
**Email de Destino**: calisproapp@gmail.com
