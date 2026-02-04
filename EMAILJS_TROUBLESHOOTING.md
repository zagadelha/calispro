# Solucionando Erros de Feedback em Produção

## ⚠️ Problema: Funciona em Dev mas Falha em Produção

Este guia ajuda a resolver erros que aparecem apenas em produção (celular/PWA).

---

## Passo 1: Verificar Variáveis de Ambiente no Build

**IMPORTANTE**: As variáveis `VITE_*` precisam estar definidas **durante o build**, não apenas em `.env.local`.

### Opção A: Definir no Vercel/Netlify/Host

1. Acesse o painel do seu serviço de hospedagem (ex: Vercel)
2. Vá para **Settings → Environment Variables**
3. Adicione as variáveis:
   ```
   VITE_EMAILJS_SERVICE_ID = seu_service_id_real
   VITE_EMAILJS_TEMPLATE_ID = seu_template_id_real
   VITE_EMAILJS_PUBLIC_KEY = sua_public_key_real
   ```
4. **Rebuild** a aplicação

### Opção B: Build Local com Variáveis

```bash
# Windows PowerShell
$env:VITE_EMAILJS_SERVICE_ID="seu_service_id"
$env:VITE_EMAILJS_TEMPLATE_ID="seu_template_id"
$env:VITE_EMAILJS_PUBLIC_KEY="sua_public_key"
npm run build

# Linux/Mac
VITE_EMAILJS_SERVICE_ID=seu_service_id VITE_EMAILJS_TEMPLATE_ID=seu_template_id VITE_EMAILJS_PUBLIC_KEY=sua_public_key npm run build
```

---

## Passo 2: Configurar Domínios Permitidos no EmailJS

EmailJS pode bloquear requisições de domínios não autorizados.

1. Acesse [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Vá para **Account → Security**
3. Em **Allowed Origins**, adicione todos os domínios:
   ```
   http://localhost:5173
   https://seu-dominio.vercel.app
   https://seu-dominio.com
   ```
4. Salve as alterações

---

## Passo 3: Limpar Cache do PWA

Aplicativos PWA em celulares podem usar versões antigas em cache.

### No Celular (Android/iOS):

1. Abra as **Configurações do App**
2. Vá para **Armazenamento**
3. Clique em **Limpar Cache**
4. Clique em **Limpar Dados**
5. Reabra o app

### Forçar Atualização Programática:

Adicione este código temporariamente em `src/App.jsx`:

```javascript
// Forçar reload na próxima visita (temporário para debug)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}
```

---

## Passo 4: Verificar Logs no Console

### Acessar Console no Celular:

#### Android (Chrome):
1. Conecte o celular ao PC via USB
2. Ative **Depuração USB** nas opções de desenvolvedor
3. No Chrome do PC, acesse: `chrome://inspect`
4. Clique em **Inspect** no seu dispositivo

#### iPhone (Safari):
1. No iPhone: **Ajustes → Safari → Avançado → Web Inspector**
2. No Mac: **Safari → Desenvolver → [Seu iPhone] → [Seu App]**

### Verifique os logs:
- ✅ **"Enviando feedback via EmailJS..."** - Configuração OK
- ❌ **"EmailJS não configurado corretamente"** - Variáveis faltando
- ❌ **"Timeout: Email demorou muito"** - Problema de rede
- ❌ **Status 400** - Template ou Service ID incorreto
- ❌ **Status 403** - Domínio não permitido

---

## Passo 5: Testar com Script de Debug

Crie um arquivo temporário `test-emailjs.html` e abra no celular:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste EmailJS</title>
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
</head>
<body>
    <h1>Teste EmailJS em Produção</h1>
    <button onclick="testar()">Enviar Teste</button>
    <div id="resultado"></div>

    <script>
        async function testar() {
            const resultado = document.getElementById('resultado');
            resultado.innerHTML = 'Enviando...';
            
            try {
                const response = await emailjs.send(
                    'SEU_SERVICE_ID',  // Substitua aqui
                    'SEU_TEMPLATE_ID', // Substitua aqui
                    {
                        user_name: 'Teste',
                        user_email: 'teste@teste.com',
                        feedback_type: 'Teste',
                        message: 'Teste de produção',
                        to_email: 'calisproapp@gmail.com'
                    },
                    'SUA_PUBLIC_KEY'   // Substitua aqui
                );
                resultado.innerHTML = '✅ Sucesso! ' + JSON.stringify(response);
            } catch (error) {
                resultado.innerHTML = '❌ Erro: ' + JSON.stringify({
                    message: error.message,
                    status: error.status,
                    text: error.text
                }, null, 2);
            }
        }
    </script>
</body>
</html>
```

---

## Passo 6: Verificar Service Worker

O Service Worker pode estar interferindo.

Adicione em `vite.config.js`:

```javascript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      workbox: {
        // Não fazer cache de requisições para EmailJS
        navigateFallbackDenylist: [/emailjs\.com/],
        runtimeCaching: [{
          urlPattern: /emailjs\.com/,
          handler: 'NetworkOnly' // Sempre usar rede, nunca cache
        }]
      }
    })
  ]
});
```

---

## Checklist de Verificação

Antes de fazer deploy, verifique:

- [ ] Variáveis VITE_EMAILJS_* definidas no painel de hospedagem
- [ ] Domínio de produção adicionado em "Allowed Origins" do EmailJS
- [ ] Cache do navegador e PWA limpos
- [ ] Build gerado **após** configurar variáveis de ambiente
- [ ] Console do celular não mostra erro de configuração
- [ ] Template do EmailJS está ativo (não em rascunho)
- [ ] Service ID e Template ID estão corretos

---

## Erros Comuns e Soluções

### "Erro de configuração. Por favor, contate o suporte."
**Causa**: Variáveis de ambiente não foram incluídas no build  
**Solução**: Configure variáveis no painel de hospedagem e rebuild

### "Tempo esgotado. Verifique sua conexão e tente novamente."
**Causa**: Rede lenta ou EmailJS não responde  
**Solução**: Verifique conexão ou tente novamente mais tarde

### "Acesso negado. Verifique as configurações do EmailJS."
**Causa**: Domínio não está em "Allowed Origins"  
**Solução**: Adicione domínio nas configurações de segurança do EmailJS

### Email não chega (mas não dá erro)
**Causa**: Template inativo ou email indo para spam  
**Solução**: Ative o template e verifique pasta de spam

---

## Suporte Adicional

Se ainda tiver problemas:

1. Copie os logs do console (incluindo o JSON de erro)
2. Tire print do erro no celular
3. Verifique se `EMAILJS_CONFIG` está com valores corretos no código buildado:
   - Abra DevTools → Sources → encontre `emailjs.js`
   - Verifique se as variáveis foram substituídas

---

**Última Atualização**: 27 de Janeiro de 2026
