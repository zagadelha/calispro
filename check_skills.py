import json

with open('src/assets/exercises/exercises_v1_1.json', encoding='utf-8') as f:
    data = json.load(f)

skill_exercises = [ex for ex in data['exercises'] if ex.get('skill')]
print(f'Total exercises: {len(data["exercises"])}')
print(f'Skill exercises: {len(skill_exercises)}')
print('\nBy skill:')
from collections import defaultdict
by_skill = defaultdict(list)
for ex in skill_exercises:
    by_skill[ex['skill']].append(ex['id'])

for skill in sorted(by_skill.keys()):
    print(f'  {skill}: {len(by_skill[skill])} - {", ".join(by_skill[skill])}')
