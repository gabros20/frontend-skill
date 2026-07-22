# React Native

Purpose: Build cross-platform mobile UI in React Native correctly — with **Expo as the default
greenfield path** (same role Next.js plays for React web): the platform-specific correctness traps
that don't exist on web, the perf patterns that keep lists and gestures at native frame rate,
Expo Router / EAS / managed-workflow levers, and bundling/startup levers unique to Hermes and
Android.

Read when:
- The target is a React Native app — **prefer Expo-managed** unless the project is already bare or
  needs native code Expo cannot express.
- A list scrolls poorly, a gesture stutters, startup is slow, Expo Go vs dev-client confusion,
  env/config plugins, OTA/build pipeline, or a crash on a pattern that would be harmless on web.

Skip when:
- The target platform is pure native iOS → `swiftui.md`; pure native Android → `compose.md`. React
  Native (almost always via Expo today) is the cross-platform stack under the native mandate;
  SwiftUI and Compose remain the canonical stacks when the project is not committed to RN.
- The question is React component/hook/state discipline that isn't RN-specific →
  `react-components-and-state.md`, which still applies here in full.
- The question is a touch-target size, contrast, or focus-order number → `accessibility.md`
  (canonical home); this file adds only RN's platform-specific expression of those floors.

Inputs: Expo SDK major (pins the RN version); managed vs bare / prebuild; Expo Go vs development
build; New Architecture on/off; whether `expo-router` is in use.

Produces: list/gesture code off the JS-thread critical path, Expo-correct routing/env/media/native
module choices, a build free of the crash patterns below, and startup/bundle levers applied where
the RN/Expo version still needs them manually.

## Contents
- Default posture: Expo first
- Lists and virtualization
- Text input responsiveness
- Gesture and animation threading
- Correctness traps that don't exist on web
- New Architecture and Fabric migration
- Threading model for native modules
- Bundle size and startup
- Android 16 KB page-size alignment
- Expo: managed workflow, prebuild, and config plugins
- Expo Router
- Expo env, images, fonts, storage
- Expo Go vs development builds; EAS Build and Update
- Optional deeper skills (install when the task is Expo-heavy)
- Official Expo docs (latest)
- State management for re-renders

## Default posture: Expo first

For **new** cross-platform RN work, start from **Expo** (create-expo-app / Expo SDK), not a bare
`react-native init` tree. Expo owns the toolchain pin (SDK ↔ RN version), first-party modules
(`expo-image`, `expo-router`, `expo-secure-store`, …), and store builds (EAS). Bare RN remains valid
when the repo already is bare, or when a required native dependency cannot run under Expo's
prebuild/config-plugin model after honest evaluation — not as a default "more control" reflex.

**SDK is the version you upgrade.** An Expo app's RN version is whatever that SDK ships. Don't
`yarn add react-native@next` out of band; bump **Expo SDK** and follow the SDK upgrade guide so
`expo` packages, Metro, and native binaries stay aligned. Mismatched peer ranges are a top agent
failure mode.

The sections below are RN-core (apply on Expo and bare). Expo-only sections follow Android 16 KB.

## Lists and virtualization

Never render a long or growing list inside a `ScrollView` with `.map()`; it mounts every row
immediately, and item count directly costs JS work, native view count, and memory before the user
can interact. `FlatList` windows to visible items plus a buffer; for large or complex lists, prefer
`FlashList` (`@shopify/flash-list`) or `Legend List` (`@legendapp/list`, no native dependency) for
view recycling. Check the installed FlashList major version before advising on sizing props:
**FlashList v1** still uses `estimatedItemSize`; **FlashList v2+** requires React Native's New
Architecture and deprecates `estimatedItemSize`, `estimatedListSize`, and
`estimatedFirstItemOffset` entirely, computing sizing automatically, don't flag their absence as a
bug on v2. For fixed-height items on `FlatList`, supply `getItemLayout` to skip a layout measurement
pass. Define `renderItem` outside the component or memoize it; an inline `renderItem` defined in the
render body causes list-wide re-renders on every parent update.

