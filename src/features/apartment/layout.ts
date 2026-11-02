// Model coordinates are feet. +z runs from the front bay toward the bedrooms.
// Only the four measurements below were supplied by the owner; other geometry is inferred.
export const measured = { livingWidth: 18, livingDepth: 11.5, hallLength: 21, bayDepth: 19 / 12, ceiling: 8.75 };
export type Room = { id: string; name: string; bounds: [number, number, number, number]; entry: [number, number]; look: [number, number]; note: string };
export const rooms: Room[] = [
	{ id: 'living', name: 'Living room', bounds: [0, 0, 18, 11.5], entry: [5, 8], look: [10, 2], note: '11.5 × 18 ft · 19 in bay recess' },
	{ id: 'dining', name: 'Dining room', bounds: [4.2, 11.5, 18, 23.3], entry: [7, 17.5], look: [14, 17], note: 'Dining table, built-in buffet & workspace' },
	{ id: 'entry', name: 'Entry', bounds: [0, 11.5, 4.2, 19], entry: [2, 14], look: [2, 21], note: 'Wood trim, bicycles & the long hall' },
	{ id: 'hall', name: 'Hallway', bounds: [0, 19, 3.4, 40], entry: [1.7, 20], look: [1.7, 39], note: '21 ft long · width estimated' },
	{ id: 'kitchen', name: 'Kitchen', bounds: [3.4, 23.3, 15.5, 32.6], entry: [6.5, 26.5], look: [12, 29], note: 'White cabinets & the breakfast nook' },
	{ id: 'wc', name: 'WC', bounds: [-4.8, 21.5, 0, 26.3], entry: [-1.5, 23.8], look: [-3.5, 23.8], note: 'Separate toilet room' },
	{ id: 'bath', name: 'Bathroom', bounds: [-6.2, 31, 0, 38.2], entry: [-1.2, 34.7], look: [-4.5, 34.7], note: 'Pedestal sink, tiled tub & green curtain' },
	{ id: 'office', name: 'Office', bounds: [-5.2, 40, 3.4, 50.5], entry: [1.6, 42.5], look: [0, 48.5], note: 'Standing desk, daybed & round rug' },
	{ id: 'bedroom', name: 'Bedroom', bounds: [3.4, 36, 17, 50.5], entry: [6, 38.4], look: [12, 45], note: 'Sage bedding, warm wood & rear windows' },
];
export type Barrier = { x1: number; z1: number; x2: number; z2: number };
export function withinFloor(x: number, z: number, margin = 0): boolean {
	return rooms.some(({ bounds: [a, b, c, d] }) => x >= a + margin && x <= c - margin && z >= b + margin && z <= d - margin)
		|| (x >= 3 && x <= 15 && z >= -measured.bayDepth && z <= 0);
}
export function canStand(x: number, z: number, barriers: Barrier[], radius = 0.25): boolean {
	if (!withinFloor(x, z)) return false;
	return !barriers.some(b => x > b.x1 - radius && x < b.x2 + radius && z > b.z1 - radius && z < b.z2 + radius);
}
