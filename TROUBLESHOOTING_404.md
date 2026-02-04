# Como Resolver Erro 404 no Telefone Após Atualização

## Problema
Ao tentar atualizar o app CalisPro no telefone, aparece um erro 404 (NOT_FOUND).

## Causa
Este erro ocorre quando o Service Worker do PWA tenta buscar arquivos que foram modificados ou removidos durante a atualização. O cache antigo ainda aponta para recursos que não existem mais.

## Solução Implementada

Foram adicionadas configurações do Workbox no `vite.config.js`:

1. **cleanupOutdatedCaches**: Remove automaticamente caches antigos
2. **skipWaiting**: Ativa o novo Service Worker imediatamente
3. **clientsClaim**: O novo SW assume controle de todas as páginas abertas
4. **navigateFallback**: Redireciona rotas não encontradas para `/index.html`
5. **runtimeCaching**: Estratégias de cache específicas para diferentes recursos

## Passos para os Usuários Resolverem no Telefone

### Opção 1: Limpar Cache do Navegador (Recomendado)
1. Abra as **Configurações** do seu navegador (Chrome/Safari)
2. Vá em **Privacidade** ou **Configurações do Site**
3. Encontre **calispro-app.web.app** na lista de sites
4. Toque em **Limpar dados** ou **Resetar permissões**
5. Feche completamente o navegador (não apenas a aba)
6. Abra novamente o app

### Opção 2: Forçar Atualização (Safari iOS)
1. Com o app aberto, puxe a tela para baixo para **atualizar**
2. Se não funcionar, feche o Safari completamente:
   - Deslize de baixo para cima (ou duplo clique no botão Home)
   - Deslize o Safari para cima para fechá-lo
3. Abra o Safari novamente e acesse o app

### Opção 3: Forçar Atualização (Chrome Android)
1. Abra o **Chrome**
2. Toque nos **três pontos** no canto superior direito
3. Selecione **Configurações** → **Privacidade e segurança**
4. Toque em **Limpar dados de navegação**
5. Selecione **Imagens e arquivos em cache**
6. Toque em **Limpar dados**
7. Abra o app novamente

### Opção 4: Desinstalar e Reinstalar (Última Opção)
⚠️ **Atenção**: Isso irá apagar dados locais não sincronizados!

1. Remova o ícone do app da tela inicial (pressione e segure → Remover)
2. Abra o navegador e acesse: https://calispro-app.web.app
3. Adicione novamente à tela inicial quando solicitado

## Para Deploy da Nova Versão

Após fazer o build e deploy da nova versão (v1.0.12):

```bash
npm run build
firebase deploy --only hosting
```

Os usuários que já têm o app instalado receberão a atualização automaticamente na próxima vez que:
- Abrirem o app com internet
- O Service Worker detectar a nova versão
- A atualização será aplicada automaticamente (graças ao `autoUpdate`)

## Prevenção de Problemas Futuros

Com as novas configurações do Workbox:
- ✅ Caches antigos são limpos automaticamente
- ✅ Atualizações são aplicadas sem precisar recarregar manualmente
- ✅ Erros 404 são redirecionados para a página inicial
- ✅ Recursos externos (Firebase Storage, Google Fonts) são cacheados adequadamente

## Monitoramento

Para verificar se o Service Worker está funcionando:
1. Abra DevTools (F12) no navegador
2. Vá na aba **Application** → **Service Workers**
3. Você deve ver o SW ativo e a versão correta

## Notas
- A primeira vez após o deploy pode levar alguns minutos para propagar o CDN
- Usuários com conexões lentas podem demorar mais para receber a atualização
- O erro 404 específico `cdg1::vvhnf-...` indica que é um problema de Edge/CDN, que será resolvido com a limpeza de cache
