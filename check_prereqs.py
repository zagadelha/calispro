import json

with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# Check specific exercises
exercises_to_check = [
    'pseudo_planche_push_up',
    'front_lever_tuck',
    'toes_to_bar_partial',
    'muscle_up'
]

print("=== CHECKING PREREQUISITES ===\n")
for ex_id in exercises_to_check:
    ex = next((e for e in data['exercises'] if e['id'] == ex_id), None)
    if ex:
        prereqs = ex.get('prerequisites', [])
        print(f"{ex_id}:")
        print(f"  Prerequisites: {prereqs}")
        print(f"  Progresses to: {ex.get('progresses_to', [])}")
        print()
    else:
        print(f"{ex_id}: NOT FOUND\n")
