// Palettes mirror site/index.html :root tokens exactly — the video must sit on the page
// as if drawn by the page's own CSS. Two variants render to two files; the page swaps them
// with the OS/user theme.
export const themes = {
  light: {
    bg: "#f6f7fa",
    panel: "#ffffff",
    ink: "#1c2333",
    muted: "#5a6478",
    line: "#d8dde8",
    accent: "__ACCENT_LIGHT__",
    accentInk: "#ffffff",
    amber: "#a97a10",
    amberBg: "#fdf6e3",
    good: "#1e7f4f",
    bad: "#b3403a",
    codeBg: "#eef1f7",
    glyph: "#8391ad",
    dim: "#8146c9", // the "structure/dimension" violet (--tok-dim)
    // wireframe-gray fill: a touch flatter than codeBg so the designed→undesigned jump reads
    wire: "#e7eaf1",
  },
  dark: {
    bg: "#12151d",
    panel: "#1a1f2b",
    ink: "#e6eaf3",
    muted: "#93a0b8",
    line: "#2b3245",
    accent: "__ACCENT_DARK__",
    accentInk: "#0d1220",
    amber: "#d9a72e",
    amberBg: "#26200f",
    good: "#4cc38a",
    bad: "#e5726c",
    codeBg: "#141824",
    glyph: "#5d6a85",
    dim: "#b98aef",
    wire: "#202634",
  },
} as const;

export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes)[ThemeName];

export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
export const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
