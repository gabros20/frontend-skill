# React components and state

Purpose: Compose React components and structure state/effects so the code is correct by
construction: the right primitive, state in the right place, hooks that don't silently re-fire,
race, or leak.

Read when:
- Building or reviewing a React component, hook, or effect.
- Deciding where a piece of state should live, or which state-management approach to reach for.
- A component re-renders more than expected, an effect loops, or a dependency warning needs a fix,
  not a suppression.

Skip when:
- Next.js/RSC rendering mechanics, hydration, or bundle-shape → `react-rendering-and-rsc.md`.
- Fetching, caching, or invalidating server data → `data-fetching-libraries.md`.
- The target is React Native → `react-native.md` (this file's doctrine still applies there; that
  file adds only the platform divergences).
- Framework-agnostic state modeling (derive-don't-store, URL-as-state, state machines) →
  `state-and-data.md`, which this file's React-specific rules sit underneath.
- Provider placement across routes / folder import layering → `client-architecture.md`.
- App-shell error reporting, multi-boundary placement → `client-app-wiring.md`.

Inputs: the component/hook/state shape in question; the target React version; any state library
already in the project.

Produces: a composition choice, a state/effect structure free of the "effect chain" and "derived
state via effect" anti-patterns, and correct hook dependencies.

## Contents
- Composition patterns
- Compound components and Context DI shape
- Controlled vs. uncontrolled inputs
- The "you might not need an effect" decision tree
- Effect chains, event handlers, and cleanup
- Effects as synchronization; per-render closures
- Before `memo`: structural fixes
- State-updater purity and stability
- Dependency-array correctness
- Selector/derivation stability across state libraries
- Context value stability
- React 19 API deltas
- Continuous values: state vs. a motion value
- Isolation pointers

## Composition patterns

Prefer explicit variant components (`<PrimaryButton/>`, `<ThreadComposer/>`, `<EditComposer/>`) over
one component switched by a pile of boolean props (`isThread` / `isEditing` / `isDM`) or a
`renderXxx` slot prop. Each boolean doubles the state space; combinations multiply silently, are hard
to test, and force every call site to reason about flags it does not own. Extract shared parts into
small pieces and compose them inside each named variant. Reach for a slot/`renderX` prop only when
the parent must inject **data into** a call-site callback, not as a default composition style —
prefer `children` otherwise.

Never define a component inside another component's render body, including one wrapped by a HOC:
React treats it as a new component type every parent render, unmounting and remounting it (lost
input focus, replayed effects, reset animations, reset scroll). Components, and anything wrapping
them, must be module-scope-stable.

A component file that also exports a non-component value (a constant, a type, a helper) breaks Fast
Refresh, forcing a full reload instead of state-preserving HMR on every edit; keep component files
exporting only components. Never call a component as a function (`Component(props)`) to "render" it
inline: a direct call executes outside React's render path and silently breaks hooks, state, and
memoization for that subtree; render as JSX instead.

`cn()` (typically `twMerge(clsx(inputs))`) resolves both conditional classes and conflicting
Tailwind utility classes; plain `clsx` alone does not dedupe conflicting utilities. An explicit
`undefined` prop spread over a default still clobbers it; reapply defaults with `??` at the use
site rather than trusting spread order. Memoized components must not use default params `= []` /
`= {}` — each call creates a new reference; extract a module-level constant instead.

## Compound components and Context DI shape

For compound UIs (tabs, composer, multi-step frame), subcomponents read shared state from Context —
not a prop-drilled god-object. Consumers compose only the pieces they need:

```tsx
<Composer.Root>
  <Composer.Input />
  <Composer.Submit />
</Composer.Root>
```

**Context as a DI contract:** expose a stable shape `{ state, actions, meta }` (names can vary; the
partition matters). Leaf UI never knows whether the provider is `useState`, Zustand, or server-synced
— swap the provider, same leaves. Lift state into the provider so siblings *outside* the visual frame
(e.g. an external Forward/Submit toolbar) can act without refs or prop-drill. Context is for
low-velocity data (theme, user, compound-widget state); high-velocity values belong in a store with
selectors or `useSyncExternalStore` (see Context value stability below). Folder-level placement of
providers lives in `client-architecture.md` (composition → Context → store ladder; provider-per-
route-subtree).

## Controlled vs. uncontrolled inputs

Real-time validation, formatting, or masking that the UI must reflect on every keystroke needs a
controlled input (`value` + `onChange`). File upload is uncontrolled, always: a file input's `value`
cannot be set programmatically for security reasons. React 19 async submission uses
`<form action={fn}>`: the method is always POST, uncontrolled fields auto-reset after a successful
submission, and it degrades to working without JS when the action is a Server Function.
`<button formAction={otherFn}>` lets one form expose multiple distinct submit actions (publish vs.
save-draft) without separate forms. One `useState` per field for 1-4 unrelated fields; a single
state object once a form has 5+ or genuinely related fields. Form library thresholds and upload
pipeline live in `forms.md`.

## The "you might not need an effect" decision tree

Before writing a `useEffect`, work down this list; each rung replaces the effect with something
that doesn't need one:
1. **Derive during render.** A value computed purely from props/state belongs in the render body or
   a `useMemo`, never mirrored into state via an effect that copies a prop in. Copying a prop into
   state once is valid only as an *initial seed* that is never expected to stay in sync with later
   prop updates.
2. **Reset via `key`.** Resetting all of a component's state when an identifying prop changes is a
   `key` change on the component, not an effect that manually resets every field.
3. **Handle it in the event handler that starts the chain.** State updates that always happen
   together (submit → loading → result → done) belong in one event handler, not a relay of effects
   each watching the previous effect's output.
4. **Fetch through a data layer, not a bare effect.** A `useEffect` fetch can race, double-fire on
   Strict Mode, or leak into an unmounted component; use TanStack Query/SWR or a Server Component
   instead (see `data-fetching-libraries.md`).

Render itself must stay pure: no `setState`, ref writes, context/store construction, or
`URL.createObjectURL()` call in the component body, since React can replay or discard a render at
any time. The one carve-out is lazy one-time initialization guarded by
`if (ref.current === null) ref.current = expensiveThing()` directly in the render body.

App-wide init that must run once belongs in a module-level guard or entry module — not
`useEffect([])` on a remountable component (Strict Mode double-fires it).

## Effect chains, event handlers, and cleanup

An async `onClick`/`onSubmit` handler stays interactive across its `await`; without a re-entry
guard (a busy flag, or disabling the trigger in flight), a double-click fires the write twice.
State-updater callbacks must be pure: React may replay them, so a side effect like an analytics or
storage call inside a setter can double-fire.

Every registration (a listener, an observer, a `requestAnimationFrame` loop, a debounce timer)
needs a teardown that references the *same* function identity that was registered:
`removeEventListener` matches by reference, so a fresh inline handler at cleanup time can never
equal what was added. A wrapper hook that calls a forwarded callback as `fn()` instead of
`return fn()` silently discards its cleanup, a subtle bug no standard lint catches.

Guard a post-`await` `setState` inside an effect with a cancellation flag closed over by the cleanup
function, so a stale response from a superseded request can't overwrite fresher state. Attach
`.catch()`, not just `.finally()`, to an async chain that sets state: a rejection skips a trailing
"reset the loading flag" line placed only after the await, so reset loading flags in `finally`.
Never pass an `async` function directly as an effect callback; wrap the async work in an inner
function instead.

## Effects as synchronization; per-render closures

An effect **synchronizes with an external system** (DOM, network subscription, third-party widget,
browser API) — it is not a lifecycle alias. `componentDidMount` ≠ `useEffect(fn, [])`: empty deps
capture the *initial* props/state and will not see later values.

Mental model (Dan): each render has its own props, state, handlers, and effects. A "stale closure"
is that model working correctly, not a React bug. To read the latest value without resubscribing,
use a ref, redesign so the value is a dependency, or `useEffectEvent` (below). Don't lie about
dependencies to "run once" — omit/force `[]` causes bugs; fix with hoist, `useReducer`, put the
function inside the effect, or Effect Events. Infinite loops come from a missing deps array *or*
unstable deps that change every render — fix the source, not the symptom.

## Before `memo`: structural fixes

Before sprinkling `memo` / `useMemo` / `useCallback`:

1. **Move state down** so only the leaf that reads it re-renders on change.
2. **Lift static content into `children`** (or slots) so parent state updates do not re-render the
   static subtree — the parent re-renders; the children element identity stays stable when passed
   from above.

These structural fixes often beat memoization. With the React Compiler enabled, most manual
`useMemo`/`useCallback`/`memo` calls become unnecessary anyway (see React 19 API deltas).

## State-updater purity and stability

Use the functional updater (`setCount(c => c + 1)`) whenever a new value depends on the prior one,
especially inside a deferred callback that might read a stale captured value; this includes boolean
toggles. Lazy-initialize expensive state or refs with the function form
(`useState(() => buildExpensiveThing())`); without it, the initializer runs on *every* render even
though only the first render's value is kept. React only re-renders on a new reference: mutating an
array or object in place on a prop, hook result, or reducer state is silently ignored; use
`.toSorted()`/`.toReversed()`/`.toSpliced()`/spread instead of the mutating methods.

## Dependency-array correctness

Beyond `exhaustive-deps`: a mutable value like `ref.current` or `location.pathname` doesn't trigger
a re-render when it changes, so listing it as a dependency is a no-op, and a `NaN` dependency can
never be seen as "changed." Never list an object/array/JSX *literal* as a dependency; extract the
primitive it depends on. For a continuously-changing raw value (scroll offset, viewport width),
depend on a derived boolean computed outside the effect, not the raw value, or the effect refires
on every intermediate step.

`useEffectEvent` (React 19.2+) wraps a callback so an effect always reads the latest props/state
without listing them as dependencies or resubscribing on every render. **Never put an Effect Event
function in a dependency array** — its identity changes every render by design; listing it forces
the effect to re-run every time and defeats the API. `useSyncExternalStore` replaces a hand-rolled
subscribe-effect for reading external stores correctly under concurrent rendering; its `getSnapshot`
must return referentially stable data or it infinite-loops.

## Selector/derivation stability across state libraries

One principle underlies Zustand, Redux (Toolkit), Jotai, MobX, and Valtio selector code: a selector must
return a referentially stable value, or every subscriber re-renders regardless of whether the data
it cares about changed. Never destructure a whole store; a selector that constructs a fresh
array/object every call defeats the equality check the same way an inline object literal defeats
`memo()`. Replace state, never mutate it.

Beyond that convergent shape, each store library has its own read-in-render rule (Valtio's
`useSnapshot()` versus its raw proxy) and its own disposer-cleanup obligation (MobX's
`reaction`/`autorun`) — that's the library's own API surface, not a transferable principle; follow
its docs or shipped skill for the exact shape. The one library-agnostic piece worth keeping: a
subscription-style disposer follows the same cleanup-completeness rule as any effect or observer
teardown, whichever store library it comes from.

## Context value stability

A context value passed as an object literal directly to `Provider value={...}` forces every
consumer to re-render on every parent render; wrap it in `useMemo` keyed on the fields that change
— or structure the contract as `{ state, actions, meta }` with stable `actions` references. Split
state and dispatch into two contexts when dispatch-only consumers shouldn't re-render on state
changes (`dispatch` from `useReducer` is referentially stable). Never put a value that changes more
than roughly once a second (mouse position, scroll, per-keystroke input) into context; reach for
`useSyncExternalStore` instead, and avoid one mega-context holding many unrelated fields.
`createContext<T | null>(null)` plus a hook that throws on `null` is the standard "provider is
mandatory" guard; use a real default only when the provider is genuinely optional.

## React 19 API deltas

Time-sensitive; check against the project's installed React version before applying. `ref` can be a
plain prop (no `forwardRef`); a ref callback may return a cleanup function run on detach, in which
case the ref does *not* receive `null` on unmount, a behavior change from React 18.
`<Context value={...}>` replaces `<Context.Provider value={...}>` (18 still needs `.Provider`).
`use()` is the only hook callable inside a conditional or after an early return, never inside
`try/catch`; its promise must be created in a Server Component or a stable location, never
recreated on every client render. `useActionState` replaces `useFormState`; `useOptimistic`'s setter
must be called inside `startTransition`; `useFormStatus` must be called from a *child* of the
`<form>`, never the component rendering it, or `pending` is always `false`. `React.FC<P>` is
discouraged (direct prop-object annotation instead), and React 19 removed `defaultProps`,
`propTypes`, `UNSAFE_` lifecycles, and the legacy `ReactDOM` render/hydrate APIs. With the React
Compiler enabled, most manual `useMemo`/`useCallback`/`memo` calls become unnecessary.

## Continuous values: state vs. a motion value

Never track a continuously-changing, user-input-driven value (mouse position, scroll progress,
pointer/drag offset) with `useState`; it re-renders the whole subtree on every change and collapses
under load on mobile. Use `useRef` for a write-only value read only in the same handler, or a
motion-value primitive (`useMotionValue`/`useTransform`/`useScroll`) that updates outside React's
render cycle when the value must drive visual output. Treat imperative scroll tracking (a raw
`scroll` listener, mirroring `window.scrollY` into state, or a `requestAnimationFrame` loop that
writes state) as a hard ban, not a preference; use a motion value, `IntersectionObserver`, or native
CSS `animation-timeline: view()` instead. Distinguish human vs. programmatic scroll when auto-
scrolling lists (e.g. chat): only pin-to-bottom when the user is already near the bottom; do not
drive that decision through a `useEffect` that fights the user's scroll.

## Isolation pointers

- **Children as isolation:** pass static subtrees as `children` from above so parent-local state
  updates do not re-render them (same structural fix as before-memo #2).
- **Multiple error boundaries:** prefer route/feature-local boundaries over one app-wide catch-all
  so one slice fails closed. Boundaries catch render errors only — async/event-handler errors need
  explicit try/report. Placement, recovery UI, and reporter wiring: `client-app-wiring.md`.

<!-- sources: millionco/react-doctor (Modified MIT, state-and-effects/react-builtins/architecture);
OpenAEC-Foundation/React-Claude-Skill-Package (MIT, react-syntax/react-core/react-errors);
Leonxlnx/taste-skill (MIT, client-architecture/state-management); Kent C. Dodds Application State
Management + colocation (personal blog, re-expressed) — composition ladder, multi-provider;
Dan Abramov, overreacted.io/a-complete-guide-to-useeffect (personal blog, re-expressed) — effects
as sync, per-render closures, before-memo structural fixes; vercel-labs/agent-skills
@vercel-composition-patterns (258K) — boolean→variants, {state,actions,meta} DI contract, children
over renderX; vercel-labs/agent-skills @vercel-react-best-practices residual — useEffectEvent never
in deps, module-level init once, memo default-param reference trap; alan2207/bulletproof-react —
children isolation, multi error boundaries; TkDodo + @_nikhilsnayak_ auto-scroll without effect
(human vs programmatic) — via authors-architecture.md, skills-finder.md, github-relay.md,
x-bookmarks.md -->
