# Next.js

Purpose: App Router file conventions, routing mechanics, the RSC/Server Action/Route Handler
boundary, Cache Components (`use cache`), and the asset/build primitives (`next/image`,
`next/font`, `next/script`, Turbopack) specific to Next.js. Generic React rendering/hydration
theory lives in `react-rendering-and-rsc.md`; this file owns only what Next.js adds on top.

Read when:
- Building routes, layouts, or route handlers in the App Router.
- Deciding between a Server Component fetch, a Server Action, and a Route Handler.
- Wiring parallel/intercepting routes (modals), error boundaries, or Suspense boundaries.
- Configuring caching (`use cache`), images/fonts/scripts, or Turbopack.

Skip when:
- The question is generic React state/effects/rendering with no Next.js-specific mechanic —
  read `react-components-and-state.md` or `react-rendering-and-rsc.md` instead.
- The question is data-fetching library mechanics (TanStack Query, React Router loaders) — read
  `data-fetching-libraries.md`.

Inputs:
- Next.js major version in use (v14/15 vs v16+ changes several APIs below).
- Whether the route needs static, cached, or fully dynamic rendering.

Produces:
- Correct file placement, boundary decisions (Server vs Client, Action vs Route Handler), and
  cache configuration for a route or feature.

## Contents
- App Router file conventions and route segment syntax
- Parallel + intercepting routes (the modal pattern)
- Async dynamic APIs
- Choosing Server Component fetch vs Server Action vs Route Handler
- RSC boundary invalid-pattern catalog
- Error boundaries
- Suspense boundary requirements
- Hydration mismatches (Next-specific causes)
- Cache Components and `use cache`
- Day-one cache architecture (tags + revalidate)
- `after()` for non-blocking work
- Images, fonts, scripts, navigation
- Turbopack and build configuration
- Optional deeper skills (install when the task is Next-heavy)
- Official Next.js docs (latest)

## App Router file conventions and route segment syntax

