# State and data

Purpose: the state and data-flow doctrine underneath any client feature: modeling a feature's states as a machine, deriving instead of storing, avoiding fetch waterfalls, and matching recovery behavior to the failure, all independent of framework.

Read when:
- Designing a feature's state shape, wiring data fetching, or deciding how a client should react to a request outcome.
- Checking whether a set of `await`s forms an accidental waterfall.
- Deciding how to model or handle a session, an auth flow, or a component's teardown.
- Building a chat UI or agent-run view over a streaming server run: resume, provisional text, approve, cancel.

Skip when:
- The question is which visual state to show for a given condition (`state-completeness.md`).
- The question is form-specific validation timing or input semantics (`forms.md`).
- The question is a framework-specific fetching or caching API (`data-fetching-libraries.md`, `nextjs.md`, and `react-rendering-and-rsc.md` own the concrete call-sites for the principles stated here).

Inputs: the feature's states and transitions, its data dependencies, and its failure modes.

Produces: a state machine with no impossible states, a fetch plan with no accidental waterfalls, and a defined recovery and retry behavior per failure class.

## Contents
- Server state ≠ client state
- Model state as a machine
- Derive, don't store
- URL as state
- No waterfalls: parallel independent awaits
- Cache freshness and invalidation
- Optimistic UI and rollback
- Retry, backoff, and conflict recovery
- Offline behavior
- Agent-run streaming client
- Client auth-flow shape
- Component teardown discipline
- Analytics: emit, don't define
- Production wiring (pointer)

## Server state ≠ client state

**Server state** is data the backend owns that the client *borrows* as a cached view (lists, detail
records, permissions from the API). It needs a dedup/cache/revalidate layer, explicit invalidation
after mutations, and a freshness window — not a permanent copy in a global client store.
**Client state** is UI-only: selection, open/closed panels, draft form fields before submit, wizard
step, theme preference. Treating server entities as long-lived Redux/Zustand truth (and syncing them
by hand) is the historical category error that produces stale UI and double sources of truth.

Put server reads/writes through the data-fetching layer (`data-fetching-libraries.md`); put
ephemeral UI in local/component or intentional client stores (`react-components-and-state.md`).
Shared "is this feature's data server or client?" is decided once per field, not per component.

## Model state as a machine

Treat any non-trivial feature as an explicit state machine: enumerate states, the events and transitions between them, and any guards, rather than a loose pile of booleans. The test for a good model: every state has an exit, and no two states can be true at once (a request that is simultaneously "loading" and "error" is a modeling bug, not a rare edge case). Canonical skeletons to start from:

- **Form**: idle → editing → validating → submitting → success/error → idle.
- **Fetch**: idle → loading → success/error, error → retrying.
- **Auth**: logged-out → authenticating → logged-in → logging-out.
- **Wizard**: step N → review → submitting → complete.
- **Agent run**: queued → running ⇄ awaiting-approval → succeeded / failed; running or awaiting-approval → cancelling → cancelled. Each terminal state can carry a partial result.

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

The same waterfall recurs in four common shapes regardless of which router or runtime is involved: a route loader awaiting two independent resources one after another instead of via `Promise.all`; a server-rendered loader or component doing the same; an API route, Server Action, or route handler starting unrelated async operations one after another instead of kicking them all off immediately and awaiting late; and a `for`/`while` loop awaiting each iteration's async call instead of collecting the promises and awaiting them together. Each is the identical mistake wearing a different router's clothes.

## Cache freshness and invalidation

Treat client-cached data as having a freshness window, not a permanent copy: define how long a cached value is considered fresh versus how long it's retained before eviction, and explicitly invalidate (not merely refetch) the affected cache entries after a mutation changes them. Freshness (`staleTime`-class) and unused retention (`gcTime`-class) are different knobs — see `data-fetching-libraries.md` for the portable traps (default immediate-stale, `initialData` blocking fetch, keys as deps). No caching layer infers which entries a given write touched; the mutation site must name the affected keys/tags itself. Prefer per-request dedup (the same data requested twice within one render pass resolves from a single call) over cross-request caching, unless the data is genuinely reused across separate requests within a short window.

## Optimistic UI and rollback

Update the UI immediately, assuming the action will succeed, only when the action's success rate is very high (roughly greater than 99%), it's reversible, and it's low-stakes: like/toggle/favorite, rename, reorder. Never apply this to payments, deletions, or any other irreversible or high-consequence action; those wait for the real result before updating.

The three-step shape, in order: cancel any in-flight request for the same key first, so a late response can't clobber the optimistic write; snapshot the current value before mutating, so there's something to roll back to; then write the optimistic value. On failure, roll back to the snapshot taken in the first step and surface an error. Regardless of outcome, reconcile with the server afterward, refetch or invalidate the affected data so the next read reflects truth rather than the optimistic guess. This sequence is the transferable part; a library's exact hook names for these three moments (TanStack Query's `onMutate`/`onError`/`onSettled`, or an equivalent) live with that library's own docs.

