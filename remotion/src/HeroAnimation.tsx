import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { themes, MONO, SANS, type ThemeName, type Theme } from "./theme";

// Hero: "the faceted router in motion." The thing an expert whiteboards to explain frontend — a
// request arrives, a design handoff feeds in from the family upstream, the three facets (primary
// job · platform · web stack) light up and compose the SMALLEST sufficient reference set, native
// overrides web, the full state set is built in code, the dev-loop self-check runs, and the code +
// tests hand off to quality/operate. 31s, loops (opens/closes on an empty stage).
//
// Scene map (30fps):
//   S1 ask       0–120    two /frontend asks type in — the whole client register
//   S2 handoff   120–250  design's DESIGN.md + handoff.yaml feed IN (family upstream; intent, not re-decided)
//   S3 route     250–430  THE centerpiece: 3 facet lanes light up → smallest sufficient read-set (poster beat)
//   S4 native    430–540  platform axis: native (SwiftUI/Compose/Expo) OVERRIDES the web substrate
//   S5 build     540–700  production code: the full state set in code, not a happy-path mock
//   S6 verify    700–810  dev-loop self-check: serve · screenshot 2 viewports · reduced-motion · interact
//   S7 ship      810–930  code + tests hand off → quality (audit) / operate (deploy); the family arc closes

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

function envelope(frame: number, dur: number, hold = 26) {
  const opIn = interpolate(frame, [0, hold], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const opOut = interpolate(frame, [dur - hold, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const y = interpolate(frame, [0, hold], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  return { opacity: Math.min(opIn, opOut), y };
}

const step = (frame: number, a: number, b: number, ease = false) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease ? EASE : undefined });

const SceneTitle: React.FC<{ t: Theme; kicker: string; title: string; accent?: string }> = ({ t, kicker, title, accent }) => (
  <div style={{ textAlign: "center", marginBottom: 30 }}>
    <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, fontSize: 17, color: accent ?? t.accent, marginBottom: 12 }}>
      {kicker}
    </div>
    <div style={{ fontFamily: MONO, fontSize: 40, color: t.ink, letterSpacing: "-0.02em" }}>{title}</div>
  </div>
);

// ── S1 · two asks — the whole client register ────────────────────────────────
const AskLine: React.FC<{ t: Theme; text: string; frame: number; from: number }> = ({ t, text, frame, from }) => {
  const chars = Math.floor(interpolate(frame, [from, from + 34], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typed = text.slice(0, chars);
  const caretOn = Math.floor(frame / 8) % 2 === 0 && chars < text.length && frame > from;
  const op = step(frame, from - 4, from + 6);
  return (
    <div style={{ opacity: op }}>
      <span style={{ color: t.accent, fontWeight: 700 }}>/frontend</span> <span>{typed}</span>
      <span style={{ opacity: caretOn ? 1 : 0, color: t.accent }}>▋</span>
    </div>
  );
};

const SceneAsk: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur, 22);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, width: 980 }}>
        <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, fontSize: 16, color: t.muted, marginBottom: 20, textAlign: "center" }}>
          one skill, the whole client register
        </div>
        <div style={{ background: t.codeBg, border: `1px solid ${t.line}`, borderRadius: 12, padding: "26px 32px", fontFamily: MONO, fontSize: 22, lineHeight: 2, color: t.ink }}>
          <AskLine t={t} text="art-directed marketing site from this design handoff" frame={frame} from={8} />
          <AskLine t={t} text="accessible Next.js signup form — every state + tests" frame={frame} from={50} />
        </div>
        <div style={{ marginTop: 18, textAlign: "center", fontFamily: SANS, fontSize: 15.5, color: t.muted, opacity: step(frame, 84, 104) }}>
          websites · web apps · dense product UI · native iOS · Android
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── S2 · the design handoff feeds in (family upstream) ───────────────────────
const ArtifactCard: React.FC<{ t: Theme; name: string; lines: [string, string][]; appear: number; slide: number }> = ({ t, name, lines, appear, slide }) => (
  <div style={{ opacity: appear, translate: `${slide}px 0`, width: 340, background: t.codeBg, border: `1px solid ${t.line}`, borderRadius: 11, padding: "16px 20px", fontFamily: MONO }}>
    <div style={{ fontSize: 15, color: t.accent, marginBottom: 12, fontWeight: 600 }}>{name}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 15, lineHeight: 1.5 }}>
      {lines.map(([k, v]) => (
        <div key={k}><span style={{ color: t.muted }}>{k}</span><span style={{ color: t.ink }}>{v}</span></div>
      ))}
    </div>
  </div>
);

