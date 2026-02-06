# 🔧 Configuração de Ambientes (Dev/Prod)

Este documento explica como configurar ambientes separados de desenvolvimento e produção para o CalisPro.

## 📋 Por que separar ambientes?

- **Segurança**: Dados de produção não são afetados por testes
- **Liberdade**: Você pode fazer testes destrutivos sem medo
- **Time Travel**: A funcionalidade de "viagem no tempo" só afeta dados de dev
- **Deploy seguro**: Não há risco de alterar dados de usuários reais

## 🛠️ Passo a Passo

### 1. Criar Projeto Firebase de Desenvolvimento

1. Acesse https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome: `calisprogress-dev` (ou similar)
4. Desabilite Google Analytics (opcional para dev)
5. Clique em **"Criar projeto"**

### 2. Configurar Authentication no Projeto Dev

1. Vá em **Authentication > Sign-in method**
2. Ative **Email/Password**
3. Ative **Google** (opcional)
4. Em **Settings > Authorized domains**, adicione `localhost`

### 3. Configurar Firestore no Projeto Dev

1. Vá em **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Selecione a mesma região do projeto de produção
4. Configure as regras (copie de `firestore.rules`)

### 4. Configurar Storage no Projeto Dev

1. Vá em **Storage**
2. Clique em **"Começar"**
3. Configure as regras (copie de `storage.rules`)

### 5. Obter Credenciais do Projeto Dev

1. Vá em **Project Settings** (ícone de engrenagem)
2. Em **"Seus apps"**, clique em **Web** (`</>`)
3. Copie as credenciais

### 6. Configurar Arquivo `.env.development`

Edite o arquivo `.env.development` com as credenciais do projeto de **desenvolvimento**:

```env
VITE_FIREBASE_API_KEY=SUA_API_KEY_DEV
VITE_FIREBASE_AUTH_DOMAIN=calisprogress-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=calisprogress-dev
VITE_FIREBASE_STORAGE_BUCKET=calisprogress-dev.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=SEU_MESSAGING_ID_DEV
VITE_FIREBASE_APP_ID=SEU_APP_ID_DEV
VITE_APP_ENV=development
```

### 7. Verificar Arquivo `.env.production`

O arquivo `.env.production` já contém as credenciais de produção:

```env
VITE_FIREBASE_PROJECT_ID=calisprogress
# ... outras credenciais de prod
VITE_APP_ENV=production
```

## 🚀 Como Funciona

O Vite carrega automaticamente os arquivos corretos:

| Comando | Arquivo Carregado | Ambiente |
|---------|-------------------|----------|
| `npm run dev` | `.env.development` | Desenvolvimento |
| `npm run build` | `.env.production` | Produção |
| `npm run preview` | `.env.production` | Preview local |

> **Fallback**: Se o arquivo específico não existir, o Vite usa `.env`

## 🔍 Indicador Visual

Durante o desenvolvimento (`npm run dev`), um badge no canto inferior esquerdo mostra:

- 🔧 **DEV DB** (verde): Usando banco de dados de desenvolvimento
- ⚠️ **PROD DB** (vermelho): Usando banco de dados de produção

Este badge **NÃO aparece** em produção.

## ⚠️ Cuidados Importantes

1. **NUNCA** commite arquivos `.env.*` com credenciais reais
2. **Verifique** o badge antes de fazer testes destrutivos
3. **Deploy das regras** deve ser feito separadamente em cada projeto:
   ```bash
   # Para dev
   npx firebase-tools use calisprogress-dev
   npx firebase-tools deploy --only firestore:rules,storage
   
   # Para prod
   npx firebase-tools use calisprogress
   npx firebase-tools deploy --only firestore:rules,storage
   ```

## 📁 Estrutura de Arquivos

```
calispro/
├── .env.example        # Template (commitado)
├── .env.development    # Credenciais dev (NÃO commitado)
├── .env.production     # Credenciais prod (NÃO commitado)
└── .env                # Fallback (NÃO commitado)
```

## 🔐 Variáveis na Vercel

Para produção na Vercel, configure as variáveis em:
**Settings > Environment Variables**

Adicione todas as variáveis do `.env.production`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_APP_ENV=production`
