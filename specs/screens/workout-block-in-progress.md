# Workout: Block In Progress

## Purpose

This is the main execution screen during a workout. It combines timing, set entry, note capture, and superset navigation.

## High-Level Layout

### Sticky top area

- full-width rest timer card
- optional rest timer configuration panel
- exercise tab bar when the block contains multiple exercises

### Scrollable content

- block notes card
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

## Block Notes Card

- always visible above the exercise editor
- includes a block-level textarea
- may show up to two recent block notes from previous completed blocks whose exercise ID set exactly matches the current block

## Exercise Tabs

- hidden when the block has only one exercise
- one tab per exercise name
- changing tabs also recalculates the first incomplete set for that exercise and makes it the active set

## Exercise Pane

Each pane contains:

- exercise name
- `Notes >` button
- optional notes popover
- set entry table
- `+ Add Set`
- optional recent exercise notes section

## Exercise Notes Popover

### Modes

- `hidden`
- `view`
- `edit`

### Open rules

- if the current exercise already has notes, tapping the notes button opens `view`
- if it has no notes, tapping opens `edit`
- tapping the button again while open dismisses the popover

### View mode

- shows note text
- auto-links raw `http`, `https`, and `www.` URLs
- offers edit and dismiss actions

### Edit mode

- shows an auto-focused textarea
- changes save immediately as the user types
- `Done` closes to view mode if there is note text, otherwise closes completely

### Seen-state behavior

- exercises with note text show a small unread dot until their notes are opened once during the current visit to this screen
- switching exercises hides the popover

## Set Table

### Header

- set number column
- goal column
- arrow separator
- actual entry column

### Per-row contents

- checkmark button
- set label like `S1`
- read-only goal text like `8x135`
- reps actual input
- weight actual input
- delete button when more than one set exists

### Checkmark button

- if actuals are blank, fills them from the goal values
- if actuals are partially filled, preserves existing entered values and only falls back for blanks
- after recording the set, advances the active set and starts rest timing

### Active set highlight

- one row is visually highlighted based on the first incomplete set logic
- the active row may move across exercises in a superset

### Manual actual entry

- reps and weight are independent numeric inputs
- blank is represented as `null`
- entering reps and pressing Enter moves focus to weight
- pressing Enter on weight completes the set

### Add and remove set

- `+ Add Set` duplicates the last goal values and adds a blank actual row
- removing a set reindexes the set numbers and adjusts the active-set pointer if needed

## Numeric Input Interaction Contract

The workout number input is specialized:

- focus selects all text
- long press begins vertical scrubbing for quick increment and decrement
- moving too far before long-press activation cancels the scrub gesture
- context menu is suppressed

This interaction is part of the gym-floor usability contract and should be preserved.

## Recent Exercise Notes

- below the set table
- up to two recent non-empty notes from previous completed workouts for this exercise
- URLs are rendered as links using the same simple auto-link logic as live notes

## Finish Block

- marks the block `finished`
- clears active set pointers
- moves to `block-finished`

## Current Behavioral Quirk

If the user later reopens a finished block from the block list, they return to this same editor, not to a read-only summary. The block stays marked `finished`, but the controls remain interactive.

## Related Docs

- [Workout Components](../components/workout-components.md)
- [Exercise History and Suggestions](../features/exercise-history-and-suggestions.md)
- [Workout: Block Finished](workout-block-finished.md)