## Text input responsiveness

A controlled `TextInput` (`value` + `onChangeText`) round-trips every keystroke between native and
JS; on the legacy architecture, a slow React state update can surface as flicker or wrong
intermediate characters during fast typing. Switch to `defaultValue` (native owns the value; JS
only receives `onChangeText` updates) when React doesn't need to transform, mask, validate, or own
the value on every keystroke, most simple text/search inputs qualify. Keep the controlled pattern
only when input masking or per-keystroke validation genuinely requires React to own the value. This
is largely resolved on the New Architecture, but the uncontrolled pattern still gives the best
responsiveness even there.

## Gesture and animation threading

Gesture and animation work must run on the UI thread via Reanimated and `react-native-gesture-handler`,
never driven by JS-thread mechanisms like `PanResponder` or a `setState` call inside an `onScroll`
handler; JS-thread-driven gestures drop frames under any JS-thread load. This is the same
"continuous value shouldn't live in React state" principle as `react-components-and-state.md`'s
motion-value guidance, applied at the native-thread level.

## Correctness traps that don't exist on web

RN has its own crash-shaped bugs with no web equivalent: bare text rendered outside a `<Text>`
component crashes (`rn-no-raw-text`), unlike a stray text node on web. `{count && <X/>}` crashes on
RN when `count` is `0` rather than merely rendering a stray zero the way it does on web
(`rn-no-falsy-and-render`); use a ternary for any condition that can be `0`/`NaN`. RN's `<Image>`
cannot render children at all, unlike an HTML `<img>` (which is void anyway, but for a different
reason); don't pass children to it.

## New Architecture and Fabric migration

`setNativeProps` is a silent no-op under Fabric; remove it rather than leaving dead code that
appears to work. Cross-platform `boxShadow` (a string value, RN 0.7+) replaces the legacy
per-platform shadow style props once the project targets the New Architecture.

## Threading model for native modules

A synchronous, value-returning Turbo Module method blocks the JS caller for its entire duration;
treat any sync native method as JS-critical and keep it trivial and deterministic; a slow sync
method (a blocking sleep, heavy computation, disk I/O) freezes the app. An async Turbo Module
method doesn't block JS while pending, but typically runs on a shared native-modules executor; move
genuinely CPU-heavy or long-running async work to a module-owned background queue or coroutine
scope instead of occupying that shared executor. View creation, prop updates, and UI-thread work
always happen on the main thread (a UIKit/Android Views requirement); don't assume a fixed thread
for Yoga/layout work, since the renderer's internals shift across New Architecture releases, profile
instead of guessing.

## Bundle size and startup

Avoid barrel imports (`import { X } from './components'`) the same way `react-rendering-and-rsc.md`
describes for web; on RN specifically, watch for Metro circular-dependency warnings, which barrel
files make easy to introduce and which break Hot Module Replacement. Expo SDK 52+ offers
experimental unused-import/export tree-shaking (`EXPO_UNSTABLE_TREE_SHAKING=1`); Re.Pack has tree
shaking built in if already configured as the bundler.

On React Native 0.78 and earlier, Android compresses the JS bundle by default, and a compressed
bundle can't be memory-mapped, so Hermes must fully decompress it into memory before it can start
reading, losing one of its key startup optimizations. Disabling compression
(`androidResources { noCompress += ["bundle"] }` in `android/app/build.gradle`) trades roughly an
8% larger install size for roughly 16% faster time-to-interactive in measured cases. React Native
0.79+ defaults to uncompressed Android JS bundles already; check the version before applying this
manually, and don't flag it as missing on 0.79+ unless the project explicitly re-enabled compression.

## Android 16 KB page-size alignment

