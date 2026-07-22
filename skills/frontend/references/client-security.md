# Client Security

Purpose: Client-side security and privacy doctrine — what's reachable from the browser is public,
which browser-native surfaces need explicit closing, how credentialed fetch / SPA CSRF / auth
storage actually behave, where to sanitize (including DOM clobbering), and which response headers
the client's own configuration should ship. Server-side enforcement (databases, RLS/authorization
rules, webhook verification, secret handling in CI) is `backend`'s job; this file owns only what a
frontend engineer writes or configures.

Read when:
- Deciding where to store an auth token or session identifier (memory vs HttpOnly vs BFF).
- Wiring `fetch`/`axios` credentials modes or debugging a silent empty session across origins.
- Choosing SPA CSRF defenses (double-submit, custom header, Fetch Metadata) for cookie-auth apps.
- Handling OAuth redirects that set cookies on an API host separate from the SPA host.
- Writing anything that renders raw HTML/markdown or interpolates user input into HTML.
- Handling `postMessage`, `window.open`, iframes, third-party widgets, or file uploads from
  untrusted content.
- Configuring CSP, Permissions-Policy, frame-ancestors / X-Frame-Options, or another security
  response header for a client app.
- Writing a Server Action, Route Handler, or any other client-callable function.
- Hiding UI by role/permission (RBAC/PBAC) — know that is not enforcement.

Skip when:
- The question is server-side authorization logic, database rules, or infrastructure secrets —
  that's `backend`.
- The question is an independent security audit or penetration test — that's `quality`.
- API-client single-flight 401 refresh, multi-tab logout broadcast, or runtime-config bootstrap
  mechanics — that's `client-app-wiring` (security constraints still apply here).

Inputs:
- Where auth/session state is currently stored (cookie vs. storage vs. memory vs. BFF).
- Whether the SPA and API share an origin, and whether OAuth returns via a different host.
- Whether the app renders any user-authored HTML, Markdown, or SVG.
- Which mutating endpoints use cookie session vs bearer token.

Produces:
- Token-storage decisions on the auth ladder, correct `credentials` + CORS pairing, SPA CSRF
  client half, sanitization at every dynamic-content sink (including clobber resistance),
  hardened `window.open`/`postMessage`/iframe/widget usage, and a CSP wired into the actual
  framework's config surface.

## Contents
- The core thesis: client-reachable is public
- Auth storage ladder
- Fetch credentials triad
- SPA CSRF ladder (client half)
- SameSite Domain / CNAME trap
- OAuth cross-origin set-cookie-on-redirect
- Server Actions and client-callable functions are public endpoints
- Sanitization at dynamic-content sinks
- DOM clobbering
- Browser-native attack surfaces that need explicit closing
- Third-party widgets
- Clickjacking headers
- Response headers
- CSP shape by framework
- Client RBAC/PBAC
- Public runtime config
- BaaS direct-write note

## The core thesis: client-reachable is public

Anything reachable via `localStorage`, `sessionStorage`, a public env-var prefix
(`NEXT_PUBLIC_`/`VITE_`/equivalent), runtime-injected `window.__ENV__` / `/config.json`, or the
shipped client bundle is public, full stop — treat it as publication, not secrecy. A secret-shaped
variable name behind a public prefix, or a secret committed to package metadata or a build
artifact, ships to every visitor regardless of intent. Debug logs and dumps left in a public build
output frequently leak source paths, internal routes, or tokens the same way.

## Auth storage ladder

Never persist auth tokens (JWTs, access/refresh tokens, any secret) in `localStorage` or
`sessionStorage` — both are readable by any script running on the page, including an injected XSS
payload. Prefer the strongest option the product shape allows; lower rungs are not "wrong" but
have explicit residual risk.

| Rung | Where the credential lives | XSS can… | CSRF surface | Notes |
|------|----------------------------|----------|--------------|-------|
| Memory only | JS heap / module scope | …steal for the tab lifetime once XSS runs | Low if no cookie session | Lost on refresh; needs silent refresh path. |
| HttpOnly cookie | Server-set cookie (`Secure` + `HttpOnly` + `SameSite`) | …not read the token, but **can ride the session** (same-origin requests as the user) | Yes — needs CSRF ladder | Cookie set via `document.cookie` is client-writable → same as storage. Server must set it. |
| BFF | Access/refresh tokens stay on the backend; browser holds only a first-party session cookie to *your* BFF | …ride the BFF session, not call third-party APIs with stolen bearer tokens | Yes for the BFF cookie | **Token never leaves the server.** Preferred when SPA talks to many upstream APIs. |
| Emerging: DBSC | Device-bound session credentials (browser/OS-bound session material) | Goal: reduce bulk session export by OS infostealers | Still pair with CSRF for cookie-auth | 2026-era platform work; treat as emerging capability, not a shipped default to design around alone. |

