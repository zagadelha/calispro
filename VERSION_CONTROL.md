# Sistema de Controle de Versão - CalisPro

## Visão Geral

O CalisPro agora possui um sistema completo de controle de versão que permite aos usuários saberem quando uma nova versão do aplicativo está disponível em produção.

## Funcionalidades

### 1. Detecção Automática de Nova Versão
- O componente `VersionChecker` verifica a cada 30 minutos se há uma nova versão disponível
- A verificação compara a versão do código em execução com a versão em produção
- Apenas funciona em ambiente de produção (não em desenvolvimento)

### 2. Notificação ao Usuário
- Quando uma nova versão é detectada, uma notificação aparece no topo da tela
- A notificação é elegante com gradiente roxo e animação de slide-down
- O usuário pode:
  - **Atualizar Agora**: Limpa o cache e recarrega a página para obter a nova versão
  - **Dispensar**: Oculta a notificação até a próxima versão

### 3. Exibição da Versão no Perfil
- A versão atual do app é exibida no rodapé da tela de perfil
- Formato: "Versão: v1.0.0"

## Arquivos Modificados/Criados

### Novos Arquivos
1. **`src/components/VersionChecker.jsx`**
   - Componente principal que verifica e notifica sobre novas versões
   - Exporta `CURRENT_VERSION` para uso em outros componentes

### Arquivos Modificados
1. **`package.json`**
   - Versão atualizada de `0.0.0` para `1.0.0`

2. **`src/App.jsx`**
   - Adicionado `<VersionChecker />` para monitoramento global

3. **`src/pages/Profile.jsx`**
   - Adicionado display da versão atual no rodapé

4. **`src/index.css`**
   - Estilos CSS para a notificação de versão
   - Animações de slide-down e bounce

5. **`src/locales/*.json`** (pt, en, es)
   - Traduções para mensagens de versão:
     - `version.new_version_available`
     - `version.update_message`
     - `version.update_now`
     - `version.current_version`
     - `common.dismiss`
     - `profile.version`

6. **`vite.config.js`**
   - Plugin customizado para copiar `package.json` para a pasta `dist/` durante o build
   - Apenas a propriedade `version` é copiada por segurança

## Como Funciona

### Processo de Verificação
1. Quando o app carrega, o `VersionChecker` inicia
2. A cada 30 minutos, faz um fetch de `/package.json` com cache desabilitado
3. Compara a versão remota com a versão local (`CURRENT_VERSION`)
4. Se houver diferença, exibe a notificação

### Sistema de Dispensar
- Quando o usuário dispensa a notificação, a versão é salva no `localStorage`
- A notificação não aparece novamente para aquela versão específica
- Se uma nova versão for lançada, a notificação voltará a aparecer

### Build e Deploy
Durante o build de produção (`npm run build`):
1. O Vite compila o código
2. O plugin customizado copia `package.json` para `dist/`
3. Apenas `{ "version": "1.0.0" }` é incluído (segurança)

## Como Atualizar a Versão

1. Edite `package.json` e atualize o campo `version`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. Faça o build e deploy:
   ```bash
   npm run build
   ```

3. Deploy para produção (Vercel, Netlify, etc.)

4. Usuários que já estão com o app aberto verão a notificação na próxima verificação (até 30 min)

## Versionamento Semântico

Recomenda-se seguir o [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (ex: `1.2.3`)
  - **MAJOR**: Mudanças incompatíveis na API
  - **MINOR**: Novas funcionalidades compatíveis
  - **PATCH**: Correções de bugs compatíveis

Exemplos:
- `1.0.0` → versão inicial estável
- `1.1.0` → nova funcionalidade adicionada
- `1.1.1` → bug fix
- `2.0.0` → mudanças significativas/quebra de compatibilidade

## Testando Localmente

Para testar o sistema de versão:

1. Faça build da aplicação:
   ```bash
   npm run build
   ```

2. Sirva a pasta dist:
   ```bash
   npx serve dist
   ```

3. Acesse em `http://localhost:3000`

4. Altere a versão em `package.json`

5. Faça novo build e atualize

6. O app detectará a nova versão e mostrará a notificação

## Desabilitando em Desenvolvimento

O sistema está automaticamente desabilitado em ambiente de desenvolvimento (`import.meta.env.DEV`). Logs no console indicarão que a verificação foi pulada.

## Personalização

### Intervalo de Verificação
Edite a constante em `src/components/VersionChecker.jsx`:
```javascript
const VERSION_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutos
```

### Mensagens
Edite os arquivos de localização em `src/locales/`:
- `version.new_version_available`
- `version.update_message`
- `version.update_now`

---

**Criado em**: 27 de Janeiro de 2026  
**Versão Inicial**: 1.0.0
