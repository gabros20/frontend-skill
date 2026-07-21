# State and data

Purpose: the state and data-flow doctrine underneath any client feature: modeling a feature's states as a machine, deriving instead of storing, avoiding fetch waterfalls, and matching recovery behavior to the failure, all independent of framework.

Read when:
- Designing a feature's state shape, wiring data fetching, or deciding how a client should react to a request outcome.
- Checking whether a set of `await`s forms an accidental waterfall.
- Deciding how to model or handle a session, an auth flow, or a component's teardown.

Skip when:
- The question is which visual state to show for a given condition (`state-completeness.md`).
- The question is form-specific validation timing or input semantics (`forms.md`).
- The question is a framework-specific fetching or caching API (`data-fetching-libraries.md`, `nextjs.md`, and `react-rendering-and-rsc.md` own the concrete call-sites for the principles stated here).

Inputs: the feature's states and transitions, its data dependencies, and its failure modes.

Produces: a state machine with no impossible states, a fetch plan with no accidental waterfalls, and a defined recovery and retry behavior per failure class.

## Contents
- Model state as a machine
- Derive, don't store
- URL as state
- No waterfalls: parallel independent awaits
- Cache freshness and invalidation
- Optimistic UI and rollback
- Retry, backoff, and conflict recovery
- Client auth-flow shape
- Component teardown discipline
- Analytics: emit, don't define

## Model state as a machine

Treat any non-trivial feature as an explicit state machine: enumerate states, the events and transitions between them, and any guards, rather than a loose pile of booleans. The test for a good model: every state has an exit, and no two states can be true at once (a request that is simultaneously "loading" and "error" is a modeling bug, not a rare edge case). Canonical skeletons to start from:

- **Form**: idle → editing → validating → submitting → success/error → idle.
- **Fetch**: idle → loading → success/error, error → retrying.
- **Auth**: logged-out → authenticating → logged-in → logging-out.
- **Wizard**: step N → review → submitting → complete.

Model one machine per concern. Combining independent concerns into a single machine multiplies their states into an unmanageable cross-product; compose or nest separate machines instead.

## Derive, don't store

If a value can be computed from state already available, at render time or read time, compute it instead of storing a second copy synced by an effect. Copying a prop into state via an effect (a "mirror" pattern) is a well-known anti-pattern: it adds a render lag, a second source of truth, and a failure mode where the two drift apart. The same applies to fetching itself: don't wrap a raw fetch in a bare effect for anything beyond the simplest case, since an effect-driven fetch can race, double-fire on remount, and leak if the component unmounts before it resolves. Use whichever data-fetching layer or server-rendering mechanism the stack provides instead (concrete APIs live in `data-fetching-libraries.md` and `nextjs.md`).

## URL as state

Any state that should survive a reload, be shareable via a link, or support back/forward navigation belongs in the URL, not only in memory: reflect it through the History API (`pushState`/`replaceState`) or query parameters, and handle `popstate` to restore it on back/forward. Concretely: persist a selected tab in a `?tab=` query parameter (or `localStorage` as a fallback), never in `sessionStorage`, since a session-scoped store doesn't survive a shared link or a new tab.

## No waterfalls: parallel independent awaits

This is the canonical home for this principle. Framework-specific call-sites (Server Components, route loaders, Server Actions) live in `nextjs.md`, `react-rendering-and-rsc.md`, and `data-fetching-libraries.md`, and should point back here rather than restate it. The rule: independent async operations must start together, not one after another.

