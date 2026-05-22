import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const sourcePath = resolve(__dirname, 'source/natural-earth-countries-110m.geojson');
const outputPath = resolve(repoRoot, 'src/data/dateMyGlobeMapPacks.ts');

const { dateMyGlobeEvents } = await import(resolve(repoRoot, 'src/data/dateMyGlobeEvents.ts'));
const countries = JSON.parse(readFileSync(sourcePath, 'utf8')).features;

const regionViewports = {
	Africa: { west: -20, south: -35, east: 55, north: 38 },
	Asia: { west: 25, south: -12, east: 150, north: 60 },
	Caribbean: { west: -90, south: 5, east: -55, north: 28 },
	'Central America': { west: -100, south: 5, east: -70, north: 25 },
	Eurasia: { west: 10, south: 35, east: 115, north: 72 },
	Europe: { west: -12, south: 35, east: 42, north: 62 },
	'Middle East': { west: 25, south: 10, east: 60, north: 42 },
	'North America': { west: -170, south: 15, east: -50, north: 72 },
	Oceania: { west: 95, south: -50, east: 230, north: 20 },
	'South America': { west: -85, south: -58, east: -32, north: 14 },
	'South Asia': { west: 60, south: 5, east: 98, north: 36 },
	'Southeast Asia': { west: 88, south: -12, east: 145, north: 28 },
};

