# Data-fetching libraries

Purpose: Configure and use the concrete data-fetching and routing libraries correctly: TanStack
Query's cache lifecycle, React Router's data APIs, and TanStack Start's server functions, with the
exact call-sites where the "don't create a waterfall" rule actually applies.

Read when:
- Wiring up TanStack Query, SWR, React Router's data router, or TanStack Start.
- A cache is invalidating too late, too often, or not at all.
- A loader, action, or mutation is racing, over-fetching, or swallowing a redirect.

Skip when:
- The question is component-level state or effect discipline → `react-components-and-state.md`.
- The question is RSC boundaries, Suspense placement, or hydration → `react-rendering-and-rsc.md`.
- The question is Next.js-specific caching (`use cache`, `cacheLife`) or file conventions →
  `nextjs.md`.
- The underlying "why parallelize independent async work" principle → `state-and-data.md`, the
  canonical home this file only adds library-specific call-sites to.

Inputs: which data-fetching/routing library the project uses (or is choosing between); the
data-dependency shape (independent vs. sequential, read vs. write).

Produces: correct cache configuration (freshness vs. retention), a loader/action structure that
doesn't waterfall or swallow control-flow errors, and a three-step optimistic-update shape when one
is warranted.

## Contents
- TanStack Query fundamentals
- Optimistic updates
- SWR as an alternative
- React Router v6.4+ data APIs
- TanStack Start server functions
- The parallel-fetch call-sites
- The redirect-in-try-catch trap

## TanStack Query fundamentals

`staleTime` (how long data is considered fresh; default `0`) and `gcTime` (how long an inactive
query stays cached before eviction; default 5 minutes) are different knobs: `gcTime` must be `>=
staleTime`, and confusing the two is a common cache-behavior bug. Instantiate `QueryClient` outside
the component tree, at module scope; constructing it inside a component recreates it (and destroys
the whole cache) on every render. `useSuspenseQuery` requires both a `<Suspense>` boundary and an
`<ErrorBoundary>` above it, since it throws promises for loading state and errors for failure state
rather than returning them. Don't rest-destructure or spread the whole query result
(`const {...rest} = useQuery(...)`); it subscribes the component to every field and over-renders.
`useQuery` is for reads, `useMutation` for writes; routing a write through `useQuery` bypasses the
library's invalidation model entirely. A mutation needs an explicit cache-invalidation call after
it settles; TanStack Query does not infer which queries a mutation should invalidate.
`mutateAsync()`'s returned promise must be handled (awaited or `.catch()`'d) like any other
floating promise.

## Optimistic updates

The three-step shape, in order: `onMutate` cancels in-flight queries for the affected key, snapshots
the current cache value, and writes the optimistic value; `onError` rolls back to the snapshot taken
in `onMutate`; `onSettled` invalidates the query regardless of outcome so the next read reflects
server truth. Reserve optimistic updates for actions where success is near-certain, the action is
reversible, and the stakes are low (like/toggle/rename); never for payments, deletions, or other
irreversible actions, where the correctness cost of a wrong optimistic write outweighs the perceived
latency win. This mirrors the state-machine doctrine in `state-and-data.md`; this file adds the
concrete TanStack Query hook shape.

## SWR as an alternative

`useSWR`/`useSWRMutation` (and the immutable variant) provide the same automatic cross-instance
request dedup, cache, and revalidation TanStack Query does, contrasted against a raw `fetch` inside
a `useEffect`. Dedup global event-listener subscriptions across multiple hook instances of the same
subscription via `useSWRSubscription` backed by a module-level `Map<key, Set<callback>>` fan-out,
instead of attaching one native listener per hook instance.

## React Router v6.4+ data APIs

The data-router API (`createBrowserRouter` + `RouterProvider`) is the only pattern supporting
`loader`/`action`/lazy routes; the legacy `<BrowserRouter>` + `<Routes>` pattern cannot run them.
Loaders and actions receive `{params, request}` and run outside component lifecycle, not as closures
over component scope. `defer()` paired with `<Suspense>`/`<Await>` splits a route's critical
(awaited) data from its non-critical (deferred, streamed-in-later) data. `<Form>` (the router's
component, not a native `<form>`) is required for the router to intercept a submission into an
`action`. A loader-based redirect (`return redirect(...)` from the loader) is the preferred
protected-route pattern over a wrapper `<RequireAuth><Outlet/></RequireAuth>` component, since it
redirects before any render rather than after a flash of the protected content. Batch multiple
`setSearchParams` calls in the same tick; unbatched, unsynchronized search-param mutations across
renders can silently drop updates.

## TanStack Start server functions

The method-chain order on a server function is type-inference-load-bearing: `.middleware()` →
`.validator()` → `.client()` → `.server()` → `.handler()`. Server functions cross the network, so
they need runtime input validation even when the caller is fully typed; type safety at the call
site doesn't protect against a malicious or malformed request body. Loaders are isomorphic (they
can run on the client too), so a secret must be wrapped in `createServerFn()`, never read directly
inside a loader body, which mirrors the "anything client-reachable is public" principle in
`client-security.md`.

## The parallel-fetch call-sites

The core principle, "independent awaits in any data-loading context must use `Promise.all`, not a
sequential chain," is homed in `state-and-data.md`. Four concrete call-sites where it recurs in
this file's stack: a React Router loader awaiting two independent resources in sequence instead of
via `Promise.all`; a TanStack Start loader doing the same; an API route/Server Action starting
unrelated async operations one after another instead of kicking them off immediately and awaiting
late; and a `for`/`while` loop awaiting each iteration's async call instead of collecting the
promises and awaiting them together. Each is the same waterfall, just triggered by a different
router or runtime.

## The redirect-in-try-catch trap

Both React Router and TanStack Start's `redirect()`/`notFound()` throw a special control-flow error
that the router catches internally to perform the navigation. A surrounding `try/catch` in the
loader or action swallows that throw and breaks the redirect/not-found behavior silently, no error,
just a navigation that doesn't happen. Never wrap a call to either function in a try/catch that
isn't specifically re-throwing router control-flow errors.

<!-- sources: millionco/react-doctor (Modified MIT, tanstack-query/tanstack-start/server categories, recommendation-string quotes attributed);
Vercel react-best-practices plugin (Apache-2.0, waterfalls/async-data-fetching section);
OpenAEC-Foundation/React-Claude-Skill-Package (MIT, react-impl-data-fetching, react-impl-routing) -->
