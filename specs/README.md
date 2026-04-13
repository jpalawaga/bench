# Benchpress Project Specification

This directory rebuilds the current product specification from the shipped application. It is organized for reimplementation work: start with architecture, then read the screen specs, then use the feature and component docs for cross-cutting behavior.

## Table of Contents

### Architecture
- [App Overview](architecture/overview.md)
- [Data and State](architecture/data-and-state.md)

### Screens
- [Log Home](screens/log-home.md)
- [Workout Detail](screens/workout-detail.md)
- [Workout Shell](screens/workout-shell.md)
- [Workout: Block List](screens/workout-block-list.md)
- [Workout: New Block](screens/workout-new-block.md)
- [Workout: Exercise Select](screens/workout-exercise-select.md)
- [Workout: Goal Setting](screens/workout-goal-setting.md)
- [Workout: Block In Progress](screens/workout-block-in-progress.md)
- [Workout: Block Finished](screens/workout-block-finished.md)
- [Exercise Library](screens/exercise-library.md)
- [Exercise Detail](screens/exercise-detail.md)

### Features
- [Workout Session and Recovery](features/workout-session-and-recovery.md)
- [Exercise History and Suggestions](features/exercise-history-and-suggestions.md)
- [Backup, Restore, and Sharing](features/backup-restore-and-sharing.md)
- [PWA, Offline, and Platform Behavior](features/pwa-offline-and-platform.md)

### Components
- [Common UI Components](components/common-ui.md)
- [Workout Components](components/workout-components.md)
- [Log and Library Components](components/log-and-library-components.md)

### Cleanup
- [Cleanup and Consolidation Candidates](cleanup.md)

## System Summary

- Benchpress is a phone-first workout tracker with an intentionally narrow scope: create a workout, divide it into blocks, log actual sets, keep notes, and optionally set targets for next time.
- The app is local-first. Workouts and the exercise library live in IndexedDB and are usable offline.
- There are four top-level routes and six workout subviews. Most of the product complexity lives inside the workout flow.
- The product is optimized for gym-floor use: large touch targets, safe-area padding, dark surfaces, short paths, and hidden advanced tools instead of admin menus.

## Reading Order

1. Read [App Overview](architecture/overview.md) for routes, shell responsibilities, and product boundaries.
2. Read [Data and State](architecture/data-and-state.md) for the schema and workout session state machine.
3. Read the relevant screen docs for UI and flow details.
4. Use the feature docs for shared algorithms such as suggestions, crash recovery, backup, and offline behavior.
5. Use the component docs when rebuilding the UI layer.