Special files: `layout`, `page`, `loading`, `error`, `global-error`, `not-found`, `template`,
`default`, `route`, `proxy.ts` (see rename below), `opengraph-image.tsx`/`twitter-image.tsx` (run
at the Edge; their metadata content is seo's domain, frontend wires the convention only). Route
segment syntax: `[id]` dynamic, `[...slug]` catch-all, `[[...slug]]` optional
catch-all, `(group)` route group (no URL segment), `@slot` parallel route slot. A `_prefix` folder
is excluded from routing entirely (private folder, safe for co-located helpers).

Intercepting-route matchers: `(.)` same level, `(..)` one level up, `(..)(..)` two levels up,
`(...)` from the route root. Common mistake: `(..)` matches one level up in the **route segment**
tree, not the filesystem folder — the two diverge once route groups are involved.

`route.ts` and `page.tsx` cannot coexist in the same folder segment.

## Parallel + intercepting routes (the modal pattern)

This is the highest-value non-obvious mechanic in the App Router. Every `@slot` **must** have a
`default.tsx` that returns `null` — omitting it turns a hard navigation (refresh, direct link) into
a 404, because Next.js has no fallback content for the slot. Nested `@slot`s each need their own
`default.tsx`.

**Close the modal with `router.back()`, never `router.push()` or `<Link>`.** `push`/`Link` add a
new history entry, so the back button re-shows the modal instead of returning to the underlying
page, and the modal can flash or persist across unrelated navigations.

Worked shape: `@modal/(.)photos/[id]/page.tsx` intercepts navigation to `/photos/[id]` and renders
it in a slot alongside the feed; `@modal/default.tsx` returns `null`; a direct hard navigation to
`/photos/[id]` renders the full non-modal page from the un-intercepted route. Common gotchas, in
order of frequency: missing `default.tsx` (hard nav 404s), modal persisting after navigating away
(closed with `push`/`Link` instead of `back()`), a nested slot missing its own `default.tsx`,
matching at the wrong folder level (`(..)` counted in folders instead of route segments), and
treating `params` as a plain object when it is a Promise (see below).

## Async dynamic APIs

`params`, `searchParams`, `cookies()`, and `headers()` are Promise-typed as of Next.js 15+. A
synchronous (non-`async`) component must use `React.use(params)` instead of `await`. Codemod:
`npx @next/codemod@latest next-async-request-api .`.

## Choosing Server Component fetch vs Server Action vs Route Handler

Server Component fetch: default choice for GET data a page needs to render; benefits from
`fetch()` request-scoped memoization automatically. Server Action (`'use server'`): form
submissions and mutations; always POST, never HTTP-cacheable, intended for internal call sites —
treat as a public endpoint (see `client-security.md` for the auth-order rule every Server Action
must follow). Route Handler (`route.ts`): webhooks, external/public REST consumers, file uploads —
runs in a Server-Component-like environment with no React hooks, no `ReactDOM`, no browser APIs.
Plain client fetch: only when the data is genuinely client-interactive (polling, client-only
auth state) and can't be modeled as one of the above.

## RSC boundary invalid-pattern catalog

Enforceable constraints, not style preferences:
- Async **Client** Components are invalid — only Server Components may be `async`.
- Non-serializable props cannot cross Server → Client: functions (except Server Actions), `Date`,
  `Map`/`Set`/`WeakMap`/`WeakSet`, class instances, unregistered `Symbol`, circular references.
  Fixes: `.toISOString()` for `Date`; `Object.fromEntries`/`Array.from` for `Map`/`Set`; destructure
  a class instance to a plain object before passing it down.
- `"use server"` marks a **Server Function**, never a Server Component — a frequent confusion.
- Importing a Server Component inside a `"use client"` file makes the bundler treat it as client
  code. Fix: pass the Server Component's rendered output as `children`/props instead of importing
  it directly into the client file.

Generic RSC serialization theory and the client/server boundary decision tree beyond these
App-Router-specific traps live in `react-rendering-and-rsc.md` — read that for the full picture.

## Error boundaries

`error.tsx` must be a Client Component; it catches errors in its own segment and children.
`global-error.tsx` catches errors in the root layout itself and must render its own `<html>`/
`<body>`, since the root layout has unmounted by the time it renders. **Never wrap
`redirect()`/`permanentRedirect()`/`notFound()`/`forbidden()`/`unauthorized()` in try/catch** —
each throws a special control-flow signal Next.js handles internally, and a surrounding catch
silently swallows the navigation. If a catch block must exist for another reason, call
`unstable_rethrow()` inside it first. The same trap recurs in any router or framework whose
loader/action API signals a redirect or not-found by throwing (React Router's and TanStack Start's
`redirect()`/`notFound()` included): a bare try/catch around the call swallows the throw and the
navigation silently never happens. This is the canonical statement of that trap; other references
should point here rather than restate it.

## Suspense boundary requirements

`useSearchParams()` always needs a `<Suspense>` boundary in a statically-rendered route — without
one, the entire page bails out to full client-side rendering. `usePathname()` needs one only in a
route with dynamic params (and is optional there if `generateStaticParams` is used). `useParams()`
and `useRouter()` need no boundary.

## Hydration mismatches (Next-specific causes)

Causes ranked by frequency in Next.js apps specifically: browser-only API access during initial
render (fix with a mount-check pattern); timezone-dependent date rendering (render client-only);
random/non-stable IDs (`useId()`, never `Math.random()` for anything hydration-visible); invalid
HTML nesting (the browser auto-corrects before React hydrates, splitting the tree unexpectedly);
third-party scripts mutating the DOM before hydration (load via `next/script` with
`strategy="afterInteractive"`, not a raw `<script>` tag).

## Cache Components and `use cache`

`cacheComponents: true` in `next.config` replaces the older `experimental.ppr` flag and splits a
route into three content categories: static (auto-prerendered), cached (`use cache`), and dynamic
(wrapped in `<Suspense>`, streamed at request time).

`'use cache'` applies at file, component, or function scope. Built-in `cacheLife()` profiles:
`default` (5 min stale / 15 min revalidate), `minutes`, `hours`, `days`, `weeks`, `max`; or an
inline `{ stale, revalidate, expire }` shape (seconds). Plain `'use cache'` stores in-memory,
per-instance only; `'use cache: remote'` stores in the shared Vercel Runtime Cache;
`'use cache: private'` allows runtime APIs (`cookies()`/`headers()`) inside, for compliance cases
that can't be refactored out.

`cookies()`/`headers()`/`searchParams` cannot be read *inside* a `'use cache'` scope — read them
outside and pass the result in as an argument, which then becomes part of the auto-derived cache
key (build ID + function ID + serializable args + closure variables).

Invalidation: `cacheTag()` tags content; `updateTag()` invalidates immediately and is visible
within the same request (Server Actions only); `revalidateTag(tag, profile)` invalidates in the
background (stale-while-revalidate), usable from Server Actions and Route Handlers. In Next 16,
single-arg `revalidateTag(tag)` is reported deprecated in favor of a required second `cacheLife`
profile argument, e.g. `revalidateTag('posts', 'max')` — this is version-gated; verify the exact
signature against the installed Next version before relying on it.

**`cacheTag` hard limits (silent failure mode):** max **128 tags per `cacheTag()` call**, max
**256 characters per tag**. Oversize tags or over-limit lists are **silently dropped** (console
warn at best). Agents miss this and ship wrong-freshness with a green build — keep tag strings
short and centralized (registry below); never interpolate unbounded user input into a tag.

Non-deterministic values (`Math.random()`, `Date.now()`) execute exactly once, at build time,
inside a `'use cache'` scope — use `await connection()` from `next/server` to defer evaluation to
request time when per-request randomness is actually needed. Edge runtime and static export are
not supported with Cache Components enabled.

Migrating from `unstable_cache`: the manual `keyParts` array is gone (the key is auto-derived from
args and closures); `options.tags` becomes `cacheTag()`; `options.revalidate` becomes
`cacheLife({ revalidate: N })`.

## Day-one cache architecture (tags + revalidate)

Three load-bearing pieces on day one — not after the first stale-list bug:

| Piece | Role | Rule |
|---|---|---|
| `lib/cache/tags.ts` | Tag **registry** | Named constants only; **no raw tag strings** at call sites |
| `lib/cache/revalidate.ts` | All `updateTag` / `revalidateTag` helpers | Mutations import helpers only; never call invalidation APIs ad hoc from random actions |
| `"use cache"` placement | On **data functions** / cached children | Pages **orchestrate** Suspense only — do not fetch or tag inside page/layout orchestration bodies |

```ts
// lib/cache/tags.ts
export const tags = {
  posts: 'posts',
  post: (id: string) => `post:${id}`,
} as const;

// lib/cache/revalidate.ts
import { updateTag } from 'next/cache';
import { tags } from './tags';

export function revalidatePost(id: string) {
  updateTag(tags.post(id));
  updateTag(tags.posts); // entity invalidation also invalidates parent collection
}
```

**Entity → collection:** invalidating one entity **must** also invalidate its parent collection tag
(else detail updates while list stays stale). Encode that pairing inside the revalidate helper so
call sites cannot forget.

Personalized data: never read `cookies()` / `headers()` / `auth()` **inside** a `"use cache"`
scope — read outside, pass primitives as args (they become part of the auto cache key).
`"use cache: private"` only when compliance forbids the props pattern.

## `after()` for non-blocking work

Use `after()` from `next/server` for logging, analytics, and other side effects that must not block
the response. Schedule the work after the response is sent so it does not inflate TTFB. Do not
`await` heavy analytics inside the Server Action / Route Handler body when the client only needs
the mutation result. Keep `after()` callbacks free of user-facing control flow (errors there do not
rewrite the already-sent response).

## Images, fonts, scripts, navigation

**Images**: always `next/image` over `<img>`. Local images auto-infer width/height; remote images
need explicit `width`/`height` or `fill` + `sizes`, and their domain must be allow-listed via
`images.remotePatterns`. Reserve `priority` for the LCP/above-fold image only. `placeholder="blur"`
(auto-generated for local images, manual `blurDataURL` for remote) prevents layout shift while the
real image loads. Static export (`output: 'export'`) requires either `unoptimized` or a custom
loader (a CDN image service, for example). The broader responsive-image/CLS doctrine lives in
`performance.md` — this section covers only the Next.js primitive.

**Fonts**: `next/font` (Google or `next/font/local`) for zero-CLS self-hosted fonts. Use the
`variable` output as a CSS custom property for Tailwind integration; import a given font exactly
once, in the root layout — importing per-component creates a redundant font instance each time.
Always specify `subsets`; `display: 'swap'` is the sane default among the five loading strategies.
Never hand-roll a Google Fonts `<link>`/`@import` — it blocks render and skips optimization
entirely.

**Scripts**: `next/script` over a raw `<script>` tag; an inline script needs an explicit `id`;
never place `next/script` inside `next/head`. Loading-strategy choice: `afterInteractive` (default,
right for most third-party scripts), `lazyOnload` (defer further), `beforeInteractive` (root
layout only, for scripts that must run before hydration), `worker` (experimental, off main
thread). Prefer `@next/third-parties`'s pre-built wrappers (`GoogleAnalytics`, `GoogleTagManager`,
`YouTubeEmbed`, `GoogleMapsEmbed`) over a hand-rolled script block for those specific integrations.

