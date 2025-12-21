import json
import re

def capitalize_after_hyphen(text):
    """
    Capitaliza a letra após cada hífen.
    Exemplo: "Push-up" -> "Push-Up", "One-Arm Pull-up" -> "One-Arm Pull-Up"
    """
    def replace_func(match):
        return '-' + match.group(1).upper()
    
    return re.sub(r'-([a-z])', replace_func, text)

# Ler o arquivo JSON
with open('src/assets/exercises/exercises_v1_1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Contar mudanças
changes = []

# Processar cada exercício
for exercise in data['exercises']:
    old_name = exercise['name']
    
    # Aplicar capitalização após hífen
    new_name = capitalize_after_hyphen(old_name)
    
    if new_name != old_name:
        exercise['name'] = new_name
        changes.append({
            'id': exercise['id'],
            'old': old_name,
            'new': new_name
        })

# Mostrar mudanças
print(f"\n🔄 Total de mudanças: {len(changes)}\n")
for change in changes:
    print(f"  ✓ {change['old']} → {change['new']}")

if changes:
    # Salvar arquivo atualizado
    with open('src/assets/exercises/exercises_v1_1.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Arquivo atualizado com {len(changes)} mudanças!")
else:
    print("\n✨ Nenhuma mudança necessária!")
