# Client app wiring

Purpose: the production SPA wiring harness — API client, session refresh/logout across tabs,
feature-flag consumption, error boundaries → reporting, and public runtime config. Not folder
structure (`client-architecture.md`) and not pure state-machine doctrine (`state-and-data.md`).

Read when:
- Bootstrapping a new SPA/shell or reviewing whether a production client has the standard seams.
- Implementing silent token refresh, multi-tab logout, flag bootstrap, or global error UI.
- Deciding public runtime config injection vs build-time env.
- Attaching idempotency keys on mutating POST retries.

Skip when:
- Folder/import structure, barrels, monorepo package shape → `client-architecture.md`.
- Token-storage thesis, CSP, sanitization sinks alone → `client-security.md`.
- Auth state-machine shape, offline queue doctrine, status→UI mapping alone → `state-and-data.md`.
- BroadcastChannel vs `storage` mechanics alone → `js-dom-craft.md` (this file owns product
  patterns on top of that mechanism).
- CWV budgets, third-party facades, web-vitals transport → `performance.md`.

Inputs: base URL and credentials mode; how session refresh and logout are issued; which flags the
client evaluates; where render errors surface; how public config reaches the browser.

Produces: a single API surface with correct credentials and error mapping; single-flight 401
refresh with multi-tab-safe rotation; logout fanout; flag bootstrap without flash or client-only
authz; multi-level error recovery with a reporter contract; public config that is never secret;
idempotent unsafe retries.

## Contents
- API client layer
- Single-flight 401 refresh mutex
- Multi-tab logout / session fanout
- Feature flags (client consumption)
- Error boundaries and reporting
- Public runtime config
- Idempotency-key header on unsafe retries

## API client layer

One shared client (or thin wrapper around `fetch`) owns base URL, default headers, credentials
mode, and status-class handling. Feature code calls named operations; it does not re-open raw
`fetch` with ad hoc base paths.

**Base URL.** Resolve from public config (see Public runtime config below), not hard-coded per
call-site. Same-origin relative paths when the app and API share origin (BFF/proxy shape);
absolute origin only when deliberately cross-origin.

**Credentials mode** — pointer only; storage and CSRF doctrine live in `client-security.md`.
`Request.credentials` is `omit` | `same-origin` (default) | `include`. Cookie sessions on a
cross-origin API need `credentials: 'include'` *and* a server that returns
`Access-Control-Allow-Credentials: true` with a **specific** `Access-Control-Allow-Origin` (not
`*`). Wrong mode is often a **silent empty session**, not a loud CORS failure. Never put access
or refresh tokens in `localStorage`/`sessionStorage` — HttpOnly cookie path is the default; see
`client-security.md`.

**Error → status mapping.** Map response status once in the client layer, then hand a typed
failure class to the feature. Canonical map is `state-and-data.md` (Retry, backoff, and conflict
recovery): 400 → field validation; 401 → session-expiry / silent refresh path (next section);
403 → permission-denied state (not generic error); 404 → not-found; 429 → rate-limit + backoff;
5xx → generic server error, no infinite retry. Do not treat every non-2xx as one blob.

**Colocated request declarations.** Prefer one module per resource or operation that co-owns:
request/response types (or schema), the fetcher (or mutation fn), and the consuming hook /
query-key factory. Matches feature-folder colocation in `client-architecture.md` — types,
transport, and UI subscription change together. Avoid a global `services/` dump of untyped URL
strings with hooks living elsewhere.

## Single-flight 401 refresh mutex

`state-and-data.md` states the product rule: on mid-session 401, refresh silently and replay the
original request so the user keeps place. This section owns the concurrency shape that rule needs.

**Order of operations on 401:**
1. Detect 401 from a credentialed call that is not itself the refresh endpoint.
2. If a refresh is already in flight, **await the same promise** — do not start a second refresh.
3. On refresh success: attach the new session (cookie already set by server, or in-memory access
   token if that is the deliberate shape) and **replay** the original request once.
4. On refresh failure: reject **all** waiters, clear local session state, run logout fanout
   (next section). Do not leave some callers retrying while others redirect.

**In-tab mutex.** A module-level `refreshPromise: Promise<void> | null`. First waiter assigns it;
later waiters `await` it; `finally` clears it so the next expiry can refresh again. Without this,
N concurrent 401s fire N refreshes — under **refresh-token rotation**, the second refresh
invalidates the first tab's new token and produces a flapping logout.

**Multi-tab rotation race.** Tab A and tab B both hit 401; both refresh; server rotates the
refresh token; A's new session is invalidated when B completes (or vice versa). Fix with one of:
- **Cross-tab lock** (e.g. `navigator.locks` when available, or a short-lived `localStorage`
  lock key with expiry) so only one tab refreshes; others await then re-read session.
- **Broadcast the new session** on a named channel after a successful refresh so peer tabs adopt
  it without re-refreshing. Mechanism: `BroadcastChannel` (or `storage` when a later-opened tab
  must read last-known state) — selection rules in `js-dom-craft.md`. Product payload: enough for
  peers to know session is live again (and any non-HttpOnly client-visible session metadata);
  never broadcast raw secrets into a channel readable by every same-origin script if an
  alternative exists.

**Silent-failure mode:** parallel refresh without a mutex under rotation looks like "random
logouts under load," not a single obvious error.

## Multi-tab logout / session fanout

Logout is not local to the tab that clicked it.

**Order:**
1. Call the server logout/revoke endpoint (best effort; still clear client state if it fails).
2. Clear in-memory session/auth machine state in the current tab.
3. **Broadcast** a logout (or `session:cleared`) message on the app's session channel.
4. Redirect this tab to the login shell (or public landing) without replaying protected routes.

