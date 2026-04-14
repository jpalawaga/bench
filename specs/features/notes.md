# Notes

## Overview

Benchpress has two first-class note types.

1. **Exercise guidance notes**
2. **Working notes**

The product spec should treat these as the only intended note concepts.

## 1. Exercise Guidance Notes

### Purpose

These are notes on the exercise as a whole, not on one specific session. They are form reminders, setup cues, or other guidance the user should keep in mind every time they perform that exercise.

### Data model

- stored on the `Exercise` record as `formNotes`
- shared across every workout that uses that exercise

### Where they appear

- editable on the exercise detail screen
- visible during an in-progress block through the `Notes >` affordance next to the active exercise name

### Interaction model

- the guidance note is treated as lightweight reference material
- it is not the main writing surface during a workout
- if no guidance note exists, the `Notes >` affordance should still allow the user to add one

## 2. Working Notes

### Purpose

These are notes on a particular exercise within a specific workout session. They are meant for session-specific observations such as:

- unusual pain or discomfort
- why a set failed
- technique breakdown during that session
- equipment or setup issues encountered in that block

### Data model

- stored on the `BlockExercise` record as `notes`
- scoped to one exercise instance inside one workout block

### Where they appear

- below the set table on the in-progress exercise pane
- surfaced again in exercise history as the note attached to that past exercise performance

### Interaction model

- section heading: `Working Notes`
- right side of the heading: grey, low-emphasis `+ Add Note` action
- tapping the action reveals a lightly styled, lightly padded textarea
- the writing surface should feel secondary to set entry, not like a dominant card

### Empty and history states

- if there is no current working note and there is no recent history, show muted text like `_There are no notes_.`
- show the last two historical working notes for the same exercise below the section in compact, muted styling
- historical entries are reference material only

## Explicit Non-Goals

The intended product note model does **not** center on workout-level notes or block-level notes. If those fields exist in the current implementation, they should be treated as implementation drift or legacy behavior rather than the target note UX.

## Screen Mapping

| Note type | Primary edit surface | Secondary surface |
| --- | --- | --- |
| Exercise guidance notes | exercise detail screen | `Notes >` affordance during in-progress exercise logging |
| Working notes | in-progress exercise pane below sets | exercise history and other read-only history surfaces |

## Related Docs

- [Exercise Detail](../screens/exercise-detail.md)
- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
- [Data and State](../architecture/data-and-state.md)
