# Sistema de Atualização Automática de Cache

## O que foi implementado?

Foi adicionado um sistema **automático** de limpeza de cache que detecta quando há uma nova versão do app em produção e força a atualização de todos os usuários, incluindo dispositivos móveis.

---

## Como Funciona?

### 1. **Detecção Automática de Versão**

O componente `VersionChecker` verifica a cada 30 minutos se há uma nova versão disponível:

- Busca o `package.json` do servidor de produção
- Compara a versão remota com a versão local do app
- Se forem diferentes, dispara o processo de atualização

### 2. **Limpeza Automática de Cache**

Quando uma nova versão é detectada:

1. **Notificação**: Mostra um banner informando sobre a atualização
2. **Aguarda 2 segundos**: Dá tempo para o usuário ver a notificação
3. **Limpa automaticamente**:
   - Desregistra todos os service workers
   - Remove todos os caches do navegador/PWA
   - Armazena a versão limpa no localStorage (previne loops)
4. **Recarrega**: Força um reload completo da página com a nova versão

### 3. **Prevenção de Loops**

O sistema usa `calispro_last_cleared_version` no localStorage para garantir que:
- Cada versão só é limpa uma vez
- Não há loops infinitos de reload
- A limpeza só acontece quando necessário

---

## Benefícios

✅ **Funciona em Produção**: Usuários recebem atualizações automaticamente  
✅ **Funciona em Mobile**: PWAs instalados em celulares são atualizados também  
✅ **Resolve Erros de Cache**: Erros como `isPerformanceCheck is not defined` são eliminados  
✅ **Sem Intervenção Manual**: Não precisa do painel admin ou acesso especial  
✅ **Experiência Suave**: Usuário vê notificação antes do reload  

---

## Fluxo Passo a Passo (Exemplo Prático)

### Cenário: Usuário com versão 1.0.10 no celular

1. **Deploy da v1.0.11**:
   - Você faz deploy da nova versão para produção
   - O `package.json` no servidor agora tem `"version": "1.0.11"`

2. **Usuário abre o app**:
   - O `VersionChecker` executa automaticamente
   - Detecta: Local = `1.0.10`, Remoto = `1.0.11`
   - Verifica: `calispro_last_cleared_version` !== `1.0.11`

3. **Processo Automático**:
   ```
   [0s]  ✅ Mostra notificação: "Nova versão disponível: 1.0.11"
   [0s]  📝 Salva localStorage('calispro_last_cleared_version', '1.0.11')
   [2s]  🧹 Limpa todos os service workers
   [2s]  🧹 Limpa todos os caches
   [2s]  🔄 Recarrega: window.location.href = '/?v=1.0.11&_refresh=...'
   ```

4. **Resultado**:
   - App recarrega com código limpo da v1.0.11
   - Erro `isPerformanceCheck is not defined` desaparece
   - Usuário está atualizado!

---

## Versionamento

Para usar este sistema corretamente:

### Antes de cada deploy:

1. **Incremente a versão** em `package.json`:
   ```json
   {
     "version": "1.0.12"  // ← Mude isso antes do deploy
   }
   ```

2. **Commit e Push**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.12"
   git push
   ```

3. **Deploy para Produção**:
   - Vercel/Netlify irá fazer o build automaticamente
   - O novo `package.json` estará disponível no servidor

### Após o deploy:

- **Nada!** O sistema faz tudo automaticamente
- Todos os usuários serão atualizados na próxima vez que abrirem o app

---

## Monitoramento

### Logs no Console (Produção):

Você pode ver os logs do processo se abrir o console:

```
[VersionChecker] Current version: 1.0.10
[VersionChecker] Remote version: 1.0.11
[VersionChecker] 🚨 Version mismatch detected! Auto-clearing cache...
[VersionChecker] 🧹 Clearing all caches...
[VersionChecker] Unregistering 1 service worker(s)...
[VersionChecker] Clearing 3 cache(s)...
[VersionChecker] ✅ All caches cleared successfully
```

### Notificação Visual:

O usuário verá por 2 segundos:

```
┌─────────────────────────────────────┐
│ 🎉 Nova versão disponível!          │
│                                     │
│ Atualizar para versão 1.0.11       │
│                                     │
│ [Atualizar Agora]  [✕]             │
└─────────────────────────────────────┘
```

Depois disso, o app recarrega automaticamente.

---

## Casos Especiais

### E se o usuário clicar em "✕" (Dismiss)?

- A notificação desaparece
- Mas **NÃO** limpa o cache automaticamente
- **PORÉM**: O banner vai reaparecer na próxima vez que abrir o app
- Solução: O usuário pode clicar em "Atualizar Agora" quando quiser

### E se houver erro de rede?

- O `checkVersion()` falhará silenciosamente
- Tentará novamente em 30 minutos
- Não afeta o funcionamento do app

### E se eu incrementar de 1.0.10 para 2.0.0?

- Funciona normalmente!
- O sistema compara strings: `2.0.0` !== `1.0.10`
- Limpa e recarrega corretamente

---

## Testando em Desenvolvimento

⚠️ **IMPORTANTE**: Este sistema **NÃO funciona em DEV**!

```javascript
if (import.meta.env.DEV) {
    console.log('[VersionChecker] Skipping version check in development');
    return;
}
```

Para testar:
1. Faça um build de produção: `npm run build`
2. Sirva localmente: `npm run preview`
3. Abra em `http://localhost:4173`
4. Modifique a versão e rebuild
5. Recarregue a página e veja o processo acontecer

---

## Solução Imediata para o Erro Atual

### O que vai acontecer quando você fizer deploy da v1.0.11:

1. Todos os usuários que abrirem o app verão a notificação
2. Após 2 segundos, o cache será limpo automaticamente
3. O app recarregará com o código correto
4. O erro `isPerformanceCheck is not defined` **desaparecerá**

### Timeline:

```
Agora:        v1.0.10 (com erro em cache)
Deploy v1.0.11: Deploy com código corrigido
Usuário abre app: Detecta v1.0.11
+2 segundos:  Limpa cache automaticamente
+3 segundos:  Recarrega com v1.0.11 limpa
Resultado:    ✅ Erro corrigido!
```

---

## Arquivo Modificado

- **`src/components/VersionChecker.jsx`**: Adicionada limpeza automática de cache
- **`package.json`**: Versão incrementada para `1.0.11`

---

**Última Atualização**: 27 de Janeiro de 2026  
**Versão do Sistema**: 1.0.11