**Navigation**: `useRouter`, `usePathname`, `useSearchParams`, `useParams`,
`useSelectedLayoutSegment(s)`, `useLinkStatus`, `useReportWebVitals` are the navigation-hook
surface. Always `next/link` over a bare `<a>` for internal navigation; build an active-nav-item
indicator from `usePathname()`.

## Turbopack and build configuration

Turbopack config moved top-level in Next 16 (`turbopack: {...}`, out of
`experimental.turbopack`). `turbopack.resolveAlias`/`resolveExtensions` replace webpack's
`resolve.alias`. Webpack-loader equivalents: `css-loader`/`style-loader`/`sass-loader`/
`postcss-loader` are built in; `svgr` becomes a `turbopack.rules` entry; `raw-loader` becomes a
`?raw` import query; `worker-loader` becomes a native `new Worker(new URL(...))`. When no
Turbopack equivalent exists yet, `bundler: 'webpack'` is the escape hatch. **SVGR/SVGO:** keep
`removeViewBox: false` (preset-default otherwise drops viewBox when width/height attrs exist and
breaks coordinate scaling). Wire that into **Turbopack and webpack** svgr rules — Next 16
`next build` is Turbopack-first. Prefer no width/height presentation attrs; size logos with CSS
`aspect-ratio` (`css-craft.md` Inline SVG Safari paint traps).

