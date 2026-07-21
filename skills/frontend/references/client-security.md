# Client Security

Purpose: Client-side security and privacy doctrine — what's reachable from the browser is public,
which browser-native surfaces need explicit closing, where to sanitize, and which response headers
the client's own configuration should ship. Server-side enforcement (databases, RLS/authorization
rules, webhook verification, secret handling in CI) is `backend`'s job; this file owns only what a
frontend engineer writes or configures.

Read when:
- Deciding where to store an auth token or session identifier.
- Writing anything that renders raw HTML/markdown or interpolates user input into HTML.
- Handling `postMessage`, `window.open`, iframes, or file uploads from untrusted content.
- Configuring CSP, Permissions-Policy, or another security response header for a client app.
- Writing a Server Action, Route Handler, or any other client-callable function.

Skip when:
- The question is server-side authorization logic, database rules, or infrastructure secrets —
  that's `backend`.
- The question is an independent security audit or penetration test — that's `quality`.

Inputs:
- Where auth/session state is currently stored (cookie vs. storage vs. memory).
- Whether the app renders any user-authored HTML, Markdown, or SVG.

Produces:
- Token-storage decisions, sanitization at every dynamic-content sink, hardened
  `window.open`/`postMessage`/iframe usage, and a CSP wired into the actual framework's config
  surface.

## Contents
- The core thesis: client-reachable is public
- Token and session storage
- Server Actions and client-callable functions are public endpoints
- Sanitization at dynamic-content sinks
- Browser-native attack surfaces that need explicit closing
- Response headers
- CSP shape by framework
- BaaS direct-write note

## The core thesis: client-reachable is public

Anything reachable via `localStorage`, `sessionStorage`, a public env-var prefix
(`NEXT_PUBLIC_`/`VITE_`/equivalent), or the shipped client bundle is public, full stop — treat it
as publication, not secrecy. A secret-shaped variable name behind a public prefix, or a secret
committed to package metadata or a build artifact, ships to every visitor regardless of intent.
Debug logs and dumps left in a public build output frequently leak source paths, internal routes,
or tokens the same way.

## Token and session storage

Never persist auth tokens (JWTs, access/refresh tokens, any secret) in `localStorage` or
`sessionStorage` — both are readable by any script running on the page, including an injected XSS
payload. Use an `HttpOnly` cookie set by the server instead: `Secure` (HTTPS-only transmission),
`HttpOnly` (invisible to JS, blocks XSS-based theft), and `SameSite=Strict` or `Lax` (blocks CSRF)
must all be set together. Cookie flags alone are not sufficient CSRF protection on their own for
state-changing requests — pair with a CSRF defense on every mutating endpoint. Never set
`SameSite=None` without also setting `Secure` and deliberately accepting the CSRF surface it
reopens. A cookie set via `document.cookie` is client-writable and therefore just as
XSS-stealable as storage — the server must set it.

## Server Actions and client-callable functions are public endpoints

Any client-callable server function — a Next.js Server Action, a tRPC procedure, a GraphQL
mutation — is directly invocable by anyone, regardless of whether the UI that "calls" it enforces
anything. Never rely solely on middleware, a layout guard, or the calling component to gate access.
Order every such function: **validate input → authenticate → authorize → mutate.** This applies
whether or not the surrounding UI ever renders the button that would normally trigger it.

## Sanitization at dynamic-content sinks

`JSON.stringify()` does not HTML-escape — a `</script>` inside embedded data can break out of its
container. Any raw-HTML render sink (`dangerouslySetInnerHTML`, an unsanitized-markdown
raw-HTML mode, server-rendered MDX from untrusted content) needs a sanitizer at the trust boundary
regardless of what upstream validation already happened; CSP reduces the blast radius of a miss,
it does not replace sanitization. Never `eval` untrusted input. Server-rendered MDX specifically
needs a constrained compiler (expressions and raw HTML disabled) and no cross-tenant caching of
attacker-controlled output.

## Browser-native attack surfaces that need explicit closing

The browser's default behavior on several native APIs is unsafe and needs an explicit fix, not a
missing default:
- `window.open()`/`target="_blank"` without `noopener`/`noreferrer` lets the opened page control
  the opener tab via `window.opener`.
- A `postMessage` handler must validate `event.origin` against an exact allowlist before trusting
  `event.data` — never trust the message shape alone.
- An iframe embedding third-party or user-controlled content needs an explicit `sandbox` attribute
  scoped to only the permissions it actually needs.