Cookie flags alone are not sufficient CSRF protection for state-changing requests — pair with a
CSRF defense on every mutating endpoint. Never set `SameSite=None` without also setting `Secure`
and deliberately accepting the CSRF surface it reopens. Order of hardening: **fix XSS first**
(storage ladder + sanitization + CSP); CSRF mitigations fail open under XSS because the attacker
can call your own APIs from the victim's origin.

## Fetch credentials triad

`Request.credentials` controls whether cookies, client certs, and HTTP auth are attached:

| Mode | Cookies / auth material | Typical use |
|------|-------------------------|-------------|
| `omit` | Never | Public, unauthenticated calls; strip accidental cookie leakage. |
| `same-origin` | **Default** — only when request URL is same-origin | First-party API on the SPA origin. |
| `include` | Always, including cross-origin | SPA on `app.example.com` calling `api.example.com` with cookies. |

Credentialed **cross-origin** requests require the server to answer with
`Access-Control-Allow-Credentials: true` **and** a **specific** `Access-Control-Allow-Origin`
echoing the request origin — **not** `*`. Pair with `Vary: Origin` when origins are reflected.
Safari is stricter in practice: cookie needs `SameSite=None; Secure` for third-party contexts;
keep `Access-Control-Max-Age` modest (~≤600s) when debugging flaky preflight caches.

**Silent empty session failure mode:** wrong `credentials` mode (or ACA-Origin `*` with
credentials) often yields **200 with an anonymous body** or a logged-out UI — not always a loud
CORS console error. When "I'm logged in but the API acts anonymous," check credentials mode and
CORS credential pairing before rewriting auth state machines.

Cross-ref: API client baseURL + credentials defaults live in `client-app-wiring`; this file owns
the security constraints those defaults must satisfy.

## SPA CSRF ladder (client half)

Cookie-authenticated SPAs need a CSRF defense on every state-changing request. Prefer higher rungs
when the framework already provides them; compose lower rungs for defense in depth. **XSS defeats
all of these** — an injected script can read tokens, set headers, and call same-origin APIs as the
user. Fix XSS first; still keep CSRF for cookie-auth apps.

| Order | Control | Client half | Trap |
|------:|---------|-------------|------|
| 1 | Framework built-in | Next.js / Remix / Rails / etc. CSRF helpers or cookie+header convention | Don't disable "for SPA convenience." |
| 2 | Synchronizer token | Server issues per-session (or per-request) token; client sends it on mutate (header or body) | Stateful; needs token bootstrap into the SPA. |
| 3 | Double-submit cookie | Readable CSRF cookie + matching header/body value | Stateless SPA-friendly; cookie must not be HttpOnly for the JS-readable half (session cookie stays HttpOnly). |
| 4 | Custom request header | e.g. `X-Requested-With` / `X-CSRF-Token` on XHR/fetch | Forces CORS preflight for cross-origin. **Not settable by classic HTML form POST** — do not rely on it if form posts hit the same mutating endpoints. |
| 5 | Fetch Metadata | Server checks `Sec-Fetch-Site` (`same-origin` / `same-site` / `cross-site` / `none`) + related Sec-Fetch-* | Client sends automatically; server enforces. Keep fallbacks for older clients if you support them. |
| 6 | Origin / Referer | Server allowlists `Origin` (prefer) or `Referer` | Referer may be stripped by policy; Origin absent on some same-origin navigations — know the cases. |
| 7 | SameSite cookies | `Strict` or `Lax` on session cookies | Necessary but not sufficient alone; see Domain/CNAME trap and method caveats. |

Do **not** use GET for state-changing operations; if a legacy endpoint must mutate on GET,
CSRF-protect it too. Custom-header CSRF only covers clients that can set headers — design APIs so
unsafe operations are not reachable from bare form posts without a token.

## SameSite Domain / CNAME trap

Do **not** set a session cookie's `Domain` to a parent domain (e.g. `.example.com`) if **any**
subdomain can be CNAME'd (or otherwise controlled) by an untrusted party — the cookie is shared
across those subdomains and becomes stealable or attachable from the hostile host. Prefer host-only
cookies (no `Domain` attribute) scoped to the exact API/SPA host that needs them. SameSite
`Strict`/`Lax` still attach on same-site subdomains when `Domain` is broad; SameSite is not a
substitute for tight cookie scope.

