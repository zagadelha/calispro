import json

# Load exercises
with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# User's mastered exercises (from console logs)
mastered = [
    'pike_push_up_beginner',
    'pike_push_up_advanced', 
    'handstand_push_up',
    'pike_push_up_elevated_feet',
    'wall_handstand_hold',
    'bodyweight_squat',
    'sissy_squat',
    'nordic_curl_eccentric',
    'lying_knee_raises',
    'mountain_climber',
    'windshield_wipers_partial',
    'windshield_wipers_full',
    'l_sit_knee_tuck'
]

print("=== MASTERED EXERCISES ===")
print(f"Total mastered: {len(mastered)}")
print("\n=== CHECKING UNLOCKABLE SKILLS ===\n")

# Check each skill
for ex in data['exercises']:
    if not ex.get('skill'):
        continue
    
    # Skip if already mastered
    if ex['id'] in mastered:
        continue
    
    prereqs = ex.get('prerequisites', [])
    missing_prereqs = [p for p in prereqs if p not in mastered]
    
    if not missing_prereqs:
        print(f"✅ UNLOCKED: {ex['id']} ({ex['skill']})")
        print(f"   Prerequisites: {prereqs}")
    else:
        print(f"🔒 LOCKED: {ex['id']} ({ex['skill']})")
        print(f"   Missing: {missing_prereqs}")
        print(f"   Has: {[p for p in prereqs if p in mastered]}")
    print()
