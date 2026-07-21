# Forms

Purpose: the code-level contract for form implementation: what each piece of field text is for, when validation runs, what a field's `type`/`autocomplete` should be, how submit behaves, and how errors are wired to assistive tech, so a form is functionally correct and accessible independent of its visual layout.

Read when:
- Implementing or reviewing a form, an input group, or a submission flow.
- Deciding when validation should run, what a submit button should do while invalid or in-flight, or how an error should be exposed to a screen reader.

Skip when:
- The question is form layout or visual hierarchy (design's `interaction.md` forms section owns that).
- The question is the submission's state machine, retry behavior, or optimistic update (`state-and-data.md`).
- The question is touch-target sizing or focus-ring treatment (`accessibility.md`).
- The question is text-expansion allowance or locale-correct formatting (`i18n.md`).
- The form is native (SwiftUI or Compose): its input types, validation-surface, and submit-state
  mechanics live in `swiftui.md` / `compose.md` — this file's autocomplete/aria wiring is web-only.

Inputs: the field set, its constraints, and whether submission is idempotent or reversible.

Produces: a validated, accessible form implementation with correct timing, correct input semantics, correct submit-button behavior, and correctly wired errors.

## Contents
- Three-layer guidance model
- Validation timing
- Error association and error summary
- Input type and autocomplete
- Fieldset and legend
- Submit-button state
- Input correctness guards
- Cross-references

## Three-layer guidance model

Every field has three distinct text roles, shown at different times, never merged into one string: **helper text** (constraints or format, shown up front, persistent), **placeholder** (a format example inside the field itself, e.g. `+1 555 123 4567` or `01 Jan 2026`; never the only label, never an instruction), and **validation message** (appears only once the field has been evaluated, and replaces the helper text in the same slot rather than pushing the layout down). Reserve the validation slot's height up front (for example a `min-height` on the message container sized to one line) so an error appearing doesn't cause a visible jump.

## Validation timing

Validate on blur by default, not on every keystroke: real-time keystroke validation is distracting and flags a field as wrong while the user is still typing it. Exceptions: complex or cross-field validation (password confirmation, date ranges) waits until submit; a genuinely real-time check that must run while typing (a strength meter) debounces 300 to 500ms and never fires on the very next keystroke after a value that just passed.

## Error association and error summary

Associate every field error with its input via `aria-describedby`, and set `aria-invalid="true"` on the field while the error is showing. On a failed submission, move focus to the first invalid field, or to a keyboard-focusable error summary at the top of the form that links to each failing field, rather than leaving focus wherever it was. Mark required fields via `aria-required` (or mark whichever of required/optional is the minority in the visible label), never by color alone.

## Input type and autocomplete

Set the correct `type` and `inputmode` on every field so it gets free format validation and the right mobile keyboard: `type="email"`, `type="tel"`, `type="url"`, `type="date"` (a real picker, never freeform text for dates), `type="password"`, `type="search"`, `type="color"`; `inputmode="numeric"` with `pattern="[0-9]*"` for numeric-only entry that shouldn't summon a stepper. Set `autocomplete` on every field with a standard mapping: `name`, `email`, `tel`, `street-address`, `postal-code`, `new-password`, `cc-number`. A one-time-code (OTP) field combines `inputmode="numeric"` + `pattern="[0-9]*"` + `autocomplete="one-time-code"` so the OS can offer to fill an SMS code automatically. Choose input control by option count: 5 or fewer options as visible radios, 6 or more as a select; dates always through a picker, never freeform text.

## Fieldset and legend

Group related inputs (a radio set, a checkbox set, an address block) inside a `<fieldset>` with a `<legend>`, not a bare heading; a legend is announced by assistive tech as the group's label in a way an ordinary heading is not.

## Submit-button state

Keep the submit button enabled and validate on submit, surfacing errors at that point, rather than disabling it while the form is "invalid." A disabled button gives a keyboard or screen-reader user no reason they can act on, and disabling on invalid is a known accessibility anti-pattern; this default overrides the older convention of disabling short forms until they're valid. The one legitimate reason to disable submit is to prevent a double submission while a valid submission is already in flight, and only paired with a visible loading state on the button.

## Input correctness guards

- A `checked` input needs an `onChange` handler, `readOnly`, or `defaultChecked`; without one of the three, the framework can't tell whether the checkbox is meant to be controlled.
- Set the indeterminate state through the DOM property on the element reference, not as an HTML attribute; indeterminate has no attribute form.
- Never block paste in authentication fields (password, 2FA code); it breaks password managers and assistive input tools that rely on paste.
- Multiline fields (`textarea`) must stay user-resizable unless the field auto-grows with its content.
- Guard Enter-to-submit against IME composition: in CJK and similar input methods, Enter confirms a candidate mid-composition and must not also submit the form; check the composition state before treating Enter as submit.
- Treat numeric parsing as unsafe input, not a guaranteed number: `Number('')` is `0` and `Number('abc')` is `NaN`, both silently wrong if used unchecked as a form value.

## Cross-references

Touch-target sizing and focus-ring treatment for form controls: `accessibility.md`. Text-expansion allowance for translated labels and placeholders, and locale-correct formatting: `i18n.md`. Submission modeled as a state machine (idle → editing → validating → submitting → success/error), plus retry and optimistic behavior after submit: `state-and-data.md`.

<!-- sources: triage-owl-listener.md (form-design/SKILL.md validation timing, aria-describedby); triage-pbakaus-ehmo-web.md (ehmo web/rules/_sections.md forms section, WCAG SC 1.3.5); triage-cuellarfr-dembrandt-ehmo.md (dembrandt form-design, three-layer model, submit-button conflict resolved per inventory R5); miner-ext-c.md (Nutlope/hallmark interaction-and-states.md form a11y, autocomplete/type table); miner-react-doctor.md (a11y: no-blocked-paste, no-nonresizable-textarea, form-control-requires-name, fieldset-requires-legend; correctness: checked-requires-onchange-or-readonly, no-indeterminate-attribute, no-enter-submit-without-ime-composition-guard, no-unguarded-numeric-input-parse) -->
