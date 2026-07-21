# React rendering and RSC

Purpose: Keep React rendering fast and correct across the render/commit cycle and the server/client
boundary: which memoization actually holds, what breaks hydration, what can and cannot cross a
Server Component boundary, and how to shape code splitting so it helps instead of just moving cost.

Read when:
- A `memo()` or `useMemo()` isn't preventing the re-render it should.
- Working with Server Components, `"use client"`/`"use server"`, or a hydration mismatch.
- Deciding where to draw a Suspense boundary or how to split a bundle.

Skip when:
- The question is component composition, hooks, or effect/state discipline →
  `react-components-and-state.md`.
- The question is fetching, caching, or mutating data → `data-fetching-libraries.md`.
- The question is Next.js-specific file conventions, caching APIs, or routing → `nextjs.md`.
- The question is Core Web Vitals thresholds, image/font loading, or general bundle-size discipline
  not specific to React → `performance.md` (canonical home; this file cites it, not the reverse).

Inputs: the component tree and re-render or hydration symptom in question; whether the project runs
Server Components (Next.js App Router or another RSC framework); whether the React Compiler is
enabled.

Produces: a memoization boundary that actually holds, a Server/Client Component split that doesn't
throw a serialization or hydration error, and a code-split shape matched to what's actually needed
on first paint.

## Contents
- The memo-defeat family
- The React Compiler caveat
- Render-timing discipline
- The hydration/SSR-mismatch family
- The RSC serialization boundary
- The `"use client"` boundary and interactivity isolation
- Suspense and streaming boundaries
- Bundle shape and code splitting
- Parallel data fetching at the render layer

## The memo-defeat family

`memo()`/`useMemo()`/`useCallback()` are silently defeated by an unstable *identity*, not just a
missing call. Four concrete shapes to check for, all with the same underlying cause (a fresh
reference each render):
- An inline object/array/function/JSX-node literal passed as a prop to a memoized component
  (`jsx-no-new-object-as-prop` and siblings for arrays, functions, and JSX-as-prop), including an
  inline `[]`/`{}` used as a "default" fallback value; extract it to a module-level constant instead.
- A `useMemo` call placed *before* an early return in the component: the early-return path still
  pays for the memo work on every render, since the hook runs unconditionally. Extract the expensive
  work into a separate memoized child, or reorder so the guard runs first.
- A `Context.Provider value={...}` built from a local object literal without `useMemo`: every
  consumer re-renders on every parent render regardless of whether the values they read changed.
- Don't over-correct: wrapping a cheap primitive expression (a property read, simple math, a
  ternary) in `useMemo` costs more in comparison overhead than it saves. Reserve memoization for
  object/array/function/JSX *identity* stability, not arithmetic.

## The React Compiler caveat

Where the React Compiler is enabled, most of the manual memoization guidance above (adding
`useMemo`/`useCallback`/`memo()`) becomes unnecessary: the compiler infers stable identities
automatically. State this explicitly as a project-detection question before applying any of the
memo-defeat fixes above: check for the Compiler's Babel/SWC plugin before recommending manual
memoization. Destructure hook return values before calling them (rather than calling a destructured
method inline) so the compiler can track their stability more precisely.

## Render-timing discipline

Hoist values or functions with no dependency on local state or props to module scope; rebuilding
them every render is wasted work regardless of whether they're read (`prefer-module-scope-static-value`).
Hoist large static JSX trees (a static SVG icon set, for example) to a module-level constant for
the same reason. Lazy-initialize expensive `useState`/ref construction with the function form,
`useState(() => new ExpensiveThing())`, not `useState(new ExpensiveThing())`; the eager form
constructs the value on every render even though only the first render's result is kept.

## The hydration/SSR-mismatch family

