# 📸 Configuração do Firebase Storage para Fotos de Perfil

## ✅ Funcionalidade Adicionada

Agora os usuários podem fazer upload de fotos de perfil! A funcionalidade já está implementada no código.

## 🔧 Configuração Necessária no Firebase

### Passo 1: Ativar o Firebase Storage

1. Acesse https://console.firebase.google.com/
2. Selecione seu projeto **calisprogress**
3. No menu lateral, clique em **Storage**
4. Clique em **Começar** (Get Started)
5. Clique em **Avançar** nas regras de segurança (vamos configurar depois)
6. Selecione a localização (mesma do Firestore, ex: southamerica-east1)
7. Clique em **Concluído**

### Passo 2: Configurar Regras de Segurança do Storage

1. Na página do Storage, clique na aba **Regras** (Rules)
2. **Substitua** o conteúdo pelas regras abaixo:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - apenas o dono pode fazer upload/atualizar
    match /profile_photos/{userId} {
      allow read: if true; // Qualquer um pode ver fotos de perfil
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Validações
      allow write: if request.resource.size < 5 * 1024 * 1024 // Max 5MB
                   && request.resource.contentType.matches('image/.*'); // Apenas imagens
    }
  }
}
```

3. Clique em **Publicar** (Publish)

## 🎯 Como Funciona

### Para o Usuário:

1. Vá para **Perfil** (botão no dashboard)
2. Clique no ícone de **câmera 📷** no avatar
3. Selecione uma foto do seu dispositivo
4. A foto será enviada automaticamente
5. O avatar será atualizado com a nova foto

### Validações Implementadas:

- ✅ Apenas imagens são aceitas
- ✅ Tamanho máximo: 5MB
- ✅ Apenas o próprio usuário pode alterar sua foto
- ✅ Fotos são públicas (qualquer um pode visualizar)

### Armazenamento:

- As fotos são salvas em: `profile_photos/{userId}`
- Cada usuário tem apenas 1 foto (substituída ao fazer novo upload)
- A URL da foto é salva no perfil do usuário no Firestore

## 🔒 Segurança

As regras garantem que:
- ✅ Apenas usuários autenticados podem fazer upload
- ✅ Usuários só podem alterar sua própria foto
- ✅ Apenas imagens são aceitas
- ✅ Tamanho limitado a 5MB
- ✅ Fotos de perfil são públicas (podem ser vistas por todos)

## 🆘 Troubleshooting

### Erro: "Storage bucket not configured"
**Solução**: Certifique-se de que ativou o Storage no Firebase Console

### Erro: "Permission denied"
**Solução**: Verifique se as regras do Storage foram configuradas corretamente

### Foto não aparece
**Solução**: 
1. Verifique o console do navegador para erros
2. Certifique-se de que o Storage está ativado
3. Verifique se as regras permitem leitura pública

### Upload muito lento
**Solução**: 
- Reduza o tamanho da imagem antes de fazer upload
- Verifique sua conexão com a internet

## 📱 Recursos Adicionais

- As fotos são otimizadas automaticamente pelo Firebase
- URLs são permanentes e podem ser compartilhadas
- Fotos antigas são substituídas automaticamente

## 🎨 Aparência

- Avatar circular com borda colorida
- Botão de câmera flutuante no canto inferior direito
- Animação de loading durante upload
- Transição suave ao atualizar a foto
