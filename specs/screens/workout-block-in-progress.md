# Workout: Block In Progress

## Purpose

This is the main execution screen during a workout. It combines timing, set entry, note capture, and superset navigation.

## High-Level Layout

### Sticky top area

- full-width rest timer card
- optional rest timer configuration panel
- exercise tab bar when the block contains multiple exercises

### Scrollable content

- one active exercise pane at a time
- optional animated transition between exercise panes

### Bottom action

- full-width `Finish Block` button

## Rest Timer

### Card states

- timer off: show `0:00` and `Tap to set rest timer`
- timer idle with duration: show full duration and `Tap to start rest timer`
- timer running: countdown with `Resting...`
- timer expired: pulse visually and show `Time's up! Tap to reset`

### Trigger rules

- tapping the timer while duration is off opens the timer configurator
- tapping while idle starts the timer
- when the user completes a set, the timer auto-start signal increments and the timer starts if duration is greater than zero
- tapping while expired resets the timer to its configured duration

### Background media constraint

- when the block timer is off, interacting with the screen must not initialize timer audio or interrupt external audio playback
- timer audio setup should only occur after explicit user interaction with an enabled timer

### Audio rules

- the app primes audio on user gestures so alerts can play later
- expiry triggers a short double-tone alert when possible

## Exercise Tabs

- hidden when the block has only one exercise
- one tab per exercise name
- changing tabs also recalculates the first incomplete set for that exercise and makes it the active set

## Exercise Pane

Each pane contains:

- exercise name
- `Notes` button with a rotating trailing chevron for exercise guidance notes
- optional inline exercise-guidance disclosure below the heading
- set entry table
- `Working Notes` section below the sets
- `+ Add Set`
- compact working-note history for the last two entries

## Exercise Guidance Notes

### Modes

- `hidden`
- `expanded`

### Open rules

- tapping the notes button expands an inline disclosure directly below the exercise heading
- the disclosure contains the editable exercise-global guidance note field for that exercise
- if the current exercise already has guidance notes, the textarea loads that text
- if it has no guidance notes, the textarea opens blank with placeholder copy
- tapping the button again while open collapses the disclosure
- the trailing chevron rotates downward while the disclosure is open
- the disclosure body animates down into place instead of using a popover shell
- the disclosure sits tight under the heading instead of reading like a separate card

### View mode

- shows a compact editable textarea
- edits update the exercise-level guidance note rather than the session working note
- the current edit is persisted when the field blurs, when the disclosure closes, when the user switches exercises, or when they finish the block
- uses compact padding and a subdued surface without a strong border

### Seen-state behavior

- exercises that already had guidance note text when their pane was loaded show a small unread dot until their notes are opened once during the current visit to this screen
- creating a new guidance note during the current visit does not create a new unread state for that same visit
- switching exercises hides the disclosure

## Set Table

### Header

- set number column
- goal column
- arrow separator
- actual entry column

### Per-row contents

- checkmark button
- set label like `S1`
- read-only goal summary:
  - strength exercises show `reps x weight` such as `8x135`
  - cardio exercises show `duration·Llevel` such as `10:00·L7`, where duration formats as `Mm` for whole minutes, `Ss` for sub-minute times, and `M:SS` otherwise
- two actual inputs matching the exercise's tracking mode:
  - strength: reps input and weight input separated by `x`
  - cardio: duration (seconds) input and level input separated by `@`
- delete button when more than one set exists

### Checkmark button

- if actuals are blank, fills them from the goal values in the same mode
- if actuals are partially filled, preserves existing entered values and only falls back for blanks in the matching mode
- after recording the set, advances the active set and starts rest timing

### Active set highlight

- one row is visually highlighted based on the first incomplete set logic
- the active row may move across exercises in a superset

### Manual actual entry

- the two actual inputs are independent numeric fields
- blank is represented as `null`
- for strength sets, Enter on reps moves focus to weight, and Enter on weight completes the set
- for cardio sets, Enter on duration moves focus to level, and Enter on level completes the set

### Add and remove set

- `+ Add Set` duplicates the last goal values and adds a blank actual row
- removing a set reindexes the set numbers and adjusts the active-set pointer if needed

## Working Notes

- positioned below the sets for the current exercise
- section heading: `Working Notes`
- grey, low-emphasis `+ Add Note` action aligned to the right
- tapping the action reveals a lightly padded, lightly styled textarea and focuses it immediately
- the surrounding note area has no distinct background card
- the textarea is for session-specific notes on that exercise instance only
- if the current exercise already has a working note, the textarea is already visible
- if there is no current working note and no historical note context, show muted empty-state text such as `_There are no notes_.`
- show the last two historical working notes for the same exercise below the section in compact muted styling
- working notes are distinct from the exercise-level guidance surfaced by the `Notes` disclosure

## Numeric Input Interaction Contract

The workout number input is specialized:

- focus selects all text
- long press begins vertical scrubbing for quick increment and decrement
- moving too far before long-press activation cancels the scrub gesture
- context menu is suppressed

This interaction is part of the gym-floor usability contract and should be preserved.

## Finish Block

- marks the block `finished`
- clears active set pointers
- moves to `block-finished`

## Current Behavioral Quirk

If the user later reopens a finished block from the block list, they return to this same editor, not to a read-only summary. The block stays marked `finished`, but the controls remain interactive.

## Related Docs

- [Workout Components](../components/workout-components.md)
- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Notes](../features/notes.md)
- [Workout: Block Finished](workout-block-finished.md)