const SceneHandoffIn: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const a1 = step(frame, 20, 46, true);
  const a2 = step(frame, 34, 60, true);
  const slide1 = interpolate(a1, [0, 1], [-40, 0]);
  const slide2 = interpolate(a2, [0, 1], [-40, 0]);
  const arrow = step(frame, 56, 78, true);
  const target = step(frame, 68, 92, true);
  const cap = step(frame, 88, 108);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SceneTitle t={t} kicker="family · design → frontend" title="consume the handoff" accent={t.dim} />
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ArtifactCard t={t} name="DESIGN.md" appear={a1} slide={slide1} lines={[["intent  ", "per-screen"], ["states  ", "loading·empty·error"], ["a11y    ", "floors"]]} />
            <ArtifactCard t={t} name="handoff.yaml" appear={a2} slide={slide2} lines={[["tokens  ", "primitive→semantic"], ["dark    ", "two-mode"], ["skill   ", "design → frontend"]]} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: arrow }}>
            <div style={{ fontFamily: MONO, fontSize: 40, color: t.accent }}>→</div>
            <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontSize: 12, color: t.muted, textAlign: "center", lineHeight: 1.4 }}>source of<br />truth</div>
          </div>
          <div style={{ opacity: target, scale: String(interpolate(target, [0, 1], [0.9, 1])), background: t.panel, border: `1px solid ${t.accent}`, borderRadius: 12, padding: "26px 34px", boxShadow: `0 30px 70px -44px ${t.accent}` }}>
            <div style={{ fontFamily: MONO, fontSize: 30, color: t.ink }}>
              <span style={{ color: t.accent, fontWeight: 700 }}>/</span>frontend
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13.5, color: t.muted, marginTop: 6 }}>implements intent · never re-decides it</div>
          </div>
        </div>
        <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 17, color: t.muted, opacity: cap, textAlign: "center" }}>
          faithful to tokens, states &amp; intent · <span style={{ color: t.accent }}>reports conflicts, never silently overrides</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── S3 · the faceted router (centerpiece) ────────────────────────────────────
const Lane: React.FC<{ t: Theme; label: string; chips: string[]; onIndex: number; appear: number; lit: number }> = ({ t, label, chips, onIndex, appear, lit }) => (
  <div style={{ opacity: appear, display: "grid", gridTemplateColumns: "150px 1fr", gap: 16, alignItems: "center" }}>
    <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontSize: 13, color: t.muted, textAlign: "right" }}>{label}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {chips.map((c, i) => {
        const on = i === onIndex;
        return (
          <div key={c} style={{ fontFamily: MONO, fontSize: 16, padding: "6px 13px", borderRadius: 8, whiteSpace: "nowrap", color: on ? t.accentInk : t.muted, background: on ? `color-mix(in srgb, ${t.accent} ${30 + lit * 70}%, ${t.panel})` : t.bg, border: `1px solid ${on ? t.accent : t.line}`, scale: String(on ? interpolate(lit, [0, 1], [1, 1.06]) : 1) }}>
            {c}
          </div>
        );
      })}
    </div>
  </div>
);

