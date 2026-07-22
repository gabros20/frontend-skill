# Data-fetching libraries

Purpose: Point to the current API surface for TanStack Query, SWR, React Router's data router, and
TanStack Start, and state the one transferable principle underneath all four: server state needs a
dedup/cache/revalidate layer, not a bare `fetch` inside an effect. Each library's exact API — cache
knobs, hook names, loader/action signatures — is API doctrine the library's own docs and shipped
skills teach better and keep fresher than a static reference can. Durable cache principles (keys,
freshness vs retention, placeholder traps) live here so agents don't need a full API dump to avoid
the common failures.

Read when:
- Wiring up TanStack Query, SWR, React Router's data router, or TanStack Start.
- Deciding whether a data-fetching need warrants reaching for one of these libraries at all.
- Setting stale/retention windows, query keys, placeholders, or cancelable `queryFn`s.

Skip when:
- The question is component-level state or effect discipline → `react-components-and-state.md`.
- The question is RSC boundaries, Suspense placement, or hydration → `react-rendering-and-rsc.md`.
- The question is Next.js-specific caching (`use cache`, `cacheLife`) or file conventions →
  `nextjs.md`.
- The underlying principles this file only points at — no-waterfalls, cache freshness and
  invalidation, and the optimistic cancel-snapshot-write → rollback → invalidate discipline →
  `state-and-data.md`, their canonical home.
- The redirect-thrown-as-control-flow trap (a loader/action's `redirect()`/`notFound()` swallowed by
  a bare try/catch) → `nextjs.md`, which states the general shape once.

Inputs: which data-fetching/routing library the project uses, or is choosing between.

Produces: the right pointer to that library's current API, applied on top of the principles homed
in `state-and-data.md`, plus the durable cache traps agents hit regardless of version.

## Contents
- The one durable principle
- Durable cache principles (TanStack Query-shaped, portable)
- Library specifics live with the library
- Optional deeper skills (TanStack / SWR / routers)
- Official docs (latest)

## The one durable principle

