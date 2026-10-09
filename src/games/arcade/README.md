# Sarah Arcade

Menu: `/projects/sarah-arcade/`. Games have stable individual URLs: `/projects/sarah-jumps/` and `/projects/flappy-sarah/`.

`catalog.ts` is the list of games, routes, controls, descriptions, and storage keys. The menu, game page layout, and sharing use it. Sarah Jumps retains its original URL, physics, sprites, and `sarahJumpsHighScore` key. Flappy Sarah stores its score separately in `flappySarahHighScore`. Bests are local to the browser; the menu refreshes them on page-cache restores and cross-tab storage changes.

`src/layouts/ArcadeGame.astro` and `game.css` provide the site-styled page, canvas, score display, pause/results panel, controls, and sound control. On portrait phones, a 48px header and 44px footer leave the rest of the dynamic viewport for an edge-to-edge playfield (plus safe-area insets). Touch controls act directly on the canvas; the separate button row is hidden. Sarah Jumps can start and steer from the same finger contact. Each game owns its input and simulation. Both use `FixedStepLoop`, safe score storage, `GameAudio`, and `shareScore`. The shared audio reuses the existing files under `public/games/sarah-jumps/sounds/`.

To add a game:

1. Add its metadata and a unique best-score key to `catalog.ts`.
2. Add a route using `ArcadeGame` and a game instance with an explicit cleanup boundary. Extend the layout's input controls if the new game needs a different control scheme.
3. Implement its simulation independently of the DOM. Keep rendering at display refresh, physics in seconds, and a bounded live object count.
4. Add a static preview in `src/components/arcade/GamePreview.astro` and simulation/input checks in `scripts/arcade/`.

Both games keep a 400-unit world width and uniform drawing scale. A taller phone reveals extra course above Sarah Jumps' original camera without changing its physics or score scale. Flappy Sarah adapts its sky/floor height, moving Sarah and pipe gaps together when the viewport changes so a resize preserves the flight. Its classic-style tuning uses a roughly 41-pixel hop with a 0.22-second ascent, a constant 165 px/s scroll, 136-pixel gaps, and 230-pixel pipe spacing. Speed and gap size stay fixed as the score rises; pipe centers move by at most 75 world pixels between gaps. Pausing or backgrounding stops the animation loop. The game ignores key repeat and secondary touches. Retry is explicit, and score sharing is optional.

Flappy Sarah uses the photo-inspired `sarah-flap-pixel.png` atlas in `../flappy-sarah/assets/`, with four 40-pixel poses cached once at load. Each tap triggers an arm flap. Sarah Jumps retains its original sprites, now also rendered without smoothing. Previous sprite sets remain in the source assets, but there is no outfit UI or persisted choice. The asset README records the generation prompts.

## Validation

```sh
npm run test:arcade
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

The checks include both games' refresh-rate independence at 30/60/90/120/144 Hz, 100 seeded 90-second courses per game across three viewport heights with mid-run resizes, collisions, scoring, bounded object counts, touch-to-start/drag, input cancellation/repeat, cleanup, and storage behavior.

With the dev server, `/projects/flappy-sarah/?playtest` exposes a local-only 30-second keyboard-driven endurance test and frame statistics. Sarah Jumps retains its equivalent `?playtest` harness. Neither is shipped in production. Manually verify mobile and desktop menu navigation, tapping, keyboard input, pause/resume, retry, and independent scores. Desktop viewport emulation does not establish physical iPhone performance.