Google Play requires apps and updates targeting Android 15+ to support 16 KB memory page sizes on
64-bit devices. React Native 0.79+ ships correctly aligned RN-provided native binaries, but
third-party native libraries (`.so` files) may still be misaligned and are not automatically fixed
by a React Native upgrade. Verify with `zipalign -c -P 16 -v 4 app-release.apk` (the `-P 16` flag is
required; without it the tool checks 4 KB alignment, not 16 KB) as part of the release pipeline, not
just before a Play Store submission. Only 64-bit ABIs (`arm64-v8a`, `x86_64`) are affected; a
misaligned library needs rebuilding with a compatible toolchain, not repackaging.

## Expo: managed workflow, prebuild, and config plugins

**Continuous Native Generation (CNG / prebuild):** in a modern Expo app, `ios/` and `android/` are
**outputs**, not the source of truth. Native project files are generated from `app.json` /
`app.config.*` plus **config plugins**. Agents must not hand-edit generated native projects and then
expect the next `npx expo prebuild` (or EAS Build) to keep those edits — changes get wiped or
diverge. Prefer: (1) Expo config fields, (2) an official/community config plugin, (3) a local
config plugin, (4) only then bare eject / permanent native forks.

**`app.config.ts` over static `app.json` when values are dynamic** (env-based bundle ids, different
scheme per channel). Keep secrets out of the committed config; use EAS secrets / CI env, not
checked-in keys.

**Native modules:** install the Expo-supported module first (`npx expo install <pkg>` so versions
match the SDK). If a library needs custom native code, check for a **config plugin**; without one,
you need a development build (not Expo Go) and often a plugin or bare workflow. Never tell the user
"run `pod install` and edit AppDelegate" as the default Expo path.

## Expo Router

When the project uses **Expo Router** (file-based routes under `app/`), treat it as the routing
system of record — analogous in *shape* to Next App Router file conventions, **not** in server
semantics (there is no RSC on device).

- Routes live as files/folders under `app/`; layouts nest via `_layout` files; dynamic segments
  follow Expo Router's `[param]` / `(groups)` conventions for the installed major.
- Prefer typed routes / the project's generated types when enabled; don't invent parallel URL
  schemes outside the router.
- Deep links and universal links go through Expo Linking + the scheme in app config — wire
  `scheme` / associated domains in config, not ad-hoc native URL handlers, unless bare.
- For auth gates, use the router's redirect/protected-route patterns for that major rather than
  a global imperative `navigate` soup fighting the history stack.
- Verify current Expo Router major docs for loaders/API routes if the SDK version has them —
  don't assume web Next data APIs exist on device.

If the app is still `react-navigation` without Expo Router, follow the project's navigator tree;
don't force a router migration mid-task.

## Expo env, images, fonts, storage

**`EXPO_PUBLIC_*` inlining:** `babel-preset-expo` only inlines `process.env.EXPO_PUBLIC_*` when the
access is a **static dotted** reference (`process.env.EXPO_PUBLIC_API_URL`). Computed keys,
destructuring (`const { EXPO_PUBLIC_API_URL } = process.env`), or dynamic access resolve to
`undefined` at runtime — silent production misconfig. Server/secrets never belong in `EXPO_PUBLIC_*`
(they ship in the client bundle).

**Images:** prefer **`expo-image`** over core `Image` in Expo apps (caching, placeholders, better
defaults). Same layout rules as RN: explicit dimensions or flex constraints to avoid zero-size
flashes.

**Fonts:** load with `expo-font` (and the splash/keep-awake pattern the template uses) before
rendering text that depends on custom faces — avoid a flash of unstyled system font on first paint.

**Secure storage:** session tokens and secrets → **`expo-secure-store`** (Keychain/Keystore), not
AsyncStorage. AsyncStorage is fine for non-sensitive preferences. Same doctrine as
`client-security.md`'s "don't put long-lived secrets in readable web storage," applied to mobile.