- Defer an `await` into the branch that actually needs its result; don't block a code path that never uses it.
- Start independent promises immediately and await them late, rather than letting unrelated operations form an accidental chain.
- Use `Promise.all()` (or the framework's equivalent, such as sibling components each fetching concurrently) for independent operations; a nested await-above-await shape creates a waterfall even when the two calls don't actually depend on each other.

This is a large and repeatedly convergent effect: measured differences between a waterfalled and a parallelized version of the same requests run roughly 2 to 10x, and the identical principle recurs for route loaders, server-rendered components, and effects alike. Establish it once per feature rather than re-deriving it per call-site.

## Cache freshness and invalidation

Treat client-cached data as having a freshness window, not a permanent copy: define how long a cached value is considered fresh versus how long it's retained before eviction, and explicitly invalidate (not merely refetch) the affected cache entries after a mutation changes them. Prefer per-request dedup (the same data requested twice within one render pass resolves from a single call) over cross-request caching, unless the data is genuinely reused across separate requests within a short window.

## Optimistic UI and rollback

Update the UI immediately, assuming the action will succeed, only when the action's success rate is very high (roughly greater than 99%), it's reversible, and it's low-stakes: like/toggle/favorite, rename, reorder. Roll back to the prior state and surface an error only if the call actually fails. Never apply this to payments, deletions, or any other irreversible or high-consequence action; those wait for the real result before updating.

## Retry, backoff, and conflict recovery

Match the recovery mechanism to the failure class:

- **Network or timeout error**: retry automatically with exponential backoff, rather than failing immediately or retrying at a fixed interval.
- **Session expiry** (a 401 mid-session): refresh the token silently and replay the original request; return the user to the exact state they were in, not to a login screen that discards their place.
- **Edit conflict** (a concurrent write collision): show both versions side by side and let the user resolve it; never silently overwrite either side.
- **Server error** (5xx): surface a clear, generic message; don't retry indefinitely against a server that's genuinely failing.

Map an API's status code to the right client behavior rather than treating every non-2xx response the same: 400 to validation errors on the relevant fields, 401 to the session-expiry handling above, 403 to a permission-denied state (not a generic error), 404 to a not-found state, 429 to a rate-limit message paired with backoff before retrying, 500 to the generic server-error handling above.

## Client auth-flow shape

Model authentication as its own state machine (see above): logged-out, authenticating, logged-in, logging-out, with session expiry handled as the silent-refresh recovery case above, not as a hard redirect that discards the user's place. Whichever auth provider's SDK is in use, its client-side hook and provider-component API are framework-specific (see `nextjs.md`); never persist the session token itself in `localStorage` or `sessionStorage` regardless of provider (`client-security.md` is the canonical home for why: anything reachable from client storage is public). Pick a provider based on what the product actually needs, a fast prebuilt UI, passwordless/flow-builder flexibility, or enterprise SSO, rather than defaulting to whichever is best known.

## Component teardown discipline

Whatever a component's life created (a subscription, a timer, an event listener, an in-flight request) must be undone on teardown: remove event listeners, cancel subscriptions, clear timers and intervals, and abort pending requests (`AbortController`) on unmount. This is a framework-agnostic completeness rule: a dangling timer or an unaborted request outlives the UI it was serving. The framework-specific hook mechanics for wiring this cleanup belong in `react-components-and-state.md`.

## Analytics: emit, don't define

The client's job is to emit well-named events at the point of genuine user intent, a completed action, not to define what the event means for the business or where it gets reported. Emit from the event handler that performs the action, not from an effect reacting to a resulting state change; emitting from a reactive effect risks firing the same event twice if the effect re-runs. Metric definitions, dashboards, and analysis pipelines are out of scope here; this file owns only the instrumentation point.

<!-- sources: triage-owl-listener.md (owl-listener state-machine/SKILL.md skeletons); triage-cuellarfr-dembrandt-ehmo.md (cuellarfr interaction-design/state-and-transitions.md, ehmo web/SKILL.md URL/history/scroll-restoration, dembrandt loading-states-and-perceived-performance optimistic UI); triage-pbakaus-ehmo-web.md (pbakaus harden.md API-status-to-UI-state mapping, memory-leak teardown checklist); miner-vercel.md (react-best-practices async-*/server-* rules: Promise.all/waterfalls, RSC parallel fetching, client-auth-flows Clerk/Descope decision matrix, client-passive-event-listeners); miner-react-doctor.md (state-and-effects: no-derived-state family, no-fetch-in-effect, cleanup-completeness family; tanstack-start/react-router four-way Promise.all convergence) -->