`import 'server-only'` at the top of a module enforces the server/client import boundary at build
time — the build fails if that module is imported from a client component.

Diagnostics: `next experimental-analyze` (16.1+) is a route/env/type-filterable bundle inspector
with an `--output` flag for comparison snapshots — the modern replacement for
`@next/bundle-analyzer`. `NEXT_TURBOPACK_TRACING=1 next dev|build` writes a `trace.json` for
`chrome://tracing`/Perfetto profiling. `"sideEffects": false` in `package.json` enables aggressive
tree-shaking/barrel-skipping specifically under Turbopack. Deeper bundle-size doctrine (barrel
imports, code-splitting strategy) lives in `performance.md`.

## Cross-references

Server Actions must self-authenticate exactly like a public API endpoint — see
`client-security.md` for the validate → authenticate → authorize → mutate order. Client-side auth
provider wiring (Clerk/Descope-style `<Provider>` + hooks) lives in `state-and-data.md`. Core Web
Vitals thresholds and the responsive-image/font-loading doctrine underlying the primitives above
live in `performance.md`. Independent-verification/screenshot-based acceptance checks live in
`testing.md`. View Transitions: enable Next's `experimental.viewTransition` flag when using the
platform VT path — mechanics and React `ViewTransition` caveats live in `web-platform-runtime.md`;
do not install canary React solely for VT on a stable Next release.

## Optional deeper skills (install when the task is Next-heavy)