**Listeners in peer tabs:** on logout message — clear local session/query caches that assume
auth, stop authenticated sockets if any, redirect or swap to the logged-out shell. Do not ignore
the message and keep showing authenticated UI; that is a **false "still signed in" state** until
the next 401.

Use `BroadcastChannel` for already-open tabs; pair with a durable flag in `localStorage` (and the
`storage` event) when a tab opened *after* logout must not resurrect a stale in-memory bootstrap.
Mechanics of channel vs storage: `js-dom-craft.md`. Same channel family can carry
`session:refreshed` for the rotation case above — keep message types explicit and versioned.

## Feature flags (client consumption)

Client owns **evaluation and UX**, not authorization.

| Rule | Detail |
|---|---|
| Bootstrap with session | Load flag payload (or evaluation context) with the same bootstrap as session/user so first paint does not flash the wrong variant. Gate shell render on flags-ready when the flag changes layout or nav. |
| Sticky % bucketing | For percentage rollouts, bucket with a stable hash of `userId + flagKey` (or anonymous id + flagKey), not `Math.random()` per render/session. Random assignment flips on reload and breaks multi-tab consistency. |
| No client-only authz | Never use a client-evaluated flag as the sole gate for a privileged action or data. UI may hide; server must enforce. Flags that gate security-sensitive paths are server decisions. |
| Cleanup after 100% | Remove dead flag branches once a rollout is permanent; long-lived flags become untested permanent forks. |
| Mid-session multi-tab | If flags can change while open, broadcast or re-bootstrap so tabs do not diverge for the same user. Prefer session-sticky evaluation over live thrash unless product requires live flip. |

Non-sensitive UI experiments may evaluate fully client-side after bootstrap. Sensitive or
compliance-relevant switches stay server-authoritative even if the client mirrors a hint for UX.

## Error boundaries and reporting

**Multi-level beats one app-wide catcher.** Place a root boundary (last-resort shell: "something
went wrong," reload/home) and route- or feature-level boundaries (retry that segment, navigate
away) so a leaf render failure does not unmount the entire app chrome. One top-level-only
boundary is a **silent full white-screen** for every leaf bug.

**Catch render only.** Framework error boundaries (React's included) intercept render, lifecycle,
and constructor errors in the subtree — **not** event-handler errors, not `async` rejections, not
`setTimeout` callbacks. Those need explicit `try/catch` (or `.catch`) plus the same reporter.
Also wire `window.onerror` / `unhandledrejection` at bootstrap for escapes, with the same scrub
and sample policy.

**Recovery UI.** Offer at least: retry (reset boundary state and remount segment), navigate to a
safe route, and hard reload as last resort. Preserve enough context (route, feature id) in the
fallback so support and logs correlate.

**Reporter contract (principle, not a product):**
- Include component stack / boundary location when the framework exposes it.
- **Scrub PII** before send: tokens, emails, raw form bodies, auth headers — never ship them in
  error payloads by default.
- Apply **sample rates** on high-volume noise (network blips, known third-party script errors);
  always-on for first-party render crashes if volume allows.
- Tag release/version and environment from public config.
- Transport may share `sendBeacon` patterns with RUM (`performance.md`); this file owns when to
  report, not CWV metrics.

## Public runtime config

Anything in a public env prefix or shipped client bundle is public — thesis in
`client-security.md`. This section is **injection shape**, not that thesis restated.

| Shape | When | Trap |
|---|---|---|
| Build-time inlining (`NEXT_PUBLIC_*`, `VITE_*`, equivalent) | Config fixed per build artifact; different values need different builds. | Changing API URL or flag endpoint requires rebuild/redeploy of the static bundle. |
| Runtime `/config.json` or `window.__ENV__` (or SSR-injected public bag) | Build-once-deploy-many: same artifact, env-specific public endpoints at start. | Fetch `/config.json` before app bootstrap if values are required for first API call; cache it. |

Never put secrets in either path — not "temporary" API keys, not private webhook secrets, not
refresh tokens. Server-only env (no public prefix, never sent to the client) is the only home for
secrets. Public config is for base URLs, public feature endpoints, release id, RUM DSN if
deliberately public, and similar non-secret knobs.

## Idempotency-key header on unsafe retries

Complement to the offline mutation queue in `state-and-data.md` (queue + key so double-replay
cannot double-apply). Online unsafe methods need the same protection when the client retries.

**Order:**
1. Before first attempt of a non-idempotent `POST`/`PATCH`/`PUT` that the client may retry,
   generate a client-side UUID (or equivalent) as the idempotency key.
2. Send it on a stable header the API documents (commonly `Idempotency-Key`).
3. Reuse the **same** key on every retry of that logical operation; generate a new key only for a
   new user intent.
4. Server dedupes by key; client must not invent a fresh key per network retry or a double charge /
   double create can land after a timeout where the first request actually succeeded.

Safe methods (`GET`/`HEAD`) do not need this. Pair with the API client's single retry policy so
timeouts and 5xx replays still carry the key. Offline queue entries should store the key with the
queued mutation so reconnect replay is the same logical operation.

<!-- sources: research-extend authors-architecture.md gap cluster (API client, single-flight
401, multi-tab session, feature flags, error boundaries, public runtime config, idempotency
header); MDN Request.credentials / CORS credentialed requests (client half); state-and-data.md
status map + offline idempotency concept; client-security.md public-prefix and token-storage
thesis (cited, not restated); js-dom-craft.md BroadcastChannel vs storage (mechanism cited);
common SPA harness patterns for refresh mutex under token rotation and multi-level error
boundaries (render-only catch). -->
