# Correção: Sistema de Versionamento Automático

## Problema Identificado

O app no celular não estava atualizando corretamente porque a versão estava **hardcoded** no código fonte (`CURRENT_VERSION = '1.0.0'`), mesmo após atualizar o `package.json` para `1.0.2`.

## Solução Implementada

### 1. Injeção Automática de Versão

Configuramos o Vite para injetar automaticamente a versão do `package.json` no código durante o build:

**`vite.config.js`**:
```javascript
const packageJson = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
  // ...
})
```

### 2. Atualização do VersionChecker

**`src/components/VersionChecker.jsx`**:
```javascript
// Antes (hardcoded):
const CURRENT_VERSION = '1.0.0';

// Depois (dinâmico):
const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.2';
```

### 3. Declaração de Tipos

Criado `src/vite-env.d.ts` para declarar a variável global injetada pelo Vite.

## Como Funciona Agora

1. **Durante o desenvolvimento (`npm run dev`)**:
   - A versão usa o fallback `'1.0.2'` (útil para testes)

2. **Durante o build (`npm run build`)**:
   - O Vite lê o `package.json`
   - Injeta a versão no código substituindo `__APP_VERSION__`
   - A versão é automaticamente sincronizada

3. **Após deploy**:
   - O código em produção terá a versão correta do `package.json`
   - Não é mais necessário atualizar manualmente o código

## Processo de Atualização Agora

### Passo 1: Atualizar Versão
```bash
# Edite package.json e mude a versão
"version": "1.0.3"  # Exemplo
```

### Passo 2: Build de Produção
```bash
npm run build
```

### Passo 3: Deploy
```bash
# Deploy da pasta dist/ para produção
# (Firebase, Vercel, Netlify, etc.)
```

### Passo 4: Verificação
- Usuários receberão notificação automática de nova versão
- Ou podem clicar em "Verificar Atualização" no perfil
- A versão será detectada corretamente

## Benefícios

✅ **Versionamento Automático**: Uma única fonte da verdade (package.json)
✅ **Sem Erros Humanos**: Não é mais necessário lembrar de atualizar manualmente
✅ **Build Consistente**: Versão sempre sincronizada entre package.json e código
✅ **Desenvolvimento Simplificado**: Fallback para testes locais

## Próximos Passos

1. **Fazer novo build de produção**:
   ```bash
   npm run build
   ```

2. **Fazer deploy da pasta `dist/`** para o servidor de produção

3. **Testar no celular**:
   - Abrir o app
   - Ir em Perfil
   - Clicar em "Verificar Atualização"
   - Agora deve detectar e instalar a versão 1.0.2 corretamente

## Verificação de Funcionamento

Após o build, você pode verificar se a versão foi injetada corretamente:

```bash
# Procurar por __APP_VERSION__ nos arquivos gerados
# Deve aparecer como "1.0.2" (ou a versão atual)
grep -r "1.0.2" dist/assets/*.js
```

## Arquivos Modificados

- ✅ `vite.config.js`: Adicionada injeção de versão
- ✅ `src/components/VersionChecker.jsx`: Usa versão injetada
- ✅ `src/vite-env.d.ts`: Declaração de tipos (novo arquivo)

## Notas Importantes

⚠️ **IMPORTANTE**: Sempre que mudar a versão no `package.json`, você DEVE fazer um novo build para produção. O servidor de desenvolvimento (`npm run dev`) usa o fallback e pode não refletir a mudança imediatamente.

⚠️ **DEPLOY**: Certifique-se de fazer deploy do novo build após atualizar a versão.