This file owns **Next-specific conventions and traps** (App Router, cache, boundaries, assets).
For product-surface depth (auth product kits, full upgrade playbooks, upstream perf catalogs),
install a specialist skill. Prefer high-install / official sources; re-check
[skills.sh](https://skills.sh/) counts.

| When the job is… | Install (skills.sh) | Why |
|---|---|---|
| React/Next performance & data-fetching catalog | `npx skills add vercel-labs/agent-skills@vercel-react-best-practices` | Vercel Engineering (~571K) — complements `performance.md` / RSC waterfalls |
| React View Transitions deep dive | `npx skills add vercel-labs/agent-skills@vercel-react-view-transitions` | Placement/silent-failure recipes beyond this pack's VT wiring |
| App Router patterns playbook | `npx skills add wshobson/agents@nextjs-app-router-patterns` | Route/layout pattern library (~25K) |
| Day-one cache tag registry / invalidation architecture | `npx skills add mohamed-hossam1/nextjs-cache-architecture@nextjs-cache-architecture` | Tags + revalidate helpers (this file states the rules; skill is fuller scaffolding) |
| Cache Components adoption / optimizer | `npx skills add vercel/next.js@next-cache-components-adoption` · `npx skills add vercel/next.js@next-cache-components-optimizer` | Official-adjacent Cache Components migration aids |
| Next dev-loop tooling | `npx skills add vercel/next.js@next-dev-loop` | Upstream Next repo skill for dev workflow |
| Clerk on Next | `npx skills add clerk/skills@clerk-nextjs-patterns` | Product auth patterns (~27K) — not a substitute for `client-security.md` |

**Rule:** stay here for day-to-day App Router / cache / asset work. Install a row above when the
task is mostly that product or migration surface.

## Official Next.js docs (latest)

**Canonical site:** [https://nextjs.org/docs](https://nextjs.org/docs) — prefer over blog posts when
APIs conflict. Match the project's **Next major** (docs version selector / installed
`next/package.json`). Prefer **`/docs/app/getting-started/*`** and **`/docs/app/guides/*`** over
legacy `/building-your-application/*` paths (those still redirect but are not canonical).

| Topic | Latest docs |
|---|---|
| Docs home | [nextjs.org/docs](https://nextjs.org/docs) |
| App Router | [nextjs.org/docs/app](https://nextjs.org/docs/app) |
| Routing (layouts & pages) | [nextjs.org/docs/app/getting-started/layouts-and-pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) |
| Fetching data | [nextjs.org/docs/app/getting-started/fetching-data](https://nextjs.org/docs/app/getting-started/fetching-data) |
| Caching (getting started) | [nextjs.org/docs/app/getting-started/caching](https://nextjs.org/docs/app/getting-started/caching) |
| Caching without Cache Components | [nextjs.org/docs/app/guides/caching-without-cache-components](https://nextjs.org/docs/app/guides/caching-without-cache-components) |
| Server Actions | [nextjs.org/docs/app/guides/server-actions](https://nextjs.org/docs/app/guides/server-actions) · intro [mutating-data](https://nextjs.org/docs/app/getting-started/mutating-data) |
| Server & Client Components | [nextjs.org/docs/app/getting-started/server-and-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| `next/image` | [nextjs.org/docs/app/api-reference/components/image](https://nextjs.org/docs/app/api-reference/components/image) |
| `next/font` | [nextjs.org/docs/app/api-reference/components/font](https://nextjs.org/docs/app/api-reference/components/font) |
| Turbopack | [nextjs.org/docs/app/api-reference/config/next-config-js/turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack) |
| Proxy (was middleware) | [nextjs.org/docs/app/api-reference/file-conventions/proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) |
| Upgrading | [nextjs.org/docs/app/guides/upgrading](https://nextjs.org/docs/app/guides/upgrading) |
| API reference | [nextjs.org/docs/app/api-reference](https://nextjs.org/docs/app/api-reference) |

**Agent habit:** perishable flags and Cache Component APIs → open live docs for the installed major
first; this pack holds capability-delta traps, not a full Next manual.

<!-- sources: Vercel react-best-practices + nextjs skills (claude-plugins-official/vercel, Apache-2.0,
attribution required) — miner-vercel.md; mohamed-hossam1/nextjs-cache-architecture (skills.sh) —
day-one tags.ts registry, revalidate.ts helpers, use cache on data functions not page orchestration,
entity+collection invalidation pairing, cacheTag 128 tags/call + 256 char silent drop limits;
vercel-labs/agent-skills @vercel-react-best-practices residual — after() for non-blocking
logging/analytics; View Transition Next flag cross-ref — skills-finder / CANDIDATES #10;
optional deeper skills + nextjs.org/docs table (canonical getting-started/guides paths; install counts as of fold; re-check skills.sh) -->
