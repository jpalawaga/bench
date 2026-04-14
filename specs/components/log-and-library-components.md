# Log and Library Components

These components support history browsing and exercise-library management.

## WorkoutListItem

### Purpose

Compact row used on the log home screen.

### Shows

- workout date
- workout duration or `In progress`
- up to three unique exercise names, with overflow summarized as `+N more`

### Interaction

- the parent decides whether a click resumes the workout or opens workout detail

## WorkoutDetail

### Purpose

Full-screen read-only detail view for a completed workout, rendered inside the log route instead of as a separate URL.

### Shows

- workout date and duration
- block list with exercises, goal-to-actual set rows, and optional working notes
- copy workout action
- delete workout action

### Special behavior

- copy action exports a plain-text representation to the clipboard
- delete delegates to the parent screen's confirmation flow

## Page-Local Library/List Patterns

Not every repeated row has been extracted into its own component yet. Important page-local patterns include:

- exercise library list row with form-note preview
- exercise picker row with muscle group and last performed date
- inline custom-exercise creation row

These matter during reimplementation because they are part of the visual system even though they are not shared components today.

## Related Docs

- [Log Home](../screens/log-home.md)
- [Exercise Library](../screens/exercise-library.md)
- [Exercise Detail](../screens/exercise-detail.md)
