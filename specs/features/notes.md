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
- visible during an in-progress block through the `Notes` disclosure affordance next to the active exercise name

### Interaction model

- the guidance note is treated as lightweight reference material
- it is still secondary to set entry during a workout
- the in-progress `Notes` disclosure contains a compact inline editor for the same `formNotes` field used on the exercise detail screen
- opening it expands an inline section below the exercise title and rotates the trailing chevron downward
- edits persist back to the exercise library record when the field blurs, the disclosure closes, the user switches exercises, or the block finishes
- the unread indicator on the `Notes` affordance only reflects guidance that already existed when that exercise pane was loaded; typing a new note during the current visit does not create a new unread state
- the disclosure should feel compact and low-chrome rather than like a bordered callout card
- if no guidance note exists, the `Notes` affordance should still open with an empty textarea and placeholder guidance

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
- tapping the action reveals a lightly styled, lightly padded textarea and immediately focuses it
- the writing surface should feel secondary to set entry, with no distinct section background and a lightly styled textarea
- if the current exercise already has a working note for this session, the textarea should already be visible when the pane opens

### Empty and history states

- if there is no current working note and there is no recent history, show muted text like `_There are no notes_.`
- show the last two historical working notes for the same exercise below the section in compact, muted styling
- historical entries are reference material only

## Explicit Non-Goals

The intended product note model does **not** center on workout-level notes or block-level notes. If those fields exist in the current implementation, they should be treated as implementation drift or legacy behavior rather than the target note UX.

That means the active workout flow and workout history should not render standalone workout-note or block-note composer panels as part of the intended experience.

## Screen Mapping

| Note type | Primary edit surface | Secondary surface |
| --- | --- | --- |
| Exercise guidance notes | exercise detail screen and in-progress `Notes` disclosure | exercise library preview and other read-only surfaces |
| Working notes | in-progress exercise pane below sets | exercise history and other read-only history surfaces |

## Related Docs

- [Exercise Detail](../screens/exercise-detail.md)
- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
- [Data and State](../architecture/data-and-state.md)
