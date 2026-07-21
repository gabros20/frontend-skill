# SwiftUI

Purpose: SwiftUI implementation conformance for iOS/iPadOS — code-level API facts (modifiers,
deprecated→modern replacements, data-flow types, accessibility API surface) for production SwiftUI.
Complements design's `surface-ios.md`, which owns the HIG *decisions* (chrome numbers, layout
targets, navigation model, permission timing) this file implements in code.

Read when:
- Writing or reviewing SwiftUI views, navigation, state, or accessibility code for iOS/iPadOS.
- Auditing SwiftUI code for deprecated API usage.

Skip when:
- Platform is Android/Compose (→ `compose.md`) or web (→ `web-platform-*` / `react-*`).
- The question is a design *decision* (chrome dimensions, tap-target rationale, navigation-model
  choice, permission copy/timing) — see `surface-ios.md`.
- The question is Swift concurrency or Swift Testing — see `swift-concurrency-and-testing.md`.
- The question is universal touch-target/contrast/reduced-motion doctrine — see `accessibility.md`;
  this file adds only the SwiftUI-specific expression.

Inputs: a SwiftUI view/feature to build or review; target iOS deployment version; whether
SwiftData/CloudKit is used.
Produces: SwiftUI code using current (non-deprecated) APIs, correct data-flow ownership, and
HIG-conformant accessibility wiring.

## Contents
- Deprecated → modern API map
- Navigation, sheets, and lifecycle
- State and data flow
- Layout, targets, and safe area
- Typography, color, and Dark Mode
- Accessibility API surface
- SF Symbols and haptics
- Permissions and ATT
- Performance
- Swift conventions

## Deprecated → modern API map

| Deprecated | Modern |
|---|---|
| `foregroundColor()` | `foregroundStyle()` |
| `cornerRadius()` | `clipShape(.rect(cornerRadius:))` |
| `tabItem()` | `Tab` API |
| `onChange(of:perform:)` (1-param) | 2-param or 0-param `onChange(of:)` — 1-param form banned |
| `.navigationBarLeading` / `Trailing` | `.topBarLeading` / `.topBarTrailing` |
| `NavigationView` | `NavigationStack` / `NavigationSplitView` |
| `NavigationLink(destination:)` | `navigationDestination(for:)` — never mix the two in one hierarchy; register each data type's destination once |
| `PreviewProvider` | `#Preview` |
| `overlay(_:alignment:)` | `overlay(alignment:content:)` |
| `UIImpactFeedbackGenerator` ad hoc | `sensoryFeedback()` |
| manual `EnvironmentKey` | `@Entry` macro |
| `Text` concatenation with `+` | string interpolation (`Text("\(a)\(b)")`) — `+` banned |
| `GeometryReader` as default | `containerRelativeFrame()`/`visualEffect()`/`Layout` protocol; `GeometryReader` last resort |
| wrapped `WKWebView`/`UIViewRepresentable` | native `WebView` (`import WebKit`, iOS 26+ — verify deployment target) |
| `Image("name")` string lookup | `Image(.name)` generated symbol when the asset catalog supports it |

## Navigation, sheets, and lifecycle

- `NavigationStack` + `navigationDestination(for:)`, never `NavigationView`. `NavigationPath` for type-erased path state.
- Attach `confirmationDialog()` to the triggering element so the presentation animates from the right source. Omit an alert whose only action is a no-op "OK" dismiss.
- Prefer `sheet(item:)` over `sheet(isPresented:)` for optional data. Always dismissable; `.cancellationAction`/`.confirmationAction` toolbar roles; never stack a modal on a modal.
- `.searchable()` + `.searchSuggestions()`, paired with `ContentUnavailableView.search`. `TabView(selection:)` binds to an enum, not Int/String.
- `@Environment(\.scenePhase)` is the interruption/backgrounding point — save state on `.background`, not just `.inactive`.

## State and data flow

- `@Observable` classes must be `@MainActor`-isolated unless the module defaults to main-actor isolation. Prefer `@Observable` + `@State` (ownership) + `@Bindable`/`@Environment` (passing) over `ObservableObject`/`@Published`/`@StateObject`/`@ObservedObject`/`@EnvironmentObject` unless legacy code forces it.
- `@State` is `private`, owned only by its creating view; may hold a non-observable, expensive-to-recompute cache (e.g. `CIContext`). Never store `@AppStorage` inside an `@Observable` class — even `@ObservationIgnored` — it won't trigger view updates.
- Avoid inline `Binding(get:set:)`; use real `@State`/`@Binding` + `.onChange()`. Numeric `TextField` needs both `format: .number` **and** `.keyboardType(.numberPad)` — the format modifier alone doesn't restrict input.
- SwiftData+CloudKit: never `@Attribute(.unique)`; every model property needs a default or must be optional; every relationship must be optional.

## Layout, targets, and safe area

- Touch targets: `accessibility.md`'s table sets the floor and iOS's comfortable standard (44×44pt). Implement via `.frame(minWidth: 44, minHeight: 44)` — enforce strictly.
- `.ignoresSafeArea()` only for decorative/background fills, never text or controls.
- Never `UIScreen.main.bounds`; prefer `containerRelativeFrame()`/`visualEffect()`, `GeometryReader` last resort.
- `ContentUnavailableView` for empty/missing states. `RoundedRectangle`'s default corner style is already `.continuous`.

