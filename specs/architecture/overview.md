# App Overview

## Product Scope

Benchpress is a focused workout logger for use on a phone during a lifting session. The product is centered on these jobs:

- start or resume a workout quickly
- build the workout out of one or more blocks
- treat a block as either a single exercise or a superset
- capture planned sets and actual performance
- keep exercise guidance notes and session-specific working notes
- help the user carry useful information forward into the next session

The app does not currently attempt to be a full training planner, social product, analytics product, or cloud-synced program manager.

## Top-Level Routes

The URL surface is intentionally small.

| Route | Purpose | Primary UI |
| --- | --- | --- |
| `/#/` | workout history, resume entry point, backup access | log home |
| `/#/workout/:workoutId` | active workout container | workout shell with internal subviews |
| `/#/exercises` | exercise library management | exercise library |
| `/#/exercises/:exerciseId` | edit one exercise and view its history | exercise detail |

The workout route does not expose each subview as its own URL. Subviews are state-driven inside the workout shell.

## Workout Subviews

The workout shell can render these internal views:

- `block-list`
- `new-block`
- `exercise-select`
- `goal-setting`
- `block-in-progress`
- `block-finished`

This stateful approach avoids deep-linking into invalid mid-workout states and keeps the route structure stable.

## App Shell Responsibilities

### Startup and recovery

- If the user lands on home and an active workout exists in storage, the app immediately redirects to that workout.
- Recovery only runs on the home route. Direct navigation to a non-home route is not overridden.

### Persistence safety

- Workout mutations are persisted after every store action.
- The app also saves the active workout on `visibilitychange` when the document becomes hidden. This is important for iOS and standalone PWAs, where normal unload behavior is unreliable.

### Service worker lifecycle

- The service worker registers immediately.
- The app checks for updates on focus, on foregrounding, and on a 30 minute interval while open.
- If a worker is already waiting when the app returns to the foreground, the app activates it instead of leaving the update pending.

### Build metadata

- The build version and build timestamp are injected at build time.
- They are hidden from normal view and only surfaced through a title tap gesture on the log screen.

## Layout and Interaction Conventions

- Phone-first layout with `min-height: 100dvh`
- Safe-area padding at top and bottom
- Large touch targets: buttons and links default to at least 48px tall
- Dark theme with surface elevation rather than heavy borders
- Short vertical flows and sticky controls where timing matters
- Buttons use clear semantic variants: primary, secondary, success, danger

## Information Architecture

The product breaks down into four layers:

1. Shell and routing
2. Workout session state
3. Persistence and derived history queries
4. Screen and component rendering

The result is a local-first app where the active workout is modeled as one mutable document in memory and persisted document-style in IndexedDB.

## Reimplementation Invariants

Any faithful rebuild should preserve these behaviors:

- one active workout can be resumed automatically from home
- the active workout is stored as a full document, not as many server-backed records
- a block may contain one exercise or multiple exercises as a superset
- note history and target suggestions are derived from previously completed workouts
- backup and restore operate on the entire local database, not per-entity exports
- the product remains fully usable offline after initial asset load

## Related Docs

- [Data and State](data-and-state.md)
- [Notes](../features/notes.md)
- [Workout Session and Recovery](../features/workout-session-and-recovery.md)
- [PWA, Offline, and Platform Behavior](../features/pwa-offline-and-platform.md)
