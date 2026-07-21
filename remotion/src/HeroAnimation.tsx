import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { themes, MONO, type ThemeName } from "./theme";

// TODO: replace with a composition that SHOWS what the skill does — see the sibling repos'
// hero animations for the bar (a wireframe becoming a finished, reviewed page, etc.). This is
// a minimal placeholder: the theme background + the skill name fading in.
export const HeroAnimation: React.FC<{ theme: ThemeName }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const t = themes[theme];

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg }}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 64,
            color: t.ink,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: t.accent }}>/</span>
          __SKILL_TITLE__
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