## Typography, color, and Dark Mode

- Semantic text styles (`.font(.headline/.body/.caption)`) — never hardcoded `.font(.system(size:))`. Layouts must reflow at large accessibility sizes: switch `HStack`→`VStack` via `ViewThatFits`/`AnyLayout`, don't truncate.
- Custom fonts scale via `Font.custom(_:size:relativeTo:)` (SwiftUI) or `UIFontMetrics.scaledFont` + `adjustsFontForContentSizeCategory` (UIKit); custom fixed spacing that must scale uses `@ScaledMetric` (iOS ≤18) or `.font(.body.scaled(by:))` (iOS 26+ — verify current support).
- Prefer weight/color variation over extreme size for hierarchy; `bold()` not `fontWeight(.bold)`.
- Semantic colors — `Color(.label)`, `.secondaryLabel`, `Color(.systemBackground)`, `.systemBlue/Red/Green` — adapt automatically Light/Dark; avoid raw `UIColor` in SwiftUI. Check both modes via `.preferredColorScheme(.light/.dark)` in `#Preview`; contrast ratios are `accessibility.md`'s table, not restated here.

## Accessibility API surface

Canonical doctrine (WCAG ratios, touch-target table, reduced-motion kill-switch) lives in `accessibility.md`; this is the SwiftUI API surface implementing it.

- `.accessibilityLabel()`, `.accessibilityValue()`, `.accessibilityHint()`, `.accessibilityElement(children: .combine)`, `.accessibilityHidden(true)` for decorative images. Labels are nouns, hints are actions.
- Decorative images → `Image(decorative:)`/`.accessibilityHidden()`; meaningful images → `.accessibilityLabel()`. Flag unhelpful auto-derived names.
- Icon-only buttons still carry a text label — `Button("Label", systemImage:, action:)` — text stays available to VoiceOver even styled `.labelStyle(.iconOnly)`.
- `onTapGesture()` banned unless tap location/count is specifically needed — use a real `Button`; if forced, add `.accessibilityAddTraits(.isButton)`. Frequently-changing labels (a live stock price) need `.accessibilityInputLabels()`.
- `.accessibilityDifferentiateWithoutColor` when color is a meaningful differentiator; `@Environment(\.legibilityWeight)` to honor Bold Text.
- Reduced motion: `@Environment(\.accessibilityReduceMotion)` is the SwiftUI expression of `accessibility.md`'s floor — swap large motion for an opacity crossfade, don't just disable the transition.

## SF Symbols and haptics

- Rendering modes monochrome/hierarchical/palette/multicolor — don't force multicolor to gray; match symbol weight to adjacent text, use scale variants (`.imageScale(.large)`) not explicit sizes. `symbolEffect()`/`.contentTransition(.symbolEffect(.replace))` (iOS 17+ — verify deployment target).
- Haptics: `UIImpactFeedbackGenerator(style:)` for physical actions, `UINotificationFeedbackGenerator()` (`.success/.warning/.error`) for outcomes, `UISelectionFeedbackGenerator()` for state changes — three distinct types, not interchangeable. Call `.prepare()` before triggering to cut latency; prefer `sensoryFeedback()` over instantiating generators directly in new code.
- Loading placeholders: `.redacted(reason: .placeholder)`, never a full-screen blocking spinner.

## Permissions and ATT

- Request just-in-time at point of use, never at launch. **PHPicker**/**CNContactPicker** grant the user's selection with no system permission at all.
- `.whenInUse` location before ever requesting `.always`; offer Sign in with Apple first if any third-party sign-in exists. After denial, deep-link to Settings rather than re-prompting in-app.

## Performance

- Ternary over if/else view branching (avoids `_ConditionalContent` recreation); avoid `AnyView`, prefer `@ViewBuilder`/`Group`/generics. Extract dedicated `View` structs rather than computed `some View` properties.
- `body` runs frequently — hoist sorting/filtering out of it. `LazyVStack`/`LazyHStack` for large scrollable data. `.task()` over `.onAppear()` for async work — auto-cancels on disappear.
- Don't store `DateFormatter`-like formatters — use `Text(date, format:)`/`Text(number, format:)`.
- Animation: prefer `@Animatable` macro over manual `animatableData`; never a bare `.animation(_:)` — always pair a `value:`.

## Swift conventions

- `.number.precision(.fractionLength(n))` over C-style `String(format:)`; date-format strings use `"y"` not `"yyyy"` for correctly-localized years (except API data-exchange).
- `localizedStandardContains()` (not `.contains()`/`.localizedCaseInsensitiveContains()`) for user-input text filtering. `Double` over `CGFloat` except optionals/`inout` contexts requiring it.
- Never silently swallow a user-triggered error with `print()` — surface it via alert.
- Hygiene: `@AppStorage` must never store credentials — use Keychain; unit-test core logic (view models, not views — Swift Testing API is in `swift-concurrency-and-testing.md`).

<!-- sources: ehmo_platform-design-skills ios/SKILL.md (MIT); swiftui-pro (MIT, Paul Hudson/twostraws); wondelai_skills ios-hig-design (MIT); twostraws/SwiftUI-Agent-Skill (MIT — diffed against swiftui-pro; no material net-new content found beyond what's listed here) -->
