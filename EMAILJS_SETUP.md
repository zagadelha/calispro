# Configuração do EmailJS para Feedback

Este guia mostra como configurar o EmailJS para receber emails de feedback do aplicativo CalisPro.

## Passo 1: Criar Conta no EmailJS

1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/)
2. Clique em "Sign Up" e crie uma conta gratuita
3. Confirme seu email

## Passo 2: Adicionar Serviço de Email

1. No dashboard do EmailJS, vá para "Email Services"
2. Clique em "Add New Service"
3. Selecione **Gmail** (recomendado)
4. Conecte sua conta do Gmail (calisproapp@gmail.com)
5. Copie o **Service ID** (ex: service_abc1234)

## Passo 3: Criar Template de Email

1. Vá para "Email Templates"
2. Clique em "Create New Template"
3. Configure o template com o seguinte conteúdo:

### Subject (Assunto):
```
CalisPro - Novo Feedback: {{feedback_type}}
```

### Content (Conteúdo):
```
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

--------------------------------------------------

Este email foi enviado automaticamente pelo sistema de feedback do CalisPro.
```

### To Email (Para):
```
{{to_email}}
```

4. Salve o template e copie o **Template ID** (ex: template_xyz5678)

## Passo 4: Obter Public Key

1. Vá para "Account" no menu
2. Na seção "General", copie o **Public Key** (ex: abc123def456)

## Passo 5: Configurar Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione as seguintes variáveis com os valores que você copiou:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=seu_service_id_aqui
VITE_EMAILJS_TEMPLATE_ID=seu_template_id_aqui
VITE_EMAILJS_PUBLIC_KEY=sua_public_key_aqui
```

3. Substitua os valores de exemplo pelos valores reais que você copiou

## Passo 6: Reiniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

## Passo 7: Testar o Feedback

1. Abra o aplicativo
2. Clique no botão de feedback (ícone de mensagem flutuante)
3. Preencha o formulário e envie
4. Verifique o email calisproapp@gmail.com

## Variáveis Disponíveis no Template

As seguintes variáveis estão disponíveis para uso no template:

- `{{user_id}}` - ID do usuário no Firebase
- `{{user_email}}` - Email do usuário
- `{{user_name}}` - Nome do usuário
- `{{feedback_type}}` - Tipo de feedback (Bug, Pergunta, Sugestão, Contato)
- `{{message}}` - Mensagem do feedback
- `{{created_at}}` - Data e hora de criação
- `{{to_email}}` - Email de destino (calisproapp@gmail.com)

## Limites da Conta Gratuita

O plano gratuito do EmailJS permite:
- 200 emails por mês
- 2 serviços de email
- Templates ilimitados

Se precisar de mais, considere fazer upgrade para um plano pago.

## Solução de Problemas

### Email não está sendo enviado

1. Verifique se as variáveis de ambiente estão corretas
2. Verifique o console do navegador para erros
3. Confirme que o serviço do Gmail está conectado no EmailJS
4. Verifique se você não excedeu o limite de emails do mês

### Email está indo para spam

1. No EmailJS, vá para "Email Services"
2. Configure o SPF e DKIM do seu domínio (se aplicável)
3. Peça aos destinários para marcar seus emails como "Não é spam"

## Recursos Adicionais

- [Documentação do EmailJS](https://www.emailjs.com/docs/)
- [Exemplos de Templates](https://www.emailjs.com/docs/examples/)
- [SDK do Browser](https://www.emailjs.com/docs/sdk/send/)
