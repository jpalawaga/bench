# Common UI Components

These are the reusable primitives that appear across multiple screens or define shared interaction rules.

## Button

### Purpose

Primary action component for most full-width and modal actions.

### Variants

| Variant | Use |
| --- | --- |
| `primary` | default call to action |
| `secondary` | neutral actions and dismissals |
| `danger` | destructive confirmation |
| `success` | positive progression such as starting a block |

### Shared behavior

- rounded large-touch-target shape
- disabled state reduces opacity and disables pointer input
- optional `fullWidth`

## SearchInput

### Purpose

Standard search field used in the exercise library and exercise picker.

### Behavior

- leading search icon
- trailing clear button when non-empty
- optional autofocus, defaulting to true
- exposes only the string value and onChange contract

### Reimplementation note

This is the only extracted text-field primitive that is widely used. Most other textareas and inputs are still page-local.

## Modal

### Purpose

Confirmation dialog for destructive or binary decisions.

### Contract

- open state is fully controlled by the parent
- clicking the backdrop cancels
- Escape cancels
- title and message are plain text
- confirm button variant can be primary or danger

### Current scope

Used for:

- delete workout
- delete block
- delete exercise

## BackupRestoreModal

### Purpose

Large utility modal for full-database export and import.

### Behavior highlights

- modal overlay and shell are visually similar to `Modal`, but content is custom
- supports busy state, status text, and multiline JSON textarea
- close is blocked while busy only indirectly through disabled buttons and Escape guarding

### Why it matters

This is effectively a second modal system with a larger surface area, which is relevant for future consolidation.

## TabBar

### Purpose

Simple horizontal tab strip for switching between exercises in a superset.

### Rules

- returns nothing when there is one tab or fewer
- uses text-only labels
- fills available width evenly
- active tab uses accent underline styling

## Input

### Purpose

Generic labeled input wrapper.

### Current status

- present in the codebase
- not actively used by the current screens

This makes it a likely cleanup or future-use component rather than a core product primitive today.

## Shared Layout Patterns That Are Not Yet Components

These patterns recur often but are still authored inline per screen:

- page headers with back button plus title
- rounded raised cards for content sections
- note history cards
- inline icon buttons

## Related Docs

- [Workout Components](workout-components.md)
- [Cleanup and Consolidation Candidates](../cleanup.md)