- Clickjacking primitives beyond the classic iframe overlay: SVG filters applied across a
  cross-origin iframe, and a redirect/frame-boundary gap that briefly exposes an unintended frame.
- A directly-served, executable SVG is itself an attack surface — serve user-uploaded SVGs via
  `<img>` (which can't execute embedded scripts) or with an attachment-disposition header, never
  inline-rendered from an untrusted source.
- A URL-sourced privileged parameter (an invite token, a role, a redirect target) must be
  server-validated and explicitly confirmed before acting on it — URLs are shareable, bookmarkable,
  and forgeable by construction.
- Imported metadata (EXIF, manifests, presets, dropped files/archives) must be parsed as data
  against a strict schema, never evaluated as code.
- If the client ships a plugin/extension/update surface, require signed updates, pinned trusted
  sources, and hash verification before executing anything fetched that way.
- If the client exposes an AI-agent or MCP-tool surface, treat every tool input as
  prompt-injection-controlled: validate arguments, scope permissions per call, and never expose
  raw shell/file/network primitives directly to an agent.

## Response headers

Ship these on every response the client controls (via framework config, a proxy/middleware layer,
or a hosting platform's header configuration):
- `Content-Security-Policy` — start in `Content-Security-Policy-Report-Only` before enforcing;
  prefer nonces/hashes over `unsafe-inline` for inline scripts; add Trusted Types as defense-in-depth
  once the app has significant DOM-injection surface.
- `Referrer-Policy: strict-origin-when-cross-origin` as the sane modern default — never
  `unsafe-url` (leaks the full path and query string to every external site; a password-reset token
  in a URL is the canonical leak scenario this prevents).
- `Permissions-Policy` with the empty-parens syntax (`camera=(), microphone=(), geolocation=()`)
  to deny a browser API to every origin including same-origin, shrinking the blast radius of a
  successful XSS.
- `X-Frame-Options: DENY` (or `SAMEORIGIN`) alongside CSP's `frame-ancestors 'none'` — the two can
  coexist, one for older browsers, one for current ones.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` as the one-year floor for
  preload eligibility; add `preload` only after testing, since it's slow to reverse.
- Subresource Integrity (`integrity="sha384-..."` + `crossorigin="anonymous"`) on any CDN-loaded
  `<script>`/`<link>` — the browser refuses to execute if the hash doesn't match, protecting
  against a compromised or hijacked CDN.
- Cross-origin isolation (`COOP`/`COEP`/`CORP`) is required for `SharedArrayBuffer` and similar
  powerful APIs — enabling `COEP` will break any unaudited cross-origin script, iframe, image,
  worker, or font, so audit every third-party embed first and verify with
  `self.crossOriginIsolated === true` rather than assuming it worked.
- Active mixed content (scripts/iframes/stylesheets loaded over plain HTTP into an HTTPS page) is
  blocked outright by modern browsers and is as severe as XSS; passive mixed content
  (images/audio/video) only warns or silently upgrades.

## CSP shape by framework

How a CSP is actually wired varies by build tooling, not just "add a header": structured
directive-array config (Next.js config helpers, SvelteKit's `kit.csp.directives`, Nuxt's
`nuxt-security` module), a literal CSP string (inline `headers()` in Next.js, Nuxt `routeRules`),
dynamic middleware (`headers.set('Content-Security-Policy', ...)` in `middleware`/`proxy`), or a
`<meta http-equiv="Content-Security-Policy">` tag in the document. Prefer the framework's
structured config when one exists — it's the safest to patch without breaking the rest of the
policy — followed by string splice, then middleware, then the meta tag as the last resort (a meta
CSP can't set every directive, e.g. `frame-ancestors`).

## BaaS direct-write note

Writing directly to Supabase or Firebase from the client is common in apps with no separate
backend codebase. In that shape, the client-visible schema/query filters are not a security
boundary by themselves — row-level security (Supabase RLS) or security rules (Firebase) must
enforce authorization server-side regardless of what the client sends. Enforcing those rules is
`backend`'s job; the frontend engineer's job is knowing not to treat a client-side query filter as
an authorization check.

<!-- sources: millionco/react-doctor security + security-scan categories (Modified MIT, short
recommendation strings quoted with attribution) — miner-react-doctor.md; thedaviddias
Front-End-Checklist security category (no LICENSE, re-expressed) — scout-github.md; pbakaus
detect-csp.mjs (Apache-2.0, NOTICE chain to ehmo) — triage-pbakaus-ehmo-web.md -->
