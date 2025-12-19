import json

# Load exercises
with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)
    exercises = {ex['id']: ex for ex in data['exercises']}

# User's mastered exercises (from logs)
mastered = {
    'pike_push_up_beginner', 'static_lunge', 'pseudo_planche_push_up',
    'pike_push_up_advanced', 'walking_lunge', 'l_sit_tuck',
    'dragon_flag_negative', 'front_lever_tuck', 'handstand_push_up',
    'planche_lean', 'tuck_planche', 'planche_push_up', 'muscle_up',
    'front_lever_pull_up', 'l_sit_full', 'v_sit', 'dragon_flag_full',
    'windshield_wipers_full', 'front_lever', 'back_lever', 'skin_the_cat',
    'human_flag', 'l_sit_knee_tuck', 'pike_push_up_elevated_feet',
    'wall_handstand_hold'
}

# Find all locked exercises
locked = []
for ex_id, ex in exercises.items():
    if ex_id in mastered:
        continue
    
    prereqs = ex.get('prerequisites', [])
    if not prereqs:
        continue  # No prerequisites, always unlocked
    
    # Check if locked (missing prerequisites)
    missing_prereqs = [p for p in prereqs if p not in mastered]
    if missing_prereqs:
        locked.append({
            'id': ex_id,
            'name': ex['name'],
            'skill': ex.get('skill'),
            'difficulty': ex['difficulty_score'],
            'missing_prereqs': missing_prereqs
        })

print(f"🔒 Found {len(locked)} locked exercises\n")

# Count which prerequisites unlock the most exercises
prereq_unlock_count = {}
for ex in locked:
    for prereq in ex['missing_prereqs']:
        if prereq not in prereq_unlock_count:
            prereq_unlock_count[prereq] = []
        prereq_unlock_count[prereq].append(ex['id'])

# Sort by unlock count
sorted_prereqs = sorted(prereq_unlock_count.items(), key=lambda x: len(x[1]), reverse=True)

print("📊 Highest-Impact Missing Prerequisites:\n")
for prereq, unlocks in sorted_prereqs[:10]:
    ex_data = exercises.get(prereq, {})
    print(f"✅ {prereq} ({ex_data.get('name', 'Unknown')})")
    print(f"   Pattern: {ex_data.get('pattern', 'N/A')}")
    print(f"   Unlocks {len(unlocks)} exercises:")
    for unlock_id in unlocks[:5]:  # Show first 5
        unlock_ex = exercises.get(unlock_id, {})
        print(f"     - {unlock_ex.get('name', unlock_id)} (skill: {unlock_ex.get('skill', 'none')})")
    if len(unlocks) > 5:
        print(f"     ... and {len(unlocks) - 5} more")
    print()
