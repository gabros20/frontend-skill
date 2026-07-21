# Compose

Purpose: Implement Android UI in Jetpack Compose against Material 3, in code. Owns the composable
APIs, window-size-class code, navigation components, predictive back, the component-selection
catalog, edge-to-edge/foldable wiring, accessibility semantics, gesture/notification/permission/
system-integration APIs, and Compose's own API-design conventions (modifier parameter, slot API,
focus, testing). Design owns the M3 *decisions* (dynamic color roles, type-scale values, shape
scale, elevation tokens, navigation-pattern rationale) in `surface-android.md`; this file consumes
those decisions in code and does not restate their values.

Read when:
- Writing or reviewing Jetpack Compose UI code, Compose theming wiring, or Android platform
  integration (permissions, notifications, widgets, deep links).
- Choosing which Composable API to reach for (navigation shell, dialog vs sheet vs snackbar).

Skip when:
- The surface is web or iOS (see the web-stack files, or `swiftui.md`).
- The question is an M3 design decision (color roles, exact type/shape/elevation values, which
  navigation pattern fits an IA), read `surface-android.md`; this file only wires that decision.
- The question is Compose state modeling, side effects, recomposition, or Kotlin concurrency/Flow
  doctrine: read `kotlin-and-compose-state.md`.
- The fact is a universal touch-target or reduced-motion invariant, read `accessibility.md`; this
  file only adds Android's platform expression of it.

Inputs: design's M3 theme (color roles, type scale) from `handoff.yaml`/DESIGN.md, app IA (top-level
destination count), window-size-class targets, target minSdk.

Produces: Compose theme wiring, navigation shell code, component code, accessibility semantics,
platform-integration code (gestures, notifications, permissions, widgets/shortcuts/deep links).

## Contents
- Theme wiring (dynamic color)
- Window size classes in code
- Navigation components
- Predictive back
- Component-selection catalog
- Edge-to-edge and foldables
- Accessibility implementation
- Gestures and input
- Notifications
- Permissions and privacy
- System integration
- Composable API design (modifier, slots, focus, testing)
- Anti-patterns

## Theme wiring (dynamic color)

Wire dynamic color with `dynamicDarkColorScheme(context)` / `dynamicLightColorScheme(context)`
(Android 12 / API 31+), with a static `ColorScheme` fallback below API 31. Reference
`MaterialTheme.colorScheme.*` roles everywhere in composable code; never hardcode a hex value in a
composable. Which role maps to which use (which is a fill, which is `on-`, which pairs with which)
is design's decision, see `surface-android.md`.

## Window size classes in code

Do not hand-roll `BoxWithConstraints` width checks. Use `calculateWindowSizeClass()`
(`androidx.compose.material3:material3-window-size-class`) for the Compact/Medium/Expanded class,
or `currentWindowAdaptiveInfo()` (`androidx.compose.material3.adaptive`) when building a
`ListDetailPaneScaffold`/`SupportingPaneScaffold`. Design owns the breakpoint values (600/840/1200/
1600dp) and the margin/gutter/column mapping per class; this file owns only the API call that
derives the class.

## Navigation components

Compose APIs for the destination-count/window-class decision design makes: `NavigationBar`
(bottom, Compact), `NavigationRail` (side, Medium/Expanded), `ModalNavigationDrawer` (Compact, 5+
destinations), `PermanentNavigationDrawer` (Expanded, 5+ destinations). `NavigationBar` items
always show a label (icon-only is not a valid configuration); the active indicator uses the
`secondaryContainer` role. Design's navigation matrix (which pattern for which destination count
and window class) lives in `surface-android.md`; this file owns only the composable names.

## Predictive back

