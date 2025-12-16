# 🧪 Guia de Teste Manual - Anti-Duplicação

## 🎯 Objetivo

Validar que o fix de anti-duplicação está funcionando corretamente no navegador.

## ✅ Pré-requisitos

- [x] npm run dev está rodando
- [x] Aplicativo acessível em http://localhost:5173 (ou porta configurada)
- [x] Console do navegador aberto (F12)

## 📋 Teste 1: Verificar Logs no Console

### Passos:

1. **Abrir o aplicativo** no navegador
2. **Fazer login** (ou criar conta se necessário)
3. **Ir para Dashboard**
4. **Abrir Console do navegador** (F12 → aba Console)
5. **Procurar por logs** que começam com `[Anti-Duplication]`

### ✅ Resultado Esperado:

```
[Anti-Duplication] Initial used IDs: ['l_sit_tuck']
[Strength Block] Pattern: "core", Candidates: 12
[Strength Block] ✅ Selected: hollow_body_hold
[Core Block] Candidates: 11 (after filtering 2 used)
[Core Block] ✅ Selected: plank
[Accessory Block] Pattern: "legs", Candidates: 18
[Accessory Block] ✅ Selected: bodyweight_squat
[Anti-Duplication] Final used IDs: ['l_sit_tuck', 'hollow_body_hold', 'plank', 'bodyweight_squat']
[Anti-Duplication] ✅ Total unique exercises: 4
```

### ❌ Resultado Incorreto:

Se você NÃO ver esses logs, significa que:
- O código não foi recompilado
- Precisa fazer refresh do navegador (Ctrl+F5)
- Ou o workout já estava salvo no Firestore (deletar treino e gerar novo)

## 📋 Teste 2: Verificar UI do Workout

### Passos:

1. **No Dashboard**, olhe para a lista de exercícios do treino
2. **Contar exercícios únicos**
3. **Verificar se há duplicados**

### ✅ Resultado Esperado:

**Treino para L-sit** (exemplo):
```
1. Tuck L-sit (Skill)
2. Hollow Body Hold (Strength)
3. Plank (Core)
4. Bodyweight Squat (Accessory)
```

Todos os 4 exercícios são DIFERENTES ✅

### ❌ Resultado Incorreto:

Se você ver algo como:
```
1. Tuck L-sit
2. Lying Knee Raises
3. Lying Knee Raises  ❌ DUPLICADO!
4. Step-up
```

Isso significa que o fix não está ativo ou há um problema.

## 📋 Teste 3: Resetar e Gerar Novo Workout

Para forçar a geração de um novo workout:

### Passos:

1. **Scroll até o final do Dashboard**
2. **Na seção "Ambiente de Teste"**, clicar em **"Resetar Treino"**
3. **Confirmar** no alerta
4. **Página recarrega**
5. **Novo workout é gerado**
6. **Repetir Testes 1 e 2**

## 📋 Teste 4: Testar Múltiplas Skills

O sistema rotaciona skills automaticamente. Para testar outras skills:

### Opção A - Usar Controle de Tempo:

1. **No Dashboard**, usar botão **"+1 Dia (Amanhã)"**
2. **Resetar o treino** (botão vermelho)
3. **Novo workout é gerado** para outra skill
4. **Verificar logs e UI** novamente

### Opção B - Deletar Histórico (Mais Drástico):

⚠️ **ATENÇÃO**: Isso apaga seu progresso!

1. Ir para Firebase Console
2. Deletar documentos em `workouts` collection
3. Deletar documentos em `user_history` (se existir)
4. Recarregar app
5. Novo workout será gerado

## 📊 Checklist de Validação

### Console Logs:
- [ ] Vejo `[Anti-Duplication] Initial used IDs`
- [ ] Vejo logs para cada bloco (Strength, Core, Accessory)
- [ ] Vejo `[Anti-Duplication] ✅ Total unique exercises: 4`
- [ ] Número final de exercícios únicos é sempre 4

### UI do Workout:
- [ ] Workout mostra 4 exercícios
- [ ] TODOS os 4 exercícios têm nomes diferentes
- [ ] Nenhum exercício está repetido

### Teste com Múltiplas Skills:
- [ ] Testei pelo menos 3 skills diferentes
- [ ] NENHUMA skill gerou duplicação
- [ ] Logs aparecem corretamente para todas

## 🐛 Troubleshooting

### Problema: Não vejo os logs no console

**Solução**:
1. Hard refresh: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
2. Limpar cache: DevTools → Application → Clear storage → Clear site data
3. Verificar se `npm run dev` está rodando sem erros

### Problema: Ainda vejo duplicação

**Possíveis causas**:
1. **Workout antigo do Firestore**: Deletar treino e gerar novo
2. **Código não recompilado**: Verificar terminal do `npm run dev`
3. **Browser cache**: Fazer hard refresh
4. **Mudança não salva**: Verificar se arquivo foi salvo corretamente

**Verificação**:
```bash
# Ver última mudança no arquivo
git diff src/utils/progressionSystem.js
```

Deve mostrar as linhas com `usedExerciseIds` e `.filter(ex => !usedExerciseIds.has(ex.id))`

### Problema: Erro no console do navegador

**Se ver erro** do tipo:
```
ReferenceError: usedExerciseIds is not defined
```

Significa que a mudança não foi aplicada corretamente. Verificar arquivo novamente.

## ✅ Critério de Sucesso

✅ **PASSOU**: Se todos os checkboxes acima estão marcados e nenhum exercício duplicado foi encontrado em múltiplos testes.

❌ **FALHOU**: Se qualquer duplicação for encontrada em qualquer skill testada.

## 📝 Reportar Resultados

Após completar os testes, reportar:

1. **Total de workouts testados**: _____
2. **Duplicações encontradas**: _____
3. **Skills testadas**: _____ (listar)
4. **Status geral**: ✅ PASSOU / ❌ FALHOU

## 🎉 Próximo Passo

Se todos os testes passaram ✅:
- O fix está funcionando perfeitamente!
- Pode fazer commit das mudanças
- Considerar implementar melhorias de médio/longo prazo

Se algum teste falhou ❌:
- Documentar o caso específico
- Copiar logs do console
- Tirar screenshot da UI
- Investigar causa raiz
