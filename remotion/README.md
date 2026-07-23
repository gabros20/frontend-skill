# remotion — hero animation

The hero animation for the **frontend** skill's site. 16:9, 31s, loops.

Storyboards the faceted router in motion: a request arrives, a design handoff feeds in, the three
facets (primary job · platform · web stack) light up and compose the smallest sufficient reference
set, native overrides web, the full state set is built in code, the dev-loop self-check runs, and
the code + tests hand off to quality/operate.

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
npx remotion still hero-light ../site/assets/hero-light-poster.png --frame=400
npx remotion still hero-dark  ../site/assets/hero-dark-poster.png  --frame=400
```

The page (`site/index.html`) swaps `hero-{light,dark}.mp4` on theme change and falls back to
the poster PNG (and to the CSS arc diagram) when video/motion is unavailable.

## AI authoring skills (prepacked)

The official Remotion authoring skills ([remotion-dev/skills](https://github.com/remotion-dev/skills))
are prepacked in this repository — tracked under `.agents/skills/` and symlinked from
`.claude/skills/` — so any agent storyboarding or re-authoring the hero finds them without
installing anything. Refresh them to the latest upstream versions with:

```bash
npx skills add remotion-dev/skills
```

The installer also drops symlinks into the runtime `skills/` directory; those are gitignored and
`scripts/init` removes them — the installable pack must never ship them. When a repository is
initialized without `--video`, `scripts/init` strips the authoring skills along with this project.