## OAuth cross-origin set-cookie-on-redirect

**Failure mode:** OAuth completes on the API host; the callback response `Set-Cookie`s the session
and `302`s to the SPA host. Browsers frequently **drop or partition** those cookies (SameSite,
cross-site redirect chains, CHIPS/partitioning) — works on localhost same-site, dies when SPA and
API are different sites (classic Vercel app + separate API host).

**Working pattern (order of ops):**
1. OAuth provider → **backend** callback (API origin).
2. Backend establishes server-side session / stores tokens; issues a **short-lived, one-time temp
   token** (query/fragment/code) to the SPA redirect — not the long-lived session cookie for a
   foreign site.
3. SPA loads, then **calls the API same-origin-to-the-API** (or credentialed cross-origin with the
   triad above) with that temp token.
4. API validates temp token and `Set-Cookie`s session cookies on the **API host** in a response to
   a request whose URL is that host — cookies stick.

Do not rely on `Set-Cookie` on a cross-site redirect response alone to establish the SPA session.

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
it does not replace sanitization. Never `eval` / `new Function` untrusted input. Prefer
`textContent` (or framework text bindings) over `innerHTML` when the content is plain text.
Server-rendered MDX specifically needs a constrained compiler (expressions and raw HTML disabled)
and no cross-tenant caching of attacker-controlled output.

Framework escape hatches are XSS sinks by name: React `dangerouslySetInnerHTML`, Angular
`bypassSecurityTrust*`, Lit `unsafeHTML`, Vue `v-html`, plus `javascript:` / `data:` URLs in
navigation and resource attributes. Treat each as a deliberate trust-boundary crossing with a
sanitizer and a CSP backstop.

## DOM clobbering

Named forms, anchors, and elements with `id`/`name` can inject properties onto `window` and
`document` (e.g. `<form name="foo">` → `window.foo`, or clobbering `document.getElementById` /
config globals depending on browser rules). Attacker-controlled HTML that never executes a script
can still **redirect lookups** of security-sensitive objects to attacker-owned nodes.

Rules:
- Sanitize untrusted HTML with a library configured to resist clobbering (e.g. DOMPurify with
  clobber-safe settings / `SANITIZE_DOM` behavior — verify current defaults).
- Do **not** use global id/name lookups (`window[configKey]`, bare identifier globals, implicit
  document property access) for security-sensitive objects; hold references in module scope or
  explicit maps.
- After sanitizing into the DOM, re-read configuration from closed-over constants, not from
  `window.*` that markup might have defined.

## Browser-native attack surfaces that need explicit closing

The browser's default behavior on several native APIs is unsafe and needs an explicit fix, not a
missing default:
- `window.open()`/`target="_blank"` without `noopener`/`noreferrer` lets the opened page control
  the opener tab via `window.opener`.
- A `postMessage` handler must validate `event.origin` against an exact allowlist before trusting
  `event.data` — never trust the message shape alone. Specify `targetOrigin` on `postMessage`
  sends; never `"*"` for sensitive payloads.
- An iframe embedding third-party or user-controlled content needs an explicit `sandbox` attribute
  scoped to only the permissions it actually needs.
- Clickjacking primitives beyond the classic iframe overlay: SVG filters applied across a
  cross-origin iframe, and a redirect/frame-boundary gap that briefly exposes an unintended frame.
  Header defense is in **Clickjacking headers** below.
