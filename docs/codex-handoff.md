# AISync Codex Handoff

Last updated: 2026-04-06  
Project: `AISYNC-DEMO`

## Purpose

This file exists to help a new Codex session understand the current product state before making changes.

Primary rule:
- Do not start refactoring blindly.
- Read this file first.
- Then inspect the current git diff/status.
- Then inspect the target files named in the active OE.

## Current Product Focus

The recent work concentrated on:
- `Documentation Mode`
- `Teams Map`
- `Review & Forward` hierarchy rules
- compact documentary list layouts
- `Audit View` behavior and manifest help
- `Knowledge Map` interaction and layout iterations

The repo has been evolving through a long sequence of OEs. Some areas are stable, some are still visually iterative.

## High-Level Status

### Stable enough to treat carefully

- `Documentation Mode -> Repository View`
- `Documentation Mode -> Audit View`
- `Documentation Mode -> Investigate View`
- `Documentation Mode -> Knowledge Map`
- `Teams Map -> Map`
- `Review & Forward` routing logic

### Sensitive / regression-prone areas

- `src/pages/PageB.tsx`
  Main Documentation Mode screen. Very large and high-impact.
- `src/pages/PageD.tsx`
  Teams Map and structural editing behavior.
- `src/pages/PageF.tsx`
  Team Workspace routing and forwarding behavior.
- `src/reviewForwardPolicy.ts`
  Central policy logic for `Review & Forward`.
- `src/components/SecondaryWorkspacePanel.tsx`
- `src/components/TeamSubManagerPanel.tsx`
- `src/components/LockIconButton.tsx`
- `src/styles/tokens.css`

If a new OE touches any of these, read them carefully first.

## Documentation Mode Summary

### Repository View

Intent:
- main operational documentary view
- search, filters, compact list reading, detail panel

Important behavior:
- uses the shared documentary base from `documentationModel`
- includes main workspace entities
- supports document detail
- supports opening items/files

Recent direction:
- rows/list reading instead of heavy cards
- tighter filters and compact headers

### Audit View

Intent:
- operational traceability
- document + auditable event

Important behavior:
- `Open` must open locally in a floating window/overlay, not in a new tab
- `Audit manif.` exists under `(Manif.)`
- `Reset Search` is the intended reset label

Recent direction:
- compact audit row aligned to a visual reference
- one single action: `Open`
- preserve Audit context behind the opened document

### Investigate View

Intent:
- reconstruct temporal/contextual evolution
- not a duplicate of Repository or Audit

Important behavior:
- local filters by view are valid
- compact top controls / scrollable main content pattern was tuned here and used as reference for other views

### Knowledge Map

Intent:
- graph-based documentary/contextual reading

Important note:
- this area has gone through many visual iterations
- some responsive/framing expectations were still being tuned
- avoid broad refactors unless the active OE explicitly targets it

If touching `Knowledge Map`, inspect the latest code path in `PageB.tsx` instead of assuming older behavior.

## Teams Map / Structural Editing Summary

### Teams Map -> Map

Important recent rule:
- clicking a node/label must no longer trigger inline rename
- `Edit` is the only valid path for editing

If this regresses, re-check `src/pages/PageD.tsx`.

### Structural mutations that matter

The system supports mutations like:
- create team
- edit team
- delete team / erase team
- add agent
- erase agent
- promote worker to sub-manager

These mutations affect routing and hierarchy and must be treated as the source of truth.

## Review & Forward Summary

This is very important.

### Main principle

`Review & Forward` must be derived from the live hierarchy, not from static or manually maintained lists.

### Central source

Current policy logic lives in:
- `src/reviewForwardPolicy.ts`

### Current intended rules

#### General Manager

Can forward to:
- direct main workspace workers
- valid top-level sub-managers only

Must not forward directly to:
- secondary / deeper sub-managers

#### Sub-managers

Can forward to:
- direct workers
- valid subordinate sub-managers
- upward only where hierarchy permits

#### Workers

Can forward to:
- their direct sub-manager
- other workers in the same team/active branch

Must not forward to:
- workers in other teams
- arbitrary nodes outside the live hierarchy

### Critical separation

Do not mix normal `Review & Forward` with:
- `Cross Verification`
- `AUDIT AI ANSWER`

Those systems were intentionally kept separate.

## Lock / Unlock Button Summary

Current intended visual rule:
- locked state: `Lock`
  - black background
  - white text
- unlocked state: `Unlock`
  - white background
  - black border
  - black text

This is a visual rule only.
Do not break the underlying lock wiring.

Files involved:
- `src/components/LockIconButton.tsx`
- `src/styles/tokens.css`

## Manifest / Help Links

### Documentation Mode `(Manif.)`

The `(Manif.)` content for Documentation Mode was translated to English.

### Audit manif.

There is also a dedicated `Audit manif.` link under `(Manif.)` when `Audit View` is active.

Its content is in English and explains:
- Audit is not Repository
- Audit is not Investigate
- Audit is operational traceability

## Current Design Doctrine

Across recent OEs, the direction has been:
- reduce visual bloat
- remove redundant explanatory boxes
- keep filters compact
- keep scroll in the real content area
- move from heavy cards toward more list-like documentary reading
- keep professional/sober UI language

If a new change makes the product more card-heavy, more decorative, or less dense, it is likely going in the wrong direction unless explicitly requested.

## What To Inspect Before Any New OE

1. Read this file.
2. Run `git status`.
3. Read the active OE carefully.
4. Inspect the exact files it targets.
5. If the OE concerns:
   - Documentation Mode -> inspect `PageB.tsx`
   - Teams Map -> inspect `PageD.tsx`
   - Team Workspace / forwarding -> inspect `PageF.tsx`, `reviewForwardPolicy.ts`, and the workspace panels
6. Only then implement.

## Known Caution

Some previous OEs involved many iterations against visual screenshots.
That means:
- there may be code paths that look slightly redundant
- a “clean refactor” can easily destroy approved behavior

Bias toward:
- minimal, scoped edits
- preserving existing wiring
- changing only the target behavior of the active OE

## Recommended Prompt For A New Codex Session

Use something close to this:

> Read `docs/codex-handoff.md` first. Then inspect `git status`. Do not change code yet. Summarize the current state, the sensitive files, and the non-regression rules before implementing anything.

## Final Rule

If unsure whether behavior is intentional:
- do not normalize it by instinct
- inspect the active OE history in the code paths involved
- prefer preserving approved behavior over “cleaning up” aggressively
