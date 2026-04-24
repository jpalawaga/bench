# Agent Instructions

This repository contains a living product specification under [`specs/`](specs/README.md). Any agent working in this repo must keep that specification current as the code changes.

## Non-Negotiable Rule

If you make a user-visible change, behavior change, architecture change, state change, persistence change, or reusable-component change, update the relevant files in `specs/` in the same piece of work.

This applies to:

- new features
- bug fixes
- UX changes
- refactors that change behavior or responsibilities
- data-model changes
- routing or flow changes
- component extraction or consolidation

## Required Workflow

1. Before editing code, identify which spec files are affected.
2. Make the code change.
3. Update the relevant spec docs before finishing.
4. If the change creates or reveals overlap between similar components or patterns, update [`specs/cleanup.md`](specs/cleanup.md).
5. Write tests as appropriate to cover the feature. Do not write overly specific or brittle tests.
6. Run tests after the change. Prefer the most relevant targeted tests when available, but the task is not complete without test execution.
7. Run a production build after the change so generated output is refreshed.
8. Commit the completed work with a descriptive commit message.
9. In your final summary, mention which spec files you updated, which tests you ran, whether you ran the build, and the commit you created.

## How To Update The Spec

- Start from [`specs/README.md`](specs/README.md) to find the right document.
- Prefer updating existing files over creating duplicate documentation.
- Keep specs implementation-aware but product-facing: describe actual shipped behavior, constraints, and flows.
- Do not leave the spec aspirational unless the doc explicitly marks something as future work.
- If a screen, feature, or component no longer matches the spec, fix the spec in the same change.

## Minimum Expectations By Change Type

### Feature work

- Update the affected screen spec in `specs/screens/`
- Update any cross-cutting feature doc in `specs/features/`
- Update component docs if shared UI changed
- Update tests as appropriate

### Bug fix

- Update the spec when the fix changes behavior, edge-case handling, constraints, or recovery behavior
- If no spec update is needed, explicitly say so in your final summary
- Update tests as appropriate

### Data or state change

- Update [`specs/architecture/data-and-state.md`](specs/architecture/data-and-state.md)
- Update any affected screen or feature docs
- Update tests as appropriate
- Ensure that migrations are handled appropriately across app versions, and that
  compatibility is maintained.

### Routing, shell, or lifecycle change

- Update [`specs/architecture/overview.md`](specs/architecture/overview.md)
- Update the affected screen docs
- Update any relevant feature docs

### Shared component change

- Update the relevant file under `specs/components/`
- Update [`specs/cleanup.md`](specs/cleanup.md) if the change affects consolidation opportunities

## Verification Requirements

- Run tests after every completed feature, bug fix, or code change.
- If there is a focused test target for the changed area, run it first; if confidence is still low, run broader coverage as needed.
- Run a production build after the tests pass.
- Treat generated build output as part of the change when the build updates tracked files.
- If tests or build fail, the task is not complete. Fix the issue or clearly report the blocker.

## Commit Requirements

- Commit each completed change, feature request, or bug fix.
- Use a descriptive commit message that explains what changed.
- The commit timestamp must be outside business hours in EDT.
- For this repository, treat business hours as `09:00` through `17:00` EDT.
- Only rewind commit timestamps; never move them into the future.
- If the current EDT time is already outside business hours, use the current time.
- If the current EDT time is inside business hours, rewind to the most recent valid time before `09:00` EDT on the same day, or earlier if needed.
- Apply the timestamp rule to both `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE`.

## Documentation Quality Bar

- Be precise enough that the product can be reimplemented from the spec.
- Use links between spec files when it improves navigation.
- Keep terminology consistent with the codebase.
- Document current behavior, including important quirks, guardrails, and edge cases.

## Done Criteria

A task is not complete until both are true:

- the code reflects the intended change
- the relevant `specs/` docs reflect the current reality of the codebase
- tests have been run
- a production build has been run
- the completed work has been committed with a descriptive message and an EDT outside-business-hours timestamp using only clock rewinds