const SceneRoute: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const lane1 = step(frame, 14, 40, true);
  const lane2 = step(frame, 24, 50, true);
  const lane3 = step(frame, 34, 60, true);
  const lit1 = step(frame, 40, 60, true);
  const lit2 = step(frame, 54, 74, true);
  const lit3 = step(frame, 68, 88, true);
  const arrow = step(frame, 86, 104, true);
  const readSet = ["forms.md", "accessibility.md", "web-platform-runtime.md", "nextjs.md", "react-components-and-state.md", "testing.md"];
  const counter = step(frame, 128, 148);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center", width: 1000 }}>
        <SceneTitle t={t} kicker="route · smallest sufficient set" title="the faceted router" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 820 }}>
          <Lane t={t} label="① primary job" chips={["state", "forms", "accessibility", "performance", "security", "…"]} onIndex={1} appear={lane1} lit={lit1} />
          <Lane t={t} label="② platform" chips={["web", "iOS", "Android", "Expo/RN"]} onIndex={0} appear={lane2} lit={lit2} />
          <Lane t={t} label="③ web stack" chips={["React", "Next.js", "Tailwind", "shadcn"]} onIndex={1} appear={lane3} lit={lit3} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: t.accent, margin: "14px 0 12px", opacity: arrow }}>↓</div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 9, maxWidth: 900 }}>
          {readSet.map((r, i) => {
            const ap = step(frame, 100 + i * 5, 116 + i * 5, true);
            return (
              <div key={r} style={{ opacity: ap, translate: `0 ${interpolate(ap, [0, 1], [8, 0])}px`, fontFamily: MONO, fontSize: 15, padding: "7px 13px", borderRadius: 8, color: t.accent, background: t.codeBg, border: `1px solid ${t.accent}` }}>
                {r}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 17, color: t.muted, opacity: counter }}>
          <span style={{ color: t.ink, fontWeight: 600 }}>6 of 27</span> loaded · read fully — <span style={{ color: t.accent }}>never all 27</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── S4 · native overrides web ────────────────────────────────────────────────
const SceneNative: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const webIn = step(frame, 16, 40, true);
  const override = step(frame, 46, 74, true); // native slides over, web dims
  const nativeIn = step(frame, 50, 78, true);
  const cap = step(frame, 84, 106);
  const webDim = interpolate(override, [0, 1], [1, 0.32]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SceneTitle t={t} kicker="platform axis · at most one" title="native overrides web" />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 30 }}>
          {/* web default substrate — dims when native takes over */}
          <div style={{ opacity: webIn * webDim, width: 360, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontSize: 13, color: t.muted, marginBottom: 12 }}>web · default substrate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["web-platform-css.md", "web-platform-runtime.md"].map((c) => (
                <div key={c} style={{ fontFamily: MONO, fontSize: 16, color: t.muted, padding: "7px 12px", borderRadius: 8, background: t.bg, border: `1px solid ${t.line}`, textDecoration: override > 0.5 ? "line-through" : "none" }}>{c}</div>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: t.accent, opacity: override }}>⤿</div>
          {/* native override */}
          <div style={{ opacity: nativeIn, scale: String(interpolate(nativeIn, [0, 1], [0.92, 1])), width: 360, background: t.panel, border: `2px solid ${t.accent}`, borderRadius: 12, padding: "20px 24px", boxShadow: `0 30px 70px -44px ${t.accent}` }}>
            <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontSize: 13, color: t.accent, marginBottom: 12 }}>native · overrides web</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["swiftui.md", "compose.md", "react-native.md"].map((c) => (
                <div key={c} style={{ fontFamily: MONO, fontSize: 15, color: t.accentInk, background: t.accent, padding: "7px 12px", borderRadius: 8 }}>{c}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 16.5, color: t.muted, opacity: cap, textAlign: "center", maxWidth: 760, lineHeight: 1.5 }}>
          a SwiftUI screen never loads web-platform CSS · uncovered stack (Vue, Svelte, Astro) →<br />core job + substrate, <span style={{ color: t.accent }}>project conventions win</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── S5 · the full state set, in code ─────────────────────────────────────────
const Btn: React.FC<{ t: Theme; bg: string; fg: string; label: string; ring?: boolean; press?: boolean; border?: string; dashed?: boolean }> = ({ t, bg, fg, label, ring, press, border, dashed }) => (
  <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: fg, background: bg, padding: "9px 15px", borderRadius: 8, border: dashed ? `1.5px dashed ${t.line}` : `1.5px solid ${border ?? "transparent"}`, outline: ring ? `2.5px solid ${t.accent}` : "none", outlineOffset: 2, translate: press ? "0 1.5px" : "0 0", whiteSpace: "nowrap" }}>
    {label}
  </div>
);

