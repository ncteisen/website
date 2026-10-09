import denim from './assets/sarah-flap-denim.png';
import hiking from './assets/sarah-flap.png';

export const outfits = {
	denim: { label: 'Denim', sheet: denim, anchors: [[350, 335], [323, 341], [350, 319], [323, 319]] },
	hiking: { label: 'Hiking', sheet: hiking, anchors: [[350, 335], [323, 341], [350, 319], [323, 319]] },
} as const;
export type Outfit = keyof typeof outfits;

export function readOutfit(): Outfit {
	try { return localStorage.getItem('flappySarahOutfit') === 'hiking' ? 'hiking' : 'denim'; }
	catch { return 'denim'; }
}

export function saveOutfit(outfit: Outfit): void {
	try { localStorage.setItem('flappySarahOutfit', outfit); } catch { /* Keep the session's outfit. */ }
}
