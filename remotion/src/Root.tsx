import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { HeroAnimation } from "./HeroAnimation";

const schema = z.object({
  theme: z.enum(["light", "dark"]),
});

// 16:9 · 28s. One composition per theme so each renders to its own file with no --props juggling.
const COMMON = {
  component: HeroAnimation,
  schema,
  durationInFrames: 840,
  fps: 30,
  width: 1280,
  height: 720,
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="hero-light" {...COMMON} defaultProps={{ theme: "light" as const }} />
      <Composition id="hero-dark" {...COMMON} defaultProps={{ theme: "dark" as const }} />
    </>
  );
};
