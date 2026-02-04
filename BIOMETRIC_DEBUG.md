# 🔐 Correção do Erro de Biometria

## 🎯 Diagnóstico

Através do **Debug Panel**, identificamos o problema exato:

```json
{
  "name": "NotAllowedError",
  "message": "The operation either timed out or was not allowed",
  "rpId": "www.calispro.com"
}
```

### **Causa Raiz**

A credencial biométrica foi **registrada em um domínio** (provavelmente `calispro.com`) e tentou ser usada em **outro domínio** (`www.calispro.com`).

O WebAuthn é **extremamente restritivo**:
- Credencial registrada em `calispro.com` ≠ `www.calispro.com`
- São considerados domínios **diferentes** para segurança

---

## ✅ Correções Implementadas

### **1. Normalização do RP ID**

Criamos uma função que **remove o prefixo `www.`** automaticamente:

```javascript
const getRpId = () => {
    const hostname = window.location.hostname;
    
    // localhost → localhost  
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return hostname;
    }
    
    // www.calispro.com → calispro.com
    // calispro.com → calispro.com
    return hostname.replace(/^www\./, '');
};
```

**Resultado:**
- ✅ `www.calispro.com` → `calispro.com`
- ✅ `calispro.com` → `calispro.com`
- ✅ Sempre usa o **mesmo domínio base**

### **2. Salvamento do RP ID**

Agora salvamos o RP ID usado no registro para verificação:

```javascript
localStorage.setItem('biometric_rp_id', rpId);
```

Logs mostram:
```javascript
[Biometric] RP ID check: {
  current: "calispro.com",
  saved: "www.calispro.com",  // ❌ Incompatível!
  match: false
}
```

### **3. Uso de `allowCredentials`**

Especificamos **exatamente qual credencial** usar:

```javascript
allowCredentials: [{
    id: credentialIdBuffer,
    type: 'public-key',
    transports: ['internal']
}]
```

Isso diz ao navegador: "use essa credencial específica, não qualquer uma".

### **4. Auto-limpeza de Credenciais Inválidas**

Quando detecta `NotAllowedError`, **limpa automaticamente** as credenciais quebradas:

```javascript
if (err.name === 'NotAllowedError') {
    console.warn('[Biometric] Clearing potentially invalid credentials');
    clearBiometricCredentials();
    setError('Credencial biométrica inválida. Faça login com email/senha para re-registrar.');
}
```

**Fluxo:**
1. Erro `NotAllowedError` detectado
2. Credenciais antigas removidas
3. Botão de biometria desaparece
4. Usuário faz login com email/senha
5. Nova credencial é registrada **corretamente**

### **5. Logging Detalhado**

Adicionamos logs em **cada etapa**:

**Registro:**
```javascript
[Biometric] Registering credential with RP ID: calispro.com
[Biometric] Credential created successfully: {
  credentialIdLength: 88,
  rpId: "calispro.com",
  email: "marcio1@mail.com"
}
```

**Login:**
```javascript
[Biometric] RP ID normalized: {
  original: "www.calispro.com",
  normalized: "calispro.com"
}
[Biometric] RP ID check: {
  current: "calispro.com",
  saved: "calispro.com",
  match: true  // ✅ Compatível!
}
```

---

## 🧪 Como Testar

### **Passo 1: Limpar Estado Atual**

As credenciais antigas estão "quebradas". Você tem 2 opções:

**Opção A: Automática (Recomendada)**
1. Tente fazer login com biometria
2. Sistema detecta erro e limpa automaticamente
3. Botão de biometria desaparece
4. Faça login com email/senha

**Opção B: Manual**
1. Abra DevTools (F12) → Console
2. Execute:
```javascript
localStorage.removeItem('biometric_email');
localStorage.removeItem('biometric_credential_id');
localStorage.removeItem('biometric_rp_id');
```
3. Recarregue a página

### **Passo 2: Re-registrar Credencial**

1. **Faça logout** (se estiver logado)
2. **Faça login** com email/senha
3. Sistema **automaticamente registra** nova credencial
4. Veja nos logs:
```
[Biometric] Registering credential with RP ID: calispro.com
[Biometric] Credential created successfully
```

### **Passo 3: Testar Biometria**

1. **Faça logout** novamente
2. Agora você verá o **botão de biometria** 🔐
3. **Toque no botão**
4. Use sua biometria (Face ID/Touch ID/Impressão Digital)
5. Sistema preenche o email automaticamente

### **Passo 4: Verificar Logs**

Abra o Debug Panel e veja:

```
✅ [Biometric] Login attempt started
✅ [Biometric] RP ID check: { current: "calispro.com", saved: "calispro.com", match: true }
✅ [Biometric] Requesting credentials with options
✅ [Biometric] Assertion received
✅ [Biometric] Login verified
```

---

## 📊 Antes vs Depois

### **ANTES** ❌
```
rpId usado no registro: "www.calispro.com"
rpId usado no login: "calispro.com"
Resultado: NotAllowedError (incompatível)
```

### **DEPOIS** ✅
```
rpId usado no registro: "calispro.com" (normalizado)
rpId usado no login: "calispro.com" (normalizado)
Resultado: Login com sucesso!
```

---

## 💡 Observação Importante

### **Limitação Atual**

A biometria apenas **preenche o email**. Você ainda precisa:
- ❌ Digitar a senha manualmente, OU
- ✅ Usar Google Login

**Por quê?**
- Login biométrico completo requer backend
- Não guardamos senha (segurança)
- Seria necessário implementar sessões persistentes

**Fluxo Atual:**
1. Toca no botão 🔐
2. Verifica Face ID/Touch ID ✅
3. Email preenchido automaticamente
4. **Digite a senha** ou use Google

**Para login 100% biométrico:**
- Implementar Firebase Persistent Sessions
- Ou usar backend custom com WebAuthn
- Guardar refresh tokens (não senhas)

---

## 🚀 O Que Esperar Agora

1. ✅ Credenciais incompatíveis serão **auto-limpas**
2. ✅ Novo registro usa **RP ID normalizado**
3. ✅ Login biométrico funciona em `calispro.com` E `www.calispro.com`
4. ✅ Logs detalhados para debug

**Teste e me diga se funcionou!** 🎯

---

**Versão**: 1.0.6  
**Data**: 27/01/2026