Server and client must produce byte-identical initial output, or React either patches the mismatch
(and warns) or, in the worst cases, discards and re-renders the affected subtree. Ranked causes,
most to least frequent: date/time rendering that differs by server-vs-client clock or timezone;
reading a browser-only API (`window`, `localStorage`, `matchMedia`) during the initial render or in
a state initializer; branching on client-only state (auth status) before mount; `Math.random()` or
any non-deterministic value in render output (use `useId()` for stable identifiers instead, never
for list keys); invalid HTML nesting, since the browser auto-corrects it *before* React hydrates
(e.g. a `<div>` inside a `<p>` gets split into three siblings by the browser, silently breaking
React's expected tree); and CSS-in-JS class-name mismatches needing library-specific SSR
configuration.

The standard fix for anything that must differ between server and client (theme, stored
preferences) is the **isClient pattern**: a `useState(false)` flipped to `true` inside a mount-only
effect, rendering the server-matching placeholder until then. This is explicitly *not* the same as
checking `typeof window !== 'undefined'` as a render condition, since that evaluates `true` during
the client's own hydration pass too, reproducing the exact mismatch it's meant to avoid. To avoid a
flash of wrong content for client-storage-derived UI specifically, a synchronous inline
`<script dangerouslySetInnerHTML>` that mutates the DOM before hydration runs avoids both the
SSR crash and the post-hydration flash a `useEffect`-based fix would still show.
`suppressHydrationWarning` is element-scoped (one level deep) and only correct for genuinely
expected, harmless mismatches (a random ID, a locale-dependent timestamp); never use it as a
blanket parent-level fix or to hide an undiagnosed mismatch. A hydration error that only reproduces
in production, not locally, and vanishes in incognito mode is almost always browser-extension DOM
injection: diagnose via incognito, never by restructuring the app around it.

Never branch directly on a browser global, embed the current time, or read `matchMedia` inside a
state initializer or during render without a mount guard; that is the same mismatch mechanism as
above, just triggered earlier in the render.

## The RSC serialization boundary

Exact rule for what a Server Component can pass to a Client Component as a prop: primitives,
`null`/`undefined`, plain objects and arrays, `Date` (serialized as an ISO string), `Promise<T>`
(consumed via `use()` on the client), pre-rendered JSX/Server Component output, and Server Functions
(passed as serializable references) can all cross. Regular functions (other than Server Functions),
class instances, DOM nodes, `Symbol`, database connections, and secrets cannot. `"use server"`
marks a **Server Function**, not a Server Component; this is a common confusion point. Importing a
Server Component inside a `"use client"` file makes the bundler treat it as client code; pass its
rendered output through `children` or another prop instead of importing it directly.

Minimize what actually crosses the boundary: pass only the fields a client component reads (a
50-field user object becomes just `user.name`), not the whole object. RSC-to-client prop dedup is
by object *reference*, not value: `.toSorted()`, `.filter()`, `.map()`, or a spread all produce a
new reference and defeat dedup even when the contents are identical; pass raw data once and
transform it client-side instead.

## The `"use client"` boundary and interactivity isolation

Global/client state, animation libraries, scroll listeners, and pointer-physics code only work
inside a Client Component; mark the component (or provider) carrying them with `"use client"`.
Isolate that marking to the smallest possible leaf: a component using an animation library or
scroll/pointer listeners should be its own isolated leaf Client Component, not a whole subtree.
Server Components should render static layout around it. This is a specific, checkable App Router
boundary rule agents commonly get wrong in both directions: over-marking whole trees as client (loses
the RSC performance and secret-isolation benefit) or under-marking (hydration mismatches, or a
runtime error when server-only code reaches the client bundle). A parent's staggered-animation
`variants` and its children must share the same Client Component tree; staggering silently breaks
if a server/client boundary splits them.

## Suspense and streaming boundaries

Don't `await` in an async Server Component before returning JSX when only part of the tree actually
needs that data; wrap the data-dependent subtree in its own `<Suspense>` instead, so the rest of the
page can stream immediately. Share one promise across sibling consumers via `use(promise)` rather
than awaiting it once and passing the resolved value down. Explicit cases where a Suspense boundary
is the wrong call: critical layout data, SEO-critical above-the-fold content, a small/fast query, or
any UX where the resulting layout shift is worse than a short wait. Nested `<Suspense>` boundaries
create independent progressive-loading regions: the outer boundary only catches the first
suspension; each inner boundary resolves independently. A `key` prop resets a Suspense boundary
when navigating between same-shape content (different profile IDs, for example).

## Bundle shape and code splitting

Avoid barrel-file imports (`import { Button } from './components'`) in performance-sensitive paths;
without effective tree-shaking, a barrel import can make every re-exported module reachable and
evaluated even though only one export is used, at real measured cost (hundreds of milliseconds of
import overhead in large libraries' entry files). Import directly from the source module instead.
Gate a browser-only module behind a dynamic `import()` combined with a `typeof window !== 'undefined'`
check to keep it out of the SSR bundle entirely. Preload a heavy, not-yet-visible bundle on an
intent signal (`onMouseEnter`/`onFocus`) rather than waiting for the click that needs it.

## Parallel data fetching at the render layer

Independent async work in any data-loading context (an effect, a loader, a Server Component) must
run through `Promise.all`, not a sequential chain of awaits; this is core doctrine homed in
`state-and-data.md`. The Server Component-specific call-site: sibling async Server Components
(`<Header/><Sidebar/>`) fetch concurrently by composition, since each is independently rendered;
nesting one awaited fetch above another in the same component creates an accidental waterfall that
composition alone doesn't fix. `React.cache()` deduplicates non-`fetch()` async work (DB queries,
auth checks) within a single request; Next.js already auto-memoizes `fetch()` calls by URL and
options, so reach for `React.cache()` only for the rest. Its cache key uses `Object.is` shallow
equality, so passing a freshly-constructed inline object as an argument on each call always misses;
pass the same object reference.

<!-- sources: millionco/react-doctor (Modified MIT, performance/nextjs/correctness categories, recommendation-string quotes attributed);
Vercel react-best-practices plugin (Apache-2.0, rendering-performance and server-performance sections);
OpenAEC-Foundation/React-Claude-Skill-Package (MIT, react-errors-hydration, react-impl-server-components);
Leonxlnx/taste-skill (MIT, RSC safety contract and interactivity-isolation section) -->
