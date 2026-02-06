# CalisPro - PWA de Calistenia

Um aplicativo web progressivo (PWA) completo para acompanhamento de treinos de calistenia, com planos personalizados e tracking de evolução.

## 🚀 Funcionalidades

### ✅ Implementadas

- **Autenticação Completa**
  - Login/Cadastro com Email e Senha
  - Login com Google OAuth
  - Proteção de rotas
  - Gerenciamento de sessão

- **Onboarding Personalizado**
  - Coleta de perfil do usuário (nível, objetivo, frequência)
  - Seleção de equipamentos disponíveis
  - Registro de restrições físicas

- **Geração Automática de Planos**
  - Planos personalizados baseados no perfil
  - Exercícios adaptados ao nível (Iniciante/Intermediário/Avançado)
  - Splits de treino inteligentes (Full Body ou ABC/D)

- **Dashboard Interativo**
  - Visualização do treino do dia
  - Estatísticas rápidas (streak, treinos da semana)
  - Navegação intuitiva

- **Execução de Treinos**
  - Marcação de exercícios concluídos
  - Campo para observações
  - Feedback de dificuldade (Fácil/Ok/Difícil)

- **Perfil do Usuário**
  - Visualização e edição de dados
  - Upload de foto de perfil
  - Recalcular plano de treino
  - Avatar personalizado com foto ou inicial

- **Progresso e Histórico**
  - Estatísticas detalhadas (streak, total, mensal)
  - Histórico completo de treinos
  - Visualização de feedback de dificuldade

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite 5
- **Autenticação**: Firebase Auth
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage (fotos de perfil)
- **Styling**: CSS moderno com design system premium
- **Routing**: React Router DOM
- **Date Handling**: date-fns

## 📋 Pré-requisitos

- Node.js 16+ instalado
- Conta no Firebase (gratuita)

## 🔧 Configuração

### 1. Clone e Instale Dependências

```bash
cd calispro
npm install
```

### 2. Configure o Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication**:
   - Vá em Authentication > Sign-in method
   - Ative "Email/Password"
   - Ative "Google"
4. Ative **Cloud Firestore**:
   - Vá em Firestore Database
   - Crie um banco de dados em modo de teste
5. Configure as regras do Firestore (veja `firestore.rules` para versão completa):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - apenas o próprio usuário pode ler/escrever
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Plans - apenas o dono do plano pode acessar
    match /plans/{planId} {
      allow read: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
    
    // Workouts - apenas o dono pode acessar
    match /workouts/{workoutId} {
      allow read: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
    
    // Workout exercises - usuário autenticado (vinculado ao workout)
    match /workout_exercises/{exerciseId} {
      allow read, write: if request.auth != null;
    }
    
    // History - apenas o dono pode acessar
    match /history/{historyId} {
      allow read: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
  }
}
```

> ⚠️ **IMPORTANTE**: Consulte o arquivo `firestore.rules` para a versão completa com validações de feedback.


6. Obtenha as credenciais do projeto:
   - Vá em Project Settings (ícone de engrenagem)
   - Em "Your apps", clique em "Web" (</>)
   - Copie as configurações do Firebase

### 3. Configure as Variáveis de Ambiente

Edite o arquivo `src/config/firebase.js` e substitua as credenciais:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

### 4. Execute o Projeto

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📱 Estrutura do Projeto

```
calispro/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx    # Proteção de rotas
│   ├── config/
│   │   └── firebase.js            # Configuração Firebase
│   ├── contexts/
│   │   └── AuthContext.jsx        # Context de autenticação
│   ├── pages/
│   │   ├── Login.jsx              # Página de login
│   │   ├── Signup.jsx             # Página de cadastro
│   │   ├── Onboarding.jsx         # Onboarding inicial
│   │   ├── Dashboard.jsx          # Dashboard principal
│   │   ├── WorkoutExecution.jsx   # Execução de treino
│   │   ├── Profile.jsx            # Perfil do usuário
│   │   └── Progress.jsx           # Progresso e histórico
│   ├── utils/
│   │   └── workoutGenerator.js    # Gerador de planos
│   ├── App.jsx                    # Componente principal
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Estilos globais
└── package.json
```

## 🎨 Design System

O app utiliza um design system premium com:
- **Tema Dark** moderno e elegante
- **Gradientes** vibrantes (roxo/azul)
- **Animações** suaves e micro-interações
- **Tipografia** Inter (Google Fonts)
- **Componentes** reutilizáveis e consistentes
- **Responsivo** mobile-first

## 🔐 Modelagem de Dados

### Collections no Firestore

**users**
```javascript
{
  name: string,
  email: string,
  photoURL: string,
  experience_level: string,
  goal: string,
  days_per_week: string,
  equipment: array,
  limitations: string,
  current_plan_id: string,
  profile_completed: boolean,
  created_at: timestamp
}
```

**plans**
```javascript
{
  user_id: string,
  name: string,
  level: string,
  goal: string,
  days_per_week: string,
  created_at: timestamp,
  active: boolean
}
```

**workouts**
```javascript
{
  user_id: string,
  plan_id: string,
  date: string,
  day_label: string,
  name: string,
  status: string,
  difficulty_feedback: string,
  notes: string,
  started_at: timestamp,
  completed_at: timestamp
}
```

**workout_exercises**
```javascript
{
  workout_id: string,
  exercise_name: string,
  muscle_group: string,
  target_sets: number,
  target_reps: number,
  order_index: number,
  completed: boolean
}
```

## 🚀 Próximos Passos (Futuras Implementações)

- [ ] Edição de treinos (adicionar/remover exercícios)
- [ ] Sistema de progressão automática
- [ ] Gráficos de evolução
- [ ] PWA com service worker (funcionalidade offline)
- [ ] Notificações push
- [ ] Sistema de assinatura/monetização
- [ ] Imagens/vídeos dos exercícios
- [ ] Cronômetro de descanso entre séries
- [ ] Compartilhamento de treinos
- [ ] Comunidade e desafios

## 📝 Licença

Este projeto foi criado para fins educacionais e de demonstração.

## 👨‍💻 Autor

Desenvolvido com ❤️ usando React, Firebase e muito café ☕
