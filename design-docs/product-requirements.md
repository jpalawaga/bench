# Product Requirements

## Overview

Benchpress is a workout tracker designed for use on the gym floor. It is a phone-based browser application (PWA) focused on doing a few things well with tight, simple flows. Large touch targets, clean text, dark mode.

## Core Functionality

- Track which exercises are performed
- Track sets, reps, and weight (lbs only)
- Track notes per exercise (per-workout notes)
- Track rest time between sets via a countdown timer

## Views

### Log View (Home)

The landing page. Shows a chronological list of past completed workouts, newest first.

- Each entry shows: date, duration, and up to 3 exercise names
- Tapping a completed workout opens a **read-only detail view** showing all blocks, exercises, sets (goal vs actual), and notes
- Completed workouts can be **deleted** (with confirmation modal) but not edited
- Tapping an active (in-progress) workout navigates to the workout view to resume it
- "Start New Workout" button at the top creates a new workout and navigates to the workout view

### Workout View

The main working view. Subdivided into state-driven sub-views (not URL routes). See [workout-flow.md](workout-flow.md) for the full flow.

## Exercise Library

- Ships with a seed list of ~50 common exercises across muscle groups (chest, back, shoulders, legs, arms, compound, core, cardio)
- Users can create custom exercises inline during exercise selection
- Exercise selection shows a **"My Exercises"** section at the top with the user's most frequently used exercises (top 8 by workout frequency), followed by "All Exercises"
- Search filters both sections; when searching, the two-section layout collapses to flat results

## Goal Pre-Population ("Next Session" Targets)

When adding an exercise to a new block, the goal fields are pre-populated:

1. First, check if the user set explicit **next-session targets** after their last session with this exercise. Use those if present.
2. Otherwise, copy the **actual values** from the last completed session with this exercise.
3. Pre-populated values are marked with `isProposed: true` and show a visual "Proposed" indicator (blue border/badge). Editing any field clears the proposed state.

After finishing a block, the user is shown an **optional, skippable** prompt per exercise to set next-session targets. The prompt is pre-filled with what they just did. They can tweak and save, or skip with one tap.

## Notes

Two types of notes exist:

1. **Exercise form notes** — guidance attached to the Exercise entity itself (e.g., "keep elbows tucked"). UI placement is TBD (not yet surfaced in any view).
2. **Per-workout exercise notes** — a text area below each exercise on the block-in-progress screen. For things like "felt tight on left shoulder today". Stored on `BlockExercise.notes`.

## Units

Pounds (lbs) only. No unit switching.