- A directly-served, executable SVG is itself an attack surface — serve user-uploaded SVGs via
  `<img>` (which can't execute embedded scripts) or with an attachment-disposition header, never
  inline-rendered from an untrusted source.
- A URL-sourced privileged parameter (an invite token, a role, a redirect target) must be
  server-validated and explicitly confirmed before acting on it — URLs are shareable, bookmarkable,
  and forgeable by construction. Open-redirect allowlists are server-side; the client must not
  blindly `window.location = searchParams.redirect`.
- Imported metadata (EXIF, manifests, presets, dropped files/archives) must be parsed as data
  against a strict schema, never evaluated as code.
- If the client ships a plugin/extension/update surface, require signed updates, pinned trusted
  sources, and hash verification before executing anything fetched that way.
- If the client exposes an AI-agent or MCP-tool surface, treat every tool input as
  prompt-injection-controlled: validate arguments, scope permissions per call, and never expose
  raw shell/file/network primitives directly to an agent.

## Third-party widgets

Prefer **sandboxed iframe** embeds over in-page third-party scripts when the vendor allows it.
Order of ops:
1. Host the widget in `<iframe sandbox="...">` with the minimum tokens required (`allow-scripts`
   only if needed; add `allow-same-origin` only when unavoidable — together they weaken sandbox).
2. Communicate via `postMessage` with **exact origin checks** on both sides.
3. If a script tag is mandatory, load it with integrity when possible, isolate behind a facade
   (see `performance` third-party notes), and assume full XSS equivalence if that script is
   compromised — it runs as your origin.

## Clickjacking headers

Prefer CSP **`frame-ancestors`** (`'none'` default; `'self'` or explicit origins when embedding is
required) as the modern control. Ship **`X-Frame-Options: DENY`** (or `SAMEORIGIN`) as well for
defense in depth and older clients.

Priority trap: when **both** are present, **some browsers historically honoured XFO over
`frame-ancestors`** despite the CSP spec saying enforce `frame-ancestors` and ignore XFO. Keep the
two **aligned** (don't set XFO `SAMEORIGIN` while CSP says `frame-ancestors 'none'` and expect CSP
to win everywhere).

**`<meta http-equiv="X-Frame-Options">` does nothing** — XFO must be an HTTP response header.
Same for `frame-ancestors`: it is **not** valid/effective via `<meta http-equiv="Content-Security-Policy">`
in the way other CSP directives can be; set framing policy on the response headers.

SameSite `Strict`/`Lax` session cookies are omitted in many third-party iframe contexts, which
blocks **authenticated** UI redress but **not** unauthenticated clickjacking (login buttons, public
forms). Headers remain mandatory.

## Response headers

Ship these on every response the client controls (via framework config, a proxy/middleware layer,
or a hosting platform's header configuration):
- `Content-Security-Policy` — start in `Content-Security-Policy-Report-Only` before enforcing;
  prefer nonces/hashes over `unsafe-inline` for inline scripts; add Trusted Types as defense-in-depth
  once the app has significant DOM-injection surface. Include `frame-ancestors` here (see above).
- `Referrer-Policy: strict-origin-when-cross-origin` as the sane modern default — never
  `unsafe-url` (leaks the full path and query string to every external site; a password-reset token
  in a URL is the canonical leak scenario this prevents).
- `Permissions-Policy` with the empty-parens syntax (`camera=(), microphone=(), geolocation=()`)
  to deny a browser API to every origin including same-origin, shrinking the blast radius of a
  successful XSS.
- `X-Frame-Options: DENY` (or `SAMEORIGIN`) alongside CSP's `frame-ancestors` — keep them aligned
  (see Clickjacking headers).
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

## Client RBAC/PBAC

UI gates (hide button, disable route link, filter menu by role or policy) are **UX and least
privilege of display only**. They must **mirror** server authorization checks on every
client-callable path (Server Actions, tRPC, Route Handlers, BaaS writes). Never treat a missing
button, a client-side role claim in a JWT payload, or a feature-flag bit as sole enforcement — the
caller can invoke the endpoint directly. Sensitive "can this user do X?" decisions belong on the
server; the client may cache a view-model of permissions for rendering and must re-validate on
mutate.

## Public runtime config

Build-time public env (`NEXT_PUBLIC_*` / `VITE_*`) and runtime injection (`/config.json`,
`window.__ENV__`, SSR-read public env) are both **public**. Use runtime injection when one build
must serve many environments; still never put secrets in either path. Bootstrap and wiring details
belong in `client-app-wiring`; the security rule is identical to the core thesis — if the browser
can read it, so can everyone else.

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
detect-csp.mjs (Apache-2.0, NOTICE chain to ehmo) — triage-pbakaus-ehmo-web.md; OWASP
CheatSheetSeries client half (CSRF SPA ladder, SameSite Domain/CNAME, clickjacking
frame-ancestors/XFO/meta-useless, DOM clobbering, XSS-defeats-CSRF) — digest-owasp-client.md +
github-relay.md; MDN/web.dev fetch credentials triad + credentialed CORS pairing —
authors-architecture.md; X @devsterxyz OAuth cross-origin set-cookie-on-redirect; X
@SixtusAgbakwuru Safari CORS checklist; X @iwashi86 auth storage ladder → BFF + DBSC —
x-bookmarks.md; bulletproof-react client RBAC = UI only — github-relay / GAP_MAP -->
