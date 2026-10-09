# Sarah Jumps

A small canvas jumping game with Sarah's original photo sprites. Drag on the playfield, hold the left/right buttons, or use arrows / A / D. Sarah jumps automatically. P or Escape pauses; Space starts or resumes. A hidden tab or window blur pauses the run until the player resumes it.

## Structure

- `js/SarahJumps.ts`: mount/start/cleanup boundary, with exactly one engine and input handler.
- `js/core/GameEngine.ts`: game states, accessible HTML controls, score persistence, audio, lifecycle.
- `js/core/World.ts`: browser-independent simulation and swept landing detection.
- `js/core/Renderer.ts`: canvas drawing, original sprites, and a bounded particle pool.
- `js/entities/`: seconds-based player physics and a bounded, progressively harder course.
- `js/utils/`: pointer/keyboard steering input.
- `../arcade/`: the shared clock, score storage, audio, sharing, and catalog used by Sarah Jumps and Flappy Sarah. See its README for arcade structure and validation.
- `src/pages/projects/sarah-jumps.astro`: game mount using the responsive `src/layouts/ArcadeGame.astro` shell and real DOM buttons/score labels.

## Performance and behavior

The simulation runs at a fixed 120 Hz, with interpolated rendering on every display refresh. There is no mobile frame cap. Catch-up is bounded to 100 ms after a stall, and pause resets the clock. Ready, paused, and game-over screens do not run an animation loop.

World dimensions stay at 400 × 600 regardless of screen size or rotation. Only the backing canvas changes, at up to 2× device pixel ratio. Resizing does not restart a run or change its physics. Background shapes use simple fills; platforms are culled and particles use a fixed pool. Score DOM updates happen only when the score changes.

Input uses one Pointer Events handler with pointer capture, scroll-aware coordinates, and cancellation/blur cleanup. Keyboard input is ignored while typing in form controls. All listeners, observers, animation frames, and audio are disposed at the mount boundary. Native page-cache restores retain a paused game.

Platforms introduce horizontal movement, crumbling, and then vertical movement. Special platforms alternate with stable ones. Vertical spacing and lateral reach are bounded against the jump trajectory. Landings sweep the feet between previous/current simulation positions, including moving platforms. A crumbling platform is immediately non-collidable.

Best scores retain the existing `sarahJumpsHighScore` key and score scale. Storage failures do not prevent play. Sharing is an optional game-over button; retry never opens a modal. Audio is decoded once after user interaction and is optional if loading fails.

## Validate

```sh
npm run test:sarah-jumps
npm run build
npm run preview -- --host 127.0.0.1
```

The checks cover refresh-rate independence (30/60/90/120/144 Hz), bounded stall recovery, stop/resume, swept collisions, bounded moving platforms, scaled touch coordinates, pointer cancellation, listener cleanup, unavailable/corrupt storage, and 100 seeded 90-second courses (150 simulated minutes).

For browser measurements, run `npm run dev` and open `/projects/sarah-jumps/?playtest`. The explicitly enabled local harness drives the real keyboard handler for 30 seconds and reports rendered FPS, frame intervals, long tasks, landings, and live platform count. It is excluded from production builds. It is an automated endurance check, not a substitute for playing with touch.

Manually check 320 × 568, 390 × 844, landscape, and desktop: start, drag/hold steering, releasing outside the canvas, lose/retry, pause/resume, switching tabs, sound, saved bests, and resize during a run. Physical iPhone Safari remains the final device-performance check; desktop phone-size emulation cannot establish actual device frame rate.