const countryAlias = {
	'afghanistan': ['Afghanistan'],
	'albania': ['Albania'],
	'algeria': ['Algeria'],
	'angola': ['Angola'],
	'antigua and barbuda': ['Antigua and Barbuda'],
	'argentina': ['Argentina'],
	'australia': ['Australia'],
	'austria': ['Austria'],
	'austria hungary': ['Austria', 'Hungary', 'Czechia', 'Slovakia', 'Slovenia', 'Croatia', 'Bosnia and Herzegovina'],
	'bahamas': ['The Bahamas'],
	'balkan states': ['Serbia', 'Montenegro', 'Romania', 'Bulgaria', 'Albania'],
	'baltic states': ['Estonia', 'Latvia', 'Lithuania'],
	'barbados': ['Barbados'],
	'belgian congo': ['Democratic Republic of the Congo'],
	'belgium': ['Belgium'],
	'belize': ['Belize'],
	'benin': ['Benin'],
	'bechuanaland': ['Botswana'],
	'bolivia': ['Bolivia'],
	'botswana': ['Botswana'],
	'brazil': ['Brazil'],
	'british east africa': ['Kenya', 'Uganda', 'United Republic of Tanzania'],
	'british guiana': ['Guyana'],
	'british honduras': ['Belize'],
	'british india': ['India', 'Pakistan', 'Bangladesh', 'Myanmar', 'Sri Lanka'],
	'british north america': ['Canada'],
	'bulgaria': ['Bulgaria'],
	'burkina faso': ['Burkina Faso'],
	'burma': ['Myanmar'],
	'cabo verde': ['Cabo Verde'],
	'california': ['United States of America'],
	'canada': ['Canada'],
	'cape verde': ['Cabo Verde'],
	'ceylon': ['Sri Lanka'],
	'chile': ['Chile'],
	'colombia': ['Colombia'],
	'congo': ['Democratic Republic of the Congo', 'Republic of the Congo'],
	'congo free state': ['Democratic Republic of the Congo'],
	'constantinople': ['Turkey'],
	'croatia': ['Croatia'],
	'czech republic': ['Czechia'],
	'czechia': ['Czechia'],
	'czechoslovakia': ['Czechia', 'Slovakia'],
	'dahomey': ['Benin'],
	'dakota': ['United States of America'],
	'democratic republic of the congo': ['Democratic Republic of the Congo'],
	'djibouti': ['Djibouti'],
	'dominica': ['Dominica'],
	'dutch east indies': ['Indonesia'],
	'dutch guiana': ['Suriname'],
	'east germany': ['Germany'],
	'east pakistan': ['Bangladesh'],
	'east timor': ['East Timor'],
	'east west germany': ['Germany'],
	'ecuador': ['Ecuador'],
	'egypt': ['Egypt'],
	'ellice islands': ['Tuvalu'],
	'eire': ['Ireland'],
	'equatorial guinea': ['Equatorial Guinea'],
	'eritrea': ['Eritrea'],
	'estonia': ['Estonia'],
	'eswatini': ['Eswatini'],
	'ethiopia': ['Ethiopia'],
	'federated states of micronesia': ['Federated States of Micronesia'],
	'fiji': ['Fiji'],
	'finland': ['Finland'],
	'florida': ['United States of America'],
	'france': ['France'],
	'germany': ['Germany'],
	'german empire': ['Germany'],
	'german states': ['Germany'],
	'ghana': ['Ghana'],
	'gilbert islands': ['Kiribati'],
	'gold coast': ['Ghana'],
	'great britain': ['United Kingdom'],
	'grenada': ['Grenada'],
	'guinea': ['Guinea'],
	'guinea bissau': ['Guinea-Bissau'],
	'guyana': ['Guyana'],
	'hatay': ['Turkey'],
	'hungary': ['Hungary'],
	'iceland': ['Iceland'],
	'india': ['India'],
	'india and pakistan': ['India', 'Pakistan'],
	'indonesia': ['Indonesia'],
	'iran': ['Iran'],
	'iraq': ['Iraq'],
	'ireland': ['Ireland'],
	'israel': ['Israel'],
	'italy': ['Italy'],
	'jamaica': ['Jamaica'],
	'jordan': ['Jordan'],
	'kenya': ['Kenya'],
	'kiribati': ['Kiribati'],
	'korea': ['North Korea', 'South Korea'],
	'latvia': ['Latvia'],
	'lesotho': ['Lesotho'],
	'libya': ['Libya'],
	'lithuania': ['Lithuania'],
	'madagascar': ['Madagascar'],
	'malawi': ['Malawi'],
	'malaya': ['Malaysia'],
	'malaysia': ['Malaysia'],
	'marshall islands': ['Marshall Islands'],
	'mauritius': ['Mauritius'],
	'micronesia': ['Federated States of Micronesia'],
	'moldavia': ['Romania'],
	'montenegro': ['Montenegro'],
	'morocco': ['Morocco'],
	'mozambique': ['Mozambique'],
	'myanmar': ['Myanmar'],
	'namibia': ['Namibia'],
	'new hebrides': ['Vanuatu'],
	'new holland': ['Australia'],
	'newfoundland': ['Canada'],
	'north and south dakota': ['United States of America'],
	'north and south korea': ['North Korea', 'South Korea'],
	'north and south vietnam': ['Vietnam'],
	'north and south yemen': ['Yemen'],
	'northern rhodesia': ['Zambia'],
	'norway': ['Norway'],
	'nyasaland': ['Malawi'],
	'orange free state': ['South Africa'],
	'pakistan': ['Pakistan'],
	'palestine': ['Israel', 'Palestine'],
	'panama': ['Panama'],
	'papua new guinea': ['Papua New Guinea'],
	'peru': ['Peru'],
	'persia': ['Iran'],
	'philippines': ['Philippines'],
	'poland': ['Poland'],
	'portuguese guinea': ['Guinea-Bissau'],
	'qatar': ['Qatar'],
	'republic of ireland': ['Ireland'],
	'rhodesia': ['Zimbabwe'],
	'romania': ['Romania'],
	'russia': ['Russia'],
	'russian america': ['United States of America'],
	'saint kitts and nevis': ['Saint Kitts and Nevis'],
	'saint lucia': ['Saint Lucia'],
	'saint vincent': ['Saint Vincent and the Grenadines'],
	'samoa': ['Samoa'],
	'saudi arabia': ['Saudi Arabia'],
	'saudi arabia and iraq': ['Saudi Arabia', 'Iraq'],
	'serbia': ['Republic of Serbia'],
	'serbia and montenegro': ['Republic of Serbia', 'Montenegro'],
	'slovenia': ['Slovenia'],
	'slovakia': ['Slovakia'],
	'solomon islands': ['Solomon Islands'],
	'south africa': ['South Africa'],
	'south sudan': ['South Sudan'],
	'south west africa': ['Namibia'],
	'south yemen': ['Yemen'],
	'soviet union': ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Georgia', 'Armenia', 'Azerbaijan', 'Estonia', 'Latvia', 'Lithuania'],
	'soviet russia': ['Russia'],
	'spain': ['Spain'],
	'sri lanka': ['Sri Lanka'],
	'sudan': ['Sudan'],
	'suriname': ['Suriname'],
	'swaziland': ['Eswatini'],
	'sweden': ['Sweden'],
	'sweden norway': ['Sweden', 'Norway'],
	'syria': ['Syria'],
	'tanganyika': ['United Republic of Tanzania'],
	'tanzania': ['United Republic of Tanzania'],
	'tasmania': ['Australia'],
	'trinidad and tobago': ['Trinidad and Tobago'],
	'tunisia': ['Tunisia'],
	'turkey': ['Turkey'],
	'tuvalu': ['Tuvalu'],
	'uganda': ['Uganda'],
	'ukraine': ['Ukraine'],
	'union of south africa': ['South Africa'],
	'united arab emirates': ['United Arab Emirates'],
	'united arab republic': ['Egypt', 'Syria'],
	'united kingdom': ['United Kingdom'],
	'united netherlands': ['Netherlands', 'Belgium'],
	'united states': ['United States of America'],
	'upper volta': ['Burkina Faso'],
	'ussr': ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Georgia', 'Armenia', 'Azerbaijan', 'Estonia', 'Latvia', 'Lithuania'],
	'vanuatu': ['Vanuatu'],
	'venetia': ['Italy'],
	'vietnam': ['Vietnam'],
	'yemen': ['Yemen'],
	'yugoslavia': ['Republic of Serbia', 'Croatia', 'Slovenia', 'Bosnia and Herzegovina', 'Montenegro', 'Macedonia', 'Kosovo'],
	'zaire': ['Democratic Republic of the Congo'],
	'zambia': ['Zambia'],
	'zimbabwe': ['Zimbabwe'],
};

