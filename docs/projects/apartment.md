# Apartment model

Route: `/projects/apartment/`. Static, browser-only Three.js project, listed in the shared project catalog. Source is `src/features/apartment/`; the Astro route supplies the accessible controls, description and non-WebGL floor-plan fallback.

## Reconstruction basis

The owner supplied 85 original photos and eight follow-ups, plus these approximate measurements:

- Living room: 11.5 × 18 ft. The 18-ft dimension is assigned across the bay/TV wall based on the photos.
- Bay recess: 19 in.
- Hallway: 21 ft, assigned from the wood-trimmed entry/hall opening to the office doorway.
- Ceiling: 8.75 ft, applied throughout.

Hall width, other room sizes, partition thickness, door/window placement and furniture dimensions are estimates. The connection graph and major furnishings follow the reference photos. This is a handcrafted approximate reconstruction, not a scanned mesh or survey. No original photos, personal photo metadata, address, or identifiable artwork are shipped with the site.

`layout.ts` owns room bounds and walkthrough entry points. Coordinates are feet with +z toward the rear bedrooms. `model.ts` creates architecture and simplified furnishings; `materials.ts` makes procedural wood, rug and tile textures. The client exports GLB with a 0.3048 conversion to meters. Export includes full walls and furniture, but leaves the roof off.

## Controls and validation

Dollhouse: orbit, zoom, room focus and wall-height slider. Plan: overhead pan/zoom. Walkthrough: drag to look, WASD movement, arrow keys to move/turn, touch direction buttons and room teleport shortcuts. Collision checks use architectural barriers and visible furniture; moving diagonally slides along walls.

Run `node scripts/apartment/check.mjs`, `npm run check:types`, `npm run test:projects`, and `npm run build`. The apartment check builds the real geometry, validates measured scale and finite vertices, checks safe room spawns, and flood-fills the actual collision map to establish that every room connects. Browser QA additionally covers WebGL rendering, view switching, keyboard/touch controls, GLB export and narrow-screen layout.