const STATES: { k: string; render: (t: Theme) => React.ReactNode }[] = [
  { k: "default", render: (t) => <Btn t={t} bg={t.accent} fg={t.accentInk} label="default" /> },
  { k: "hover", render: (t) => <Btn t={t} bg={`color-mix(in srgb,${t.accent} 82%,#000)`} fg={t.accentInk} label="hover" /> },
  { k: "focus", render: (t) => <Btn t={t} bg={t.accent} fg={t.accentInk} label="focus" ring /> },
  { k: "active", render: (t) => <Btn t={t} bg={`color-mix(in srgb,${t.accent} 70%,#000)`} fg={t.accentInk} label="active" press /> },
  { k: "disabled", render: (t) => <Btn t={t} bg={t.line} fg={t.muted} label="disabled" /> },
  { k: "loading", render: (t) => <Btn t={t} bg={t.accent} fg={t.accentInk} label="loading…" /> },
  { k: "empty", render: (t) => <Btn t={t} bg="transparent" fg={t.muted} label="empty" dashed /> },
  { k: "error", render: (t) => <Btn t={t} bg="transparent" fg={t.bad} label="error" border={t.bad} /> },
  { k: "success", render: (t) => <Btn t={t} bg="transparent" fg={t.good} label="success" border={t.good} /> },
];

const SceneBuild: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const label1 = step(frame, 16, 38);
  const label2 = step(frame, 92, 112);
  const cap = step(frame, 118, 140);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SceneTitle t={t} kicker="build · ship every state" title="the full state set, in code" />
        <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontSize: 13, color: t.muted, marginBottom: 12, opacity: label1 }}>
          interactive states
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 760 }}>
          {STATES.slice(0, 6).map((s, i) => {
            const a = step(frame, 24 + i * 6, 42 + i * 6, true);
            return <div key={s.k} style={{ opacity: a, scale: String(interpolate(a, [0, 1], [0.8, 1])) }}>{s.render(t)}</div>;
          })}
        </div>
        <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontSize: 13, color: t.muted, margin: "22px 0 12px", opacity: label2 }}>
          data-region states
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 760 }}>
          {STATES.slice(6).map((s, i) => {
            const a = step(frame, 98 + i * 6, 116 + i * 6, true);
            return <div key={s.k} style={{ opacity: a, scale: String(interpolate(a, [0, 1], [0.8, 1])) }}>{s.render(t)}</div>;
          })}
        </div>
        <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 17, color: t.muted, opacity: cap }}>
          not a happy-path mock — <span style={{ color: t.accent }}>every state rendered</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── S6 · dev-loop self-check ─────────────────────────────────────────────────
const Device: React.FC<{ t: Theme; w: number; h: number; appear: number; label: string }> = ({ t, w, h, appear, label }) => (
  <div style={{ opacity: appear, scale: String(interpolate(appear, [0, 1], [0.9, 1])), display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div style={{ width: w, height: h, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 12, background: t.bg, borderBottom: `1px solid ${t.line}`, display: "flex", alignItems: "center", gap: 3, paddingLeft: 6 }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.line }} />
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: t.line }} />
      </div>
      <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ height: 8, width: "60%", background: `color-mix(in srgb, ${t.accent} 55%, ${t.panel})`, borderRadius: 3 }} />
        <div style={{ height: 5, width: "90%", background: t.codeBg, borderRadius: 3 }} />
        <div style={{ height: 5, width: "78%", background: t.codeBg, borderRadius: 3 }} />
        <div style={{ marginTop: "auto", height: 12, width: "42%", background: t.accent, borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ fontFamily: MONO, fontSize: 12.5, color: t.muted }}>{label}</div>
  </div>
);

