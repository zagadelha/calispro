import json

# Load exercises
with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# Mastered exercises from logs
mastered = [
    'pike_push_up_beginner',
    'pike_push_up_advanced',
    'handstand_push_up',
    'pike_push_up_elevated_feet',
    'glute_bridge',
    'nordic_curl_eccentric',
    'l_sit_tuck',
    'dragon_flag_negative',
    'windshield_wipers_partial',
    'l_sit_full',
    'v_sit',
    'dragon_flag_full',
    'windshield_wipers_full',
    'l_sit_knee_tuck',
    'wall_handstand_hold'
]

print("=== CHECKING WORKOUT GENERATION LOGIC ===\n")

# Check skills
print("1. Skills available:")
skills_found = {}
for ex in data['exercises']:
    if ex.get('skill'):
        skill = ex['skill']
        if skill not in skills_found:
            skills_found[skill] = []
        skills_found[skill].append({
            'id': ex['id'],
            'difficulty': ex.get('difficulty_score', 0),
            'mastered': ex['id'] in mastered
        })

for skill, exercises in sorted(skills_found.items()):
    print(f"\n  {skill}:")
    for ex in sorted(exercises, key=lambda x: x['difficulty']):
        status = "✅ MASTERED" if ex['mastered'] else "❌ not mastered"
        print(f"    - {ex['id']} (diff:{ex['difficulty']}) {status}")

# Check what exercises are shown in current workout
current_workout = ['handstand_push_up', 'pike_push_up_beginner', 'dragon_flag_negative']

print(f"\n\n2. Current workout exercises:")
for ex_id in current_workout:
    ex = next((e for e in data['exercises'] if e['id'] == ex_id), None)
    if ex:
        mastered_status = "✅ MASTERED" if ex_id in mastered else "❌ not mastered"
        print(f"   - {ex_id}: {mastered_status}")
        print(f"     skill: {ex.get('skill')}")
        print(f"     progresses_to: {ex.get('progresses_to', [])}")

# Check if there are newer exercises to progress to
print("\n\n3. What should come NEXT:")
for ex_id in current_workout:
    ex = next((e for e in data['exercises'] if e['id'] == ex_id), None)
    if ex and ex_id in mastered:
        progresses_to = ex.get('progresses_to', [])
        if progresses_to:
            for next_id in progresses_to:
                next_ex = next((e for e in data['exercises'] if e['id'] == next_id), None)
                if next_ex:
                    print(f"   {ex_id} → {next_id} (diff:{next_ex.get('difficulty_score')})")
                else:
                    print(f"   {ex_id} → {next_id} (NOT FOUND IN DATABASE!)")
