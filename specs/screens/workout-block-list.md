# Workout: Block List

## Purpose

This is the default workout subview after loading or resuming a workout. It acts as the session dashboard.

## Layout

### Top action

- full-width `Add Block` button

### Workout notes card

- title: `Workout Notes`
- multiline textarea for whole-workout notes
- optional `Recent Workout Notes` section showing up to two previous completed workout notes

### Block list

- empty state or one card per block

### Bottom action

- full-width `Finish Workout` button
- disabled when no blocks exist

## Block Card Contents

Each block card shows:

- block number
- status: `Planning`, `In Progress`, or `Done`
- comma-separated exercise names when present
- total set count across the block

## Interactions

### Add Block

- appends a new planning block
- inherits the previous block's rest timer value if available
- makes the new block active
- moves to `new-block`

### Tap block

- planning block -> `new-block`
- in-progress block -> `block-in-progress`
- finished block -> also `block-in-progress` in current behavior

### Long press or context menu on block

- opens delete confirmation for planning and finished blocks
- disabled for in-progress blocks

### Finish Workout

- marks the workout completed
- clears the active session store
- returns the user to home through the workout shell

## Notes Behavior

- workout notes save on every change
- recent workout notes come only from completed workouts with non-empty note text
- the recent note list is informational only and not tappable

## Empty State

- centered message: no blocks yet, add the first one

## Delete Behavior

- confirmation references the block order number
- removing a block reindexes all remaining block orders
- the active block index is clamped so it still points at a valid block if one remains

## Related Docs

- [Workout: New Block](workout-new-block.md)
- [Workout Session and Recovery](../features/workout-session-and-recovery.md)
- [Workout Components](../components/workout-components.md)
