# Feature: Unlock-Key Exercise Detection

## Problem
When users mastered most available exercises, the progression system would fall into a loop suggesting the same mastered exercises repeatedly, preventing further progression.

## Example
User had mastered advanced skills (Muscle-up, Planche, Front Lever, etc.) but never did `lying_knee_raises`, which blocked:
- `toes_to_bar_partial` (toes_to_bar skill)
- `tucked_front_lever_raise` (front_lever skill)
- `windshield_wipers_partial` (core)
- `hanging_knee_raises` (core)

Without this exercise, 4+ progressions were permanently blocked.

## Solution
Added intelligent "unlock-key" detection that:

1. **Identifies locked exercises**: Finds all exercises blocked by missing prerequisites
2. **Counts unlock impact**: For each unmastered prerequisite, counts how many locked exercises it would unlock
3. **Prioritizes high-impact keys**: When in fallback mode (all skills maxed), suggests the exercise that unlocks the MOST new progressions

## Implementation
- `findUnlockKeyExercises(masteredIds)`: Core function that analyzes the exercise dependency graph
- Modified fallback in `generateSkillWorkout()`: Now checks for unlock-keys before falling back to "hardest exercise"

## Result
The system now proactively suggests exercises like `lying_knee_raises` that open doors to multiple new skill progressions, maintaining continuous user growth and preventing stagnation.

## Logs
When an unlock-key is found, you'll see:
```
[Fallback] 🔑 Found unlock-key exercises: lying_knee_raises (unlocks 4 exercises)
[Fallback] ✅ Selected unlock-key: lying_knee_raises (unlocks 4 exercises)
  Will unlock: toes_to_bar_partial, tucked_front_lever_raise, ...
```
