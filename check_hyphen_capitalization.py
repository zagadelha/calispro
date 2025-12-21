import json
import re

# Ler o arquivo JSON
with open('src/assets/exercises/exercises_v1_1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("\n🔍 Buscando nomes que possam precisar de capitalização após hífen:\n")

# Contar mudanças
changes = []

# Processar cada exercício
for exercise in data['exercises']:
    name = exercise['name']
    
    # Procurar por padrões "Palavra-palavra" onde a segunda palavra não está capitalizada
    # Mas ignorar parêmetros entre parênteses
    
    # Dividir por parênteses para processar apenas a parte principal
    main_part = name.split('(')[0].strip()
    
    # Procurar por padrões "-palavra" onde palavra não inicia com maiúscula
    pattern = r'-([a-z])'
    
    if re.search(pattern, main_part):
        # Apenas mostrar para análise
        print(f"  ⚠️  {exercise['id']:30} → {name}")

print("\n✅ Análise completa!")
