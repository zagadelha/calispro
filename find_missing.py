import json

with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# Get existing skill exercises
existing_skills = {}
for ex in data['exercises']:
    if ex.get('skill'):
        if ex['skill'] not in existing_skills:
            existing_skills[ex['skill']] = []
        existing_skills[ex['skill']].append(ex['id'])

print("Existing skills:")
for skill, exercises in sorted(existing_skills.items()):
    print(f"  {skill}: {exercises}")

# Skills we need
needed_skills = {
    'planche': ['pseudo_planche_push_up', 'planche_lean', 'tuck_planche', 'planche_push_up'],
    'muscle_up': ['muscle_up']
}

print("\nMissing exercises:")
missing_count = 0
for skill, needed_ids in needed_skills.items():
    current = existing_skills.get(skill, [])
    missing = [id for id in needed_ids if id not in current]
    if missing:
        print(f"  {skill}: {missing}")
        missing_count += len(missing)

print(f"\nTotal missing: {missing_count}")
