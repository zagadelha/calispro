import json
import re

# Ler o arquivo JSON
with open('src/assets/exercises/exercises_v1_1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("\n📋 RELATÓRIO FINAL - Verificação de Nomes dos Exercícios\n")
print("=" * 70)

# Verificar se há algum nome com padrão errado
issues = []

for exercise in data['exercises']:
    name = exercise['name']
    
    # Verificar padrões problemáticos
    # 1. Hífen seguido de letra minúscula (exceto em preposições como "to", "of", etc.)
    if re.search(r'-[a-z]', name):
        main_part = name.split('(')[0].strip()
        # Verificar se é uma preposição permitida
        if not re.search(r'-(to|of|the|a|an|and|or|in|on|at)-', main_part.lower()):
            issues.append({
                'id': exercise['id'],
                'name': name,
                'issue': 'Hífen com minúscula'
            })
    
    # 2. Underscore no nome (não deveria ter)
    if '_' in name:
        issues.append({
            'id': exercise['id'],
            'name': name,
            'issue': 'Contém underscore'
        })

if issues:
    print("\n⚠️  PROBLEMAS ENCONTRADOS:\n")
    for issue in issues:
        print(f"  • {issue['id']:30} → {issue['name']}")
        print(f"    Problema: {issue['issue']}\n")
else:
    print("\n✅ NENHUM PROBLEMA ENCONTRADO!\n")
    print("Todos os nomes estão formatados corretamente:")
    print("  • Sem underscores (_)")
    print("  • Hífens com letras maiúsculas após eles")
    print("  • Exemplos corretos: L-Sit, Push-Up, Pull-Up, Muscle-Up")

print("\n" + "=" * 70)

# Mostrar estatísticas
print(f"\nTotal de exercícios: {len(data['exercises'])}")
print(f"Problemas encontrados: {len(issues)}")
print("\n")
