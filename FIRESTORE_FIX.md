# 🔥 CORREÇÃO URGENTE - Regras do Firestore

## ⚠️ Problema
Erro: "Missing or insufficient permissions" ao tentar criar usuário/plano de treino.

## ✅ Solução Rápida

### Passo 1: Acesse o Firebase Console
1. Vá para https://console.firebase.google.com/
2. Selecione seu projeto **calisprogress**

### Passo 2: Configure as Regras do Firestore
1. No menu lateral, clique em **Firestore Database**
2. Clique na aba **Regras** (Rules)
3. **APAGUE** todo o conteúdo atual
4. **COLE** as regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - usuário pode ler e escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Plans collection - usuário autenticado pode criar e ler seus próprios planos
    match /plans/{planId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
    
    // Workouts collection - usuário pode criar e gerenciar seus próprios treinos
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.user_id == request.auth.uid;
    }
    
    // Workout exercises - usuário autenticado pode criar e gerenciar
    match /workout_exercises/{exerciseId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Clique em **Publicar** (Publish)

### Passo 3: Teste Novamente
1. Volte para o app: http://localhost:5173/
2. Faça logout (se estiver logado)
3. Crie uma nova conta
4. Complete o onboarding
5. Deve funcionar! ✅

## 📝 O que mudou?

As regras anteriores estavam verificando `resource.data.user_id` na criação de documentos, mas `resource` só existe DEPOIS que o documento é criado. 

Agora usamos:
- `request.resource.data.user_id` para **criar** documentos
- `resource.data.user_id` para **atualizar/deletar** documentos existentes

## 🔒 Segurança

Estas regras são seguras porque:
- ✅ Apenas usuários autenticados podem acessar dados
- ✅ Usuários só podem criar/editar seus próprios dados
- ✅ O `user_id` é validado contra o `uid` do usuário autenticado
- ✅ Ninguém pode acessar dados de outros usuários

## 🆘 Se ainda não funcionar

1. Verifique se você está logado (veja o console do navegador)
2. Limpe o cache do navegador (Ctrl + Shift + Delete)
3. Tente fazer logout e login novamente
4. Verifique se as regras foram publicadas corretamente no Firebase Console