Opt in via manifest `android:enableOnBackInvokedCallback="true"` (Android 13+). Code API: the
standalone composable `PredictiveBackHandler(enabled) { progress: Flow<BackEventCompat> -> ... }`
(`androidx.activity.compose`, `androidx.activity:activity-compose` 1.8+) — not a `Modifier`
extension. Do not suppress the system-provided back preview
animation. If implementing a custom transition, interpolate using `BackEventCompat.progress`
(0.0 to 1.0) and respect `BackEventCompat.swipeEdge` (`EDGE_LEFT`/`EDGE_RIGHT`) so the exiting
screen tracks the initiating edge; the specific scale/offset math is a choreography value (OUT to
the animation skill); this file keeps only the API names and the "don't suppress the system
preview" rule. Back gesture navigates back in the stack; the Up button navigates up the
hierarchy; they may differ. Never override the deprecated `onBackPressed()`.

## Component-selection catalog

Which Composable API to reach for, by need:

| Need | Composable API |
|---|---|
| Primary screen action | `FloatingActionButton` / `ExtendedFloatingActionButton` / `LargeFloatingActionButton` (at most one per screen) |
| Brief, non-critical feedback | `SnackbarHostState.showSnackbar(message, actionLabel, duration)` |
| Critical decision | `AlertDialog` |
| Supplementary, non-critical content | `ModalBottomSheet` (must show a visible drag handle) |
| Toggle filter | `FilterChip` |
| User-entered tag | `InputChip` |
| Smart suggestion | `AssistChip` / `SuggestionChip` |
| Content group | `Card` |
| Vertical list | `LazyColumn` + `ListItem` |
| 2-5 segmented options | `SegmentedButton` |
| Binary toggle | `Switch` |
| List selection | `RadioButton` or an exposed dropdown |

Top App Bar: `TopAppBar` (small, default) vs `MediumTopAppBar`/`LargeTopAppBar` for prominent
titles, connected to `TopAppBarDefaults.enterAlwaysScrollBehavior()`/
`exitUntilCollapsedScrollBehavior()`; limit actions to 2-3, overflow into a menu. Dialogs: confirm
is a `TextButton`, never filled; dismiss sits on the left. Snackbar: one action max (for example
"Undo"). Chips arrange horizontally or in a flow layout, never stacked vertically.

## Edge-to-edge and foldables

Call `ComponentActivity.enableEdgeToEdge()` before `setContent`; Android 15+ enforces
edge-to-edge. `Scaffold` auto-handles insets for its own slots (top/bottom bar content); for other
content, pad with `Modifier.statusBarsPadding()` / `navigationBarsPadding()` / `imePadding()` /
`displayCutoutPadding()`, or `Scaffold`'s `contentWindowInsets`. Scrollable content should scroll
behind transparent system bars, with inset padding applied only at the list's top/bottom.

Foldables: detect hinge/fold state via
`WindowInfoTracker.getOrCreate(context).windowLayoutInfo(context)`, branching on
`FoldingFeature.State.HALF_OPENED` with `.Orientation.HORIZONTAL`/`.VERTICAL` (tabletop vs. book
posture). Use `ListDetailPaneScaffold`/`SupportingPaneScaffold` (Material3 adaptive library) rather
than hand-built two-pane logic. Never place critical content across the physical hinge.

## Accessibility implementation

Universal touch-target and reduced-motion invariants live in `accessibility.md`; Android's
expression of them:

- Minimum touch target **48x48dp**. `IconButton` provides this by default; enforce manually with
  `Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)`. Pad, never shrink, to hit the floor.
- Android has no direct Compose equivalent of iOS's `accessibilityReduceMotion`. Check the OS
  "remove animations" toggle via the system animator-duration-scale setting before starting a
  non-essential Compose animation; treat it as this platform's expression of the reduced-motion
  kill-switch in `accessibility.md`.
- `contentDescription` on every interactive element (`null` only if purely decorative), describing
  the action, not the appearance ("Add to favorites", not "Heart icon"). Group a compound element
  into one TalkBack focus unit with `Modifier.semantics(mergeDescendants = true)`; expose
  swipe/long-press actions to TalkBack via `customActions = listOf(CustomAccessibilityAction(...))`.