const SceneVerify: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const desktop = step(frame, 18, 44, true);
  const mobile = step(frame, 30, 56, true);
  const checks = ["serve", "screenshot ×2", "reduced-motion", "interact"];
  const cap = step(frame, 78, 100);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SceneTitle t={t} kicker="verify · the dev-loop self-check" title="a green build ≠ a correct screen" />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 34, marginBottom: 26 }}>
          <Device t={t} w={280} h={172} appear={desktop} label="desktop · 1280" />
          <Device t={t} w={96} h={172} appear={mobile} label="mobile · 390" />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {checks.map((c, i) => {
            const a = step(frame, 48 + i * 8, 64 + i * 8, true);
            return (
              <div key={c} style={{ opacity: a, display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 15, color: t.ink, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 8, padding: "7px 13px" }}>
                <span style={{ color: t.good, fontWeight: 700 }}>✓</span> {c}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 17, color: t.muted, opacity: cap }}>
          state what ran — <span style={{ color: t.accent }}>never present untested code as verified</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── S7 · hand off onward (family arc closes) ─────────────────────────────────
const NextSkill: React.FC<{ t: Theme; name: string; note: string; appear: number }> = ({ t, name, note, appear }) => (
  <div style={{ opacity: appear, translate: `0 ${interpolate(appear, [0, 1], [12, 0])}px`, width: 250, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 11, padding: "16px 18px" }}>
    <div style={{ fontFamily: MONO, fontSize: 18, color: t.ink }}><span style={{ color: t.accent, fontWeight: 700 }}>/</span>{name}</div>
    <div style={{ fontFamily: SANS, fontSize: 13, color: t.muted, marginTop: 5, lineHeight: 1.45 }}>{note}</div>
  </div>
);

const SceneShip: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur, 20);
  const yamlLines: [string, string][] = [["skill:", " frontend"], ["status:", " complete"], ["artifacts:", " components, tests"], ["states:", " full set · a11y floors"], ["validation:", " dev-loop ✓"]];
  const arrow = step(frame, 52, 74, true);
  const q = step(frame, 62, 86, true);
  const o = step(frame, 74, 98, true);
  const cap = step(frame, 92, 112);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SceneTitle t={t} kicker="family · frontend → quality / operate" title="hand off, don't auto-invoke" />
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ width: 430 }}>
            <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, fontSize: 14, color: t.accent, marginBottom: 12 }}>handoff.yaml</div>
            <div style={{ background: t.codeBg, border: `1px solid ${t.line}`, borderRadius: 12, padding: "18px 22px", fontFamily: MONO, fontSize: 18, lineHeight: 1.8 }}>
              {yamlLines.map(([k, v], i) => {
                const op = step(frame, 12 + i * 7, 28 + i * 7);
                return (
                  <div key={k} style={{ opacity: op }}>
                    <span style={{ color: t.accent }}>{k}</span><span style={{ color: t.ink }}>{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 40, color: t.accent, opacity: arrow }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <NextSkill t={t} name="quality" note="independent audits · WCAG · release gates" appear={q} />
            <NextSkill t={t} name="operate" note="deploy · CI/CD · monitoring · store delivery" appear={o} />
          </div>
        </div>
        <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 16.5, color: t.muted, opacity: cap }}>
          design → <span style={{ color: t.accent }}>frontend</span> → quality / operate · the Build stage of the family
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── persistent chrome + master timeline ──────────────────────────────────────
const BOUNDS = [120, 250, 430, 540, 700, 810, 930];
const LABELS = ["ask", "handoff", "route", "native", "build", "verify", "ship"];

const PhaseBar: React.FC<{ t: Theme; frame: number }> = ({ t, frame }) => {
  const active = Math.max(0, BOUNDS.findIndex((b) => frame < b));
  return (
    <div style={{ position: "absolute", bottom: 34, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
      {LABELS.map((l, i) => (
        <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === active ? t.accent : t.line, scale: String(i === active ? 1.3 : 1) }} />
          <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.09em", fontSize: 12, fontWeight: 600, color: i === active ? t.ink : t.muted, opacity: i === active ? 1 : 0.55 }}>{l}</div>
        </div>
      ))}
    </div>
  );
};

export const HeroAnimation: React.FC<{ theme: ThemeName }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = themes[theme];

  const intro = step(frame, 0, 14);
  const outro = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const master = Math.min(intro, outro);
  const glow = interpolate(Math.sin(frame / 90), [-1, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, fontFamily: SANS }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 82% 16%, color-mix(in srgb, ${t.accent} 13%, transparent), transparent 44%), radial-gradient(circle at 8% 92%, color-mix(in srgb, ${t.accent} 9%, transparent), transparent 48%)`, opacity: glow }} />
      <AbsoluteFill style={{ opacity: master }}>
        <Sequence from={0} durationInFrames={120}><SceneAsk t={t} dur={120} /></Sequence>
        <Sequence from={120} durationInFrames={130}><SceneHandoffIn t={t} dur={130} /></Sequence>
        <Sequence from={250} durationInFrames={180}><SceneRoute t={t} dur={180} /></Sequence>
        <Sequence from={430} durationInFrames={110}><SceneNative t={t} dur={110} /></Sequence>
        <Sequence from={540} durationInFrames={160}><SceneBuild t={t} dur={160} /></Sequence>
        <Sequence from={700} durationInFrames={110}><SceneVerify t={t} dur={110} /></Sequence>
        <Sequence from={810} durationInFrames={120}><SceneShip t={t} dur={120} /></Sequence>
        <PhaseBar t={t} frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
