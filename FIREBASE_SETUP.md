# Guia de Configuração do Firebase

Este guia detalha passo a passo como configurar o Firebase para o CalisProgress.

## 1. Criar Projeto no Firebase

1. Acesse https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto: `calisprogress` (ou outro nome de sua preferência)
4. Aceite os termos e clique em "Continuar"
5. Desabilite o Google Analytics (opcional para este projeto)
6. Clique em "Criar projeto"
7. Aguarde a criação e clique em "Continuar"

## 2. Configurar Authentication

### 2.1 Ativar Email/Password

1. No menu lateral, clique em "Authentication"
2. Clique em "Começar" (se for a primeira vez)
3. Vá na aba "Sign-in method"
4. Clique em "Email/Password"
5. Ative a primeira opção "Email/Password"
6. Clique em "Salvar"

### 2.2 Ativar Google Sign-In

1. Na mesma tela "Sign-in method"
2. Clique em "Google"
3. Ative o provedor
4. Selecione um email de suporte do projeto
5. Clique em "Salvar"

## 3. Configurar Cloud Firestore

### 3.1 Criar Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Selecione "Iniciar no modo de teste" (para desenvolvimento)
4. Escolha a localização mais próxima (ex: southamerica-east1 para Brasil)
5. Clique em "Ativar"

### 3.2 Configurar Regras de Segurança

1. Vá na aba "Regras"
2. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - usuário só pode ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Plans collection - usuário autenticado pode ler/escrever
    match /plans/{planId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      resource.data.user_id == request.auth.uid;
    }
    
    // Workouts collection - usuário só pode acessar seus próprios treinos
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      resource.data.user_id == request.auth.uid;
    }
    
    // Workout exercises - usuário autenticado pode ler/escrever
    match /workout_exercises/{exerciseId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em "Publicar"

**IMPORTANTE**: Essas regras são para desenvolvimento. Para produção, você deve implementar regras mais restritivas.

## 4. Obter Credenciais do Projeto

1. Clique no ícone de engrenagem ⚙️ ao lado de "Visão geral do projeto"
2. Clique em "Configurações do projeto"
3. Role até a seção "Seus aplicativos"
4. Clique no ícone `</>` (Web)
5. Digite um apelido para o app: `calisprogress-web`
6. **NÃO** marque "Configurar Firebase Hosting"
7. Clique em "Registrar app"
8. Copie o objeto `firebaseConfig` que aparece

Exemplo do que você verá:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "calisprogress-xxxxx.firebaseapp.com",
  projectId: "calisprogress-xxxxx",
  storageBucket: "calisprogress-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 5. Configurar no Projeto

1. Abra o arquivo `src/config/firebase.js`
2. Substitua os valores placeholder pelas suas credenciais:

```javascript
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "COLE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "COLE_SEU_PROJECT_ID_AQUI",
  storageBucket: "COLE_SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "COLE_SEU_APP_ID_AQUI"
};
```

3. Salve o arquivo

## 6. Testar a Configuração

1. Execute o projeto:
```bash
npm run dev
```

2. Acesse http://localhost:5173

3. Tente criar uma conta:
   - Clique em "Cadastre-se"
   - Preencha os dados
   - Clique em "Criar Conta"

4. Se tudo estiver correto:
   - Você será redirecionado para o onboarding
   - No Firebase Console > Authentication, você verá o usuário criado
   - No Firestore Database, você verá a collection `users` criada

## 7. Verificar Collections Criadas

Após completar o onboarding, você deve ver as seguintes collections no Firestore:

- **users**: Dados do perfil do usuário
- **plans**: Planos de treino gerados
- **workouts**: Treinos individuais
- **workout_exercises**: Exercícios de cada treino

## 8. Configuração de Produção (Opcional)

Para deploy em produção:

1. Altere as regras do Firestore para modo de produção
2. Configure domínios autorizados em Authentication > Settings
3. Ative o Firebase Hosting (opcional)
4. Configure variáveis de ambiente para as credenciais

## Troubleshooting

### Erro: "Firebase: Error (auth/unauthorized-domain)"

**Solução**: 
1. Vá em Authentication > Settings
2. Na seção "Authorized domains"
3. Adicione `localhost` e seu domínio de produção

### Erro: "Missing or insufficient permissions"

**Solução**: 
1. Verifique se as regras do Firestore estão corretas
2. Certifique-se de que o usuário está autenticado
3. Verifique se o `user_id` nos documentos corresponde ao `uid` do usuário

### Erro ao fazer login com Google

**Solução**:
1. Verifique se o Google Sign-in está ativado em Authentication
2. Certifique-se de ter selecionado um email de suporte
3. Verifique se o domínio está autorizado

## Suporte

Para mais informações, consulte a documentação oficial:
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
