import json

with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

# Check toes_to_bar_partial which requires lying_knee_raises
toes = next((e for e in data['exercises'] if e['id'] == 'toes_to_bar_partial'), None)
print("TOES_TO_BAR_PARTIAL:")
print(f"  Prerequisites: {toes.get('prerequisites', [])}")

# Check if user has done lying_knee_raises (the prerequisite)
lying = next((e for e in data['exercises'] if e['id'] == 'lying_knee_raises'), None)
print(f"\nLYING_KNEE_RAISES exists: {lying is not None}")
if lying:
    print(f"  Name: {lying['name']}")
    print(f"  Category: {lying.get('category')}")

# Check pseudo planche
pseudo = next((e for e in data['exercises'] if e['id'] == 'pseudo_planche_push_up'), None)
print(f"\nPSEUDO_PLANCHE_PUSH_UP:")
print(f"  Prerequisites: {pseudo.get('prerequisites', [])}")

# Check pike_push_up_advanced
pike = next((e for e in data['exercises'] if e['id'] == 'pike_push_up_advanced'), None)
print(f"\nPIKE_PUSH_UP_ADVANCED exists: {pike is not None}")

print("\n" + "="*50)
print("MASTERED EXERCISES (from user history logs):")
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

print(f"\nTotal mastered: {len(mastered)}")

print("\n" + "="*50)
print("CHECKING UNLOCKS:")

# Check if pseudo_planche_push_up should unlock
if pseudo:
    prereqs = pseudo.get('prerequisites', [])
    print(f"\npseudo_planche_push_up requires: {prereqs}")
    all_met = all(p in mastered for p in prereqs)
    print(f"  All prerequisites met? {all_met}")
    for p in prereqs:
        print(f"    - {p}: {'✅' if p in mastered else '❌'}")

# Check if toes_to_bar_partial should unlock
if toes:
    prereqs = toes.get('prerequisites', [])
    print(f"\ntoes_to_bar_partial requires: {prereqs}")
    all_met = all(p in mastered for p in prereqs)
    print(f"  All prerequisites met? {all_met}")
    for p in prereqs:
        print(f"    - {p}: {'✅' if p in mastered else '❌'}")
