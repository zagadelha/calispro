# Bug Fix: Progression System - Cross-Skill Prerequisites

## Problem Summary
The workout progression system was stuck suggesting the same exercises repeatedly instead of advancing to new, more challenging exercises, despite the user having mastered all prerequisites.

## Root Cause
The `getUserSkillStage()` function in `progressionSystem.js` was calculating mastered exercises **only for the current skill**, but passing this limited list to `isExerciseUnlocked()` to check prerequisites.

This caused cross-skill prerequisites to fail. For example:
- `muscle_up` requires `handstand_push_up` (from the `handstand` skill)
- When checking `muscle_up` unlock status, only exercises from the `muscle_up` skill were in the mastered list
- `handstand_push_up` wasn't found, so `muscle_up` remained locked

## Solution
Modified `getUserSkillStage()` to calculate TWO separate mastered exercise lists:
1. **`skillMasteredIds`**: Exercises mastered in the current skill (for logging/display)
2. **`allMasteredIds`**: ALL mastered exercises across ALL skills (for prerequisite checking)

Now `isExerciseUnlocked()` receives the global mastery list, allowing it to correctly recognize prerequisites from other skills.

## Files Modified
- `src/utils/progressionSystem.js`:
  - Updated `getUserSkillStage()` to calculate global mastery list
  - Removed temporary debug logs from `isExerciseUnlocked()`
  - Removed cache-busting import parameter

- `src/main.jsx`:
  - Removed temporary Service Worker cleanup code

## Testing
After the fix:
- ✅ `muscle_up` now correctly unlocks (prerequisite: `handstand_push_up` ✅ mastered)
- ✅ `pseudo_planche_push_up` now correctly unlocks (prerequisite: `pike_push_up_advanced` ✅ mastered)
- ✅ `front_lever_tuck` now correctly unlocks (prerequisite: `l_sit_knee_tuck` ✅ mastered)
- ✅ System successfully generates workouts with new advanced exercises

## Impact
Users can now progress naturally through advanced calisthenics skills as they master prerequisites, maintaining engagement and continuous progression.
