# PWA, Offline, and Platform Behavior

## Offline Model

Benchpress is local-first:

- persistent data is stored in IndexedDB
- no network connection is required for normal use
- the PWA service worker caches built assets for offline loading after the app has been installed or visited

Because the app has no backend, backup and restore are the only supported way to move data between devices.

## Routing and Static Hosting

- The app uses hash-based routing.
- This is important for static hosting environments where path-based rewrites are not guaranteed.
- The build output targets the `docs/` directory for static deployment.

## Service Worker Strategy

- The service worker is registered immediately.
- Updates are checked on:
  - initial registration
  - window focus
  - document visibility returning to visible
  - a 30 minute interval
- If an update is already waiting when the app becomes visible, the waiting worker is activated instead of postponing refresh indefinitely.

## Platform-Specific Touches

### Safe areas

- top and bottom safe-area padding is applied so controls remain reachable in notched devices and standalone PWAs

### Touch targets

- interactive controls default to a minimum 48px tap target

### Number inputs

- browser number spinners are removed
- numeric inputs favor touch entry and text selection behavior that works in the gym context

### Rest timer audio

- the rest timer primes Web Audio on user gestures so future alerts can play on iOS
- the timer also attempts best-effort `navigator.audioSession` configuration where supported

## Visual System

- dark surfaces with three elevation levels: base, raised, overlay
- bright accent for active state and progression
- success and danger colors for completion and destructive actions
- monospace numerals where time and set values need stable alignment

## Build Metadata

- build version comes from `package.json`
- build timestamp is injected at build time in UTC
- both values are hidden by default and surfaced from the log title interaction

## Related Docs

- [App Overview](../architecture/overview.md)
- [Backup, Restore, and Sharing](backup-restore-and-sharing.md)
- [Workout: Block In Progress](../screens/workout-block-in-progress.md)