Don't wrap a raw `fetch` in a bare `useEffect` for anything beyond the simplest case: it can race,
double-fire on remount, and leak if the component unmounts before it resolves (see
`react-components-and-state.md`'s effect decision tree). Use a dedup/cache/revalidate layer instead.
All four libraries below exist to be that layer; which one to reach for is a project/ecosystem
choice this file doesn't take a side on. **Server state is not client state** — the server owns the
data; the client borrows a cached view (`state-and-data.md`).

## Durable cache principles (TanStack Query-shaped, portable)

These principles travel across cache libraries; names below match TanStack Query because that is the
current default. Other libraries have equivalent knobs. Exact defaults can shift by version — verify
against the installed docs, not memory.

1. **Default `staleTime` is often `0`** → data is immediately stale and **refetches on every mount**
   (and typically on window focus). Match volatility **per query type**, not one global window for
   the whole app (profile/settings may want minutes; live prices may want seconds or zero).
   `staleTime` is not `refetchInterval`.
2. **`staleTime` vs `gcTime`:** `staleTime` is the *fresh* window (no background refetch while
   fresh). `gcTime` (ex-`cacheTime`) is how long an *unused* entry is retained after the last
   observer unmounts (often ~5 min). Most "why is it refetching?" bugs are **staleTime**, not
   gcTime. `gcTime: 0` kills cache benefit; `Infinity` risks unbounded memory.
3. **`placeholderData` vs `initialData`:** `initialData` is treated as **real cache truth** and
   **`staleTime` applies to it** — a non-zero `staleTime` can **block the first network fetch**
   entirely if the seed looks fresh. Prefer `placeholderData` for temporary UI scaffolding that
   must not pollute the cache. Escape hatches when you do seed with `initialData`:
   `initialDataUpdatedAt: 0` or `refetchOnMount: 'always'`.
4. **Query keys are arrays.** Include **every dependency** the `queryFn` closes over (`userId`,
   filters, locale). Key change = new cache entry. Keys must be **JSON-serializable only** — no
   functions, Symbols, class instances; stabilize dates as ISO strings (a fresh `new Date()` each
   render thrash-hashes the key).
5. **Don't copy `useQuery` data into `useState`.** A local mirror opts out of background updates and
   goes stale silently; derive UI from the query result (or the library's select/placeholder knobs).
6. **`queryFn` must pass `AbortSignal`** from the library context into `fetch` / the HTTP client so
   unmount, key change, and typing/search cancel in-flight work. Without it, late responses still
   resolve (wasted work; race risk if anything writes outside the cache).
7. **Router loaders + Suspense:** prefer `ensureQueryData` (or equivalent) in the loader so the
   cache is warm, then `useSuspenseQuery` in the component — bare loader `fetch` bypasses the cache;
   component-only `useQuery` reintroduces a nav waterfall.

When the project uses TanStack Query, install the maintained skill for version-fresh API detail:
`npx skills add deckardger/tanstack-agent-skills@tanstack-query-best-practices`. This file keeps
durable traps; that skill keeps hook/API surface current.

## Library specifics live with the library

Each library's exact API changes across versions faster than a static reference can track, and the
library's own docs or shipped skill teach it more precisely than a snapshot here could. For any of
the four, load the current API in this order: check `node_modules/<package>/skills/` first (a
packaged skill installed with the library, freshest, no network needed); else `npx skills add
<owner/repo@skill>` from the skills.sh registry; else WebFetch the official docs. Never hard-code a
version-specific detail from memory; match whatever the project has installed.

- **TanStack Query** — cache lifecycle (`staleTime`/`gcTime`), `useQuery`/`useMutation`/
  `useSuspenseQuery`, and the optimistic-update hooks (`onMutate`/`onError`/`onSettled`). The
  cancel-snapshot-write → rollback → invalidate discipline these hooks implement is homed in
  `state-and-data.md`'s Optimistic UI section; this pointer is only for the hooks' exact shape.
  Companion skill: `deckardger/tanstack-agent-skills@tanstack-query-best-practices` (above).
  Docs: https://tanstack.com/query/latest
- **SWR** — the smaller-footprint #2 to TanStack Query's cache-lifecycle depth, still actively
  maintained by Vercel; `useSWR`/`useSWRMutation`, its immutable variant, and `useSWRSubscription`
  for shared subscriptions. Docs: https://swr.vercel.app
- **React Router (data APIs)** — `createBrowserRouter`/`RouterProvider`, `loader`/`action`,
  `defer`/`Await`, `<Form>`, and `setSearchParams` batching. Docs: https://reactrouter.com. **TanStack
  Router** is the type-safety-first alternative when a project prioritizes fully-typed route trees
  and search params over React Router's larger ecosystem and lower migration friction — a project
  choice, not a currency correction; TanStack Start (below) builds on it. Docs:
  https://tanstack.com/router/latest
- **TanStack Start** — full-stack framework on TanStack Router: server functions and the
  `.middleware()` → `.validator()` → `.client()` → `.server()` → `.handler()` chain order. Runtime
  input validation and secret handling for a server function follow the same "client-reachable is
  public, the network is a trust boundary" doctrine as any other client-callable function — see
  `client-security.md`. Prefer the Start companion skill for version-fresh API when building a
  Start app end-to-end; this file only keeps the durable cache + security posture.
  Docs: https://tanstack.com/start/latest

## Optional deeper skills (TanStack / SWR / routers)

Load order for any library API: `node_modules/<package>/skills/` (if shipped) → skills.sh install
below → official docs. Prefer high-install skills; re-check [skills.sh](https://skills.sh/).

| When the job is… | Install (skills.sh) | Why |
|---|---|---|
| TanStack Query API / patterns | `npx skills add deckardger/tanstack-agent-skills@tanstack-query-best-practices` | Maintained Query skill (~9K); pairs with durable principles above |
| TanStack Start full-stack | `npx skills add deckardger/tanstack-agent-skills@tanstack-start-best-practices` | Start-specific server functions / app shape (~8K) |
| TanStack Router typing / search params | `npx skills add deckardger/tanstack-agent-skills@tanstack-router-best-practices` | Router-only depth (~5K) |
| Clerk on TanStack | `npx skills add clerk/skills@clerk-tanstack-patterns` | Product auth on Start/Router (~8K) |
| Alternate Query packaging | `npx skills add tanstack-skills/tanstack-skills@tanstack-query` | Another Query packaging (~5K) — use if project already pins it |
| React Router **framework mode** (Remix lineage) | `npx skills add remix-run/agent-skills@react-router-framework-mode` | Official remix-run (~3K) — full-stack RR; not a substitute for portable principles here |
| React perf waterfalls (any React app) | `npx skills add vercel-labs/agent-skills@vercel-react-best-practices` | Cross-cutting fetch/RSC waterfalls (~571K) |

**SWR** has no dominant high-install dedicated skill (≥1K) — use official docs (below) and this
file's portable cache principles. Prefer high-install skills; re-check [skills.sh](https://skills.sh/).

## Official docs (latest)

| Library | Canonical docs | High-value deep links |
|---|---|---|
| TanStack Query | [tanstack.com/query/latest](https://tanstack.com/query/latest) | [overview](https://tanstack.com/query/latest/docs/framework/react/overview) · [queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries) · [mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) · [SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr) |
| TanStack Router | [tanstack.com/router/latest](https://tanstack.com/router/latest) | Prefer short `/docs/…` paths: [overview](https://tanstack.com/router/latest/docs/overview) · [data loading](https://tanstack.com/router/latest/docs/guide/data-loading) · [search params](https://tanstack.com/router/latest/docs/guide/search-params) |
| TanStack Start | [tanstack.com/start/latest](https://tanstack.com/start/latest) | [getting started](https://tanstack.com/start/latest/docs/framework/react/getting-started) · [server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) · [server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) |
| SWR | [swr.vercel.app](https://swr.vercel.app) | [getting started](https://swr.vercel.app/docs/getting-started) · [mutation](https://swr.vercel.app/docs/mutation) · [revalidation](https://swr.vercel.app/docs/revalidation) · [with Next.js](https://swr.vercel.app/docs/with-nextjs) |
| React Router | [reactrouter.com/home](https://reactrouter.com/home) | Framework mode: [install](https://reactrouter.com/start/framework/installation) · [data loading](https://reactrouter.com/start/framework/data-loading) · [actions](https://reactrouter.com/start/framework/actions); data mode / SPA loaders still valid project choice |

Match the **installed major** (docs version / package version). Perishable hook names and defaults
→ live docs; this pack holds transferable traps.

<!-- sources: millionco/react-doctor (Modified MIT, tanstack-query/tanstack-start/server categories,
recommendation-string quotes attributed); Vercel react-best-practices plugin (Apache-2.0,
waterfalls/async-data-fetching section); OpenAEC-Foundation/React-Claude-Skill-Package (MIT,
react-impl-data-fetching, react-impl-routing); fold-wave research-extend: TkDodo Practical React
Query + X thread (staleTime default, initialData freshness trap, key=deps, no mirror into useState);
deckardger/tanstack-agent-skills@tanstack-query-best-practices (placeholder vs initial, AbortSignal,
ensureQueryData+useSuspenseQuery, gcTime vs staleTime); GAP_MAP P0 #6 durable query principles;
optional skills table + official docs (skills.sh find tanstack/start; install counts as of fold) -->
