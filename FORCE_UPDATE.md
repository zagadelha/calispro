# Sistema de Atualização do CalisPro

## Descrição

O CalisPro possui dois mecanismos para atualizar o aplicativo (PWA):

1. **Verificação Manual (Perfil)**: Permite que usuários verifiquem e instalem atualizações manualmente
2. **Atualização Forçada (Admin)**: Permite que administradores forcem a limpeza de caches

## Localização

### Verificação Manual de Atualização
- **Tela**: Perfil do Usuário (`/profile`)
- **Localização**: Na seção "Versão" no rodapé do perfil
- **Botão**: "Verificar Atualização" com ícone de refresh

### Atualização Forçada (Admin)
- **Tela**: Painel Administrativo (`/admin`)
- **Seção**: "Manutenção do Sistema"
- **Botão**: "Forçar Atualização de Apps Instalados"

## Verificação Manual de Atualização (Perfil)

### Como Funciona

1. **Usuário clica em "Verificar Atualização"**: O botão está localizado próximo à versão do app na tela de perfil
2. **Verificação**: O sistema busca o `package.json` do servidor para comparar versões
3. **Comparação**: Compara a versão local (`CURRENT_VERSION`) com a versão remota
4. **Resultados possíveis**:
   - **Nova versão disponível**: Exibe diálogo perguntando se deseja atualizar agora
   - **Versão atual**: Exibe mensagem informando que já está na versão mais recente

### Fluxo da Atualização Manual

```javascript
// 1. Verificar versão remota
const response = await fetch(`/package.json?t=${Date.now()}`, {
    cache: 'no-cache'
});
const data = await response.json();
const remoteVersion = data.version;

// 2. Comparar versões
if (remoteVersion !== CURRENT_VERSION) {
    // 3. Perguntar ao usuário
    const shouldUpdate = confirm(`Nova versão disponível: v${remoteVersion}...`);
    
    if (shouldUpdate) {
        // 4. Instalar atualização
        handleInstallUpdate();
    }
}
```

### Estados do Botão

- **Normal**: "Verificar Atualização" com ícone estático
- **Verificando**: "Verificando..." com ícone girando
- **Nova versão detectada**: Badge verde "Nova: vX.X.X" aparece ao lado da versão

### Logs

Todos os passos são logados com o prefixo `[CheckUpdate]` e `[InstallUpdate]`:

```
[CheckUpdate] Verificando atualizações...
[CheckUpdate] Versão atual: 1.0.0
[CheckUpdate] Versão remota: 1.1.0
[InstallUpdate] Iniciando atualização...
[InstallUpdate] Desregistrando 1 service worker(s)...
[InstallUpdate] Limpando 3 cache(s)...
```

## Atualização Forçada (Admin)

## Como Funciona

Quando o botão "Forçar Atualização de Apps Instalados" é clicado:

1. **Confirmação**: Um diálogo de confirmação é exibido ao usuário
2. **Desregistro de Service Workers**: Todos os service workers registrados são desregistrados
3. **Limpeza de Caches**: Todos os caches do navegador são limpos
4. **Reload Forçado**: A página é recarregada forçando o download da versão mais recente do servidor

## Quando Usar

Use essa funcionalidade quando:

- Uma nova versão crítica foi publicada em produção
- Há bugs na versão em cache que precisam ser corrigidos urgentemente
- Mudanças importantes no service worker foram feitas
- Deseja garantir que todos os usuários estejam na versão mais recente

## Processo de Atualização

```javascript
// 1. Desregistrar service workers
const registrations = await navigator.serviceWorker.getRegistrations();
for (const registration of registrations) {
    await registration.unregister();
}

// 2. Limpar todos os caches
const cacheNames = await caches.keys();
for (const cacheName of cacheNames) {
    await caches.delete(cacheName);
}

// 3. Forçar reload
window.location.reload(true);
```

## O que Acontece com os Usuários

Após clicar no botão de atualização forçada:

1. **Usuários com app aberto**: Na próxima vez que recarregarem ou abrirem o app, receberão a versão mais recente
2. **Novos usuários**: Sempre receberão a versão mais recente instalada
3. **Caches antigos**: Serão completamente removidos e baixados novamente

## Logs e Debugging

Todos os passos do processo de atualização são logados no console com o prefixo `[ForceUpdate]`:

```
[ForceUpdate] Unregistering 1 service worker(s)...
[ForceUpdate] Service worker unregistered
[ForceUpdate] Clearing 3 cache(s)...
[ForceUpdate] Cache cleared: workbox-precache-v2
[ForceUpdate] Cache cleared: workbox-runtime
[ForceUpdate] Cache cleared: images-cache
```

## Tratamento de Erros

Se algo der errado durante o processo:
- Um erro será logado no console: `[ForceUpdate] Error during force update`
- Um alerta será exibido ao usuário com a mensagem de erro
- O processo será interrompido de forma segura

## Considerações de Segurança

- O botão está protegido na área administrativa
- Requer confirmação explícita do usuário antes de executar
- Apenas afeta a sessão atual do administrador
- Logs detalhados facilitam auditoria e debugging

## Sistema de Versões

O CalisPro também possui um sistema automático de verificação de versões (`VersionChecker.jsx`) que:
- Verifica novas versões a cada 30 minutos
- Exibe notificações aos usuários quando uma nova versão está disponível
- Permite que usuários atualizem voluntariamente

A funcionalidade de **Forçar Atualização** é complementar e serve para casos urgentes onde não é possível esperar pela atualização automática.

## Arquivos Modificados

### Verificação Manual (Perfil)
- `src/pages/Profile.jsx`: Implementação do botão e funções de verificação e instalação de atualização
- `src/index.css`: Estilos CSS para o botão de verificação, badge de nova versão e animações

### Atualização Forçada (Admin)
- `src/pages/AdminDashboard.jsx`: Implementação do botão e função de atualização forçada