- Bold-text and high-contrast OS settings: `Configuration.fontWeightAdjustment` (API 31+, >=700
  means the bold-text preference is active) and `AccessibilityManager.isHighTextContrastEnabled()`.
  `MaterialTheme.typography` auto-adapts to `fontWeightAdjustment`; branch custom colors on the
  high-contrast flag (for example, swap `onSurface` for `onSurfaceVariant`).
- Focus order follows logical reading order; avoid a custom `focusOrder` unless the default is
  actually wrong. After navigation or a dialog dismiss, move focus with
  `FocusRequester.requestFocus()`.
- A custom `View` subclass drawing on `Canvas` (charts, custom pickers) is invisible to TalkBack by
  default. Expose a virtual accessibility tree with `ExploreByTouchHelper`
  (`androidx.customview.widget`): override `getVirtualViewAt()`, `getVisibleVirtualViews()`,
  `onPopulateNodeForVirtualView()`, `onPerformActionForVirtualView()`, wired via
  `ViewCompat.setAccessibilityDelegate(this, helper)` with `dispatchHoverEvent` forwarded.
- Always use `sp` for text sizes, never `dp`; test the UI at 200% font scale for clipping.

## Gestures and input

Never place interactive elements in system gesture inset zones (bottom 20dp, left/right 24dp
edges); detect via `WindowInsets.systemGestures`. Pull-to-refresh: `PullToRefreshBox(isRefreshing,
onRefresh)`. Swipe-to-dismiss: `SwipeToDismissBox` with `rememberSwipeToDismissBoxState()` and
`backgroundContent`; the action must be undoable (snackbar Undo) or confirmed, and needs a
non-gesture alternative. Compose's `clickable` modifier ripples by default; don't strip it.
Long-press is for contextual menus/multi-select only, never the sole access path, paired with
`HapticFeedbackType.LongPress`.

## Notifications

Channel importance: `IMPORTANCE_HIGH` (sound + heads-up: messages/calls), `IMPORTANCE_DEFAULT`
(sound: social/email), `IMPORTANCE_LOW` (no sound: recommendations), `IMPORTANCE_MIN` (silent, no
status-bar entry: ongoing/weather). One `NotificationChannel` per notification type; choose
importance conservatively (overuse of HIGH causes users to disable notifications entirely). Every
notification needs a tap `PendingIntent` and a `contentDescription` on its icon. Use
`MessagingStyle` for conversations (direct-reply, "Mark as read"); expandable styles
(`BigTextStyle`, `BigPictureStyle`, `InboxStyle`) for rich content. A foreground-service
notification must accurately describe the ongoing operation and provide a stop action.

## Permissions and privacy

Request a permission in context at the moment it is needed, never at launch, with a rationale
shown first; degrade gracefully on denial rather than blocking the UI; never request an unused
permission. API: `rememberPermissionState(Manifest.permission.X)` / `launchPermissionRequest()`.
Use the Android 13+ Photo Picker (`ActivityResultContracts.PickVisualMedia`) instead of requesting
`READ_MEDIA_IMAGES`; it needs no permission grant. Prefer `ACCESS_COARSE_LOCATION` unless precise
location is essential, one-time permissions for camera/mic in non-recording contexts, and a
privacy indicator while camera or mic is actively in use.

## System integration

Widgets: the Glance API (`GlanceAppWidget`, `provideGlance`, `GlanceTheme` for dynamic color);
ship a working default configuration, offer multiple sizes, match corner radius to
`system_app_widget_background_radius`. App shortcuts: 2-4 static entries in `shortcuts.xml` plus
dynamic shortcuts for recent content. Support Android App Links (verified deep links) for public
content URLs; implement the share sheet with `ShareCompat`/`Intent.createChooser` (rich previews:
title, description, thumbnail) and handle incoming share intents with content-type filtering.

## Composable API design (modifier, slots, focus, testing)

Three rules for a composable that emits layout:
1. Declare `modifier: Modifier = Modifier` (named exactly `modifier`), placed after required
   parameters and before content/lambda parameters, and apply it to the composable's root.
