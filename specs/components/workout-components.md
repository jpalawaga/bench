# Workout Components

These components define most of the reusable behavior inside the workout flow.

## BlockCard

### Purpose

Summary card for one block on the block list screen.

### Shows

- block order
- block status
- exercise names
- total set count

### Interaction

- standard tap opens the block
- optional long press opens delete behavior
- long press is also available via context menu prevention fallback

## ExerciseCard

### Purpose

Summary card for one configured exercise inside a planning block.

### Shows

- exercise name
- set count
- compressed goal summary

### Interaction

- main card tap is reserved but currently unused
- optional remove button deletes the exercise from the block

## RestTimerSlider

### Purpose

Touch-friendly control for selecting block rest duration.

### Range

- 0 through 300 seconds

### Snap points

- 0
- 10
- 30
- 45
- 60
- 90
- 120
- 150
- 180
- 240
- 300

### Interaction

- pointer-driven, unified for touch and mouse
- near snap points, the thumb sticks to the snap
- between snap points, values round to the nearest 5 seconds
- `0` is persisted as `null`

## RestTimer

### Purpose

Countdown card used during a block.

### Responsibilities

- render the current time in `m:ss`
- start and reset the timer
- react to auto-start signals
- play expiry audio when possible
- surface a configuration action when the timer is off

### Audio behavior

- when the timer is off, the component must stay audio-inert
- disabled-timer interactions must not initialize Web Audio or interfere with background media playback
- audio priming only happens from explicit interaction with an enabled timer
- expiry audio is best-effort and should not force audio initialization at expiry time if the timer was never primed

### Important platform behavior

- primes Web Audio only from explicit enabled-timer gestures
- favors mixing-friendly audio session behavior on supported browsers so timer alerts do not steal focus from background media

## WorkoutNumberInput

### Purpose

Specialized numeric field for goal and actual entry.

### Key behaviors

- numeric keyboard friendly
- focus selects the current value
- Enter can trigger custom submit behavior
- optional fallback value is used during set-completion flows
- long press activates vertical scrubbing
- scrub sensitivity is measured in pixels per step

### Why it is a core contract

This component changes how the app feels in use. A reimplementation should treat it as a product interaction, not just a styled number field.

## SetRow

### Purpose

Reusable grouped goal row for the goal-setting screen.

### Contents

- set label
- reps input
- weight input
- amount select
- proposal badge
- optional remove button

### Proposal states

- `PLANNED` for saved targets
- `PREV` for last actuals

## Page-Local Workout UI That May Become Components Later

The workout flow still has several repeated patterns that are not extracted:

- block notes card
- exercise notes popover
- recent-note cards
- editable target rows on the block-finished screen
- in-progress set rows

These are called out again in [cleanup.md](../cleanup.md).

## Related Docs

- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
- [Workout: Goal Setting](../screens/workout-goal-setting.md)
- [Cleanup and Consolidation Candidates](../cleanup.md)
