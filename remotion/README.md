# remotion — hero animation

The hero animation for the **__SKILL_NAME__** skill's site. 16:9, 28s, loops.

The palette in [`src/theme.ts`](src/theme.ts) mirrors `site/index.html`'s `:root` tokens
exactly, so the video reads as part of the page in both light and dark.

## Commands

```bash
npm i                     # install (node_modules is gitignored)
npm run dev               # Remotion Studio preview
```

Render the two theme variants + poster stills into the site (paths are relative to this dir):

```bash
npx remotion render hero-light ../site/assets/hero-light.mp4 --codec=h264 --crf=23
npx remotion render hero-dark  ../site/assets/hero-dark.mp4  --codec=h264 --crf=23
npx remotion still hero-light ../site/assets/hero-light-poster.png --frame=815
npx remotion still hero-dark  ../site/assets/hero-dark-poster.png  --frame=815
```

The page (`site/index.html`) swaps `hero-{light,dark}.mp4` on theme change and falls back to
the poster PNG (and to the CSS arc diagram) when video/motion is unavailable.

## Re-rendering with AI assistance

Temporarily install the Remotion AI skills while authoring, and remove them when done — they'd
pollute the installable skill layout if left in:

```bash
npx skills add remotion-dev/skills
```

They land in `.agents/` + `.claude/skills/remotion-*` (both gitignored already — see the repo
`.gitignore`).
