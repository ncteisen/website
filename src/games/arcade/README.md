# Sarah Arcade

Menu: `/projects/sarah-arcade/`. Games have stable individual URLs: `/projects/sarah-jumps/` and `/projects/flappy-sarah/`.

`catalog.ts` is the list of games, routes, controls, descriptions, and storage keys. The menu, game page layout, and sharing use it. Sarah Jumps retains its original URL, physics, sprites, and `sarahJumpsHighScore` key. Flappy Sarah stores its score separately in `flappySarahHighScore`. Bests are local to the browser; the menu refreshes them on page-cache restores and cross-tab storage changes.

`src/layouts/ArcadeGame.astro` and `game.css` provide the site-styled page, canvas, score display, pause/results panel, touch controls, and sound control. Each game owns its input and simulation. Both use `FixedStepLoop`, safe score storage, `GameAudio`, and `shareScore`. The shared audio reuses the existing files under `public/games/sarah-jumps/sounds/`.

To add a game:

1. Add its metadata and a unique best-score key to `catalog.ts`.
2. Add a route using `ArcadeGame` and a game instance with an explicit cleanup boundary. Extend the layout's input controls if the new game needs a different control scheme.
3. Implement its simulation independently of the DOM. Keep rendering at display refresh, physics in seconds, and a bounded live object count.
4. Add a static preview in `src/components/arcade/GamePreview.astro` and simulation/input checks in `scripts/arcade/`.

Flappy Sarah uses a fixed 400 × 600 world, one impulse per tap/Space/Up press, and circle-to-pipe collisions. Its classic-style tuning uses a roughly 41-pixel hop with a 0.22-second ascent, a constant 165 px/s scroll, 136-pixel gaps, and 230-pixel pipe spacing. Speed and gap size stay fixed as the score rises; pipe centers move by at most 75 world pixels between gaps. Pausing or backgrounding stops the animation loop; resizing changes only the canvas backing size. The game ignores key repeat and secondary touches. Retry is explicit, and score sharing is optional.

Flappy Sarah has two photo-inspired pixel-art atlases in `../flappy-sarah/assets/`: Denim (the default) and Hiking (the preserved red-jacket set). A panel button switches outfits and remembers the choice without affecting physics or scores. Each tap triggers a four-pose arm flap; each selected image is cached into a small canvas once at load. Sarah Jumps retains its original sprites. The asset README records both generation prompts.

## Validation

```sh
npm run test:arcade
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

The checks include both games' refresh-rate independence at 30/60/90/120/144 Hz, 100 seeded 90-second courses per game, collisions, scoring, bounded object counts, input cancellation/repeat, cleanup, and storage behavior.

With the dev server, `/projects/flappy-sarah/?playtest` exposes a local-only 30-second keyboard-driven endurance test and frame statistics. Sarah Jumps retains its equivalent `?playtest` harness. Neither is shipped in production. Manually verify mobile and desktop menu navigation, tapping, keyboard input, pause/resume, retry, and independent scores. Desktop viewport emulation does not establish physical iPhone performance.
