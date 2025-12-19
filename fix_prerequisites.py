import json

# Load exercises
with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# Get all exercise IDs
all_ids = {ex['id'] for ex in data['exercises']}

# Corrections mapping (wrong -> correct)
corrections = {
    'diamond_push_up': 'diamond_push_up_light',
    'hollow_body_hold': 'hollow_hold_basic',
    'hanging_leg_raises': 'lying_knee_raises',
    'scapula_pull_ups': 'scapular_pull_up',
    'explosive_pull_up': 'chest_to_bar_pull_up',
    'hanging_knee_raises': 'lying_knee_raises',
    'toes_to_bar': 'windshield_wipers_full',  # Since toes_to_bar requires pull-up bar exercises first
    'side_plank': 'l_sit_full',  # For human flag
}

print("=== FIXING PREREQUISITES ===\n")

fixes_made = 0
for ex in data['exercises']:
    if not ex.get('prerequisites'):
        continue
    
    original_prereqs = ex['prerequisites'].copy()
    fixed_prereqs = []
    
    for prereq in ex['prerequisites']:
        if prereq in all_ids:
            fixed_prereqs.append(prereq)
        elif prereq in corrections:
            fixed = corrections[prereq]
            print(f"✅ {ex['id']}: {prereq} → {fixed}")
            fixed_prereqs.append(fixed)
            fixes_made += 1
        else:
            print(f"⚠️  {ex['id']}: Unknown prerequisite '{prereq}' - REMOVING")
            fixes_made += 1
    
    ex['prerequisites'] = fixed_prereqs

print(f"\n✅ Made {fixes_made} fixes!")

# Save
with open('src/assets/exercises/exercises_v1_1.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Saved updated exercises!")
