import { CARTO_TILE_OPTIONS, CARTO_TILE_URL } from './cartoBasemap';

type Leaflet = typeof import('leaflet');
let leaflet: Promise<Leaflet> | undefined;
const loadLeaflet = () => leaflet ??= import('leaflet');

/** Reject truncated, oversized, and out-of-range routes before passing them to Leaflet. */
export function decodeActivityPolyline(encoded: string): [number, number][] {
	if (encoded.length > 200_000) throw new Error('Route is too large');
	let index = 0;
	let lat = 0;
	let lng = 0;
	const points: [number, number][] = [];
	const readDelta = () => {
		let result = 0;
		let shift = 0;
		while (true) {
			if (index >= encoded.length || shift > 30) throw new Error('Invalid route');
			const byte = encoded.charCodeAt(index++) - 63;
			if (byte < 0 || byte > 63) throw new Error('Invalid route');
			result += (byte & 31) * 2 ** shift;
			if (byte < 32) break;
			shift += 5;
		}
		return result % 2 ? -(result + 1) / 2 : result / 2;
	};
	while (index < encoded.length) {
		lat += readDelta();
		lng += readDelta();
		if (Math.abs(lat) > 9_000_000 || Math.abs(lng) > 18_000_000) throw new Error('Invalid route coordinates');
		points.push([lat / 1e5, lng / 1e5]);
	}
	return points;
}

/** Maps are optional: a missing chunk, bad route, or failed card never interrupts core controls. */
export async function initActivityMaps(selector: string, load: () => Promise<Leaflet> = loadLeaflet): Promise<void> {
	const containers = [...document.querySelectorAll<HTMLElement>(selector)]
		.filter((el) => el.dataset.polyline && !el.dataset.initialized && !el.closest('.hidden'));
	if (!containers.length) return;
	for (const el of containers) el.dataset.initialized = 'loading';
	let L: Leaflet;
	try {
		L = await load();
	} catch {
		for (const el of containers) { el.dataset.initialized = 'failed'; el.hidden = true; }
		return;
	}
	for (const el of containers) {
		// Filters can change while the optional module is loading. A hidden map
		// has no usable size; leave it eligible for the next filter/load-more pass.
		if (el.closest('.hidden')) {
			delete el.dataset.initialized;
			continue;
		}
		let map: import('leaflet').Map | undefined;
		try {
			const points = decodeActivityPolyline(el.dataset.polyline!);
			if (!points.length) throw new Error('Empty route');
			map = L.map(el, { zoomControl: false, dragging: false, scrollWheelZoom: false,
				doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false });
			map.attributionControl.setPrefix(false);
			L.tileLayer(CARTO_TILE_URL, CARTO_TILE_OPTIONS).addTo(map);
			const line = L.polyline(points, { color: '#5b8ef0', weight: 3, opacity: 0.9 }).addTo(map);
			map.fitBounds(line.getBounds(), { padding: [15, 15] });
			el.dataset.initialized = 'true';
		} catch {
			map?.remove();
			el.dataset.initialized = 'failed';
			el.hidden = true;
		}
	}
}
