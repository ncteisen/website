const cartoBasemapKey = import.meta.env.PUBLIC_CARTO_BASEMAP_KEY?.trim();
const cartoTileBaseUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export const CARTO_TILE_URL = cartoBasemapKey
	? `${cartoTileBaseUrl}?key=${encodeURIComponent(cartoBasemapKey)}`
	: cartoTileBaseUrl;

export const CARTO_TILE_OPTIONS = {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
	maxZoom: 19,
	subdomains: 'abcd',
};
