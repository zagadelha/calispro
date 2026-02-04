# Como Testar o Sistema de Feedback por Email

## Usando o Painel Administrativo

### Passo 1: Acessar o Painel Admin

1. Faça login no aplicativo
2. Navegue até o **Dashboard**
3. No ambiente de desenvolvimento, role até o final da página
4. Clique em **"📊 Painel Administrativo"**

### Passo 2: Exibir o Teste de EmailJS

1. No painel administrativo, role até a seção **"Diagnóstico de Email (Feedback)"**
2. Clique no botão **"Exibir Teste de EmailJS"** (azul/roxo)
3. Um componente de diagnóstico aparecerá no canto inferior direito da tela

### Passo 3: Executar o Teste

1. No componente de diagnóstico, clique em **"Testar EmailJS"**
2. Aguarde alguns segundos enquanto o teste é executado
3. Os resultados aparecerão em seções expansíveis:
   - **✅ TESTE PASSOU** ou **❌ TESTE FALHOU**
   - **📋 Configuração**: Mostra os IDs e chaves configuradas
   - **✓ Validação**: Verifica se as configurações são válidas
   - **📨 Resposta** ou **⚠️ Erro**: Detalhes do resultado
   - **📡 Rede**: Status da conexão

### Passo 4: Copiar Resultados (Opcional)

1. Clique em **"📋 Copiar Resultado"** para copiar todos os dados
2. Cole em um arquivo de texto ou envie para análise

### Passo 5: Ocultar o Componente

1. Volte ao painel administrativo
2. Clique em **"Ocultar Teste de EmailJS"** para remover o componente

---

## Interpretando os Resultados

### ✅ Teste Bem-Sucedido

Se você ver **"✅ TESTE PASSOU"**:
- O EmailJS está configurado corretamente
- O email de teste foi enviado
- Verifique a caixa de entrada de `calisproapp@gmail.com`

### ❌ Teste Falhou

Se você ver **"❌ TESTE FALHOU"**, verifique o erro:

#### **Erro: "EmailJS configuration invalid"**
- **Causa**: Variáveis de ambiente não configuradas
- **Solução**: Configure as variáveis no `.env.local` (dev) ou no painel de hospedagem (prod)

#### **Erro: "Timeout: Email demorou muito para enviar"**
- **Causa**: Problema de rede ou EmailJS não responde
- **Solução**: Verifique sua conexão de internet e tente novamente

#### **Status 400**
- **Causa**: Service ID ou Template ID incorretos
- **Solução**: Verifique as configurações no EmailJS Dashboard

#### **Status 403**
- **Causa**: Domínio não autorizado
- **Solução**: Adicione o domínio em "Allowed Origins" no EmailJS

---

## Testando em Produção

### Método 1: Usar o Painel Admin em Produção

1. Acesse o app em produção
2. Faça login com uma conta admin
3. Navegue para `/admin`
4. Siga os passos acima

### Método 2: Usar o Console do Navegador

Se quiser acessar os logs detalhados:

#### Android (Chrome):
1. Conecte o celular ao PC via USB
2. Ative "Depuração USB" nas opções de desenvolvedor
3. No Chrome do PC, acesse `chrome://inspect`
4. Clique em "Inspect" no seu dispositivo

#### iPhone (Safari):
1. No iPhone: **Ajustes → Safari → Avançado → Web Inspector**
2. No Mac: **Safari → Desenvolver → [Seu iPhone] → [Seu App]**

---

## Problemas Comuns

### O botão não aparece
- Verifique se você está na rota `/admin`
- Recarregue a página

### O componente não abre
- Verifique o console do navegador para erros
- Certifique-se de que o arquivo `EmailJSDiagnostic.jsx` existe

### O teste sempre falha
- Verifique as variáveis de ambiente
- Confirme que as chaves do EmailJS estão corretas
- Verifique se o domínio está autorizado

---

## Dicas

- **Use em Dev e Prod**: O componente funciona em ambos os ambientes
- **Salve os Resultados**: Copie e salve os resultados para comparar testes
- **Teste Após Deploy**: Sempre teste após fazer deploy para produção
- **Verifique o Email**: Confira se o email chegou em `calisproapp@gmail.com`

---

**Última Atualização**: 27 de Janeiro de 2026