## Retry, backoff, and conflict recovery

Match the recovery mechanism to the failure class:

- **Network or timeout error**: retry automatically with exponential backoff, rather than failing immediately or retrying at a fixed interval. On **mutating** retries (and first-shot unsafe POSTs that may be replayed), attach a **client-generated idempotency key** per logical action (UUID or equivalent in a request header the API agrees on) so a double-send cannot double-apply — same key discipline as the offline queue below, not only for offline.
- **Session expiry** (a 401 mid-session): refresh the token silently and replay the original request; return the user to the exact state they were in, not to a login screen that discards their place. **Single-flight the refresh:** concurrent 401s must share one in-flight refresh (mutex / shared promise), not each fire their own — uncoordinated refresh under token rotation invalidates siblings and thrash-logs the user out. Cross-tab: only one tab should refresh, then broadcast the new session (or "logged out") to the others; see Client auth-flow shape. Concrete API-client interceptors and mutex wiring: `client-app-wiring.md`.
- **Edit conflict** (a concurrent write collision): show both versions side by side and let the user resolve it; never silently overwrite either side.
- **Server error** (5xx): surface a clear, generic message; don't retry indefinitely against a server that's genuinely failing.

Map an API's status code to the right client behavior rather than treating every non-2xx response the same: 400 to validation errors on the relevant fields, 401 to the session-expiry handling above, 403 to a permission-denied state (not a generic error), 404 to a not-found state, 429 to a rate-limit message paired with backoff before retrying, 500 to the generic server-error handling above.

## Offline behavior

`navigator.onLine` and the `online`/`offline` events report the network interface, not real reachability; verify with a lightweight request before trusting either. Queue mutations made while offline and replay them on reconnect, keyed by an idempotency key per mutation, so a double-replay can't double-apply. Surface the queued-not-synced state to the user, a pending/syncing badge, never a silent success; reuse `state-completeness.md`'s autosave "stored locally, will retry" pattern rather than inventing a new one. TanStack Query: `networkMode` plus paused mutations resume automatically on reconnect (see `data-fetching-libraries.md` for the concrete API). Offline shell and asset caching live in `web-platform-runtime.md`.

## Agent-run streaming client

A chat UI or agent-run view renders a server-owned run the client does not control: it keeps
running when the tab closes, retries steps the user already watched, and pauses for approval. The
client renders committed truth and sends intent; prompts, provider credentials, orchestration,
policy, and durable run state stay on the server. The event contract itself is `architecture`'s
(`contracts.md` "Contract-first design", versioned per "Versioning + deprecation"), the replayable
event log behind it is `backend`'s (`surface-realtime.md` "Replayable run events"), and what a turn
must carry arrives in `ai`'s handoff (`handoff.md` "What `ai` hands downstream").

