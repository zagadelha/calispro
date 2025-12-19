import json

# Load
with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# Simple fixes based on what user has mastered
fixes = {
    'pseudo_planche_push_up': ['pike_push_up_advanced'],  # User has this
    'l_sit_tuck': ['l_sit_knee_tuck'],  # User has this
    'dragon_flag_negative': ['windshield_wipers_full', 'l_sit_knee_tuck'],  # User has both
    'toes_to_bar_partial': ['lying_knee_raises'],  # User has this
    'front_lever_tuck': ['l_sit_knee_tuck'],  # User has this  
    'muscle_up': ['handstand_push_up'],  # User has this (requires strength)
    'tucked_front_lever_raise': ['lying_knee_raises'],
    'skin_the_cat': ['l_sit_knee_tuck'],
    'human_flag': ['l_sit_knee_tuck', 'windshield_wipers_full'],
}

print("=== APPLYING FIXES ===\n")
for ex in data['exercises']:
    if ex['id'] in fixes:
        old = ex.get('prerequisites', [])
        ex['prerequisites'] = fixes[ex['id']]
        print(f"✅ {ex['id']}")
        print(f"   Old: {old}")
        print(f"   New: {ex['prerequisites']}\n")

# Save
with open('src/assets/exercises/exercises_v1_1.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Saved!")