**Safe area / chrome:** use `react-native-safe-area-context` (Expo template default) for notches
and home indicators; pair with Expo status-bar / system-ui modules rather than hard-coded padding
magic numbers per device.

## Expo Go vs development builds; EAS Build and Update

| Runtime | Use when | Limitation |
|---|---|---|
| **Expo Go** | UI work against modules already inside Go | Custom native code / many third-party native modules **won't load** |
| **Development build** (`expo-dev-client`) | App needs native modules, config plugins, or New Arch experiments | Must build a client binary (EAS or local) once per native change |
| **Release (EAS Build)** | Store / internal distribution | Production signing, profiles, store metadata — operate/CI owns pipeline details; this file owns **when** you need a native rebuild |

**Rule agents miss:** "works in Expo Go" is not "works in production" when the app depends on
native modules. Prefer a **dev client** as soon as a dependency requires custom native code.

**EAS Update (OTA):** JS/asset updates without a store resubmit, within the native binary's
compatibility. Native module bumps, permissions, or SDK upgrades still need a **new binary** (EAS
Build + store/TestFlight). Don't promise OTA for a Pod/Gradle change.

**Local native rebuild signal:** after adding a config plugin or native-dependent package, run
prebuild/dev-client rebuild — restarting Metro alone is not enough.

## Optional deeper skills (install when the task is Expo-heavy)

