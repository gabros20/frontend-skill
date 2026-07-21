# State completeness

Purpose: the code-side model for covering every state a UI can be in (not just the happy path), choosing the right notification or overlay surface for a given situation, and handling errors and recovery so nothing dead-ends.

Read when:
- Deciding whether a state (loading, empty, error, success) has been accounted for.
- Choosing between a toast, banner, inline message, or modal for a given situation.
- Writing an error message, a destructive-action flow, or an autosave/recovery behavior.

Skip when:
- The question is visual treatment or layout intent for a state (design's `interaction.md`).
- The question is ARIA/focus mechanics for a modal or overlay (`accessibility.md`).
- The question is how a fetch is retried, how state is machine-modeled, or how an API status code maps to behavior (`state-and-data.md`).
- The question is form-specific validation timing or input semantics (`forms.md`).

Inputs: the feature or surface being built, its data conditions, and the reversibility/frequency of its actions.

Produces: every non-happy-path state accounted for, the right notification or overlay surface chosen, and an error/recovery contract that matches the failure.

## Contents
- The two-layer state model
- Loading-pattern-by-duration
- Empty-state taxonomy
- Error-prevention hierarchy
- Error message anatomy and destructive actions
- Undo versus confirm
- Notification and overlay surface selection
- Autosave and draft recovery
- Notification-center preferences

## The two-layer state model

Every interactive element carries six universal states: default, hover, focus-visible, active, disabled, loading. Data regions and forms add three data-region states on top: empty, error, success. Components with their own modes add component-specific states (selected, expanded). This is a two-layer split, not one number: a plain button having six states and a data-bearing component having nine are the same reality described at different scope, not a contradiction between sources.

Cite design's `interaction.md` eight-state model (default, hover, focus, active, disabled, loading, error, success, plus empty on data regions) as the intent-side canon for what a component must visually express. This file is the code-side split: it tells you which states are structural per-element concerns (always present) and which are data-conditioned per-region concerns (present only when the region has data semantics), so coverage can be audited systematically instead of eyeballed.

## Loading-pattern-by-duration

Treat these as guidance bands, not hard cutoffs; sources vary by tens to hundreds of ms:

| Wait | Pattern |
|---|---|
| under ~100ms | no loading indicator |
| ~100ms to 3s | skeleton matched to the final content's shape |
| ~3s to 10s | spinner or determinate progress (prefer determinate once you can compute an estimate) |
| beyond ~10s | move to background work, notify on completion |

Never show a blank screen while loading. Never show a loading indicator at all for actions that reliably complete under roughly 100 to 400ms; the flash of a spinner costs more perceived latency than it saves.

## Empty-state taxonomy

A region can be empty for different reasons, and each implies a different response:

- **First-use**: nothing has been created yet. Explain what belongs here and surface the primary creation action.
- **No-results**: a filter or search matched nothing. Confirm the query back to the user, suggest a correction or broader terms, offer to clear filters.
- **Cleared**: the user emptied it themselves (inbox zero, cart emptied). Confirm the state positively; don't treat it as an error.
- **Error**: the region failed to load. Show the error, not a generic empty message; offer retry.
- **Permission**: the user can't see this region's contents. Explain why, don't just show nothing.

Zero-results is a retention moment, not a dead end: treat a failed search as a problem to solve, not a limitation to report.

## Error-prevention hierarchy

Apply in this order before writing error-handling code, cheapest and most upstream first: **eliminate** the failure mode entirely (a date picker instead of free text) > **prevent** it at the point of entry (disable an invalid option rather than letting it be chosen) > **detect** it as early as possible (validate before submission, not after) > when it still happens, **recover** gracefully (retry, rollback, restore) > **explain** what happened in the user's terms > only then, if needed, offer a path to **diagnose** further. Most implementations skip straight to the explain step and never build the cheaper upstream layers.

## Error message anatomy and destructive actions

Every error message answers three questions: what went wrong, why (if known), and what to do next. Never a bare "Invalid" or "Something went wrong" with no next step. Handle by failure class:

- **Transient** (network/timeout): always offer Retry.
- **Destructive action**: confirm before commit, don't apologize after (see undo versus confirm below for when a confirm dialog is even the right tool).
- **Server error** (5xx-class): a clear, generic message plus a support/contact path; don't surface raw server detail.
- **Edit conflict** (concurrent-edit collision): show both versions side by side and let the user choose; never silently overwrite one side.

## Undo versus confirm

Default to undo, not confirm, for reversible and low-stakes actions: perform the action immediately, then show an undo affordance for roughly 5 to 10 seconds before it becomes final. Confirmation dialogs habituate; once a user has clicked through enough of them they stop reading. Reserve a confirm step for actions that are irreversible, high-cost, wide-scope (bulk/mass), or affect other people or accounts. When a confirm step is warranted, name the specific entity and consequence ("Delete project: Website Redesign?", not "Are you sure?"), and don't let the destructive option sit on the dialog's default focus.

## Notification and overlay surface selection

Pick the surface by how transient and how blocking the situation is, lightest first: inline or contextual message (adjacent to the field or item it concerns) → toast (transient, non-blocking, auto-dismissing) → inline banner (a persistent condition scoped to the affected section) → modal (a decision that must block everything else). The same lightest-first logic applies to interactive overlays by anchoring and blocking need: tooltip → popover → dropdown → bottom sheet (mobile) → drawer → modal → full-screen. Pick the lightest surface that still does the job; don't reach for a modal when a popover would do. (`accessibility.md` owns the focus-trap and ARIA mechanics for whichever surface is chosen.)

Toast rules: place bottom-center or a bottom/top-right corner, never top-center. Auto-dismiss success toasts in roughly 4 to 6 seconds; let error toasts persist until the user dismisses them. Never show more than one at a time, queue the rest. Pause the dismiss timer on hover or focus so a toast can't disappear mid-read.

## Autosave and draft recovery

For long-lived editing surfaces, autosave silently every 30 to 60 seconds instead of relying on an explicit save action. If an autosave attempt fails, say so without alarming the user ("changes stored locally, will retry") instead of failing silently. On return after a crash or unexpected close, offer an explicit Restore or Discard of the last unsaved snapshot instead of either silently restoring or silently discarding it.

## Notification-center preferences

Keep notification-preference controls coarse: 1 to 3 categories, each with an Off/Minimal/All choice, plus a prominent mute-all and mark-all-read. A wall of per-event toggles serves neither of the two things users actually want: silence everything, or tune the one or two categories they care about.

<!-- sources: triage-cuellarfr-dembrandt-ehmo.md (cuellarfr error-prevention.md, cuellarfr pattern-documentation.md; dembrandt notifications-and-recovery, loading-states-and-perceived-performance, button-states); triage-owl-listener.md (Doherty Threshold, state-machine framing); triage-pbakaus-ehmo-web.md (undo>confirm, eight-state table); miner-ext-c.md (Nutlope/hallmark interaction-and-states.md, dembrandt notifications-and-recovery / status-colors-and-errors, cross-checked); design-skill references/interaction.md (eight-state model, cited as intent-side canon per R2) -->
