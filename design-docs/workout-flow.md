# Workout Flow

The workout view is a single route (`/#/workout/:workoutId`) that renders different sub-views based on the `currentView` field in the Zustand store. Navigation between sub-views is state-driven, not URL-driven, to prevent deep-linking into invalid states.

## Sub-Views and Transitions

```
block-list → new-block → exercise-select → goal-setting → (back to new-block)
                                                         ↓
                                               new-block → block-in-progress → block-finished → block-list
                                                                                                    ↓
                                                                                              (repeat or finish workout → log view)
```

### 1. Block List (`block-list`)

The default view after starting or resuming a workout.

- Lists all blocks in the current workout as cards showing: block number, exercise names, set count, status (Planning / In Progress / Done)
- **Add Block** button at top — creates a new block and navigates to `new-block`
- **Finish Workout** button at bottom (disabled if no blocks) — marks workout completed, saves, navigates to log view
- Tapping a "planning" block navigates to `new-block` for that block
- Tapping an "in-progress" block navigates to `block-in-progress`
- Finished blocks are not tappable (display only)

### 2. New Block (`new-block`)

Configure a block before starting it. Shows the list of exercises added to this block.

- **Add Exercise** button (or **Create Superset** if 1+ exercises already added) — navigates to `exercise-select`
- Exercise cards show name and set summary. Tappable (currently no-op, future: edit).
- **Rest Timer** — a slider control (0–5 minutes) with snap points at 0, 10s, 30s, 45s, 60s, 90s, 2m, 2.5m, 3m, 4m, 5m. Fine-grained between snap points (rounds to 5s). Displays "Off" when at 0. Current value shown as text next to the label. Remembers its value across blocks within a workout (new blocks inherit from the previous block).
- **Start Block** button (disabled if no exercises) — transitions block to `in-progress` status, navigates to `block-in-progress`

### 3. Exercise Select (`exercise-select`)

Full-screen exercise picker.

- Search bar at top (auto-focused)
- When not searching: "My Exercises" section (top 8 by frequency) followed by "All Exercises" (alphabetical, excluding those already shown in My Exercises)
- When searching: flat filtered list
- Each row: exercise name + muscle group
- Tapping selects the exercise and navigates to `goal-setting`
- "Create Custom Exercise" option at the bottom — inline text input + Add button

### 4. Goal Setting (`goal-setting`)

Set reps, weight, and number of sets for the selected exercise.

- Header: exercise name
- Pre-populates from next-session targets or last actuals (see product-requirements.md)
- Rows per set: `S1  [reps] x [weight] lbs  [delete]`
- Proposed values show a blue border and "Proposed" badge; editing clears it
- **+ Add Set** button — copies values from previous set
- **Lock In** button — creates the `BlockExercise`, adds it to the block, navigates back to `new-block`

### 5. Block In Progress (`block-in-progress`)

The active workout screen. Three sections:

**Top — Rest Timer** (only shown if rest timer > 0):
- Full-width card with large countdown display (monospace, `5:00` format)
- "Tap to start rest timer" → counts down → alert on expiry (visual pulse + audio) → "Time's up! Tap to reset" → resets to original duration

**Middle — Exercise + Sets:**
- Tab bar for superset exercises (hidden if only one exercise)
- Exercise name
- Header row: Set | Goal | → | Actual
- Per-set rows:
  - Green checkmark button (left) — one tap fills actual with goal values. Stays green when actuals are filled.
  - Set number
  - Goal (read-only): `8x135`
  - Arrow
  - Actual (editable): reps input, `x`, weight input
  - Delete set button (if >1 set)
- **+ Add Set** button
- **Notes** textarea below the sets

**Bottom:**
- **Finish Block** button

### 6. Block Finished (`block-finished`)

Shown after finishing a block. Optional next-session targets prompt.

- "Block Complete!" header with exercise names
- Per exercise: a collapsed card showing exercise name and "Set targets for next time →". Tapping expands it to show editable set rows pre-filled with what was just done. Save or Skip buttons.
- **Continue Workout** button — navigates back to `block-list`

## Back Navigation

The WorkoutPage header shows a back chevron (hidden on `block-list`). Back behavior:

| From | Goes to |
|------|---------|
| `block-list` | Log view (resets store) |
| `new-block` | `block-list` |
| `exercise-select` | `new-block` |
| `goal-setting` | `exercise-select` |
| `block-in-progress` | Blocked (no back) |
| `block-finished` | `block-list` |
