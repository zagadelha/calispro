# Plano de Testes de Sanidade - Sistema de Progressão

Este documento define os testes automáticos necessários para garantir a integridade do sistema de progressão do CalisPro.

## 1. Validação de Dados Estáticos (Build-Time)
Estes testes devem ser executados durante o build ou em pipeline de CI/CD para validar o arquivo JSON de exercícios (`exercises_v1_1.json`).

### 1.1 Integridade Referencial
*   **Teste:** Verificar se todo ID listado em `prerequisites` e `progresses_to` existe como um `id` válido na lista de exercícios.
*   **Objetivo:** Evitar links quebrados na árvore de progressão.

### 1.2 Detecção de Ciclos
*   **Teste:** Construir um grafo direcionado onde A -> B se B está em `progresses_to` de A. Validar que não existem ciclos (ex: A -> B -> A).
*   **Objetivo:** Impedir loops infinitos de progressão.

### 1.3 Consistência de Métricas
*   **Teste:** Para cada exercício:
    *   Se `metric_type` for 'reps', garantir que `default_prescription.reps_min` e `reps_max` existem e são > 0.
    *   Se `metric_type` for 'seconds', garantir que `default_prescription.seconds_min` e `seconds_max` existem e são > 0.
*   **Objetivo:** Garantir que a UI sempre saiba o que exibir.

### 1.4 Ordenação de Dificuldade
*   **Teste:** Para cada relação de progressão (A -> B):
    *   Validar se `exercise(B).difficulty_score >= exercise(A).difficulty_score`.
*   **Objetivo:** Garantir que a progressão seja sempre para algo mais difícil ou equivalente, nunca mais fácil.

## 2. Validação de Lógica de Negócio (Unit Tests)
Estes testes validam as funções puras em `src/utils/progressionSystem.js`.

### 2.1 Regra de Desbloqueio (Consistência)
*   **Cenário A:** Usuário tem 1 sessão com meta atingida.
    *   *Expectativa:* `checkMastery` retorna `false`.
*   **Cenário B:** Usuário tem 2 sessões com meta atingida, mas RPE 5 em uma delas.
    *   *Expectativa:* `checkMastery` retorna `false` (se a regra de RPE estiver ativa).
*   **Cenário C:** Usuário tem 2 sessões com meta atingida e RPE <= 4.
    *   *Expectativa:* `checkMastery` retorna `true`.

### 2.2 Limites do Readiness Score
*   **Teste:** Injetar histórico vazio.
    *   *Expectativa:* Score = 0.
*   **Teste:** Injetar histórico perfeito (máxima dificuldade em todas categorias).
    *   *Expectativa:* Score = 100.
*   **Teste:** Injetar histórico com RPE alto (fadiga).
    *   *Expectativa:* Score deve ser menor que o score base sem fadiga (validar penalidade).

### 2.3 Geração de Treino de Skill
*   **Teste:** Solicitar treino para skill 'handstand' sem nenhum histórico.
    *   *Expectativa:* Retornar exercício de nível 1 (preparação).
*   **Teste:** Solicitar treino com equipamento 'none'.
    *   *Expectativa:* Retornar apenas exercícios que não exigem equipamento.

## 3. Sugestão de Execução

### Onde rodar?
1.  **Jest / Vitest:** Ideal para os testes de unidade (Seção 2) e para validar o JSON (Seção 1) carregando-o como módulo.
2.  **Github Actions / Pre-commit Hook:** Rodar o script de validação do JSON antes de qualquer merge para garantir que dados corruptos não entrem na base.

### Ferramentas Sugeridas
*   Um script simples `scripts/validate_db.js` pode ser criado para rodar as verificações da Seção 1 rapidamente.
