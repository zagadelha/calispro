import json

# Load existing exercises
with open('src/assets/exercises/exercises_v1_1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Load new exercises
with open('final_exercises.json', 'r', encoding='utf-8') as f:
    new_exercises = json.load(f)

# Get current exercise count
print(f"Current exercises: {len(data['exercises'])}")

# Filter out duplicates (check by id)
existing_ids = {ex['id'] for ex in data['exercises']}
unique_new = [ex for ex in new_exercises if ex['id'] not in existing_ids]

print(f"New unique exercises to add: {len(unique_new)}")
print("New IDs:", [ex['id'] for ex in unique_new])

#Add new exercises
data['exercises'].extend(unique_new)

# Update indexes
for ex in unique_new:
    data['indexes']['by_id'][ex['id']] = len(data['exercises']) - len(unique_new) + unique_new.index(ex)

# Save
with open('src/assets/exercises/exercises_v1_1.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Added {len(unique_new)} new exercises!")
print(f"Total exercises now: {len(data['exercises'])}")
