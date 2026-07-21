# React Native

Purpose: Build cross-platform mobile UI in React Native correctly: the platform-specific
correctness traps that don't exist on web, the perf patterns that keep lists and gestures at native
frame rate, and the bundling/startup levers unique to Hermes and Android.

Read when:
- The target is a React Native (including Expo) app rather than a website, web app, or a native
  SwiftUI/Compose app.
- A list scrolls poorly, a gesture stutters, startup is slow, or the app crashes on a pattern that
  would be harmless on web.

Skip when:
- The target platform is native iOS → `swiftui.md`; native Android → `compose.md`. React Native is
  the cross-platform stack option under the native mandate; SwiftUI and Compose remain the
  canonical native stacks when the project isn't already committed to React Native.
- The question is React component/hook/state discipline that isn't RN-specific → `react-components-and-state.md`,
  which still applies here in full.
- The question is a touch-target size, contrast, or focus-order number → `accessibility.md`
  (canonical home); this file adds only RN's platform-specific expression of those floors.

Inputs: whether the project is on React Native's New Architecture (Fabric/Turbo Modules) or the
legacy architecture; the RN version (bundle-compression defaults changed at 0.79); whether it's an
Expo-managed or bare project.

Produces: list/gesture code that stays off the JS thread's critical path, a build free of the
platform-specific crash patterns below, and startup/bundle-size levers applied where the RN version
still needs them manually.

## Contents
- Lists and virtualization
- Text input responsiveness
- Gesture and animation threading
- Correctness traps that don't exist on web
- New Architecture and Fabric migration
- Threading model for native modules
- Bundle size and startup
- Android 16 KB page-size alignment
- Expo-specific gotchas
- State management for re-renders

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

## Expo-specific gotchas

`babel-preset-expo` only inlines `process.env.EXPO_PUBLIC_*` access when it's a static, dotted
reference; a computed or destructured access to the same variable resolves to `undefined` at
runtime, a sharp, non-obvious build-time gotcha. Prefer `expo-image` over the core `Image` component
where the project is Expo-managed.

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
callstackincubator/agent-skills, react-native-best-practices skill (MIT, "The Ultimate Guide to React Native Optimization" by Callstack) -->
