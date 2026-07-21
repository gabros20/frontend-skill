# Data-fetching libraries

Purpose: Point to the current API surface for TanStack Query, SWR, React Router's data router, and
TanStack Start, and state the one transferable principle underneath all four: server state needs a
dedup/cache/revalidate layer, not a bare `fetch` inside an effect. Each library's exact API — cache
knobs, hook names, loader/action signatures — is API doctrine the library's own docs and shipped
skills teach better and keep fresher than a static reference can.

Read when:
- Wiring up TanStack Query, SWR, React Router's data router, or TanStack Start.
- Deciding whether a data-fetching need warrants reaching for one of these libraries at all.

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
in `state-and-data.md`.

## Contents
- The one durable principle
- Library specifics live with the library

## The one durable principle

Don't wrap a raw `fetch` in a bare `useEffect` for anything beyond the simplest case: it can race,
double-fire on remount, and leak if the component unmounts before it resolves (see
`react-components-and-state.md`'s effect decision tree). Use a dedup/cache/revalidate layer instead.
All four libraries below exist to be that layer; which one to reach for is a project/ecosystem
choice this file doesn't take a side on.

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
- **TanStack Start** — server functions and the `.middleware()` → `.validator()` → `.client()` →
  `.server()` → `.handler()` chain order. Runtime input validation and secret handling for a server
  function follow the same "client-reachable is public, the network is a trust boundary" doctrine
  as any other client-callable function — see `client-security.md`.
  Docs: https://tanstack.com/start/latest

<!-- sources: millionco/react-doctor (Modified MIT, tanstack-query/tanstack-start/server categories,
recommendation-string quotes attributed); Vercel react-best-practices plugin (Apache-2.0,
waterfalls/async-data-fetching section); OpenAEC-Foundation/React-Claude-Skill-Package (MIT,
react-impl-data-fetching, react-impl-routing) -->