const focusOverrides = {
	'viceroyalty-of-peru': ['Peru', 'Ecuador', 'Bolivia', 'Chile'],
	'dutch-east-india-company': ['Indonesia', 'Malaysia'],
	'westphalia': ['Germany', 'France', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Czechia'],
	'great-britain': ['United Kingdom', 'Ireland'],
	'united-states': ['United States of America'],
	'florida-cession': ['United States of America'],
	'california-statehood': ['United States of America'],
	'alaska-purchase': ['United States of America'],
	'dakota-statehood': ['United States of America'],
	'austria-hungary-dissolution': ['Austria', 'Hungary', 'Czechia', 'Slovakia', 'Poland', 'Romania', 'Slovenia', 'Croatia', 'Bosnia and Herzegovina'],
	'baltic-independence': ['Estonia', 'Latvia', 'Lithuania'],
	'year-of-africa': ['Cameroon', 'Central African Republic', 'Chad', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Gabon', 'Ivory Coast', 'Madagascar', 'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Senegal', 'Somalia'],
	'angola-mozambique-independence': ['Angola', 'Mozambique'],
	'soviet-dissolution': ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Georgia', 'Armenia', 'Azerbaijan', 'Estonia', 'Latvia', 'Lithuania'],
	'yugoslavia-dissolution': ['Republic of Serbia', 'Croatia', 'Slovenia', 'Bosnia and Herzegovina', 'Montenegro', 'Macedonia'],
	'czechoslovakia': ['Czechia', 'Slovakia'],
};

const markerOverrides = {
	'budapest-name': [19.04, 47.5],
	'petrograd-name': [30.31, 59.94],
	'leningrad-name': [30.31, 59.94],
	'oslo-name': [10.75, 59.91],
	'istanbul-name': [28.98, 41.01],
	'florida-cession': [-82.6, 28.1],
	'california-statehood': [-119.5, 37.2],
	'alaska-purchase': [-150, 64],
	'dakota-statehood': [-100.5, 46.2],
	'tasmania-name': [146.7, -42],
	'hatay-to-turkey': [36.2, 36.4],
	'newfoundland-canada': [-56, 49],
};

const lineOverrides = {
	'suez-canal': [[32.33, 31.25], [32.32, 30.55], [32.55, 29.95]],
	'panama-canal': [[-79.92, 9.35], [-79.7, 9.08], [-79.55, 8.9]],
};

const viewportOverrides = {
	'united-states': { west: -128, south: 24, east: -65, north: 50 },
	'florida-cession': { west: -91, south: 23, east: -76, north: 33 },
	'california-statehood': { west: -126, south: 31, east: -112, north: 43 },
	'alaska-purchase': { west: -170, south: 51, east: -129, north: 72 },
	'dakota-statehood': { west: -106, south: 42, east: -94, north: 50 },
	'tasmania-name': { west: 142, south: -45, east: 150, north: -38 },
	'hatay-to-turkey': { west: 34.6, south: 35.4, east: 37.2, north: 37.4 },
	'suez-canal': { west: 27, south: 22, east: 38, north: 34 },
	'panama-canal': { west: -84, south: 6, east: -76, north: 12 },
	'budapest-name': { west: 14, south: 45, east: 25, north: 50 },
	'petrograd-name': { west: 24, south: 57, east: 35, north: 62 },
	'leningrad-name': { west: 24, south: 57, east: 35, north: 62 },
	'oslo-name': { west: 4, south: 56, east: 14, north: 62 },
	'istanbul-name': { west: 24, south: 38, east: 33, north: 43 },
	'newfoundland-canada': { west: -62, south: 45, east: -50, north: 54 },
};

const normalize = (value) => value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const countryName = (feature) => feature.properties.name ?? feature.properties.NAME ?? feature.properties.ADMIN;
const countryByName = new Map(countries.map((feature) => [countryName(feature), feature]));
const naturalNameAliases = {
	'Bosnia and Herzegovina': 'Bosnia and Herz.',
	'Democratic Republic of the Congo': 'Dem. Rep. Congo',
	'East Timor': 'Timor-Leste',
	'Equatorial Guinea': 'Eq. Guinea',
	'Ivory Coast': "Côte d'Ivoire",
	'Macedonia': 'North Macedonia',
	'Republic of Serbia': 'Serbia',
	'Republic of the Congo': 'Congo',
	'Solomon Islands': 'Solomon Is.',
	'The Bahamas': 'Bahamas',
	'United Republic of Tanzania': 'Tanzania',
	'Eswatini': 'eSwatini',
};
const resolveCountryName = (name) => countryByName.has(name) ? name : naturalNameAliases[name];
const aliasEntries = Object.entries(countryAlias).sort((a, b) => b[0].length - a[0].length);

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

function countriesForText(text) {
	const normalized = normalize(text);
	const matches = [];
	for (const [alias, countryNames] of aliasEntries) {
		if (normalized.includes(alias)) {
			matches.push(...countryNames);
		}
	}
	return unique(matches);
}

function ringsForGeometry(geometry) {
	return geometry.type === 'MultiPolygon'
		? geometry.coordinates.flat()
		: geometry.coordinates;
}

function bboxForRing(ring) {
	let west = Infinity;
	let south = Infinity;
	let east = -Infinity;
	let north = -Infinity;
	for (const [lon, lat] of ring) {
		west = Math.min(west, lon);
		south = Math.min(south, lat);
		east = Math.max(east, lon);
		north = Math.max(north, lat);
	}
	return { west, south, east, north };
}

function bboxForFeature(feature) {
	let west = Infinity;
	let south = Infinity;
	let east = -Infinity;
	let north = -Infinity;
	for (const ring of ringsForGeometry(feature.geometry)) {
		for (const [lon, lat] of ring) {
			west = Math.min(west, lon);
			south = Math.min(south, lat);
			east = Math.max(east, lon);
			north = Math.max(north, lat);
		}
	}
	return { west, south, east, north };
}

function mergeBboxes(boxes) {
	return boxes.reduce((merged, box) => ({
		west: Math.min(merged.west, box.west),
		south: Math.min(merged.south, box.south),
		east: Math.max(merged.east, box.east),
		north: Math.max(merged.north, box.north),
	}), { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity });
}

function padViewport(box, region, eventId) {
	const override = viewportOverrides[eventId];
	if (override) return override;
	if (!Number.isFinite(box.west)) return regionViewports[region] ?? regionViewports.Europe;
	const spanLon = Math.max(6, box.east - box.west);
	const spanLat = Math.max(5, box.north - box.south);
	const padLon = Math.max(2, spanLon * 0.45);
	const padLat = Math.max(1.8, spanLat * 0.5);
	const viewport = {
		west: Math.max(-180, box.west - padLon),
		south: Math.max(-60, box.south - padLat),
		east: Math.min(230, box.east + padLon),
		north: Math.min(84, box.north + padLat),
	};
	if (viewport.east - viewport.west < 10) {
		const center = (viewport.east + viewport.west) / 2;
		viewport.west = center - 5;
		viewport.east = center + 5;
	}
	if (viewport.north - viewport.south < 8) {
		const center = (viewport.north + viewport.south) / 2;
		viewport.south = center - 4;
		viewport.north = center + 4;
	}
	return viewport;
}

function intersects(a, b) {
	return a.west <= b.east && a.east >= b.west && a.south <= b.north && a.north >= b.south;
}

function ringArea(ring) {
	let area = 0;
	for (let i = 0; i < ring.length - 1; i += 1) {
		area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
	}
	return Math.abs(area / 2);
}

function pointLineDistance(point, start, end) {
	const [x, y] = point;
	const [x1, y1] = start;
	const [x2, y2] = end;
	const dx = x2 - x1;
	const dy = y2 - y1;
	if (!dx && !dy) return Math.hypot(x - x1, y - y1);
	const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
	return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplifyRing(points, tolerance) {
	if (points.length <= 8) return points;
	const first = points[0];
	const last = points[points.length - 1];
	let index = -1;
	let maxDistance = 0;
	for (let i = 1; i < points.length - 1; i += 1) {
		const distance = pointLineDistance(points[i], first, last);
		if (distance > maxDistance) {
			maxDistance = distance;
			index = i;
		}
	}
	if (maxDistance > tolerance && index > 0) {
		const left = simplifyRing(points.slice(0, index + 1), tolerance);
		const right = simplifyRing(points.slice(index), tolerance);
		return [...left.slice(0, -1), ...right];
	}
	return [first, last];
}

function simplifyGeometry(geometry, viewport) {
	const tolerance = Math.max(viewport.east - viewport.west, viewport.north - viewport.south) / 190;
	const simplifyPolygon = (polygon) => polygon
		.filter((ring) => intersects(bboxForRing(ring), viewport))
		.map((ring) => simplifyRing(ring, tolerance))
		.filter((ring) => ring.length >= 4 && ringArea(ring) > tolerance * tolerance * 0.7);

	if (geometry.type === 'Polygon') {
		const coordinates = simplifyPolygon(geometry.coordinates);
		return coordinates.length ? { type: 'Polygon', coordinates } : null;
	}

	const coordinates = geometry.coordinates
		.map(simplifyPolygon)
		.filter((polygon) => polygon.length);
	return coordinates.length ? { type: 'MultiPolygon', coordinates } : null;
}

function centroid(feature) {
	const box = bboxForFeature(feature);
	return [(box.west + box.east) / 2, (box.south + box.north) / 2];
}

function countryFeature(name, role, label, viewport, options = {}) {
	const source = countryByName.get(name);
	if (!source) return null;
	const geometry = simplifyGeometry(source.geometry, viewport);
	if (!geometry) return null;
	return {
		type: 'Feature',
		properties: {
			label,
			role,
			labelPosition: centroid(source),
			labelSize: options.labelSize ?? (role === 'context' ? 'small' : 'normal'),
			showLabel: options.showLabel,
		},
		geometry,
	};
}

function pointFeature(label, role, coordinates, labelPosition = coordinates) {
	return {
		type: 'Feature',
		properties: { label, role, labelPosition, labelSize: 'normal' },
		geometry: { type: 'Point', coordinates },
	};
}

function lineFeature(label, role, coordinates) {
	return {
		type: 'Feature',
		properties: { label, role, labelPosition: coordinates[Math.floor(coordinates.length / 2)], labelSize: 'small' },
		geometry: { type: 'LineString', coordinates },
	};
}

function contextCountries(viewport, focusNames) {
	const focus = new Set(focusNames);
	const center = [(viewport.west + viewport.east) / 2, (viewport.south + viewport.north) / 2];
	return countries
		.map((feature) => ({ feature, box: bboxForFeature(feature) }))
		.filter(({ feature, box }) => !focus.has(countryName(feature)) && intersects(box, viewport) && simplifyGeometry(feature.geometry, viewport))
		.sort((a, b) => {
			const ca = centroid(a.feature);
			const cb = centroid(b.feature);
			return Math.hypot(ca[0] - center[0], ca[1] - center[1]) - Math.hypot(cb[0] - center[0], cb[1] - center[1]);
		})
		.slice(0, 12)
		.map(({ feature }, index) => countryFeature(countryName(feature), 'context', countryName(feature), viewport, {
			showLabel: index < 7,
		}))
		.filter(Boolean);
}

function eventCountries(event) {
	const override = focusOverrides[event.id] ?? [];
	return unique([
		...override,
		...countriesForText(event.beforeLabel),
		...countriesForText(event.afterLabel),
		...countriesForText(event.name),
	])
		.map(resolveCountryName)
		.filter((name) => name && countryByName.has(name));
}

function sourceNote(event) {
	if (event.year >= 1886) {
		return 'Atlas map pack: Natural Earth-derived modern geography, interpreted against CShapes 2.0/SUNGEO historical-boundary references and simplified for this checklist.';
	}
	return 'Atlas map pack: Natural Earth-derived modern geography with curated historical context for this pre-1886 dating clue; simplified for this checklist.';
}

function mapPackForEvent(event) {
	const focusNames = eventCountries(event);
	const focusFeatures = focusNames.map((name) => countryByName.get(name)).filter(Boolean);
	const focusBox = mergeBboxes(focusFeatures.map(bboxForFeature));
	const viewport = padViewport(focusBox, event.region, event.id);
	const context = contextCountries(viewport, focusNames);
	const afterLabel = event.afterLabel;
	const beforeLabel = event.beforeLabel;
	const marker = markerOverrides[event.id];
	const line = lineOverrides[event.id];
	const singleFocus = focusNames.length === 1;
	const beforeFocus = focusNames
		.map((name, index) => countryFeature(name, line ? 'context' : 'removed', singleFocus ? beforeLabel : name, viewport, { labelSize: singleFocus ? 'large' : 'normal', showLabel: index < 8 }))
		.filter(Boolean);
	const afterFocus = focusNames
		.map((name, index) => countryFeature(name, line ? 'context' : 'added', singleFocus ? afterLabel : name, viewport, { labelSize: singleFocus ? 'large' : 'normal', showLabel: index < 8 }))
		.filter(Boolean);

	if (!beforeFocus.length && marker) {
		beforeFocus.push(pointFeature(beforeLabel, 'removed', marker));
		afterFocus.push(pointFeature(afterLabel, 'added', marker));
	}

	if (!beforeFocus.length) {
		const fallbackCenter = [(viewport.west + viewport.east) / 2, (viewport.south + viewport.north) / 2];
		beforeFocus.push(pointFeature(beforeLabel, 'removed', fallbackCenter));
		afterFocus.push(pointFeature(afterLabel, 'added', fallbackCenter));
	}

	if (marker) {
		beforeFocus.push(pointFeature(beforeLabel, 'removed', marker));
		afterFocus.push(pointFeature(afterLabel, 'added', marker));
	}

	if (line) {
		beforeFocus.push(lineFeature(beforeLabel, 'removed', line));
		afterFocus.push(lineFeature(afterLabel, 'added', line));
	}

	return {
		mapViewport: viewport,
		beforeMap: {
			type: 'FeatureCollection',
			label: 'Before',
			note: beforeLabel,
			features: [...context, ...beforeFocus],
		},
		afterMap: {
			type: 'FeatureCollection',
			label: 'After',
			note: afterLabel,
			features: [...context, ...afterFocus],
		},
		mapSourceNote: sourceNote(event),
	};
}

const mapPacks = Object.fromEntries(dateMyGlobeEvents.map((event) => [event.id, mapPackForEvent(event)]));
const body = `// Generated by scripts/date-my-globe/generate-map-packs.mjs.
// Do not hand-edit large geometry blocks; update the generator or source data instead.

export const dateMyGlobeMapPacks = ${JSON.stringify(mapPacks, null, '\t')} as const;
`;

writeFileSync(outputPath, body);
console.log(`Wrote ${Object.keys(mapPacks).length} map packs to ${outputPath}`);