- **Render the product's versioned event contract, never a vendor UI protocol.** Components bind to
  the product's own event types (text delta, status, source, tool call, approval request, artifact,
  error, completion) and check the schema version. A UI-adapter library may translate events
  internally, as one swappable adapter; its message format never becomes what a native client or a
  second web app depends on. An unknown event type or newer schema degrades (log, generic "update
  the app"), never crashes the thread.
- **Resume after the last committed event; re-sync from a snapshot when the cursor has expired.**
  Keep the ID/sequence of the last committed event applied, subscribe after it on every reconnect
  (drop, tab wake, reload, second device), and apply replayed events idempotently by event ID — a
  replay is a no-op, never a duplicate message. The browser's own SSE reconnect replays the last
  `id` as `Last-Event-ID` (Real-time transport in `web-platform-runtime.md`), but a reload or a new
  device starts with no cursor: persist it per run or fetch it with the run. When the server reports
  the cursor expired, replace local run state with its snapshot rather than splicing, then stream on.
- **Partial text is provisional.** Show streaming deltas as in progress, keyed by step and attempt,
  not by append order. When a retried step commits, its output replaces the superseded partial text;
  never concatenate the retry onto the old attempt, and never let provisional text be copied, cited,
  or shown as the final answer.
- **Closing the tab never cancels.** Disconnect, unmount, navigation, and the teardown abort above
  close the connection only. Cancel is an explicit user action; on return, render the run's current
  state (running, awaiting approval, finished) from replay or snapshot.
- **Start, cancel, and approve are authenticated API calls, not stream messages.** Send them
  through the shared API client (`client-app-wiring.md`) with an idempotency key, so a double-click
  is one run or one decision. A run starts only from an explicit user action — never as a side
  effect of rendering, an effect, or a prefetch. Show each pending until the run's own event
  confirms: cancel requested is not cancelled, and a step already executing may still complete —
  show what completed.
- **The approval card shows the exact action preview.** Render what the server will execute — the
  operation, its target resource, the normalized parameters, and the expiry — from the approval
  event's payload, not a model-written summary. An expired or already-decided approval renders as
  such with its controls disabled; the server re-checks authorization on resume, the client never
  decides it.
- **Native clients use the same contract.** iOS, Android, and desktop consume the same run API and
  event schema over their own networking stack — ideally a typed client generated from the same
  contract — with no dependence on React hooks, a web framework's server actions, or browser
  cookies for auth.

Test it: drop the connection mid-run, reload, and open the same run on a second device; both
replays render with no duplicate or superseded output, and the run kept running.

## Client auth-flow shape

Model authentication as its own state machine (see above): logged-out, authenticating, logged-in, logging-out, with session expiry handled as the silent-refresh recovery case above, not as a hard redirect that discards the user's place. Whichever auth provider's SDK is in use, its client-side hook and provider-component API are framework-specific (see `nextjs.md`); never persist the session token itself in `localStorage` or `sessionStorage` regardless of provider (`client-security.md` is the canonical home for why: anything reachable from client storage is public). Pick a provider based on what the product actually needs, a fast prebuilt UI, passwordless/flow-builder flexibility, or enterprise SSO, rather than defaulting to whichever is best known.

**Multi-tab session fanout:** logout, forced re-auth, and successful silent refresh are product events that must reach every open tab of the same origin, or tab A logs out while tab B keeps a live UI against a dead session (or holds a revoked access token after rotation). Broadcast a small session message (`logged-out` / `session-updated`) via `BroadcastChannel` (or `storage` event when a new tab must learn state on load). Mechanism choice and API live in `js-dom-craft.md`; this file owns the product requirement: one logout clears all tabs; one refresh does not race-invalidate other tabs' tokens. Full bootstrap/interceptor shape: `client-app-wiring.md`.

## Component teardown discipline

Whatever a component's life created (a subscription, a timer, an event listener, an in-flight request) must be undone on teardown: remove event listeners, cancel subscriptions, clear timers and intervals, and abort pending requests (`AbortController`) on unmount. This is a framework-agnostic completeness rule: a dangling timer or an unaborted request outlives the UI it was serving. The framework-specific hook mechanics for wiring this cleanup belong in `react-components-and-state.md`.

## Analytics: emit, don't define

The client's job is to emit well-named events at the point of genuine user intent, a completed action, not to define what the event means for the business or where it gets reported. Emit from the event handler that performs the action, not from an effect reacting to a resulting state change; emitting from a reactive effect risks firing the same event twice if the effect re-runs. Metric definitions, dashboards, and analysis pipelines are out of scope here; this file owns only the instrumentation point.

## Production wiring (pointer)

API client shape (`baseURL`, `credentials`), single-flight 401 interceptors, feature-flag bootstrap, error boundaries + reporters, and public runtime config are production *wiring*, not pure state modeling — home is `client-app-wiring.md`. This file owns the state-machine, recovery-class, and multi-tab *requirements* those seams implement.

<!-- sources: triage-owl-listener.md (owl-listener state-machine/SKILL.md skeletons); triage-cuellarfr-dembrandt-ehmo.md (cuellarfr interaction-design/state-and-transitions.md, ehmo web/SKILL.md URL/history/scroll-restoration, dembrandt loading-states-and-perceived-performance optimistic UI); triage-pbakaus-ehmo-web.md (pbakaus harden.md API-status-to-UI-state mapping, memory-leak teardown checklist); miner-vercel.md (react-best-practices async-*/server-* rules: Promise.all/waterfalls, RSC parallel fetching, client-auth-flows Clerk/Descope decision matrix, client-passive-event-listeners); miner-react-doctor.md (state-and-effects: no-derived-state family, no-fetch-in-effect, cleanup-completeness family; tanstack-start/react-router four-way Promise.all convergence); fold-wave research-extend: TkDodo/KCD server-state≠client-state; authors-architecture single-flight 401 mutex + multi-tab logout fanout + client idempotency-key headers; js-dom-craft BroadcastChannel mechanism cite; GAP_MAP P0 #1 wiring, P1 state/idempotency; papa-fold 2026-10-17 agent-run streaming client: HTML Living Standard server-sent events (Last-Event-ID reports the last event ID string on reconnect); AI SDK UI "Chatbot Resume Streams" docs, observed 2026-10-17 (a client stop only closes the HTTP connection and should not cancel the underlying generation; explicit stop goes to a dedicated endpoint), as one adapter's example; OWASP AI Agent Security Cheat Sheet ("Implement action previews before execution"; approval bound to the exact action); Cursor, Josh Ma, "What we've learned building cloud agents" (2 Jun 2026: storage and streaming separated from the agent workflow; the client rewinds its stream and shows the new data after a retry) -->