2. When the root already has its own intrinsic modifier chain, apply the caller's modifier first
   (outermost) so caller overrides win: `modifier.clip(...).size(...)`, not
   `Modifier.clip(...).then(modifier)`.
3. Never hardcode a layout-owning modifier (`.fillMaxWidth()`, `.padding(horizontal = 16.dp)`) on
   a general-purpose composable's root. Only modifiers that are part of the component's identity
   (for example `Avatar`'s `.clip(CircleShape)`) may stay, and only after the caller's modifier in
   the chain.

Build a modifier chain as one fluent `val` expression, never a stepwise reassigned `var`. Format
multiline (one call per line) once a chain reaches three or more chained calls; the threshold is
call count, not character count. Keep conditional segments inline via
`.then(if (condition) Modifier.x() else Modifier)`.

Slot API for a genuinely reusable component: use `@Composable () -> Unit` slots named
`xxxContent` (Material 3 convention: `headlineContent`, `trailingContent`) or a singular noun
where the slot is semantically constrained (`icon`, `actions`). Use a scope-receiver slot
(`@Composable RowScope.() -> Unit`) only when the slot is emitted inside that exact parent layout.
Make an optional slot `(@Composable () -> Unit)? = null`, not `= {}`, so the component can skip
the slot's space and padding entirely when it is absent. Put repeated default content in an
`XxxDefaults` object, matching the `ButtonDefaults`/`TopAppBarDefaults` pattern. Do not add slot
ceremony to a single-use composable; a plain primitive parameter is enough.

Focus: add a `FocusRequester`/`onFocusChanged` only when a composable actually needs to request or
observe focus, not on every focusable component. Call `requestFocus()` from `LaunchedEffect`,
never from the composable body, and key the effect to the loaded/visible condition when the
target appears asynchronously. Store focus and selection by stable item id, not lazy-list index
(index shifts on reorder). Use `focusProperties { up = ...; down = ... }` sparingly, only to
override a genuinely broken spatial-navigation edge.

Testing: choose the test shape by what changed. Text/button/branch/callback wiring: a plain
Compose UI test with fakes. Focus/keyboard: a Compose test plus key input, asserted with
`assertIsFocused()`, not `performClick()`. Visual layout/clipping/elevation/typography: a
screenshot test. Interaction state (hover, pressed, focused, dragged): inject a
`MutableInteractionSource` and emit, for example, `HoverInteraction.Enter()` from a
`TestScope().launch { }`, call `waitForIdle()`, and assert the resulting state; never simulate
real pointer/mouse events (fragile, flaky). Prefer testing the plain, state-driven UI composable
(a literal `UiState`) over constructing a full ViewModel/DI/navigation graph.

## Anti-patterns

Hardcoded hex color instead of a theme role. `dp` used for text instead of `sp`. A custom
hand-rolled bottom nav instead of `NavigationBar`/`NavigationRail`. An icon-only navigation bar
with no visible labels. A `Dialog` used for purely informational content that needs no decision.
A FAB used for a secondary action. Overriding the deprecated `onBackPressed()` instead of the
predictive-back APIs. Touch targets under 48dp. Requesting a permission at launch instead of in
context. A pure-black (`#000000`) dark theme instead of tonal elevation. Full-width content on an
expanded/tablet window instead of a capped max width or list-detail layout. Requesting
`READ_EXTERNAL_STORAGE` for photo access instead of the Android 13+ Photo Picker. Blocking the UI
on a permission denial instead of degrading gracefully. Hand-picking a color palette instead of
generating one from a seed.

<!-- sources: ehmo_platform-design-skills (skills/android/SKILL.md, MIT) via miner-ehmo-android;
chrisbanes/skills (compose-modifier-and-layout-style, compose-slot-api-pattern,
compose-focus-navigation, compose-ui-testing-patterns, Apache-2.0) via scout-github;
hamen_material-3-skill (layout-and-responsive.md, MIT) via miner-ext-c -->
