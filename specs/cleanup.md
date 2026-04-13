# Cleanup and Consolidation Candidates

This file documents areas where the current implementation has overlapping components or repeated UI patterns that should probably be consolidated later. These are not required for a faithful rebuild, but they are useful follow-up work.

## Highest-Value Consolidation Targets

| Area | Overlap | Why it should be consolidated | Suggested direction |
| --- | --- | --- | --- |
| Modal shells | `Modal` and `BackupRestoreModal` both implement custom overlay, escape handling, and shell styling | duplicated modal behavior will drift | create one modal shell with size presets and slot content |
| Page headers | log home, workout shell, exercise library, exercise detail, and workout detail all hand-roll similar headers | repeated back-button and spacing logic | extract a page header primitive with optional trailing action |
| Numeric set rows | goal-setting rows, in-progress set rows, and block-finished target rows all render reps, weight, and amount variants | the same domain concept is implemented three different ways | define a shared set-row family with mode-specific props |
| Card rows | `WorkoutListItem`, `BlockCard`, `ExerciseCard`, exercise library rows, and target prompt cards all share card-like summary layouts | repeated padding, typography, and press-state patterns | introduce one summary-card base style or component |

## Medium-Value Cleanup

| Area | Overlap | Suggested direction |
| --- | --- | --- |
| Text inputs | `Input` exists, `SearchInput` is separate, and most textareas and text fields are inline | decide whether to keep fully custom fields or create a small shared field system |
| Notes UI | workout notes, block notes, exercise notes, and recent-note cards all use similar content containers but slightly different markup | extract note card and note history presentation primitives |
| Inline icon buttons | many screens repeat the same rounded icon-button treatment for back, delete, and utility actions | create a small icon-button primitive with semantic variants |

## Behavior-Level Cleanup

| Behavior | Current state | Follow-up |
| --- | --- | --- |
| Finished block reopening | finished blocks reopen into the editable in-progress screen | decide whether finished blocks should become read-only or reopen through a dedicated summary view |
| Custom exercise creation | available only inside exercise selection and has minimal validation | consider a shared create-edit exercise flow with duplicate-name handling |
| Exercise edit saving | detail screen auto-saves only on back and silently ignores blank names | clarify whether the product wants explicit save/discard behavior |

## Low-Value Or Optional

| Area | Notes |
| --- | --- |
| Unused `Input` component | either adopt it or remove it |
| Exercise-row extraction | the exercise picker row could become a shared component if the library and picker should align visually |
| History-card extraction | workout note history, block note history, and exercise note history cards are structurally close but not identical |

## Recommendation

If cleanup work is taken on later, start with:

1. modal shell unification
2. page header extraction
3. shared set-row primitives
4. summary-card styling base

Those changes would reduce duplication without forcing a major product rewrite.