This file owns **cross-cutting RN correctness + Expo-first posture**. For deep dives (full Expo UI
kits, EAS pipelines, Router edge cases, RN perf playbooks), install a specialist skill rather than
swelling this pack. Prefer **official `expo/skills`** and high-install RN skills; verify current
install counts on [skills.sh](https://skills.sh/) before depending on low-install forks.

| When the job is… | Install (skills.sh) | Why |
|---|---|---|
| Building Expo/RN UI screens, primitives, layout | `npx skills add expo/skills@building-native-ui` | Official Expo UI craft (~59K installs) |
| Expo + Tailwind styling setup | `npx skills add expo/skills@expo-tailwind-setup` | Official Tailwind-on-Expo wiring (~45K) |
| Custom native modules / dev client | `npx skills add expo/skills@expo-dev-client` | Dev client vs Go depth (~44K) |
| SDK upgrade path | `npx skills add expo/skills@upgrading-expo` | Official upgrade playbook (~43K) |
| Store / EAS deployment | `npx skills add expo/skills@expo-deployment` | Official deploy surface (~41K) |
| CI for Expo (EAS workflows) | `npx skills add expo/skills@expo-cicd-workflows` | Official CI patterns (~40K) |
| Expo Router edge cases / API routes | `npx skills add expo/skills@expo-router` · `npx skills add expo/skills@expo-api-routes` | Router + server routes when this file’s thin Router section isn’t enough |
| Expo UI / SwiftUI hybrid UI kits | `npx skills add expo/skills@expo-ui` · `npx skills add expo/skills@expo-ui-swiftui` · `npx skills add expo/skills@expo-native-ui` | Deeper Expo UI libraries beyond core RN components |
| EAS Update insights / simulators / store listing ops | `npx skills add expo/skills@eas-update-insights` (+ `eas-simulator`, `eas-app-stores`, `eas-workflows` as needed) | EAS product depth past this file’s Build/Update table |
| RN performance / architecture playbook | `npx skills add vercel-labs/agent-skills@vercel-react-native-skills` · `npx skills add callstackincubator/agent-skills@react-native-best-practices` | High-install RN optimization (Vercel ~171K; Callstack ~20K) — complements lists/gestures here |
| RN major upgrade (not Expo SDK) | `npx skills add callstackincubator/agent-skills@upgrading-react-native` | Bare/RN-core upgrades; prefer `upgrading-expo` for Expo apps |

**Rule:** stay in this file for day-to-day Expo/RN implementation traps. Install a row above when
the task is predominantly that product surface (EAS, Expo UI kit, full upgrade migration) so the
agent gets current, specialized procedures without bloating the frontend pack.

## Official Expo docs (latest)

**Canonical site:** [https://docs.expo.dev](https://docs.expo.dev) — always prefer these pages over
blog posts or outdated SDK guides when APIs or CLI flags conflict. WebFetch / open the path that
matches the project's **current Expo SDK** (docs are versioned; use the version selector or the
SDK that `npx expo --version` / `package.json` `expo` reports).

| Topic | Latest docs |
|---|---|
| Docs home / get started | [docs.expo.dev](https://docs.expo.dev) |
| Develop overview | [docs.expo.dev/develop/](https://docs.expo.dev/develop/) |
| Router | [docs.expo.dev/router/introduction/](https://docs.expo.dev/router/introduction/) |
| API reference (all packages) | [docs.expo.dev/versions/latest/](https://docs.expo.dev/versions/latest/) |
| Config (`app.json` / `app.config`) | [docs.expo.dev/workflow/configuration/](https://docs.expo.dev/workflow/configuration/) |
| Prebuild / CNG | [docs.expo.dev/workflow/continuous-native-generation/](https://docs.expo.dev/workflow/continuous-native-generation/) |
| Config plugins | [docs.expo.dev/config-plugins/introduction/](https://docs.expo.dev/config-plugins/introduction/) |
| Environment variables | [docs.expo.dev/guides/environment-variables/](https://docs.expo.dev/guides/environment-variables/) |
| Development builds | [docs.expo.dev/develop/development-builds/introduction/](https://docs.expo.dev/develop/development-builds/introduction/) |
| EAS Build | [docs.expo.dev/build/introduction/](https://docs.expo.dev/build/introduction/) |
| EAS Update | [docs.expo.dev/eas-update/introduction/](https://docs.expo.dev/eas-update/introduction/) |
| EAS Submit / store | [docs.expo.dev/submit/introduction/](https://docs.expo.dev/submit/introduction/) |
| Upgrade Expo SDK | [docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) |
| `expo-image` | [docs.expo.dev/versions/latest/sdk/image/](https://docs.expo.dev/versions/latest/sdk/image/) |
| `expo-secure-store` | [docs.expo.dev/versions/latest/sdk/securestore/](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Expo UI (SwiftUI / Jetpack Compose) | [docs.expo.dev/guides/expo-ui/](https://docs.expo.dev/guides/expo-ui/) (follow current path if renamed) |

**Agent habit:** for a perishable flag or package API, open **versions/latest** (or the project's SDK
version) first; treat this pack's Expo section as posture + traps, not as a substitute for live
docs.

## State management for re-renders

A broad Context value makes every consumer eligible to re-render whenever that value's identity
changes, even for fields a given consumer doesn't read. When profiling shows unrelated subscribers
re-rendering after a global state update, reach for an atomic store (Jotai, atom-level subscriptions;
Zustand, selector-level subscriptions) instead of manually memoizing every consumer; this doesn't
replace the selector/derivation-stability principle in `react-components-and-state.md`, it's the RN
context this pattern most often shows up in (a broad app-state Context feeding many list-item
subscribers). Prefer measuring the actual re-render cost before migrating state management solely
to reduce re-renders; a React Compiler, once available, may resolve the same symptom without a
library change.

<!-- sources: millionco/react-doctor (Modified MIT, react-native category, 33 rules, recommendation-string quotes attributed);
callstackincubator/agent-skills, react-native-best-practices skill (MIT, "The Ultimate Guide to React Native Optimization" by Callstack);
Expo docs at docs.expo.dev (home, Router, config, CNG, plugins, env, dev builds, EAS Build/Update/Submit, SDK upgrade, image/securestore, Expo UI) — linked under Official Expo docs; facts re-expressed, SDK majors perishable;
skills.sh expo/skills + vercel-labs/callstackincubator RN skills — optional deeper-dive install table (install counts as of fold date; re-check skills.sh) -->
