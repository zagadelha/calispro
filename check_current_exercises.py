import json

with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total exercises: {len(data['exercises'])}")

skills = {}
for ex in data['exercises']:
    skill = ex.get('skill')
    if skill:
        skills[skill] = skills.get(skill, 0) + 1

print("\nSkill exercises count:")
for skill, count in sorted(skills.items()):
    print(f"  {skill}: {count}")

# Check for specific exercises
important_ids = [
    'pseudo_planche_push_up', 'planche_lean', 'tuck_planche', 'planche_push_up',
    'front_lever_tuck', 'tucked_front_lever_raise', 'front_lever', 'front_lever_pull_up',
    'toes_to_bar_partial', 'toes_to_bar',
    'muscle_up',
    'back_lever', 'skin_the_cat',
    'human_flag'
]

print("\nChecking for important skill exercises:")
exercise_ids = {ex['id'] for ex in data['exercises']}
for ex_id in important_ids:
    status = "✅ EXISTS" if ex_id in exercise_ids else "❌ MISSING"
    print(f"  {ex_id}: {status}")
