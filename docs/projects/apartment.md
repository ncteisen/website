# Apartment model

Route: `/projects/apartment/`. Static, browser-only Three.js project, listed in the shared project catalog. Source is `src/features/apartment/`; the Astro route supplies the accessible controls, description and non-WebGL floor-plan fallback.

## Reconstruction basis

The owner supplied 85 original photos and eight follow-ups, plus these approximate measurements:

- Living room: 11.5 × 18 ft. The 18-ft dimension is assigned across the bay/TV wall based on the photos.
- Bay recess: 19 in.
- Hallway: 21 ft, assigned from the wood-trimmed entry/hall opening to the office doorway.
- Ceiling: 8.75 ft, applied throughout.

Hall width, other room sizes, partition thickness, door/window placement and furniture dimensions are estimates. The connection graph and major furnishings follow the reference photos. This is a handcrafted approximate reconstruction, not a scanned mesh or survey. A local RealityKit photogrammetry attempt on all 93 HEICs, and a second attempt on converted JPEGs, both ended with `processError` during image alignment; neither produced a usable mesh or camera poses. This does not establish that the photos are unusable by every reconstruction engine.

`layout.ts` owns room bounds and walkthrough entry points. Coordinates are feet with +z toward the rear bedrooms. Source construction coordinates are reflected in x for the corrected world layout, including collision bounds, floor containment, labels and room navigation. Facing the bay, the fireplace is on the left and the piano is on the right. The bathroom's fixtures were separately checked against the follow-up photos: sink left, tub right on entering.

`model.ts` creates architecture and furnishings; `materials.ts` combines photo textures with procedural materials. Four reduced reference photos and 14 texture patches are shipped under `public/images/apartment/`. The textures include the real fireplace, abstract artwork, bookcases, wood, rugs, upholstery, curtains and window views. `scripts/apartment/extract-textures.py` accepts local photo directories, rectifies hand-selected surface quadrilaterals, compensates for shadows in two source patches and exports optimized WebP without EXIF. Run it in a Python virtual environment with Pillow, pillow-heif and numpy. Original HEICs and Live Photo videos remain local and unchanged.

The client exports GLB with a 0.3048 conversion to meters. Export includes embedded textures, the corrected orientation, full walls and furniture, but leaves the roof off. Texture UVs on photo patches compensate for the geometry reflection so artwork is not reversed.

## Controls and validation

Dollhouse: orbit, zoom and room focus. Far walls retain their full height; near walls automatically cut away as the camera moves. Settings controls the height of those front walls, furniture visibility, labels and GLB export. Plan: overhead pan/zoom. Walkthrough: full walls and ceilings, drag to look, WASD movement, arrow keys to move/turn, touch direction buttons and room teleport shortcuts. Collision checks use architectural barriers and visible furniture; moving diagonally slides along walls. Daylight and lamp presets, reference photos and model information are available from the full-screen interface, inspired by the owner's requested [Apartment Study](https://page-st-apt.vercel.app/) reference.

Run `node scripts/apartment/check.mjs`, `npm run check:types`, `npm run test:projects`, and `npm run build`. The apartment check builds the real geometry, validates measured scale and finite vertices, checks safe room spawns, and flood-fills the actual collision map to establish that every room connects. Browser QA additionally covers WebGL rendering, view switching, keyboard/touch controls, GLB export and narrow-screen layout.
