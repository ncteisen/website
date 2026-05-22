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
	'united-states': [-75, 40],
	'transvaal-republic': [30.2, -25.3],
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
	'barbados-independence': [-59.54, 13.19],
	'mauritius-independence': [57.55, -20.2],
	'fiji-independence': [178.1, -17.8],
	'tonga-independence': [-175.2, -21.2],
	'grenada-independence': [-61.68, 12.12],
	'cape-verde-independence': [-23.62, 15.1],
	'dominica-independence': [-61.36, 15.41],
	'tuvalu-independence': [179.2, -8.52],
	'kiribati-independence': [173.0, 1.4],
	'st-lucia-independence': [-60.98, 13.91],
	'st-vincent-independence': [-61.2, 13.25],
	'antigua-barbuda-independence': [-61.8, 17.1],
	'st-kitts-nevis-independence': [-62.72, 17.33],
	'marshall-islands-independence': [171.2, 7.1],
	'micronesia-independence': [158.2, 6.9],
	'western-samoa-samoa': [-172.1, -13.8],
	'cabo-verde-name': [-23.62, 15.1],
};

const contextPointOverrides = {
	'mauritius-independence': [
		['Madagascar', [47.5, -19.2]],
		['Reunion', [55.54, -21.1]],
	],
	'tonga-independence': [
		['Samoa', [-172.1, -13.8]],
		['Niue', [-169.9, -19.05]],
	],
	'cape-verde-independence': [
		['Senegal', [-14.8, 14.5]],
		['Atlantic Ocean', [-24.8, 16.6]],
	],
	'dominica-independence': [
		['Guadeloupe', [-61.55, 16.25]],
		['Martinique', [-61.0, 14.65]],
	],
	'tuvalu-independence': [
		['Fiji', [178.1, -17.8]],
		['Kiribati', [173.0, 1.4]],
	],
	'kiribati-independence': [
		['Tuvalu', [179.2, -8.5]],
		['Nauru', [166.9, -0.5]],
	],
	'st-lucia-independence': [
		['Martinique', [-61.0, 14.65]],
		['St. Vincent', [-61.2, 13.25]],
	],
	'vanuatu-independence': [
		['Solomon Islands', [160.2, -9.5]],
		['New Caledonia', [165.6, -21.3]],
	],
	'antigua-barbuda-independence': [
		['Guadeloupe', [-61.55, 16.25]],
		['St. Kitts', [-62.72, 17.33]],
	],
	'st-kitts-nevis-independence': [
		['Antigua', [-61.8, 17.1]],
		['Montserrat', [-62.2, 16.75]],
	],
	'marshall-islands-independence': [
		['Micronesia', [158.2, 6.9]],
		['Wake Island', [166.6, 19.3]],
	],
	'micronesia-independence': [
		['Palau', [134.6, 7.5]],
		['Marshall Islands', [171.2, 7.1]],
	],
	'western-samoa-samoa': [
		['American Samoa', [-170.7, -14.3]],
		['Tonga', [-175.2, -21.2]],
	],
	'cabo-verde-name': [
		['Senegal', [-14.8, 14.5]],
		['Atlantic Ocean', [-24.8, 16.6]],
	],
};

const lineOverrides = {
	'suez-canal': [[32.33, 31.25], [32.32, 30.55], [32.55, 29.95]],
	'panama-canal': [[-79.92, 9.35], [-79.7, 9.08], [-79.55, 8.9]],
};

const viewportOverrides = {
	'united-states': { west: -86, south: 25, east: -66, north: 48 },
	'florida-cession': { west: -91, south: 23, east: -76, north: 33 },
	'california-statehood': { west: -126, south: 31, east: -112, north: 43 },
	'alaska-purchase': { west: -170, south: 51, east: -129, north: 72 },
	'dakota-statehood': { west: -106, south: 42, east: -94, north: 50 },
	'tasmania-name': { west: 142, south: -45, east: 150, north: -38 },
	'transvaal-republic': { west: 24, south: -29, east: 33, north: -21 },
	'hatay-to-turkey': { west: 34.6, south: 35.4, east: 37.2, north: 37.4 },
	'suez-canal': { west: 27, south: 22, east: 38, north: 34 },
	'panama-canal': { west: -84, south: 6, east: -76, north: 12 },
	'budapest-name': { west: 14, south: 45, east: 25, north: 50 },
	'petrograd-name': { west: 24, south: 57, east: 35, north: 62 },
	'leningrad-name': { west: 24, south: 57, east: 35, north: 62 },
	'oslo-name': { west: 4, south: 56, east: 14, north: 62 },
	'istanbul-name': { west: 24, south: 38, east: 33, north: 43 },
	'second-polish-republic': { west: 12, south: 48, east: 25, north: 56 },
	'kenya-name': { west: 32, south: -6, east: 43, north: 6 },
	'ireland-republic': { west: -11, south: 50.5, east: -4, north: 56 },
	'israel': { west: 32.5, south: 29, east: 37, north: 34 },
	'zimbabwe-name': { west: 24, south: -23, east: 34, north: -14 },
	'burkina-faso-name': { west: -6.5, south: 8.5, east: 3.5, north: 15.5 },
	'czechia-name': { west: 9, south: 47, east: 20, north: 52 },
	'eswatini-name': { west: 28.5, south: -28, east: 33, north: -25 },
	'libya-independence': { west: 8, south: 19, east: 26, north: 34 },
	'morocco-independence': { west: -20, south: 16, east: 10, north: 42 },
	'sudan-independence': { west: 20, south: 3, east: 40, north: 23 },
	'tunisia-independence': { west: 6, south: 30, east: 12, north: 38 },
	'ghana-independence': { west: -4, south: 4, east: 2, north: 12 },
	'guinea-independence': { west: -16, south: 7, east: -7, north: 13 },
	'tanganyika-independence': { west: 28, south: -12, east: 42, north: 2 },
	'algeria-independence': { west: -20, south: 10, east: 25, north: 42 },
	'kenya-independence': { west: 32, south: -6, east: 43, north: 6 },
	'malawi-independence': { west: 30, south: -18, east: 36, north: -8 },
	'tanzania-formation': { west: 28, south: -13, east: 42, north: 2 },
	'zambia-independence': { west: 21, south: -19, east: 34, north: -8 },
	'botswana-independence': { west: 18, south: -27, east: 30, north: -17 },
	'lesotho-independence': { west: 26, south: -31, east: 30, north: -28 },
	'equatorial-guinea-independence': { west: 6, south: -2, east: 12, north: 4 },
	'guinea-bissau-independence': { west: -18, south: 10, east: -12, north: 13 },
	'djibouti-independence': { west: 40, south: 10, east: 45, north: 14 },
	'namibia-independence': { west: 10, south: -30, east: 26, north: -16 },
	'newfoundland-canada': { west: -62, south: 45, east: -50, north: 54 },
	'barbados-independence': { west: -62.8, south: 11.5, east: -58.2, north: 15.2 },
	'mauritius-independence': { west: 45, south: -25.5, east: 60.2, north: -12.5 },
	'fiji-independence': { west: 174, south: -21, east: 181, north: -14.5 },
	'tonga-independence': { west: -176.5, south: -22.5, east: -168.8, north: -12.5 },
	'grenada-independence': { west: -63.3, south: 10.8, east: -60.1, north: 13.8 },
	'cape-verde-independence': { west: -26.5, south: 12.5, east: -13.2, north: 18.2 },
	'dominica-independence': { west: -63, south: 14.2, east: -59.6, north: 16.8 },
	'tuvalu-independence': { west: 172, south: -18.5, east: 181, north: 3 },
	'kiribati-independence': { west: 165, south: -9.5, east: 181, north: 5.5 },
	'st-lucia-independence': { west: -62.7, south: 12.7, east: -59.6, north: 15.2 },
	'st-vincent-independence': { west: -62.8, south: 12, east: -59.7, north: 14.6 },
	'vanuatu-independence': { west: 158, south: -24, east: 170, north: -8 },
	'antigua-barbuda-independence': { west: -63.3, south: 15.8, east: -60.1, north: 18.6 },
	'st-kitts-nevis-independence': { west: -64.1, south: 16.2, east: -61, north: 18.5 },
	'marshall-islands-independence': { west: 156, south: 3, east: 174.5, north: 20.5 },
	'micronesia-independence': { west: 133, south: 1, east: 172.5, north: 11 },
	'western-samoa-samoa': { west: -176.5, south: -22.5, east: -169, north: -12 },
	'cabo-verde-name': { west: -26.5, south: 12.5, east: -13.2, north: 18.2 },
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
	'South Sudan': 'S. Sudan',
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

function visibleLabelPosition(feature, viewport) {
	const box = bboxForFeature(feature);
	const visibleWest = Math.max(box.west, viewport.west);
	const visibleEast = Math.min(box.east, viewport.east);
	const visibleSouth = Math.max(box.south, viewport.south);
	const visibleNorth = Math.min(box.north, viewport.north);
	const spanLon = viewport.east - viewport.west;
	const spanLat = viewport.north - viewport.south;
	const marginLon = spanLon * 0.04;
	const marginLat = spanLat * 0.04;
	const unclampedLon = (visibleWest + visibleEast) / 2;
	const unclampedLat = (visibleSouth + visibleNorth) / 2;

	return [
		Math.min(viewport.east - marginLon, Math.max(viewport.west + marginLon, unclampedLon)),
		Math.min(viewport.north - marginLat, Math.max(viewport.south + marginLat, unclampedLat)),
	];
}

function countryFeature(name, role, label, viewport, options = {}) {
	const source = countryByName.get(resolveCountryName(name) ?? name);
	if (!source) return null;
	const geometry = simplifyGeometry(source.geometry, viewport);
	if (!geometry) return null;
	return {
		type: 'Feature',
		properties: {
			label,
			role,
			labelPosition: options.labelPosition ?? visibleLabelPosition(source, viewport),
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

function lineFeature(label, role, coordinates, options = {}) {
	return {
		type: 'Feature',
		properties: {
			label,
			role,
			labelPosition: options.labelPosition ?? coordinates[Math.floor(coordinates.length / 2)],
			labelSize: options.labelSize ?? 'small',
			showLabel: options.showLabel,
		},
		geometry: { type: 'LineString', coordinates },
	};
}

function polygonFeature(label, role, coordinates, options = {}) {
	return {
		type: 'Feature',
		properties: {
			label,
			role,
			labelPosition: options.labelPosition ?? centroid({ geometry: { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]]] } }),
			labelSize: options.labelSize ?? 'normal',
			showLabel: options.showLabel,
		},
		geometry: {
			type: 'Polygon',
			coordinates: [[...coordinates, coordinates[0]]],
		},
	};
}

function smallIslandFeature(label, role, center, options = {}) {
	const lonRadius = options.lonRadius ?? 0.18;
	const latRadius = options.latRadius ?? 0.14;
	const shape = options.shape ?? [
		[-0.7, -0.15],
		[-0.42, 0.42],
		[0.08, 0.58],
		[0.58, 0.25],
		[0.72, -0.2],
		[0.24, -0.55],
		[-0.38, -0.46],
	];
	const coordinates = shape.map(([x, y]) => [center[0] + x * lonRadius, center[1] + y * latRadius]);
	return polygonFeature(label, role, coordinates, {
		labelPosition: options.labelPosition ?? center,
		labelSize: options.labelSize ?? 'normal',
		showLabel: options.showLabel,
	});
}

function countryOrIslandFeature(country, label, role, center, viewport, options = {}) {
	if (options.forceIsland) {
		return smallIslandFeature(label, role, center, options);
	}

	return countryFeature(country, role, label, viewport, {
		showLabel: true,
		labelPosition: options.labelPosition ?? center,
		labelSize: options.labelSize ?? 'normal',
	}) ?? smallIslandFeature(label, role, center, options);
}

function contextLandOrPoint(label, country, coordinates, viewport, options = {}) {
	return countryFeature(country, 'context', label, viewport, {
		showLabel: true,
		labelPosition: options.labelPosition ?? coordinates,
		labelSize: options.labelSize ?? 'small',
	}) ?? pointFeature(label, 'context', coordinates, options.labelPosition ?? coordinates);
}

function compactMarkerLabel(label) {
	return label
		.replace(/^British-protected /, '')
		.replace(/^British /, '')
		.replace(/^French /, '')
		.replace(/^Portuguese /, '')
		.replace(/^Spanish /, '')
		.replace(/^Dutch /, '')
		.replace(/^Indonesian /, '')
		.replace(/^Australian /, '')
		.replace(/^U\.S\. trust territory$/, 'Trust territory')
		.replace(/^U\.S\. /, '')
		.replace(/\s*\([^)]*\)/g, '')
		.slice(0, 28);
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

function contextPoints(eventId) {
	return (contextPointOverrides[eventId] ?? [])
		.map(([label, coordinates]) => pointFeature(label, 'context', coordinates, coordinates));
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

function mapCollection(label, note, features) {
	return {
		type: 'FeatureCollection',
		label,
		note,
		features,
	};
}

const easternNorthAmericaContext = (viewport) => [
	countryFeature('Canada', 'context', 'Canada', viewport, { showLabel: true }),
	countryFeature('The Bahamas', 'context', 'Bahamas', viewport, { showLabel: true }),
].filter(Boolean);

const europeanContext = (viewport, names = ['France', 'Switzerland', 'Austria', 'Poland', 'Netherlands', 'Denmark', 'Italy']) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const southAsiaContext = (viewport, names = ['Afghanistan', 'Iran', 'China', 'Nepal', 'Bhutan', 'Sri Lanka', 'Myanmar']) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const middleEastContext = (viewport, names = ['Turkey', 'Syria', 'Iraq', 'Iran', 'Saudi Arabia', 'Egypt', 'Jordan']) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const eastAsiaContext = (viewport, names = ['China', 'Japan', 'Russia', 'Mongolia']) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const southeastAsiaContext = (viewport, names = ['Thailand', 'Laos', 'Cambodia', 'Vietnam', 'Malaysia', 'Indonesia', 'Philippines', 'Papua New Guinea']) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const africaContext = (viewport, names) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const americasContext = (viewport, names) => (
	names.map((name) => countryFeature(resolveCountryName(name) ?? name, 'context', name, viewport, { showLabel: true })).filter(Boolean)
);

const caribbeanPoint = (label, coordinates, role = 'context') => pointFeature(label, role, coordinates);

const oceaniaPoint = (label, coordinates, role = 'context') => pointFeature(label, role, coordinates);

function manualMapPackForEvent(event) {
	const cityNameSpecs = {
		'budapest-name': {
			viewport: viewportOverrides['budapest-name'],
			coords: [19.04, 47.5],
			before: 'Pesth',
			after: 'Budapest',
			context: (viewport) => [
				countryFeature('Hungary', 'context', 'Hungary', viewport, { showLabel: true, labelPosition: [19.2, 46.6] }),
				countryFeature('Austria', 'context', 'Austria', viewport, { showLabel: true }),
				countryFeature('Slovakia', 'context', 'Slovakia', viewport, { showLabel: true }),
				countryFeature('Romania', 'context', 'Romania', viewport, { showLabel: true }),
				pointFeature('Danube', 'context', [18.5, 47.1], [18.5, 47.1]),
			].filter(Boolean),
			source: 'Curated Budapest city-label comparison based on the 1872 unification of Buda, Pest, and Obuda, with Natural Earth-derived central Europe context; simplified for the checklist.',
		},
		'petrograd-name': {
			viewport: viewportOverrides['petrograd-name'],
			coords: [30.31, 59.94],
			before: 'St. Petersburg',
			after: 'Petrograd',
			context: (viewport) => [
				countryFeature('Russia', 'context', 'Russia', viewport, { showLabel: true, labelPosition: [31.8, 59.0] }),
				countryFeature('Finland', 'context', 'Finland', viewport, { showLabel: true }),
				countryFeature('Estonia', 'context', 'Estonia', viewport, { showLabel: true }),
				pointFeature('Gulf of Finland', 'context', [28.7, 59.5], [28.7, 59.5]),
			].filter(Boolean),
			source: 'Curated St. Petersburg/Petrograd city-label comparison based on the 1914 rename, with Natural Earth-derived Gulf of Finland context; simplified for the checklist.',
		},
		'leningrad-name': {
			viewport: viewportOverrides['leningrad-name'],
			coords: [30.31, 59.94],
			before: 'Petrograd',
			after: 'Leningrad',
			context: (viewport) => [
				countryFeature('Russia', 'context', 'Russia', viewport, { showLabel: true, labelPosition: [31.8, 59.0] }),
				countryFeature('Finland', 'context', 'Finland', viewport, { showLabel: true }),
				countryFeature('Estonia', 'context', 'Estonia', viewport, { showLabel: true }),
				pointFeature('Gulf of Finland', 'context', [28.7, 59.5], [28.7, 59.5]),
			].filter(Boolean),
			source: 'Curated Petrograd/Leningrad city-label comparison based on the 1924 rename, with Natural Earth-derived Gulf of Finland context; simplified for the checklist.',
		},
		'oslo-name': {
			viewport: viewportOverrides['oslo-name'],
			coords: [10.75, 59.91],
			before: 'Kristiania',
			after: 'Oslo',
			context: (viewport) => [
				countryFeature('Norway', 'context', 'Norway', viewport, { showLabel: true, labelPosition: [8.0, 60.4] }),
				countryFeature('Sweden', 'context', 'Sweden', viewport, { showLabel: true }),
				countryFeature('Denmark', 'context', 'Denmark', viewport, { showLabel: true }),
				pointFeature('Skagerrak', 'context', [8.6, 57.8], [8.6, 57.8]),
			].filter(Boolean),
			source: 'Curated Christiana/Kristiania/Oslo city-label comparison based on the 1924 Oslo rename, with Natural Earth-derived Scandinavia context; simplified for the checklist.',
		},
		'istanbul-name': {
			viewport: viewportOverrides['istanbul-name'],
			coords: [28.98, 41.01],
			before: 'Constantinople',
			after: 'Istanbul',
			context: (viewport) => [
				countryFeature('Turkey', 'context', 'Turkey', viewport, { showLabel: true, labelPosition: [30.5, 39.5] }),
				countryFeature('Greece', 'context', 'Greece', viewport, { showLabel: true }),
				countryFeature('Bulgaria', 'context', 'Bulgaria', viewport, { showLabel: true }),
				pointFeature('Black Sea', 'context', [30.4, 42.4], [30.4, 42.4]),
				pointFeature('Sea of Marmara', 'context', [28.2, 40.5], [28.2, 40.5]),
			].filter(Boolean),
			source: 'Curated Constantinople/Istanbul city-label comparison based on the 1930 international standardization of Istanbul, with Natural Earth-derived Bosporus context; simplified for the checklist.',
		},
	};
	if (cityNameSpecs[event.id]) {
		const spec = cityNameSpecs[event.id];
		const context = spec.context(spec.viewport);
		return {
			mapViewport: spec.viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, pointFeature(spec.before, 'removed', spec.coords)]),
			afterMap: mapCollection('After', event.afterLabel, [...context, pointFeature(spec.after, 'added', spec.coords)]),
			mapSourceNote: spec.source,
		};
	}

	if (event.id === 'second-polish-republic') {
		const viewport = viewportOverrides[event.id];
		const context = europeanContext(viewport, ['Germany', 'Lithuania', 'Belarus', 'Ukraine', 'Czechia', 'Slovakia']);
		const partitionedPoland = countryFeature('Poland', 'removed', 'Partitioned Poland', viewport, {
			showLabel: false,
		});
		const partitionBoundaries = [
			lineFeature('Partition boundary', 'boundary', [[18.8, 54.5], [18.5, 52.4], [18.1, 50.4]], { showLabel: false }),
			lineFeature('Partition boundary', 'boundary', [[18.1, 50.4], [20.6, 50.0], [23.0, 50.8]], { showLabel: false }),
		];
		const partitionLabels = [
			pointFeature('German partition', 'removed', [16.7, 53.0], [16.7, 53.0]),
			pointFeature('Russian partition', 'removed', [21.4, 52.7], [21.4, 52.7]),
			pointFeature('Austrian partition', 'removed', [20.6, 49.9], [20.6, 49.9]),
		];
		const poland = countryFeature('Poland', 'added', 'Poland', viewport, { showLabel: true, labelPosition: [19.4, 52.0] });
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, partitionedPoland, ...partitionBoundaries, ...partitionLabels].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, poland].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Poland outline with curated partition-boundary labels, based on post-WWI Polish independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'ireland-republic') {
		const viewport = viewportOverrides[event.id];
		const context = [
			countryFeature('United Kingdom', 'context', 'United Kingdom', viewport, { showLabel: true, labelPosition: [-5.4, 54.6] }),
			pointFeature('Atlantic Ocean', 'context', [-10.0, 53.6]),
			pointFeature('Irish Sea', 'context', [-5.6, 53.2]),
		].filter(Boolean);
		const beforeIreland = countryFeature('Ireland', 'removed', 'Eire', viewport, { showLabel: true, labelPosition: [-8.0, 53.2] });
		const afterIreland = countryFeature('Ireland', 'added', 'Republic of Ireland', viewport, { showLabel: true, labelPosition: [-8.0, 53.2] });
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeIreland].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterIreland].filter(Boolean)),
			mapSourceNote: 'Curated Eire/Republic of Ireland label comparison based on 1948 Republic of Ireland references and Natural Earth-derived Irish Sea context; simplified for the checklist.',
		};
	}

	if (event.id === 'israel') {
		const viewport = viewportOverrides[event.id];
		const context = middleEastContext(viewport, ['Lebanon', 'Syria', 'Jordan', 'Egypt']);
		const mandateIsrael = countryFeature('Israel', 'removed', 'Mandate Palestine', viewport, { showLabel: true, labelPosition: [34.9, 31.7] });
		const mandatePalestine = countryFeature('Palestine', 'removed', 'Mandate Palestine', viewport, { showLabel: false });
		const palestine = countryFeature('Palestine', 'context', 'Palestine', viewport, { showLabel: false, labelPosition: [35.3, 31.8], labelSize: 'small' });
		const israel = countryFeature('Israel', 'added', 'Israel', viewport, { showLabel: true, labelPosition: [34.9, 31.4] });
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, mandateIsrael, mandatePalestine].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, palestine, israel].filter(Boolean)),
			mapSourceNote: 'Curated Mandate Palestine/Israel comparison based on 1948 Israel independence references and Natural Earth-derived eastern Mediterranean context; simplified for the checklist.',
		};
	}

	const countryNameChangeSpecs = {
		'kenya-name': {
			country: 'Kenya',
			context: ['Uganda', 'Ethiopia', 'Somalia', 'United Republic of Tanzania'],
			before: 'British East Africa',
			after: 'Kenya',
			labelPosition: [37.8, 0.4],
			source: 'Curated British East Africa/Kenya label comparison based on the 1920 Kenya Colony name change, with Natural Earth-derived East Africa context; simplified for the checklist.',
		},
		'zimbabwe-name': {
			country: 'Zimbabwe',
			context: ['Zambia', 'Mozambique', 'Botswana', 'South Africa'],
			before: 'Rhodesia',
			after: 'Zimbabwe',
			labelPosition: [29.9, -18.8],
			source: 'Curated Rhodesia/Zimbabwe label comparison based on 1980 Zimbabwe independence references and Natural Earth-derived southern Africa context; simplified for the checklist.',
		},
		'burkina-faso-name': {
			country: 'Burkina Faso',
			context: ['Mali', 'Niger', 'Ghana', 'Ivory Coast', 'Benin'],
			before: 'Upper Volta',
			after: 'Burkina Faso',
			labelPosition: [-1.5, 12.4],
			source: 'Curated Upper Volta/Burkina Faso label comparison based on the 1984 name change, with Natural Earth-derived West Africa context; simplified for the checklist.',
		},
		'czechia-name': {
			country: 'Czechia',
			context: ['Germany', 'Poland', 'Slovakia', 'Austria'],
			before: 'Czech Republic',
			after: 'Czechia',
			labelPosition: [15.5, 49.8],
			source: 'Curated Czech Republic/Czechia label comparison based on the 2016 short-form country name adoption, with Natural Earth-derived central Europe context; simplified for the checklist.',
		},
		'eswatini-name': {
			country: 'eSwatini',
			context: ['South Africa', 'Mozambique'],
			before: 'Swaziland',
			after: 'Eswatini',
			labelPosition: [31.5, -26.5],
			source: 'Curated Swaziland/Eswatini label comparison based on the 2018 name change, with Natural Earth-derived southern Africa context; simplified for the checklist.',
		},
	};
	if (countryNameChangeSpecs[event.id]) {
		const spec = countryNameChangeSpecs[event.id];
		const viewport = viewportOverrides[event.id];
		const context = (event.region === 'Europe' ? europeanContext : africaContext)(viewport, spec.context);
		const beforeCountry = countryFeature(spec.country, 'removed', spec.before, viewport, { showLabel: true, labelPosition: spec.labelPosition });
		const afterCountry = countryFeature(spec.country, 'added', spec.after, viewport, { showLabel: true, labelPosition: spec.labelPosition });
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeCountry].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterCountry].filter(Boolean)),
			mapSourceNote: spec.source,
		};
	}

	if (event.id === 'cabo-verde-name') {
		const viewport = viewportOverrides[event.id];
		const context = [
			contextLandOrPoint('Senegal', 'Senegal', [-14.8, 14.5], viewport),
			pointFeature('Atlantic Ocean', 'context', [-24.8, 16.6]),
		];
		const beforeCapeVerde = smallIslandFeature('Cape Verde', 'removed', [-23.62, 15.1], {
			lonRadius: 0.58,
			latRadius: 0.36,
			labelPosition: [-23.6, 15.75],
		});
		const afterCaboVerde = smallIslandFeature('Cabo Verde', 'added', [-23.62, 15.1], {
			lonRadius: 0.58,
			latRadius: 0.36,
			labelPosition: [-23.6, 15.75],
		});
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeCapeVerde]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterCaboVerde]),
			mapSourceNote: 'Curated Cape Verde/Cabo Verde island-label comparison based on the 2013 international-name request, with Natural Earth-derived West Africa context; simplified for the checklist.',
		};
	}

	if (event.id === 'morocco-independence') {
		const viewport = viewportOverrides[event.id];
		const context = [
			countryFeature('Spain', 'context', 'Spain', viewport, { showLabel: true }),
			countryFeature('Algeria', 'context', 'Algeria', viewport, { showLabel: true, labelPosition: [1.8, 30.2] }),
			pointFeature('Spanish Sahara', 'context', [-11.6, 25.2], [-11.6, 25.2]),
		].filter(Boolean);
		const moroccoShape = [
			[-12.8, 27.7],
			[-10.4, 28.2],
			[-9.4, 30.1],
			[-8.8, 31.7],
			[-7.2, 32.8],
			[-6.1, 35.0],
			[-2.4, 35.5],
			[-1.2, 33.2],
			[-2.8, 31.6],
			[-4.6, 30.7],
			[-5.4, 29.3],
			[-7.9, 28.0],
		];
		const beforeMorocco = polygonFeature('French Morocco', 'removed', moroccoShape, { labelPosition: [-6.0, 31.5] });
		const afterMorocco = polygonFeature('Morocco', 'added', moroccoShape, { labelPosition: [-6.0, 31.5] });
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeMorocco]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterMorocco]),
			mapSourceNote: 'Curated French Morocco/Morocco comparison based on 1956 Moroccan independence references, with Natural Earth-derived North Africa context and Spanish Sahara shown separately; simplified for the checklist.',
		};
	}

	if (event.id === 'sudan-independence') {
		const viewport = viewportOverrides[event.id];
		const context = africaContext(viewport, ['Egypt', 'Libya', 'Chad', 'Ethiopia', 'Eritrea']);
		const beforeSudan = [
			countryFeature('Sudan', 'removed', 'Anglo-Egyptian Sudan', viewport, { showLabel: false }),
			countryFeature('South Sudan', 'removed', 'Anglo-Egyptian Sudan', viewport, { showLabel: false }),
			pointFeature('Anglo-Egyptian Sudan', 'removed', [30.4, 13.5], [30.4, 13.5]),
		].filter(Boolean);
		const afterSudan = [
			countryFeature('Sudan', 'added', 'Sudan', viewport, { showLabel: false }),
			countryFeature('South Sudan', 'added', 'Sudan', viewport, { showLabel: false }),
			pointFeature('Sudan', 'added', [30.4, 13.5], [30.4, 13.5]),
		].filter(Boolean);
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...beforeSudan]),
			afterMap: mapCollection('After', event.afterLabel, [...context, ...afterSudan]),
			mapSourceNote: 'Natural Earth-derived Sudan and South Sudan outlines grouped as pre-2011 Sudan, interpreted against 1956 Anglo-Egyptian Sudan independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'equatorial-guinea-independence') {
		const viewport = viewportOverrides[event.id];
		const context = africaContext(viewport, ['Cameroon', 'Gabon', 'Nigeria']);
		const spanishGuinea = countryFeature('Equatorial Guinea', 'removed', 'Spanish Guinea', viewport, {
			showLabel: true,
			labelPosition: [10.5, 1.6],
		});
		const equatorialGuinea = countryFeature('Equatorial Guinea', 'added', 'Equatorial Guinea', viewport, {
			showLabel: true,
			labelPosition: [10.5, 1.6],
		});
		const fernandoPo = pointFeature('Fernando Po', 'removed', [8.75, 3.5], [8.75, 3.5]);
		const bioko = pointFeature('Bioko', 'added', [8.75, 3.5], [8.75, 3.5]);
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, spanishGuinea, fernandoPo].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, equatorialGuinea, bioko].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Equatorial Guinea outline interpreted against 1968 Spanish Guinea independence references, with separate Fernando Po/Bioko marker; simplified for the checklist.',
		};
	}

	const africaIndependenceSpecs = {
		'libya-independence': {
			country: 'Libya',
			before: 'Italian / Allied Libya',
			after: 'Libya',
			context: ['Tunisia', 'Algeria', 'Chad', 'Sudan'],
			labelPosition: [17.2, 27.0],
		},
		'morocco-independence': {
			country: 'Morocco',
			before: 'French Morocco',
			after: 'Morocco',
			context: ['Algeria', 'Spain', 'Western Sahara'],
			labelPosition: [-6.0, 31.6],
		},
		'sudan-independence': {
			country: 'Sudan',
			before: 'Anglo-Egyptian Sudan',
			after: 'Sudan',
			context: ['Egypt', 'Libya', 'Chad', 'Ethiopia', 'South Sudan'],
			labelPosition: [30.3, 14.0],
		},
		'tunisia-independence': {
			country: 'Tunisia',
			before: 'French Tunisia',
			after: 'Tunisia',
			context: ['Algeria', 'Libya', 'Italy'],
			labelPosition: [9.2, 34.2],
		},
		'ghana-independence': {
			country: 'Ghana',
			before: 'Gold Coast',
			after: 'Ghana',
			context: ['Ivory Coast', 'Burkina Faso', 'Togo'],
			labelPosition: [-1.1, 7.7],
		},
		'guinea-independence': {
			country: 'Guinea',
			before: 'French Guinea',
			after: 'Guinea',
			context: ['Senegal', 'Mali', 'Ivory Coast', 'Sierra Leone', 'Guinea-Bissau'],
			labelPosition: [-10.7, 10.6],
		},
		'tanganyika-independence': {
			country: 'Tanzania',
			before: 'Tanganyika Territory',
			after: 'Tanganyika',
			context: ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Zambia', 'Mozambique'],
			labelPosition: [35.1, -6.2],
			beforeExtra: () => [pointFeature('Zanzibar', 'context', [39.2, -6.1])],
			afterExtra: () => [pointFeature('Zanzibar', 'context', [39.2, -6.1])],
		},
		'algeria-independence': {
			country: 'Algeria',
			before: 'French Algeria',
			after: 'Algeria',
			context: ['Morocco', 'Tunisia', 'Libya', 'Mali', 'Niger'],
			labelPosition: [2.6, 28.0],
		},
		'kenya-independence': {
			country: 'Kenya',
			before: 'Kenya Colony',
			after: 'Kenya',
			context: ['Uganda', 'Ethiopia', 'Somalia', 'Tanzania'],
			labelPosition: [37.8, 0.4],
		},
		'malawi-independence': {
			country: 'Malawi',
			before: 'Nyasaland',
			after: 'Malawi',
			context: ['Zambia', 'Mozambique', 'Tanzania'],
			labelPosition: [34.1, -13.5],
		},
		'tanzania-formation': {
			country: 'Tanzania',
			before: 'Tanganyika',
			after: 'Tanzania',
			context: ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Zambia', 'Mozambique'],
			labelPosition: [35.1, -6.2],
			beforeExtra: () => [pointFeature('Zanzibar separate', 'removed', [39.2, -6.1])],
			afterExtra: () => [pointFeature('Zanzibar in Tanzania', 'added', [39.2, -6.1])],
		},
		'zambia-independence': {
			country: 'Zambia',
			before: 'Northern Rhodesia',
			after: 'Zambia',
			context: ['Angola', 'Democratic Republic of the Congo', 'Tanzania', 'Malawi', 'Zimbabwe', 'Botswana', 'Namibia'],
			labelPosition: [27.8, -13.3],
		},
		'botswana-independence': {
			country: 'Botswana',
			before: 'Bechuanaland',
			after: 'Botswana',
			context: ['Namibia', 'Zimbabwe', 'South Africa'],
			labelPosition: [24.3, -22.0],
		},
		'lesotho-independence': {
			country: 'Lesotho',
			before: 'Basutoland',
			after: 'Lesotho',
			context: ['South Africa'],
			labelPosition: [28.2, -29.6],
		},
		'equatorial-guinea-independence': {
			country: 'Eq. Guinea',
			before: 'Spanish Guinea',
			after: 'Equatorial Guinea',
			context: ['Cameroon', 'Gabon', 'Nigeria'],
			labelPosition: [10.3, 1.6],
		},
		'guinea-bissau-independence': {
			country: 'Guinea-Bissau',
			before: 'Portuguese Guinea',
			after: 'Guinea-Bissau',
			context: ['Senegal', 'Guinea'],
			labelPosition: [-15.1, 11.8],
		},
		'djibouti-independence': {
			country: 'Djibouti',
			before: 'French Somaliland',
			after: 'Djibouti',
			context: ['Ethiopia', 'Somalia', 'Eritrea', 'Yemen'],
			labelPosition: [42.6, 11.8],
		},
		'namibia-independence': {
			country: 'Namibia',
			before: 'South West Africa',
			after: 'Namibia',
			context: ['Angola', 'Zambia', 'Botswana', 'South Africa'],
			labelPosition: [17.5, -22.1],
		},
	};
	if (africaIndependenceSpecs[event.id]) {
		const spec = africaIndependenceSpecs[event.id];
		const viewport = viewportOverrides[event.id];
		const context = africaContext(viewport, spec.context);
		const beforeCountry = countryFeature(spec.country, 'removed', spec.before, viewport, { showLabel: true, labelPosition: spec.labelPosition });
		const afterCountry = countryFeature(spec.country, 'added', spec.after, viewport, { showLabel: true, labelPosition: spec.labelPosition });
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeCountry, ...(spec.beforeExtra?.() ?? [])].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterCountry, ...(spec.afterExtra?.() ?? [])].filter(Boolean)),
			mapSourceNote: `Curated ${event.beforeLabel}/${event.afterLabel} comparison based on African independence and name-change references, with Natural Earth-derived regional context; simplified for the checklist.`,
		};
	}

	if (event.id === 'mauritius-independence') {
		const viewport = viewportOverrides[event.id];
		const context = [
			contextLandOrPoint('Madagascar', 'Madagascar', [47.5, -19.2], viewport, { labelPosition: [47.3, -18.3] }),
			smallIslandFeature('Reunion', 'context', [55.54, -21.1], {
				lonRadius: 0.18,
				latRadius: 0.12,
				labelPosition: [55.1, -21.6],
				labelSize: 'small',
			}),
		].filter(Boolean);
		const beforeMauritius = smallIslandFeature('British Mauritius', 'removed', [57.55, -20.2], {
			lonRadius: 0.75,
			latRadius: 0.55,
			labelPosition: [57.35, -19.75],
		});
		const afterMauritius = smallIslandFeature('Mauritius', 'added', [57.55, -20.2], {
			lonRadius: 0.75,
			latRadius: 0.55,
			labelPosition: [57.35, -19.75],
		});
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeMauritius]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterMauritius]),
			mapSourceNote: 'Curated British Mauritius/Mauritius island-label comparison based on 1968 Mauritius independence references, with Natural Earth-derived Indian Ocean context; simplified for the checklist.',
		};
	}

	if (event.id === 'cape-verde-independence') {
		const viewport = viewportOverrides[event.id];
		const context = [
			contextLandOrPoint('Senegal', 'Senegal', [-14.8, 14.5], viewport),
			pointFeature('Atlantic Ocean', 'context', [-24.8, 16.6]),
		];
		const beforeCapeVerde = smallIslandFeature('Portuguese Cape Verde', 'removed', [-23.62, 15.1], {
			lonRadius: 0.58,
			latRadius: 0.36,
			labelPosition: [-23.6, 15.75],
		});
		const afterCapeVerde = smallIslandFeature('Cape Verde', 'added', [-23.62, 15.1], {
			lonRadius: 0.58,
			latRadius: 0.36,
			labelPosition: [-23.6, 15.75],
		});
		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeCapeVerde]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterCapeVerde]),
			mapSourceNote: 'Curated Portuguese Cape Verde/Cape Verde island-label comparison based on 1975 Cape Verde independence references, with Natural Earth-derived West Africa context; simplified for the checklist.',
		};
	}

	if (event.id === 'dutch-east-india-company') {
		const viewport = { west: 94, south: -12.5, east: 132, north: 10 };
		const context = [
			countryFeature('Indonesia', 'context', 'East Indies', viewport, { showLabel: true, labelPosition: [113.5, -3.2] }),
			countryFeature('Malaysia', 'context', 'Malay Peninsula', viewport, { showLabel: true, labelPosition: [102.6, 4.2] }),
			countryFeature('Philippines', 'context', 'Philippines', viewport, { showLabel: true, labelPosition: [122.7, 7.8] }),
			countryFeature('Papua New Guinea', 'context', 'New Guinea', viewport, { showLabel: true, labelPosition: [128.8, -4.2] }),
		].filter(Boolean);
		const java = polygonFeature('Java and Batavia', 'added', [
			[105.0, -5.9],
			[106.2, -5.8],
			[107.8, -6.1],
			[109.5, -6.4],
			[111.2, -6.7],
			[113.0, -7.1],
			[114.6, -7.6],
			[114.2, -8.4],
			[112.4, -8.4],
			[110.4, -8.0],
			[108.0, -7.6],
			[106.0, -7.1],
			[105.0, -6.6],
		], { labelPosition: [109.8, -6.8], labelSize: 'normal' });
		const spiceIslands = pointFeature('Moluccas', 'added', [127.5, -3.0]);
		const batavia = pointFeature('Batavia', 'boundary', [106.8, -6.2], [103.8, -4.2]);
		const preDutch = pointFeature('Pre-Dutch East Indies', 'removed', [113.0, -4.8]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, preDutch]),
			afterMap: mapCollection('After', event.afterLabel, [...context, java, spiceIslands, batavia]),
			mapSourceNote: 'Curated Dutch East Indies comparison based on Dutch East India Company references and Natural Earth-derived maritime Southeast Asia context; simplified for the checklist.',
		};
	}

	if (event.id === 'westphalia') {
		const viewport = { west: 2.0, south: 45.0, east: 12.0, north: 53.8 };
		const context = [
			countryFeature('France', 'context', 'France', viewport, { showLabel: true }),
			countryFeature('Germany', 'context', 'Holy Roman Empire', viewport, { showLabel: true, labelPosition: [9.4, 50.4] }),
			countryFeature('Belgium', 'context', 'Spanish Netherlands', viewport, { showLabel: true, labelPosition: [4.6, 50.7] }),
		].filter(Boolean);
		const lowCountriesNorth = countryFeature('Netherlands', 'removed', 'Low Countries', viewport, {
			showLabel: false,
		});
		const lowCountriesSouth = countryFeature('Belgium', 'removed', 'Low Countries', viewport, {
			showLabel: false,
		});
		const lowCountriesLabel = pointFeature('Low Countries', 'removed', [5.1, 52.2], [5.1, 52.2]);
		const swissBefore = countryFeature('Switzerland', 'removed', 'Swiss lands', viewport, {
			showLabel: true,
			labelPosition: [8.1, 46.9],
			labelSize: 'small',
		});
		const dutchRepublic = countryFeature('Netherlands', 'added', 'Dutch Republic', viewport, {
			showLabel: true,
			labelPosition: [5.1, 52.5],
			labelSize: 'normal',
		});
		const spanishNetherlands = countryFeature('Belgium', 'context', 'Spanish Netherlands', viewport, {
			showLabel: true,
			labelPosition: [4.6, 50.7],
		});
		const swissConfederacy = countryFeature('Switzerland', 'added', 'Swiss Confederacy', viewport, {
			showLabel: true,
			labelPosition: [8.1, 46.9],
			labelSize: 'small',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, lowCountriesNorth, lowCountriesSouth, lowCountriesLabel, swissBefore].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context.filter((feature) => feature.properties.label !== 'Spanish Netherlands'), spanishNetherlands, dutchRepublic, swissConfederacy].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Netherlands, Belgium, and Switzerland outlines interpreted against Dutch and Swiss Westphalia references; simplified for the checklist.',
		};
	}

	if (event.id === 'great-britain') {
		const viewport = { west: -10.8, south: 49.0, east: 3.0, north: 59.5 };
		const context = [
			countryFeature('Ireland', 'context', 'Ireland', viewport, { showLabel: true }),
			countryFeature('France', 'context', 'France', viewport, { showLabel: true }),
			countryFeature('Netherlands', 'context', 'Netherlands', viewport, { showLabel: true }),
		].filter(Boolean);
		const england = polygonFeature('England', 'removed', [
			[-5.7, 50.1],
			[-4.4, 50.3],
			[-3.1, 50.7],
			[-1.6, 50.7],
			[0.5, 51.0],
			[1.5, 51.7],
			[1.4, 52.8],
			[0.5, 53.9],
			[-0.3, 54.8],
			[-1.2, 55.5],
			[-2.5, 55.1],
			[-3.0, 54.3],
			[-4.5, 53.5],
			[-5.0, 52.2],
			[-4.6, 51.4],
			[-5.7, 50.7],
		], { labelPosition: [-2.0, 52.7], labelSize: 'normal' });
		const scotland = polygonFeature('Scotland', 'removed', [
			[-5.5, 55.0],
			[-6.2, 55.7],
			[-5.6, 56.6],
			[-6.1, 57.4],
			[-5.2, 58.4],
			[-4.0, 58.7],
			[-2.2, 58.6],
			[-1.4, 57.8],
			[-1.8, 56.6],
			[-2.3, 55.8],
			[-3.6, 55.4],
		], { labelPosition: [-3.8, 56.8], labelSize: 'normal' });
		const greatBritain = polygonFeature('Great Britain', 'added', [
			[-5.7, 50.1],
			[-4.4, 50.3],
			[-3.1, 50.7],
			[-1.6, 50.7],
			[0.5, 51.0],
			[1.5, 51.7],
			[1.4, 52.8],
			[0.5, 53.9],
			[-0.3, 54.8],
			[-1.2, 55.5],
			[-1.8, 56.6],
			[-1.4, 57.8],
			[-2.2, 58.6],
			[-4.0, 58.7],
			[-5.2, 58.4],
			[-6.1, 57.4],
			[-5.6, 56.6],
			[-6.2, 55.7],
			[-5.5, 55.0],
			[-3.6, 55.4],
			[-2.5, 55.1],
			[-3.0, 54.3],
			[-4.5, 53.5],
			[-5.0, 52.2],
			[-4.6, 51.4],
			[-5.7, 50.7],
		], { labelPosition: [-3.0, 54.6], labelSize: 'large' });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, england, scotland]),
			afterMap: mapCollection('After', event.afterLabel, [...context, greatBritain]),
			mapSourceNote: 'Curated Great Britain comparison based on the 1707 Acts of Union references and Natural Earth-derived northwest Europe context; simplified for the checklist.',
		};
	}

	if (event.id === 'orange-free-state' || event.id === 'transvaal-republic' || event.id === 'union-of-south-africa') {
		const viewport = { west: 14, south: -36, east: 33, north: -18.5 };
		const context = [
			countryFeature('Namibia', 'context', 'Namibia', viewport, { showLabel: true }),
			countryFeature('Botswana', 'context', 'Botswana', viewport, { showLabel: true }),
			countryFeature('Zimbabwe', 'context', 'Zimbabwe', viewport, { showLabel: true }),
			countryFeature('Mozambique', 'context', 'Mozambique', viewport, { showLabel: false }),
			countryFeature('Lesotho', 'context', 'Lesotho', viewport, { showLabel: true }),
			countryFeature('Eswatini', 'context', 'Eswatini', viewport, { showLabel: true }),
		].filter(Boolean);
		const southAfricaContext = countryFeature('South Africa', 'context', 'South Africa', viewport, {
			showLabel: false,
		});
		const cape = polygonFeature('Cape Colony', 'removed', [
			[16.8, -34.7],
			[18.7, -34.8],
			[20.8, -34.6],
			[23.0, -34.0],
			[25.4, -33.4],
			[27.0, -32.4],
			[27.5, -31.1],
			[26.4, -30.2],
			[24.4, -30.0],
			[22.0, -29.3],
			[20.2, -30.0],
			[18.8, -30.4],
			[17.4, -31.6],
			[16.9, -33.2],
		], { labelPosition: [21.5, -32.3], labelSize: 'small' });
		const natal = polygonFeature('Natal', 'removed', [
			[28.8, -30.9],
			[30.2, -31.1],
			[31.5, -30.3],
			[32.1, -28.7],
			[31.4, -27.3],
			[30.2, -27.5],
			[29.1, -28.1],
			[28.4, -29.2],
		], { labelPosition: [30.0, -29.4], labelSize: 'small' });
		const orangeFreeState = polygonFeature('Orange Free State', event.id === 'orange-free-state' ? 'added' : 'removed', [
			[24.0, -30.7],
			[26.2, -30.7],
			[28.4, -30.4],
			[29.2, -29.2],
			[29.1, -27.6],
			[27.7, -26.8],
			[25.5, -26.8],
			[24.2, -27.7],
			[23.7, -29.2],
		], { labelPosition: [26.5, -28.8], labelSize: 'normal' });
		const transvaal = polygonFeature('Transvaal', event.id === 'transvaal-republic' ? 'added' : 'removed', [
			[24.5, -26.8],
			[27.7, -26.8],
			[30.5, -26.4],
			[31.8, -25.2],
			[31.4, -23.2],
			[29.5, -22.2],
			[27.0, -22.0],
			[25.2, -23.0],
			[24.2, -24.6],
		], { labelPosition: [28.3, -24.7], labelSize: 'normal' });
		const southAfrica = countryFeature('South Africa', 'added', 'Union of South Africa', viewport, {
			showLabel: true,
			labelPosition: [25.2, -29.0],
			labelSize: 'large',
		});
		const historicalContext = (feature) => ({
			...feature,
			properties: { ...feature.properties, role: 'context' },
		});

		if (event.id === 'orange-free-state') {
			const orangeRiverTerritory = {
				...orangeFreeState,
				properties: { ...orangeFreeState.properties, label: 'Orange River territory', role: 'removed' },
			};
			const capeContext = historicalContext(cape);
			const transvaalContext = historicalContext(transvaal);
			const natalContext = historicalContext(natal);

			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, southAfricaContext, capeContext, transvaalContext, natalContext, orangeRiverTerritory].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, southAfricaContext, capeContext, transvaalContext, natalContext, orangeFreeState].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived South Africa context with curated Orange River/Orange Free State overlay based on Boer republic references; simplified for the checklist.',
			};
		}

		if (event.id === 'transvaal-republic') {
			const boerSettlements = {
				...transvaal,
				properties: { ...transvaal.properties, label: 'Boer settlements', role: 'removed' },
			};
			const capeContext = historicalContext(cape);
			const orangeFreeStateContext = historicalContext(orangeFreeState);
			const natalContext = historicalContext(natal);

			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, southAfricaContext, capeContext, orangeFreeStateContext, natalContext, boerSettlements].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, southAfricaContext, capeContext, orangeFreeStateContext, natalContext, transvaal].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived South Africa context with curated Transvaal overlay based on Boer republic references; simplified for the checklist.',
			};
		}

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, southAfricaContext, cape, natal, orangeFreeState, transvaal].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, southAfrica].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived South Africa outline with curated pre-Union colony/republic overlays based on 1910 union references; simplified for the checklist.',
		};
	}

	if (event.id === 'congo-free-state' || event.id === 'belgian-congo') {
		const viewport = { west: 10, south: -14, east: 32, north: 7 };
		const context = [
			countryFeature('Republic of the Congo', 'context', 'French Congo', viewport, { showLabel: true }),
			countryFeature('Angola', 'context', 'Angola', viewport, { showLabel: true }),
			countryFeature('Zambia', 'context', 'Northern Rhodesia', viewport, { showLabel: true }),
			countryFeature('Central African Republic', 'context', 'Central Africa', viewport, { showLabel: true }),
			countryFeature('Rwanda', 'context', 'Rwanda', viewport, { showLabel: true }),
			countryFeature('Burundi', 'context', 'Burundi', viewport, { showLabel: true }),
		].filter(Boolean);
		const congo = countryFeature('Dem. Rep. Congo', 'removed', event.id === 'belgian-congo' ? 'Congo Free State' : 'Congo Basin', viewport, {
			showLabel: true,
			labelPosition: [22.0, -3.5],
			labelSize: 'large',
		});
		const afterCongo = countryFeature('Dem. Rep. Congo', 'added', event.id === 'belgian-congo' ? 'Belgian Congo' : 'Congo Free State', viewport, {
			showLabel: true,
			labelPosition: [22.0, -3.5],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, congo].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterCongo].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Democratic Republic of the Congo outline interpreted against Congo Free State / Belgian Congo historical references; simplified for the checklist.',
		};
	}

	if (event.id === 'united-states') {
		const viewport = viewportOverrides[event.id];
		const context = easternNorthAmericaContext(viewport);
		const colonies = polygonFeature('British colonies', 'removed', [
			[-81.3, 31.0],
			[-80.7, 32.2],
			[-79.4, 33.4],
			[-78.6, 34.6],
			[-77.6, 35.8],
			[-76.4, 36.9],
			[-75.3, 38.0],
			[-74.1, 39.4],
			[-73.4, 40.7],
			[-72.0, 41.3],
			[-70.6, 42.4],
			[-69.2, 44.2],
			[-68.6, 45.1],
			[-70.2, 44.6],
			[-72.8, 43.6],
			[-74.8, 42.1],
			[-76.2, 40.2],
			[-78.1, 37.2],
			[-79.5, 34.5],
		], { labelPosition: [-75.6, 38.5], labelSize: 'large' });
		const unitedStates = {
			...colonies,
			properties: { ...colonies.properties, label: 'United States', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, colonies]),
			afterMap: mapCollection('After', event.afterLabel, [...context, unitedStates]),
			mapSourceNote: 'Curated colonial North America comparison based on the Census/USGS Territorial Acquisitions map and Natural Earth-derived surrounding geography; simplified for the checklist.',
		};
	}

	if (event.id === 'florida-cession') {
		const viewport = viewportOverrides[event.id];
		const context = [
			countryFeature('United States of America', 'context', 'United States', viewport, { showLabel: true }),
			countryFeature('Cuba', 'context', 'Cuba', viewport, { showLabel: true }),
			countryFeature('The Bahamas', 'context', 'Bahamas', viewport, { showLabel: true }),
		].filter(Boolean);
		const florida = polygonFeature('Spanish Florida', 'removed', [
			[-87.6, 30.3],
			[-86.0, 30.5],
			[-84.0, 30.6],
			[-82.4, 30.4],
			[-81.2, 29.2],
			[-80.6, 27.6],
			[-80.3, 26.2],
			[-80.7, 25.2],
			[-81.7, 24.7],
			[-82.6, 25.4],
			[-82.9, 27.0],
			[-83.8, 28.8],
			[-85.2, 29.8],
			[-86.8, 30.0],
		], { labelPosition: [-83.4, 28.7], labelSize: 'large' });
		const usFlorida = {
			...florida,
			properties: { ...florida.properties, label: 'U.S. Florida', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, florida]),
			afterMap: mapCollection('After', event.afterLabel, [...context, usFlorida]),
			mapSourceNote: 'Curated Florida cession comparison based on the Census/USGS Territorial Acquisitions map and Natural Earth-derived surrounding geography; simplified for the checklist.',
		};
	}

	if (event.id === 'california-statehood') {
		const viewport = viewportOverrides[event.id];
		const context = [
			countryFeature('United States of America', 'context', 'United States', viewport, { showLabel: false }),
			countryFeature('Mexico', 'context', 'Mexico', viewport, { showLabel: true }),
			pointFeature('Oregon', 'context', [-121.5, 42.4]),
			pointFeature('Nevada / Utah', 'context', [-116.3, 39.5]),
		].filter(Boolean);
		const california = polygonFeature('California territory', 'removed', [
			[-124.4, 42.0],
			[-122.2, 42.0],
			[-120.0, 42.0],
			[-114.1, 32.7],
			[-117.1, 32.5],
			[-118.4, 33.6],
			[-119.4, 34.1],
			[-120.3, 35.6],
			[-121.8, 37.2],
			[-122.7, 38.2],
			[-123.7, 39.8],
			[-124.2, 41.0],
		], { labelPosition: [-120.3, 37.2], labelSize: 'large' });
		const state = {
			...california,
			properties: { ...california.properties, label: 'California, U.S.', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, california]),
			afterMap: mapCollection('After', event.afterLabel, [...context, state]),
			mapSourceNote: 'Curated California statehood comparison based on the Census/USGS Territorial Acquisitions map and Natural Earth-derived surrounding geography; simplified for the checklist.',
		};
	}

	if (event.id === 'alaska-purchase') {
		const viewport = viewportOverrides[event.id];
		const context = [
			countryFeature('Canada', 'context', 'Canada', viewport, { showLabel: true }),
			pointFeature('Bering Sea', 'context', [-166, 58]),
		].filter(Boolean);
		const alaska = polygonFeature('Russian America', 'removed', [
			[-169.5, 54.5],
			[-164.8, 55.5],
			[-161.0, 58.4],
			[-154.5, 58.2],
			[-149.0, 59.5],
			[-141.0, 60.2],
			[-141.0, 69.2],
			[-147.0, 70.5],
			[-155.0, 71.0],
			[-162.0, 69.5],
			[-166.5, 67.4],
			[-169.0, 63.4],
			[-170.0, 59.2],
		], { labelPosition: [-153.8, 64.2], labelSize: 'large' });
		const usAlaska = {
			...alaska,
			properties: { ...alaska.properties, label: 'Alaska, U.S.', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, alaska]),
			afterMap: mapCollection('After', event.afterLabel, [...context, usAlaska]),
			mapSourceNote: 'Curated Alaska purchase comparison based on the Census/USGS Territorial Acquisitions map and Natural Earth-derived surrounding geography; simplified for the checklist.',
		};
	}

	if (event.id === 'dakota-statehood') {
		const viewport = viewportOverrides[event.id];
		const context = [
			pointFeature('Montana', 'context', [-105.2, 47.2]),
			pointFeature('Minnesota', 'context', [-94.8, 46.2], [-96.1, 46.2]),
			pointFeature('Nebraska', 'context', [-99.6, 42.6]),
			pointFeature('Canada', 'context', [-100.5, 49.4]),
		];
		const dakota = polygonFeature('Dakota', 'removed', [
			[-104.1, 43.0],
			[-96.4, 43.0],
			[-96.4, 49.0],
			[-104.1, 49.0],
		], { labelPosition: [-100.3, 46.1], labelSize: 'large' });
		const northDakota = polygonFeature('North Dakota', 'added', [
			[-104.1, 45.95],
			[-96.4, 45.95],
			[-96.4, 49.0],
			[-104.1, 49.0],
		], { labelPosition: [-100.3, 47.6] });
		const southDakota = polygonFeature('South Dakota', 'added', [
			[-104.1, 43.0],
			[-96.4, 43.0],
			[-96.4, 45.95],
			[-104.1, 45.95],
		], { labelPosition: [-100.3, 44.6] });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, dakota]),
			afterMap: mapCollection('After', event.afterLabel, [...context, northDakota, southDakota]),
			mapSourceNote: 'Curated Dakota split comparison based on historical Dakota Territory references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'india-pakistan') {
		const viewport = { west: 58, south: 2, east: 102, north: 39 };
		const context = southAsiaContext(viewport, ['Afghanistan', 'Iran', 'China', 'Nepal', 'Bhutan', 'Sri Lanka', 'Myanmar']);
		const britishIndiaParts = [
			countryFeature('India', 'removed', 'British India', viewport, { showLabel: false }),
			countryFeature('Pakistan', 'removed', 'British India', viewport, { showLabel: false }),
			countryFeature('Bangladesh', 'removed', 'British India', viewport, { showLabel: false }),
			pointFeature('British India', 'removed', [79.0, 21.6], [79.0, 21.6]),
		].filter(Boolean);
		const westPakistan = countryFeature('Pakistan', 'added', 'West Pakistan', viewport, {
			showLabel: true,
			labelPosition: [68.6, 28.6],
		});
		const india = countryFeature('India', 'added', 'India', viewport, {
			showLabel: true,
			labelPosition: [80.3, 21.0],
			labelSize: 'large',
		});
		const eastPakistan = countryFeature('Bangladesh', 'added', 'East Pakistan', viewport, {
			showLabel: true,
			labelPosition: [90.1, 23.8],
			labelSize: 'small',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...britishIndiaParts]),
			afterMap: mapCollection('After', event.afterLabel, [...context, westPakistan, india, eastPakistan].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived India, Pakistan, and Bangladesh outlines grouped as British India / post-partition states, interpreted against 1947 Partition references; simplified for the checklist.',
		};
	}

	if (event.id === 'afghanistan-independence') {
		const viewport = { west: 58, south: 27, east: 78, north: 40 };
		const context = southAsiaContext(viewport, ['Iran', 'Pakistan', 'India', 'China']);
		const afghanistanBefore = countryFeature('Afghanistan', 'removed', 'British influence', viewport, {
			showLabel: true,
			labelPosition: [66.8, 34.0],
			labelSize: 'large',
		});
		const afghanistanAfter = countryFeature('Afghanistan', 'added', 'Afghanistan', viewport, {
			showLabel: true,
			labelPosition: [66.8, 34.0],
			labelSize: 'large',
		});
		const durandLine = lineFeature('Durand Line', 'boundary', [
			[69.8, 31.5],
			[70.6, 33.0],
			[71.4, 34.4],
			[72.1, 35.5],
		]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, afghanistanBefore, durandLine].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afghanistanAfter, durandLine].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Afghanistan outline interpreted against Treaty of Rawalpindi / Anglo-Afghan War references; simplified for the checklist.',
		};
	}

	if (event.id === 'burma-separates-india') {
		const viewport = { west: 78, south: 7, east: 103, north: 30 };
		const context = southAsiaContext(viewport, ['China', 'Thailand', 'Sri Lanka']);
		const britishIndiaBefore = [
			countryFeature('India', 'context', 'British India', viewport, { showLabel: false }),
			countryFeature('Pakistan', 'context', 'British India', viewport, { showLabel: false }),
			countryFeature('Bangladesh', 'context', 'British India', viewport, { showLabel: false }),
			pointFeature('British India', 'context', [82.2, 22.0], [82.2, 22.0]),
		].filter(Boolean);
		const britishIndiaAfter = [
			countryFeature('India', 'context', 'British India', viewport, { showLabel: false }),
			countryFeature('Pakistan', 'context', 'British India', viewport, { showLabel: false }),
			countryFeature('Bangladesh', 'context', 'British India', viewport, { showLabel: false }),
			pointFeature('British India', 'context', [82.2, 22.0], [82.2, 22.0]),
		].filter(Boolean);
		const burmaWithinIndia = countryFeature('Myanmar', 'removed', 'Burma in British India', viewport, {
			showLabel: true,
			labelPosition: [95.3, 20.3],
			labelSize: 'normal',
		});
		const burma = countryFeature('Myanmar', 'added', 'Burma', viewport, {
			showLabel: true,
			labelPosition: [95.1, 21.0],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...britishIndiaBefore, burmaWithinIndia].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, ...britishIndiaAfter, burma].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Myanmar/Burma outline interpreted against 1937 Burma separation references; simplified for the checklist.',
		};
	}

	if (event.id === 'sri-lanka-independence' || event.id === 'sri-lanka-name') {
		const viewport = { west: 77, south: 5, east: 84, north: 11.2 };
		const context = [
			countryFeature('India', 'context', 'India', viewport, { showLabel: true }),
			pointFeature('Indian Ocean', 'context', [82.3, 6.0], [82.3, 6.0]),
		].filter(Boolean);
		const beforeName = event.id === 'sri-lanka-independence' ? 'British Ceylon' : 'Ceylon';
		const afterName = event.id === 'sri-lanka-independence' ? 'Ceylon' : 'Sri Lanka';
		const ceylonBefore = countryFeature('Sri Lanka', 'removed', beforeName, viewport, {
			showLabel: true,
			labelPosition: [80.6, 7.8],
			labelSize: 'large',
		});
		const ceylonAfter = countryFeature('Sri Lanka', 'added', afterName, viewport, {
			showLabel: true,
			labelPosition: [80.6, 7.8],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ceylonBefore].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, ceylonAfter].filter(Boolean)),
			mapSourceNote: `Natural Earth-derived Sri Lanka outline interpreted against Sri Lanka/Ceylon historical name references; simplified for the checklist.`,
		};
	}

	if (event.id === 'bangladesh') {
		const viewport = { west: 84.5, south: 19, east: 94.5, north: 27.6 };
		const context = southAsiaContext(viewport, ['India', 'Myanmar']);
		const eastPakistan = countryFeature('Bangladesh', 'removed', 'East Pakistan', viewport, {
			showLabel: true,
			labelPosition: [90.2, 23.8],
			labelSize: 'large',
		});
		const bangladesh = countryFeature('Bangladesh', 'added', 'Bangladesh', viewport, {
			showLabel: true,
			labelPosition: [90.2, 23.8],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, eastPakistan].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, bangladesh].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Bangladesh outline interpreted against East Pakistan/Bangladesh historical references; simplified for the checklist.',
		};
	}

	if (event.id === 'turkey-republic') {
		const viewport = { west: 24, south: 34, east: 46, north: 43.5 };
		const context = middleEastContext(viewport, ['Greece', 'Bulgaria', 'Syria', 'Iraq', 'Iran']);
		const anatolia = countryFeature('Turkey', 'removed', 'Ottoman Empire', viewport, {
			showLabel: true,
			labelPosition: [35.5, 39.0],
			labelSize: 'large',
		});
		const turkey = countryFeature('Turkey', 'added', 'Turkey', viewport, {
			showLabel: true,
			labelPosition: [35.5, 39.0],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, anatolia].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, turkey].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Turkey outline interpreted against Ottoman Empire/Turkish Republic references; simplified for the checklist.',
		};
	}

	if (event.id === 'saudi-arabia-iraq') {
		const viewport = { west: 32, south: 12, east: 58, north: 38 };
		const context = middleEastContext(viewport, ['Turkey', 'Syria', 'Jordan', 'Iran', 'Oman', 'Egypt']);
		const mandateIraq = countryFeature('Iraq', 'removed', 'Mandate Iraq', viewport, {
			showLabel: true,
			labelPosition: [43.8, 33.2],
		});
		const arabia = countryFeature('Saudi Arabia', 'removed', 'Hejaz / Nejd', viewport, {
			showLabel: true,
			labelPosition: [44.5, 23.4],
			labelSize: 'large',
		});
		const iraq = countryFeature('Iraq', 'added', 'Iraq', viewport, {
			showLabel: true,
			labelPosition: [43.8, 33.2],
		});
		const saudiArabia = countryFeature('Saudi Arabia', 'added', 'Saudi Arabia', viewport, {
			showLabel: true,
			labelPosition: [44.5, 23.4],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, mandateIraq, arabia].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, iraq, saudiArabia].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Iraq and Saudi Arabia outlines interpreted against Mandate Iraq and Hejaz/Nejd-to-Saudi-Arabia references; simplified for the checklist.',
		};
	}

	if (event.id === 'persia-iran') {
		const viewport = { west: 42, south: 24, east: 65, north: 41 };
		const context = middleEastContext(viewport, ['Turkey', 'Iraq', 'Saudi Arabia', 'Afghanistan', 'Pakistan']);
		const persia = countryFeature('Iran', 'removed', 'Persia', viewport, { labelSize: 'large', showLabel: true });
		const iran = countryFeature('Iran', 'added', 'Iran', viewport, { labelSize: 'large', showLabel: true });
		const gulf = pointFeature('Persian Gulf', 'context', [51.0, 27.5]);
		const caspian = pointFeature('Caspian Sea', 'context', [51.0, 38.6]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, persia, gulf, caspian].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, iran, gulf, caspian].filter(Boolean)),
			mapSourceNote: 'Curated Persia/Iran name comparison based on 1935 Iran-name historical references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'hatay-to-turkey') {
		const viewport = { west: 34.6, south: 35.4, east: 37.2, north: 37.4 };
		const context = middleEastContext(viewport, ['Turkey', 'Syria']);
		const hatay = polygonFeature('Hatay / Alexandretta', 'removed', [
			[35.76, 35.82],
			[36.02, 35.78],
			[36.26, 35.82],
			[36.48, 36.02],
			[36.62, 36.28],
			[36.44, 36.50],
			[36.18, 36.66],
			[35.94, 36.55],
			[35.78, 36.32],
			[35.72, 36.05],
		], { labelPosition: [36.12, 36.18], labelSize: 'large' });
		const turkishHatay = {
			...hatay,
			properties: { ...hatay.properties, label: 'Hatay in Turkey', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, hatay]),
			afterMap: mapCollection('After', event.afterLabel, [...context, turkishHatay]),
			mapSourceNote: 'Curated Hatay transfer comparison based on 1939 Hatay/Turkey historical references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'jordan-independence') {
		const viewport = { west: 33, south: 28.5, east: 40.5, north: 34.5 };
		const context = middleEastContext(viewport, ['Israel', 'Syria', 'Iraq', 'Saudi Arabia', 'Egypt']);
		const transjordan = countryFeature('Jordan', 'removed', 'Transjordan', viewport, {
			showLabel: true,
			labelPosition: [37.0, 31.5],
			labelSize: 'large',
		});
		const jordan = countryFeature('Jordan', 'added', 'Jordan', viewport, {
			showLabel: true,
			labelPosition: [37.0, 31.5],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, transjordan].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, jordan].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Jordan outline interpreted against 1946 Transjordan/Jordan independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'united-arab-republic') {
		const viewport = { west: 24, south: 20, east: 43, north: 38 };
		const context = middleEastContext(viewport, ['Israel', 'Jordan', 'Saudi Arabia', 'Iraq', 'Turkey']);
		const egypt = countryFeature('Egypt', 'removed', 'Egypt', viewport, {
			showLabel: true,
			labelPosition: [29.6, 26.8],
			labelSize: 'large',
		});
		const syria = countryFeature('Syria', 'removed', 'Syria', viewport, {
			showLabel: true,
			labelPosition: [38.4, 35.0],
		});
		const uarEgypt = countryFeature('Egypt', 'added', 'U.A.R.', viewport, {
			showLabel: true,
			labelPosition: [29.6, 26.8],
			labelSize: 'large',
		});
		const uarSyria = countryFeature('Syria', 'added', 'U.A.R.', viewport, {
			showLabel: true,
			labelPosition: [38.4, 35.0],
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, egypt, syria].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, uarEgypt, uarSyria].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Egypt/Syria outlines interpreted against 1958 United Arab Republic references; simplified for the checklist.',
		};
	}

	if (event.id === 'south-yemen-independence' || event.id === 'yemen-unification') {
		const viewport = { west: 41, south: 11, east: 56, north: 19.2 };
		const context = middleEastContext(viewport, ['Saudi Arabia', 'Oman', 'Djibouti', 'Eritrea']);
		const yemenContext = countryFeature('Yemen', 'context', 'Yemen', viewport, {
			showLabel: false,
		});
		const splitYemen = countryFeature('Yemen', 'removed', event.id === 'yemen-unification' ? 'North and South Yemen' : 'Aden Protectorate', viewport, {
			showLabel: false,
		});
		const unifiedYemen = countryFeature('Yemen', 'added', 'Yemen', viewport, {
			showLabel: true,
			labelPosition: [47.5, 14.9],
			labelSize: 'large',
		});
		const northYemen = polygonFeature('North Yemen', event.id === 'yemen-unification' ? 'removed' : 'context', [
			[42.2, 14.4],
			[42.8, 15.2],
			[43.5, 16.0],
			[44.3, 17.1],
			[45.6, 17.5],
			[47.0, 17.0],
			[48.1, 16.5],
			[48.6, 15.3],
			[48.2, 14.2],
			[46.6, 14.0],
			[45.0, 13.7],
			[43.6, 13.7],
		], { labelPosition: [45.3, 15.8] });
		const southYemenBefore = polygonFeature(event.id === 'yemen-unification' ? 'South Yemen' : 'Aden Protectorate', 'removed', [
			[43.22, 13.22],
			[43.48, 12.64],
			[44.18, 12.59],
			[44.49, 12.72],
			[44.99, 12.70],
			[45.14, 12.95],
			[45.41, 13.03],
			[45.63, 13.29],
			[45.88, 13.35],
			[46.72, 13.40],
			[47.35, 13.59],
			[47.94, 14.01],
			[48.24, 13.95],
			[48.68, 14.00],
			[49.57, 14.71],
			[51.17, 15.18],
			[52.17, 15.60],
			[52.80, 16.00],
			[48.90, 15.80],
			[47.10, 15.20],
			[45.00, 13.90],
			[43.60, 13.70],
		], { labelPosition: [48.7, 13.9], labelSize: 'large' });
		const southYemenAfter = {
			...southYemenBefore,
			properties: { ...southYemenBefore.properties, label: 'South Yemen', role: 'added' },
		};
		const formerBorder = lineFeature('former border', 'boundary', [
			[43.6, 13.7],
			[45.0, 13.9],
			[47.1, 15.2],
			[48.9, 15.8],
			[52.8, 16.0],
		], { showLabel: false });

		if (event.id === 'south-yemen-independence') {
			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, yemenContext, northYemen, southYemenBefore, formerBorder].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, yemenContext, northYemen, southYemenAfter, formerBorder].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived Yemen outline with curated Aden Protectorate/South Yemen split based on 1967 independence references; simplified for the checklist.',
			};
		}

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, splitYemen, northYemen, southYemenBefore, formerBorder].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, unifiedYemen].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Yemen outline with curated North/South Yemen border based on 1990 unification references; simplified for the checklist.',
		};
	}

	if (event.id === 'uae-independence' || event.id === 'qatar-independence') {
		const viewport = { west: 48, south: 21, east: 58, north: 28.5 };
		const context = middleEastContext(viewport, ['Saudi Arabia', 'Iran', 'Oman', 'Bahrain']);
		const trucialStates = countryFeature('United Arab Emirates', 'removed', 'Trucial States', viewport, {
			showLabel: true,
			labelPosition: [54.4, 24.2],
			labelSize: 'large',
		});
		const trucialStatesContext = countryFeature('United Arab Emirates', 'context', 'Trucial States', viewport, {
			showLabel: true,
			labelPosition: [54.4, 24.2],
		});
		const uae = countryFeature('United Arab Emirates', 'added', 'United Arab Emirates', viewport, {
			showLabel: true,
			labelPosition: [54.4, 24.2],
			labelSize: 'large',
		});
		const uaeContext = countryFeature('United Arab Emirates', 'context', 'United Arab Emirates', viewport, {
			showLabel: true,
			labelPosition: [54.4, 24.2],
		});
		const qatarBefore = countryFeature('Qatar', 'removed', 'British-protected Qatar', viewport, {
			showLabel: true,
			labelPosition: [51.25, 25.45],
			labelSize: 'small',
		});
		const qatarAfter = countryFeature('Qatar', 'added', 'Qatar', viewport, {
			showLabel: true,
			labelPosition: [51.25, 25.45],
			labelSize: 'small',
		});
		const qatarContext = countryFeature('Qatar', 'context', 'Qatar', viewport, {
			showLabel: true,
			labelPosition: [51.25, 25.45],
			labelSize: 'small',
		});

		if (event.id === 'uae-independence') {
			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, trucialStates, qatarContext].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, uae, qatarContext].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived United Arab Emirates and Qatar outlines interpreted against 1971 UAE formation references; simplified for the checklist.',
			};
		}

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, trucialStatesContext, qatarBefore].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, trucialStatesContext, qatarAfter].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Qatar and Trucial States/UAE outlines interpreted against 1971 Qatar independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'philippines-independence') {
		const viewport = { west: 115, south: 4, east: 128, north: 21 };
		const context = southeastAsiaContext(viewport, ['China', 'Taiwan', 'Vietnam', 'Malaysia', 'Indonesia']);
		const philippines = countryFeature('Philippines', 'removed', 'Philippine Islands (U.S.)', viewport, {
			showLabel: true,
			labelPosition: [122.1, 12.6],
			labelSize: 'large',
		});
		const independentPhilippines = countryFeature('Philippines', 'added', 'Philippines', viewport, {
			showLabel: true,
			labelPosition: [122.1, 12.6],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, philippines].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, independentPhilippines].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Philippines outline interpreted against 1946 Philippines independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'indonesia-independence') {
		const viewport = { west: 94, south: -12, east: 143, north: 8 };
		const context = southeastAsiaContext(viewport, ['Malaysia', 'Philippines', 'Australia']);
		const indonesia = countryFeature('Indonesia', 'removed', 'Netherlands Indies', viewport, {
			showLabel: true,
			labelPosition: [116.8, -3.8],
			labelSize: 'large',
		});
		const independentIndonesia = countryFeature('Indonesia', 'added', 'Indonesia', viewport, {
			showLabel: true,
			labelPosition: [116.8, -3.8],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, indonesia].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, independentIndonesia].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Indonesian archipelago outline interpreted against Netherlands Indies / Indonesian sovereignty-transfer references; simplified for the checklist.',
		};
	}

	if (event.id === 'korea-divided') {
		const viewport = { west: 124, south: 33, east: 132, north: 43.5 };
		const context = [
			countryFeature('China', 'context', 'China', viewport, { showLabel: false }),
			countryFeature('Japan', 'context', 'Japan', viewport, { showLabel: true }),
			countryFeature('Russia', 'context', 'Russia', viewport, { showLabel: true }),
		].filter(Boolean);
		const koreaNorth = countryFeature('North Korea', 'removed', 'Korea', viewport, {
			showLabel: false,
		});
		const koreaSouth = countryFeature('South Korea', 'removed', 'Korea', viewport, {
			showLabel: false,
		});
		const northKorea = countryFeature('North Korea', 'added', 'North Korea', viewport, {
			showLabel: true,
			labelPosition: [127.8, 40.0],
		});
		const southKorea = countryFeature('South Korea', 'added', 'South Korea', viewport, {
			showLabel: true,
			labelPosition: [127.7, 36.0],
		});
		const koreaLabel = pointFeature('Korea', 'removed', [127.8, 38.2], [127.8, 38.2]);
		const parallel = lineFeature('38th parallel', 'boundary', [
			[125.4, 38.0],
			[129.8, 38.0],
		]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, koreaNorth, koreaSouth, koreaLabel, parallel].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, northKorea, southKorea, parallel].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Korean peninsula outlines interpreted against postwar Korea division references; simplified for the checklist.',
		};
	}

	if (event.id === 'north-south-vietnam' || event.id === 'vietnam-unification') {
		const viewport = { west: 101, south: 8, east: 110, north: 24 };
		const context = southeastAsiaContext(viewport, ['China', 'Laos', 'Cambodia', 'Thailand']);
		const vietnamContext = countryFeature('Vietnam', 'context', 'Vietnam', viewport, { showLabel: false });
		const vietnam = countryFeature('Vietnam', 'removed', 'Vietnam / French Indochina', viewport, {
			showLabel: true,
			labelPosition: [106.6, 16.0],
			labelSize: 'large',
		});
		const northVietnam = polygonFeature('North Vietnam', event.id === 'vietnam-unification' ? 'removed' : 'added', [
			[102.8, 22.5],
			[104.5, 22.7],
			[106.0, 23.2],
			[107.4, 22.6],
			[108.5, 21.4],
			[108.3, 20.2],
			[107.5, 18.9],
			[107.2, 17.0],
			[105.7, 17.0],
			[104.7, 18.0],
			[103.9, 19.4],
			[103.2, 20.8],
		], { labelPosition: [106.0, 20.0] });
		const southVietnam = polygonFeature('South Vietnam', event.id === 'vietnam-unification' ? 'removed' : 'added', [
			[105.7, 17.0],
			[107.2, 17.0],
			[107.9, 16.0],
			[108.6, 14.5],
			[109.3, 12.8],
			[109.1, 11.2],
			[107.8, 9.8],
			[106.7, 8.8],
			[105.3, 9.0],
			[104.5, 10.2],
			[105.0, 12.2],
			[105.5, 14.2],
			[105.8, 15.8],
		], { labelPosition: [106.9, 12.8] });
		const dmz = lineFeature('17th parallel', 'boundary', [
			[105.6, 17.0],
			[107.6, 17.0],
		]);
		const unifiedVietnam = countryFeature('Vietnam', 'added', 'Vietnam', viewport, {
			showLabel: true,
			labelPosition: [106.6, 16.0],
			labelSize: 'large',
		});

		if (event.id === 'north-south-vietnam') {
			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, vietnam, dmz].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, vietnamContext, northVietnam, southVietnam, dmz].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived Vietnam outline with curated 17th-parallel split based on Geneva Accords / two Vietnams references; simplified for the checklist.',
			};
		}

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, vietnamContext, northVietnam, southVietnam, dmz].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, unifiedVietnam].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Vietnam outline with curated 17th-parallel split based on 1976 Vietnam reunification references; simplified for the checklist.',
		};
	}

	if (event.id === 'malaya-malaysia') {
		const viewport = { west: 95, south: -1.5, east: 121, north: 8.5 };
		const context = southeastAsiaContext(viewport, ['Thailand', 'Indonesia', 'Vietnam']);
		const malayStates = countryFeature('Malaysia', 'removed', 'Malay states', viewport, {
			showLabel: false,
			labelPosition: [105.4, 3.8],
			labelSize: 'large',
		});
		const malaya = pointFeature('Malaya', 'removed', [101.5, 3.8], [101.5, 3.8]);
		const borneoStates = pointFeature('Borneo states', 'removed', [114.2, 4.4], [114.2, 4.4]);
		const malaysia = countryFeature('Malaysia', 'added', 'Malaysia', viewport, {
			showLabel: true,
			labelPosition: [105.4, 3.8],
			labelSize: 'large',
		});
		const sabahSarawak = pointFeature('Sabah / Sarawak', 'added', [114.2, 4.4], [114.2, 4.4]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, malayStates, malaya, borneoStates].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, malaysia, sabahSarawak].filter(Boolean)),
			mapSourceNote: 'Curated Malaya/Malaysia comparison based on Malaya and Malaysia formation references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'burma-myanmar') {
		const viewport = { west: 91, south: 9, east: 101, north: 28.5 };
		const context = southeastAsiaContext(viewport, ['India', 'Bangladesh', 'China', 'Thailand', 'Laos']);
		const burma = countryFeature('Myanmar', 'removed', 'Burma', viewport, {
			showLabel: true,
			labelPosition: [95.3, 21.0],
			labelSize: 'large',
		});
		const myanmar = countryFeature('Myanmar', 'added', 'Myanmar', viewport, {
			showLabel: true,
			labelPosition: [95.3, 21.0],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, burma].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, myanmar].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Myanmar/Burma outline interpreted against 1989 Burma/Myanmar name-change references; simplified for the checklist.',
		};
	}

	if (event.id === 'east-timor-independence') {
		const viewport = { west: 119, south: -11.2, east: 128, north: -6.5 };
		const context = southeastAsiaContext(viewport, ['Indonesia', 'Australia']);
		const eastTimor = countryFeature('Timor-Leste', 'removed', 'Indonesian East Timor', viewport, {
			showLabel: true,
			labelPosition: [125.8, -8.9],
			labelSize: 'large',
		});
		const timorLeste = countryFeature('Timor-Leste', 'added', 'East Timor', viewport, {
			showLabel: true,
			labelPosition: [125.8, -8.9],
			labelSize: 'large',
		});
		const westTimor = pointFeature('West Timor', 'context', [122.5, -9.0], [122.5, -9.0]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, westTimor, eastTimor]),
			afterMap: mapCollection('After', event.afterLabel, [...context, westTimor, timorLeste]),
			mapSourceNote: 'Curated East Timor comparison based on East Timor/Indonesia separation references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'year-of-africa') {
		const viewport = { west: -25, south: -30, east: 58, north: 25 };
		const context = africaContext(viewport, ['Ghana', 'Guinea', 'Liberia', 'Ethiopia', 'Sudan', 'Angola', 'Tanzania']);
		const westAfricaNames = ['Senegal', 'Mali', 'Mauritania', 'Niger', 'Benin', 'Burkina Faso', "Côte d'Ivoire", 'Togo'];
		const centralAfricaNames = ['Cameroon', 'Central African Rep.', 'Chad', 'Congo', 'Gabon'];
		const otherNames = ['Dem. Rep. Congo', 'Nigeria', 'Somalia', 'Madagascar'];
		const focusNames = [...westAfricaNames, ...centralAfricaNames, ...otherNames];
		const colonialParts = focusNames.map((name) => countryFeature(name, 'removed', name, viewport, { showLabel: false })).filter(Boolean);
		const colonialLabels = [
			pointFeature('French West Africa', 'removed', [-4.0, 12.5], [-4.0, 12.5]),
			pointFeature('French Equatorial Africa', 'removed', [17.8, 8.7], [17.8, 8.7]),
			pointFeature('Belgian Congo', 'removed', [22.0, -1.0], [22.0, -1.0]),
			pointFeature('British Nigeria / Somalia', 'removed', [38.5, 4.6], [38.5, 4.6]),
		];
		const afterStates = [
			...westAfricaNames.map((name) => countryFeature(name, 'added', name, viewport, {
				showLabel: ['Senegal', 'Mali', 'Niger'].includes(name),
				labelSize: 'small',
			})),
			...centralAfricaNames.map((name) => countryFeature(name, 'added', name === 'Central African Rep.' ? 'Central African Republic' : name, viewport, {
				showLabel: ['Cameroon', 'Chad'].includes(name),
				labelSize: 'small',
			})),
			countryFeature('Dem. Rep. Congo', 'added', 'D.R. Congo', viewport, { showLabel: true, labelPosition: [22.0, -1.0] }),
			countryFeature('Nigeria', 'added', 'Nigeria', viewport, { showLabel: true, labelPosition: [8.5, 9.8] }),
			countryFeature('Somalia', 'added', 'Somalia', viewport, { showLabel: true, labelPosition: [46.5, 5.4] }),
			countryFeature('Madagascar', 'added', 'Madagascar', viewport, { showLabel: true, labelPosition: [45.4, -18.6], labelSize: 'small' }),
		].filter(Boolean);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...colonialParts, ...colonialLabels].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, ...afterStates].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived African country outlines grouped into colonial-before and independent-after labels based on 1960 Year of Africa independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'angola-mozambique-independence') {
		const viewport = { west: 8, south: -28, east: 42, north: 1 };
		const context = africaContext(viewport, ['Democratic Republic of the Congo', 'Zambia', 'Malawi', 'Botswana', 'South Africa', 'Namibia', 'Tanzania']);
		const angola = countryFeature('Angola', 'removed', 'Portuguese Angola', viewport, { labelSize: 'large', showLabel: true });
		const mozambique = countryFeature('Mozambique', 'removed', 'Portuguese Mozambique', viewport, { labelSize: 'normal', showLabel: true, labelPosition: [32.9, -18.2] });
		const independentAngola = countryFeature('Angola', 'added', 'Angola', viewport, { labelSize: 'large', showLabel: true });
		const independentMozambique = countryFeature('Mozambique', 'added', 'Mozambique', viewport, { labelSize: 'large', showLabel: true, labelPosition: [35.6, -18.2] });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, angola, mozambique].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, independentAngola, independentMozambique].filter(Boolean)),
			mapSourceNote: 'Curated Portuguese Africa comparison based on Angola and Mozambique independence references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'eritrea-independence') {
		const viewport = { west: 32, south: 2, east: 48, north: 18 };
		const context = africaContext(viewport, ['Sudan', 'Djibouti', 'Somalia', 'Yemen', 'Kenya']);
		const ethiopia = countryFeature('Ethiopia', 'context', 'Ethiopia', viewport, { showLabel: true });
		const eritreaWithin = countryFeature('Eritrea', 'removed', 'Eritrea within Ethiopia', viewport, {
			showLabel: true,
			labelPosition: [39.6, 15.1],
			labelSize: 'large',
		});
		const eritrea = countryFeature('Eritrea', 'added', 'Eritrea', viewport, {
			showLabel: true,
			labelPosition: [39.6, 15.1],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ethiopia, eritreaWithin].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, ethiopia, eritrea].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Eritrea outline interpreted against 1993 Eritrea/Ethiopia independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'south-sudan') {
		const viewport = { west: 17, south: 0, east: 42, north: 26 };
		const context = africaContext(viewport, ['Chad', 'Central African Republic', 'Ethiopia', 'Eritrea', 'Egypt']);
		const unifiedSudan = [
			countryFeature('Sudan', 'removed', 'Sudan', viewport, { showLabel: false }),
			countryFeature('South Sudan', 'removed', 'Sudan', viewport, { showLabel: false }),
			pointFeature('Sudan', 'removed', [30.5, 14.2], [30.5, 14.2]),
		].filter(Boolean);
		const sudan = countryFeature('Sudan', 'context', 'Sudan', viewport, {
			showLabel: true,
			labelPosition: [31.0, 15.5],
			labelSize: 'large',
		});
		const southSudan = countryFeature('South Sudan', 'added', 'South Sudan', viewport, {
			showLabel: true,
			labelPosition: [29.2, 6.7],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...unifiedSudan]),
			afterMap: mapCollection('After', event.afterLabel, [...context, sudan, southSudan].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Sudan and South Sudan outlines grouped as unified Sudan before the 2011 South Sudan independence reference; simplified for the checklist.',
		};
	}

	if (event.id === 'viceroyalty-of-peru') {
		const viewport = { west: -84, south: -36, east: -42, north: 14 };
		const context = americasContext(viewport, ['Brazil', 'Venezuela', 'Guyana', 'Suriname']);
		const earlyGovernorships = polygonFeature('Spanish governorates', 'removed', [
			[-82, 10],
			[-75, 12],
			[-67, 6],
			[-60, -6],
			[-58, -18],
			[-66, -34],
			[-74, -34],
			[-80, -12],
			[-82, 2],
		], { labelPosition: [-70, -10], labelSize: 'large' });
		const viceroyalty = polygonFeature('Viceroyalty of Peru', 'added', [
			[-82, 10],
			[-75, 12],
			[-67, 6],
			[-60, -6],
			[-58, -18],
			[-66, -34],
			[-74, -34],
			[-80, -12],
			[-82, 2],
		], { labelPosition: [-70, -10], labelSize: 'large' });
		const lima = pointFeature('Lima', 'boundary', [-77.0, -12.0]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, earlyGovernorships, lima]),
			afterMap: mapCollection('After', event.afterLabel, [...context, viceroyalty, lima]),
			mapSourceNote: 'Curated Viceroyalty of Peru comparison based on Spanish American viceroyalty references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'argentina-independence' || event.id === 'chile-independence' || event.id === 'peru-independence' || event.id === 'brazil-independence') {
		const specs = {
			'argentina-independence': {
				viewport: { west: -75, south: -56, east: -47, north: -18 },
				context: ['Chile', 'Bolivia', 'Paraguay', 'Uruguay', 'Brazil'],
				country: 'Argentina',
				before: 'Spanish Rio de la Plata',
				after: 'Argentina',
				labelPosition: [-61.8, -37.5],
			},
			'chile-independence': {
				viewport: { west: -82, south: -56, east: -57, north: -14 },
				context: ['Peru', 'Bolivia', 'Argentina', 'Brazil'],
				country: 'Chile',
				before: 'Spanish Chile',
				after: 'Chile',
				labelPosition: [-70.8, -34.5],
			},
			'peru-independence': {
				viewport: { west: -83, south: -21, east: -59, north: 2 },
				context: ['Ecuador', 'Colombia', 'Brazil', 'Bolivia', 'Chile'],
				country: 'Peru',
				before: 'Spanish Peru',
				after: 'Peru',
				labelPosition: [-74.6, -9.0],
			},
			'brazil-independence': {
				viewport: { west: -76, south: -35, east: -32, north: 7 },
				context: ['Peru', 'Bolivia', 'Paraguay', 'Uruguay', 'Argentina', 'Venezuela', 'Guyana'],
				country: 'Brazil',
				before: 'Portuguese Brazil',
				after: 'Brazil',
				labelPosition: [-53.5, -13.0],
			},
		};
		const spec = specs[event.id];
		const viewport = spec.viewport;
		const context = americasContext(viewport, spec.context);
		const before = countryFeature(spec.country, 'removed', spec.before, viewport, { showLabel: true, labelPosition: spec.labelPosition, labelSize: 'large' });
		const after = countryFeature(spec.country, 'added', spec.after, viewport, { showLabel: true, labelPosition: spec.labelPosition, labelSize: 'large' });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, before].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, after].filter(Boolean)),
			mapSourceNote: 'Curated South American independence comparison based on nineteenth-century independence references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'canadian-confederation') {
		const viewport = { west: -98, south: 41, east: -50, north: 56 };
		const context = [
			countryFeature('Canada', 'context', 'British North America', viewport, { showLabel: false }),
			countryFeature('United States of America', 'context', 'United States', viewport, { showLabel: false }),
			pointFeature('Newfoundland', 'context', [-56.6, 49.0]),
			pointFeature("Rupert's Land", 'context', [-91.0, 52.2]),
		].filter(Boolean);
		const provinceOfCanada = polygonFeature('Province of Canada', 'removed', [
			[-84.8, 42.0],
			[-79.0, 43.0],
			[-74.2, 44.7],
			[-70.0, 46.0],
			[-66.2, 47.6],
			[-67.2, 49.2],
			[-72.8, 49.4],
			[-78.8, 48.9],
			[-84.4, 46.8],
			[-89.2, 48.7],
			[-91.0, 46.4],
			[-86.2, 44.2],
		], { labelPosition: [-77.0, 46.7], labelSize: 'normal' });
		const newBrunswick = polygonFeature('N.B.', 'removed', [
			[-69.1, 45.1],
			[-67.8, 45.2],
			[-66.4, 44.9],
			[-65.1, 45.2],
			[-64.2, 46.0],
			[-64.6, 46.9],
			[-65.8, 47.2],
			[-67.2, 47.6],
			[-68.4, 47.0],
			[-68.9, 46.0],
		], { labelPosition: [-66.6, 46.1], labelSize: 'small' });
		const novaScotia = polygonFeature('N.S.', 'removed', [
			[-66.4, 43.5],
			[-64.8, 43.7],
			[-63.5, 44.2],
			[-62.2, 44.4],
			[-60.8, 44.8],
			[-59.7, 45.4],
			[-60.2, 46.0],
			[-62.0, 45.9],
			[-63.6, 45.5],
			[-65.0, 44.8],
		], { labelPosition: [-62.7, 44.7], labelSize: 'small' });
		const dominionCanada = {
			...provinceOfCanada,
			properties: { ...provinceOfCanada.properties, label: 'Dominion of Canada', role: 'added', labelSize: 'large' },
		};
		const dominionNewBrunswick = {
			...newBrunswick,
			properties: { ...newBrunswick.properties, label: 'N.B.', role: 'added', showLabel: false },
		};
		const dominionNovaScotia = {
			...novaScotia,
			properties: { ...novaScotia.properties, label: 'N.S.', role: 'added', showLabel: false },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, provinceOfCanada, newBrunswick, novaScotia]),
			afterMap: mapCollection('After', event.afterLabel, [...context, dominionCanada, dominionNewBrunswick, dominionNovaScotia]),
			mapSourceNote: 'Curated Canadian Confederation comparison based on 1867 Dominion of Canada formation references, with Natural Earth-derived North America context and Newfoundland/Rupert’s Land left outside the new dominion; simplified for the checklist.',
		};
	}

	if (event.id === 'newfoundland-canada') {
		const viewport = { west: -70, south: 43, east: -48, north: 56 };
		const context = [
			countryFeature('Canada', 'context', 'Canada', viewport, { showLabel: true, labelPosition: [-63.5, 49.5] }),
			pointFeature('Atlantic Ocean', 'context', [-55.5, 44.8]),
		].filter(Boolean);
		const newfoundland = polygonFeature('Newfoundland', 'removed', [
			[-59.3, 47.6],
			[-58.2, 47.3],
			[-57.2, 47.6],
			[-55.7, 46.8],
			[-53.5, 47.5],
			[-52.8, 48.5],
			[-53.3, 49.4],
			[-54.5, 50.1],
			[-55.8, 50.8],
			[-57.4, 50.5],
			[-58.9, 49.6],
			[-59.5, 48.6],
		], { labelPosition: [-56.3, 48.7], labelSize: 'normal' });
		const labrador = polygonFeature('Labrador', 'removed', [
			[-64.8, 52.0],
			[-63.6, 53.4],
			[-61.3, 54.8],
			[-59.0, 55.4],
			[-56.9, 54.8],
			[-55.5, 53.4],
			[-56.2, 51.5],
			[-58.2, 51.0],
			[-60.2, 51.3],
			[-62.5, 50.8],
		], { labelPosition: [-59.8, 53.0], labelSize: 'small' });
		const joinedNewfoundland = {
			...newfoundland,
			properties: { ...newfoundland.properties, label: 'Newfoundland in Canada', role: 'added' },
		};
		const joinedLabrador = {
			...labrador,
			properties: { ...labrador.properties, label: 'Labrador in Canada', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, newfoundland, labrador]),
			afterMap: mapCollection('After', event.afterLabel, [...context, joinedNewfoundland, joinedLabrador]),
			mapSourceNote: 'Curated Newfoundland joining Canada comparison based on 1949 Newfoundland and Labrador confederation references and Natural Earth-derived North Atlantic context; simplified for the checklist.',
		};
	}

	if (event.id === 'australia-name') {
		const viewport = { west: 108, south: -46, east: 158, north: -8 };
		const context = [
			countryFeature('Indonesia', 'context', 'Indonesia', viewport, { showLabel: true }),
			countryFeature('Papua New Guinea', 'context', 'Papua New Guinea', viewport, { showLabel: true }),
			countryFeature('New Zealand', 'context', 'New Zealand', viewport, { showLabel: true }),
			pointFeature('Timor', 'context', [125.6, -9.2]),
			pointFeature('Coral Sea', 'context', [151.5, -18.0]),
		].filter(Boolean);
		const newHolland = countryFeature('Australia', 'removed', 'New Holland', viewport, { showLabel: true, labelPosition: [133.5, -26.0], labelSize: 'large' });
		const australia = countryFeature('Australia', 'added', 'Australia', viewport, { showLabel: true, labelPosition: [133.5, -26.0], labelSize: 'large' });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, newHolland].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, australia].filter(Boolean)),
			mapSourceNote: 'Curated New Holland/Australia name comparison based on nineteenth-century Australia naming references and Natural Earth-derived Oceania context; simplified for the checklist.',
		};
	}

	if (event.id === 'tasmania-name') {
		const viewport = { west: 142, south: -45, east: 150, north: -38 };
		const context = [
			countryFeature('Australia', 'context', 'Australia', viewport, { showLabel: true, labelPosition: [145.5, -38.6] }),
			pointFeature('Bass Strait', 'context', [146.0, -39.4]),
		].filter(Boolean);
		const vanDiemensLand = polygonFeature("Van Diemen's Land", 'removed', [
			[144.1, -40.7],
			[145.3, -40.9],
			[146.7, -41.0],
			[148.2, -41.5],
			[148.4, -42.4],
			[147.2, -43.4],
			[146.0, -43.8],
			[144.8, -43.4],
			[143.7, -42.3],
			[143.9, -41.4],
		], { labelPosition: [146.0, -42.3], labelSize: 'normal' });
		const tasmania = {
			...vanDiemensLand,
			properties: { ...vanDiemensLand.properties, label: 'Tasmania', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, vanDiemensLand]),
			afterMap: mapCollection('After', event.afterLabel, [...context, tasmania]),
			mapSourceNote: 'Curated Van Diemen’s Land/Tasmania name comparison based on Tasmania naming references and Natural Earth-derived Australia context; simplified for the checklist.',
		};
	}

	if (['solomon-islands-independence', 'tuvalu-independence', 'kiribati-independence', 'vanuatu-independence', 'marshall-islands-independence', 'western-samoa-samoa'].includes(event.id)) {
		const specs = {
			'solomon-islands-independence': {
				viewport: { west: 152, south: -13, east: 168, north: -5 },
				context: [
					['Papua New Guinea', [154.8, -6.0]],
					['Coral Sea', [157.0, -12.0]],
				],
				country: 'Solomon Islands',
				coords: [160.2, -9.5],
				labelPosition: [160.9, -10.8],
				chain: [[156.7, -7.0], [158.2, -8.0], [160.2, -9.5], [162.4, -10.4]],
				before: 'British Solomon Islands',
				after: 'Solomon Islands',
			},
			'tuvalu-independence': {
				viewport: { west: 172, south: -18.5, east: 181, north: 2.5 },
				context: [
					['Fiji', [178.1, -17.8]],
					['Kiribati', [173.0, 1.4]],
				],
				coords: [178.7, -7.7],
				labelPosition: [178.2, -9.0],
				lonRadius: 0.45,
				latRadius: 0.34,
				chain: [[176.0, -6.0], [178.0, -8.0], [179.2, -8.5], [179.85, -9.4]],
				before: 'Ellice Islands',
				after: 'Tuvalu',
			},
			'kiribati-independence': {
				viewport: { west: 165, south: -9.5, east: 181, north: 5.5 },
				context: [
					['Tuvalu', [179.2, -8.5]],
					['Nauru', [166.9, -0.5]],
				],
				coords: [173.0, 1.4],
				labelPosition: [172.5, 2.6],
				forceIsland: true,
				lonRadius: 0.72,
				latRadius: 0.58,
				chain: [[169.0, 1.0], [173.0, 1.4], [176.0, -2.0]],
				before: 'Gilbert Islands',
				after: 'Kiribati',
			},
			'vanuatu-independence': {
				viewport: { west: 158, south: -24, east: 170, north: -8 },
				context: [
					['Solomon Islands', [160.2, -9.5]],
					['New Caledonia', [165.6, -21.3]],
				],
				country: 'Vanuatu',
				coords: [167.0, -16.0],
				labelPosition: [167.4, -17.2],
				chain: [[166.2, -13.0], [167.0, -16.0], [168.2, -18.2]],
				before: 'New Hebrides',
				after: 'Vanuatu',
			},
			'marshall-islands-independence': {
				viewport: { west: 156, south: 3, east: 174.5, north: 14.2 },
				context: [
					['Micronesia', [159.8, 6.9]],
					['Pacific Ocean', [164.0, 12.5]],
				],
				coords: [169.5, 8.8],
				labelPosition: [169.2, 7.4],
				lonRadius: 1.05,
				latRadius: 0.42,
				chain: [[166.6, 11.5], [168.3, 9.8], [169.5, 8.8], [171.2, 7.1]],
				before: 'U.S. trust territory',
				after: 'Marshall Islands',
			},
			'western-samoa-samoa': {
				viewport: { west: -176.5, south: -22.5, east: -169, north: -12 },
				context: [
					['American Samoa', [-170.7, -14.3]],
					['Tonga', [-175.2, -21.2]],
				],
				country: 'Samoa',
				coords: [-172.1, -13.8],
				labelPosition: [-172.4, -15.0],
				forceIsland: true,
				lonRadius: 0.62,
				latRadius: 0.42,
				chain: [[-173.9, -13.7], [-172.1, -13.8], [-170.7, -14.3]],
				before: 'Western Samoa',
				after: 'Samoa',
			},
		};
		const spec = specs[event.id];
		const context = spec.context.map(([label, coordinates]) => pointFeature(label, 'context', coordinates));
		const chain = spec.chain ? [lineFeature('Island chain', 'boundary', spec.chain, { showLabel: false })] : [];
		const beforePoint = countryOrIslandFeature(spec.country ?? spec.after, spec.before, 'removed', spec.coords, spec.viewport, spec);
		const afterPoint = countryOrIslandFeature(spec.country ?? spec.after, spec.after, 'added', spec.coords, spec.viewport, spec);

		return {
			mapViewport: spec.viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...chain, beforePoint]),
			afterMap: mapCollection('After', event.afterLabel, [...context, ...chain, afterPoint]),
			mapSourceNote: 'Curated Pacific island comparison based on Oceania independence/name-change references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'panama-independence') {
		const viewport = { west: -83.5, south: 5.5, east: -73, north: 12.5 };
		const context = [
			countryFeature('Costa Rica', 'context', 'Costa Rica', viewport, {
				showLabel: true,
				labelPosition: [-81.7, 9.8],
			}),
			countryFeature('Nicaragua', 'context', 'Nicaragua', viewport, {
				showLabel: true,
				labelPosition: [-81.6, 11.1],
			}),
			countryFeature('Venezuela', 'context', 'Venezuela', viewport, {
				showLabel: false,
			}),
		].filter(Boolean);
		const colombia = countryFeature('Colombia', 'context', 'Colombia', viewport, { showLabel: true });
		const colombianPanama = countryFeature('Panama', 'removed', 'Colombian Panama', viewport, {
			showLabel: true,
			labelPosition: [-79.9, 8.3],
			labelSize: 'large',
		});
		const panama = countryFeature('Panama', 'added', 'Panama', viewport, {
			showLabel: true,
			labelPosition: [-79.9, 8.3],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, colombia, colombianPanama].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, colombia, panama].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Panama outline interpreted against 1903 Panama independence-from-Colombia references; simplified for the checklist.',
		};
	}

	if (event.id === 'guyana-independence' || event.id === 'suriname-independence') {
		const viewport = { west: -63, south: -2, east: -50, north: 9 };
		const context = americasContext(viewport, ['Venezuela', 'Brazil']);
		const frenchGuiana = polygonFeature('French Guiana', 'context', [
			[-54.6, 2.1],
			[-51.6, 2.1],
			[-51.6, 5.8],
			[-53.5, 5.6],
			[-54.6, 4.4],
		], { labelPosition: [-53.0, 4.2], labelSize: 'small' });
		const guyanaBefore = countryFeature('Guyana', event.id === 'guyana-independence' ? 'removed' : 'context', event.id === 'guyana-independence' ? 'British Guiana' : 'Guyana', viewport, {
			showLabel: true,
			labelPosition: [-58.9, 5.0],
			labelSize: event.id === 'guyana-independence' ? 'large' : 'normal',
		});
		const guyanaAfter = countryFeature('Guyana', event.id === 'guyana-independence' ? 'added' : 'context', 'Guyana', viewport, {
			showLabel: true,
			labelPosition: [-58.9, 5.0],
			labelSize: event.id === 'guyana-independence' ? 'large' : 'normal',
		});
		const surinameBefore = countryFeature('Suriname', event.id === 'suriname-independence' ? 'removed' : 'context', event.id === 'suriname-independence' ? 'Dutch Guiana' : 'Suriname', viewport, {
			showLabel: true,
			labelPosition: [-55.8, 4.1],
			labelSize: event.id === 'suriname-independence' ? 'large' : 'normal',
		});
		const surinameAfter = countryFeature('Suriname', event.id === 'suriname-independence' ? 'added' : 'context', 'Suriname', viewport, {
			showLabel: true,
			labelPosition: [-55.8, 4.1],
			labelSize: event.id === 'suriname-independence' ? 'large' : 'normal',
		});

		if (event.id === 'guyana-independence') {
			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, guyanaBefore, surinameBefore, frenchGuiana].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, guyanaAfter, surinameBefore, frenchGuiana].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived Guyana and Suriname outlines interpreted against Guyana independence references; French Guiana remains curated context.',
			};
		}

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, guyanaAfter, surinameBefore, frenchGuiana].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, guyanaAfter, surinameAfter, frenchGuiana].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Guyana and Suriname outlines interpreted against Suriname independence references; French Guiana remains curated context.',
		};
	}

	if (event.id === 'belize-independence') {
		const viewport = { west: -91.5, south: 14, east: -86, north: 19.2 };
		const context = americasContext(viewport, ['Mexico', 'Guatemala', 'Honduras']);
		const britishHonduras = countryFeature('Belize', 'removed', 'British Honduras', viewport, {
			showLabel: true,
			labelPosition: [-88.55, 17.15],
			labelSize: 'large',
		});
		const belize = countryFeature('Belize', 'added', 'Belize', viewport, {
			showLabel: true,
			labelPosition: [-88.55, 17.15],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, britishHonduras].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, belize].filter(Boolean)),
			mapSourceNote: 'Curated British Honduras/Belize comparison based on Belize independence references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if ([
		'jamaica-independence',
		'trinidad-tobago-independence',
		'barbados-independence',
		'bahamas-independence',
		'grenada-independence',
		'dominica-independence',
		'st-lucia-independence',
		'st-vincent-independence',
		'antigua-barbuda-independence',
		'st-kitts-nevis-independence',
	].includes(event.id)) {
		const specs = {
			'jamaica-independence': {
				viewport: { west: -81, south: 16.5, east: -73, north: 22.5 },
				context: [contextLandOrPoint('Cuba', 'Cuba', [-78.8, 20.6], { west: -81, south: 16.5, east: -73, north: 22.5 }), contextLandOrPoint('Haiti', 'Haiti', [-73.8, 19.0], { west: -81, south: 16.5, east: -73, north: 22.5 })],
				country: 'Jamaica',
				coords: [-77.3, 18.1],
				labelPosition: [-77.3, 17.55],
				before: 'British Jamaica',
				after: 'Jamaica',
			},
			'trinidad-tobago-independence': {
				viewport: { west: -63.5, south: 9.2, east: -58.5, north: 12.5 },
				context: [contextLandOrPoint('Venezuela', 'Venezuela', [-61.8, 10.2], { west: -63.5, south: 9.2, east: -58.5, north: 12.5 }), caribbeanPoint('Grenada', [-61.7, 12.1])],
				country: 'Trinidad and Tobago',
				coords: [-61.2, 10.6],
				labelPosition: [-61.2, 10.05],
				before: 'British Trinidad & Tobago',
				after: 'Trinidad & Tobago',
			},
			'barbados-independence': {
				viewport: { west: -62.8, south: 11.5, east: -58.2, north: 15.2 },
				context: [caribbeanPoint('St. Lucia', [-60.98, 13.9]), caribbeanPoint('St. Vincent', [-61.2, 13.2]), caribbeanPoint('Grenada', [-61.7, 12.1])],
				coords: [-59.55, 13.2],
				labelPosition: [-59.3, 13.75],
				lonRadius: 0.12,
				latRadius: 0.2,
				chain: [[-61.0, 14.65], [-60.98, 13.9], [-61.2, 13.2], [-61.7, 12.1]],
				before: 'British Barbados',
				after: 'Barbados',
			},
			'bahamas-independence': {
				viewport: { west: -82, south: 20, east: -70, north: 28.5 },
				context: [contextLandOrPoint('Florida', 'United States of America', [-80.5, 26.5], { west: -82, south: 20, east: -70, north: 28.5 }), contextLandOrPoint('Cuba', 'Cuba', [-78.8, 21.0], { west: -82, south: 20, east: -70, north: 28.5 })],
				country: 'The Bahamas',
				coords: [-77.4, 24.4],
				labelPosition: [-75.5, 24.7],
				before: 'British Bahamas',
				after: 'The Bahamas',
			},
			'grenada-independence': {
				viewport: { west: -63.3, south: 10.8, east: -60.1, north: 13.8 },
				context: [caribbeanPoint('St. Vincent', [-61.2, 13.2])],
				coords: [-61.7, 12.1],
				labelPosition: [-61.55, 11.65],
				lonRadius: 0.14,
				latRadius: 0.18,
				chain: [[-61.35, 13.1], [-61.5, 12.7], [-61.7, 12.1]],
				before: 'British Grenada',
				after: 'Grenada',
			},
			'dominica-independence': {
				viewport: { west: -62.5, south: 14.5, east: -60.0, north: 16.8 },
				context: [caribbeanPoint('Guadeloupe', [-61.55, 16.2]), caribbeanPoint('Martinique', [-61.0, 14.65])],
				coords: [-61.35, 15.4],
				labelPosition: [-61.35, 15.15],
				lonRadius: 0.12,
				latRadius: 0.25,
				chain: [[-61.55, 16.2], [-61.35, 15.4], [-61.0, 14.65]],
				before: 'British Dominica',
				after: 'Dominica',
			},
			'st-lucia-independence': {
				viewport: { west: -62.2, south: 12.8, east: -60.0, north: 15.2 },
				context: [caribbeanPoint('Martinique', [-61.0, 14.65]), caribbeanPoint('St. Vincent', [-61.2, 13.2])],
				coords: [-60.98, 13.9],
				labelPosition: [-60.78, 13.62],
				lonRadius: 0.12,
				latRadius: 0.2,
				chain: [[-61.0, 14.65], [-60.98, 13.9], [-61.2, 13.2]],
				before: 'British St. Lucia',
				after: 'Saint Lucia',
			},
			'st-vincent-independence': {
				viewport: { west: -62.5, south: 12.2, east: -60.2, north: 14.4 },
				context: [caribbeanPoint('St. Lucia', [-60.98, 13.9])],
				coords: [-61.2, 13.2],
				labelPosition: [-61.45, 12.78],
				lonRadius: 0.14,
				latRadius: 0.2,
				chain: [[-60.98, 13.9], [-61.2, 13.2], [-61.35, 12.6]],
				before: 'British St. Vincent',
				after: 'St. Vincent & Grenadines',
			},
			'antigua-barbuda-independence': {
				viewport: { west: -63.2, south: 15.6, east: -60.8, north: 18.2 },
				context: [caribbeanPoint('St. Kitts', [-62.75, 17.3]), caribbeanPoint('Guadeloupe', [-61.55, 16.2])],
				coords: [-61.78, 17.1],
				labelPosition: [-61.65, 17.55],
				lonRadius: 0.18,
				latRadius: 0.16,
				chain: [[-62.75, 17.3], [-61.78, 17.1], [-61.55, 16.2]],
				before: 'British Antigua & Barbuda',
				after: 'Antigua & Barbuda',
			},
			'st-kitts-nevis-independence': {
				viewport: { west: -63.8, south: 16.4, east: -61.3, north: 18.4 },
				context: [caribbeanPoint('Antigua', [-61.78, 17.1]), caribbeanPoint('Montserrat', [-62.2, 16.75])],
				coords: [-62.75, 17.3],
				labelPosition: [-62.9, 17.75],
				lonRadius: 0.16,
				latRadius: 0.14,
				chain: [[-62.75, 17.3], [-62.55, 17.15], [-62.2, 16.75], [-61.78, 17.1]],
				before: 'Leeward Islands',
				after: 'St. Kitts & Nevis',
			},
		};
		const spec = specs[event.id];
		const chain = spec.chain ? [lineFeature('Lesser Antilles', 'boundary', spec.chain, { showLabel: false })] : [];
		const beforeFocus = countryOrIslandFeature(spec.country ?? spec.after, spec.before, 'removed', spec.coords, spec.viewport, spec);
		const afterFocus = countryOrIslandFeature(spec.country ?? spec.after, spec.after, 'added', spec.coords, spec.viewport, spec);

		return {
			mapViewport: spec.viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...spec.context, ...chain, beforeFocus].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...spec.context, ...chain, afterFocus].filter(Boolean)),
			mapSourceNote: 'Curated Caribbean island-state comparison based on Caribbean independence references and Natural Earth-derived regional context or island outlines; simplified for the checklist.',
		};
	}

	if (event.id === 'fiji-independence') {
		const viewport = { west: 174, south: -21, east: 181, north: -14.5 };
		const context = [
			lineFeature('Fiji island group', 'boundary', [[177.2, -16.6], [178.1, -17.8], [179.4, -18.2]], { showLabel: false }),
			oceaniaPoint('South Pacific', [176.4, -15.6]),
		];
		const beforePoint = countryOrIslandFeature('Fiji', 'British Fiji', 'removed', [178.1, -17.8], viewport, {
			labelPosition: [178.2, -18.8],
		});
		const afterPoint = countryOrIslandFeature('Fiji', 'Fiji', 'added', [178.1, -17.8], viewport, {
			labelPosition: [178.2, -18.8],
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforePoint].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterPoint].filter(Boolean)),
			mapSourceNote: 'Curated Fiji independence comparison based on Fiji independence references and Natural Earth-derived Pacific context; simplified for the checklist.',
		};
	}

	if (event.id === 'tonga-independence') {
		const viewport = { west: -177.8, south: -23, east: -169.4, north: -13 };
		const context = [
			lineFeature('Tonga island chain', 'boundary', [[-175.6, -15.6], [-175.2, -18.6], [-175.2, -21.2]], { showLabel: false }),
			oceaniaPoint('Samoa', [-172.1, -13.8]),
			oceaniaPoint('Niue', [-169.9, -19.1]),
		];
		const beforePoint = smallIslandFeature('British-protected Tonga', 'removed', [-175.2, -18.6], {
			lonRadius: 0.48,
			latRadius: 0.45,
			labelPosition: [-174.7, -19.2],
		});
		const afterPoint = smallIslandFeature('Tonga', 'added', [-175.2, -18.6], {
			lonRadius: 0.48,
			latRadius: 0.45,
			labelPosition: [-174.7, -19.2],
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforePoint]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterPoint]),
			mapSourceNote: 'Curated Tonga independence comparison based on Tonga protectorate/independence references and Natural Earth-derived Pacific context; simplified for the checklist.',
		};
	}

	if (event.id === 'papua-new-guinea-independence') {
		const viewport = { west: 138, south: -12.5, east: 156, north: 2 };
		const context = [
			countryFeature('Australia', 'context', 'Australia', viewport, { showLabel: true }),
			countryFeature('Indonesia', 'context', 'Indonesia', viewport, { showLabel: true }),
		].filter(Boolean);
		const territory = countryFeature('Papua New Guinea', 'removed', 'Australian Papua and New Guinea', viewport, {
			showLabel: true,
			labelPosition: [146.8, -5.8],
			labelSize: 'large',
		});
		const papuaNewGuinea = countryFeature('Papua New Guinea', 'added', 'Papua New Guinea', viewport, {
			showLabel: true,
			labelPosition: [146.8, -5.8],
			labelSize: 'large',
		});
		const portMoresby = pointFeature('Port Moresby', 'boundary', [147.2, -9.5]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, territory, portMoresby].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, papuaNewGuinea, portMoresby].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Papua New Guinea outline interpreted against 1975 independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'micronesia-independence') {
		const viewport = { west: 133, south: 1, east: 172.5, north: 11 };
		const context = [
			lineFeature('Caroline Islands', 'boundary', [[138.1, 9.5], [146.0, 7.5], [152.0, 7.0], [158.2, 6.9], [163.0, 5.3]], { showLabel: false }),
			oceaniaPoint('Palau', [136.2, 7.5]),
			oceaniaPoint('Marshall Is.', [168.8, 7.1]),
		];
		const beforePoint = smallIslandFeature('Trust Territory', 'removed', [158.2, 6.9], {
			lonRadius: 1.25,
			latRadius: 0.34,
			labelPosition: [158.2, 5.6],
		});
		const afterPoint = smallIslandFeature('Micronesia', 'added', [158.2, 6.9], {
			lonRadius: 1.25,
			latRadius: 0.34,
			labelPosition: [158.2, 5.6],
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforePoint]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterPoint]),
			mapSourceNote: 'Curated Federated States of Micronesia comparison based on Trust Territory of the Pacific Islands references and Natural Earth-derived Pacific context; simplified for the checklist.',
		};
	}

	if (event.id === 'suez-canal') {
		const viewport = { west: 30, south: 27, east: 35.5, north: 33 };
		const context = [
			countryFeature('Egypt', 'context', 'Egypt', viewport, { showLabel: true }),
			countryFeature('Israel', 'context', 'Sinai / Levant', viewport, { showLabel: true }),
			pointFeature('Mediterranean Sea', 'context', [32.2, 32.4]),
			pointFeature('Red Sea', 'context', [33.3, 28.2]),
		].filter(Boolean);
		const canalRoute = [
			[32.3, 31.3],
			[32.34, 30.6],
			[32.4, 29.9],
			[32.55, 29.2],
		];
		const beforeRoute = lineFeature('Canal route absent', 'removed', canalRoute, { showLabel: false });
		const afterRoute = lineFeature('Suez Canal', 'added', canalRoute, { showLabel: false });
		const portSaid = pointFeature('Port Said', 'boundary', [32.3, 31.3]);
		const suez = pointFeature('Suez', 'boundary', [32.55, 29.97]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeRoute, portSaid, suez]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterRoute, portSaid, suez]),
			mapSourceNote: 'Curated Suez Canal comparison based on 1869 Suez Canal opening references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'panama-canal') {
		const viewport = { west: -82.8, south: 7, east: -77, north: 10.8 };
		const context = [
			countryFeature('Panama', 'context', 'Panama', viewport, { showLabel: true }),
			countryFeature('Costa Rica', 'context', 'Costa Rica', viewport, {
				showLabel: true,
				labelPosition: [-81.5, 9.2],
			}),
			countryFeature('Colombia', 'context', 'Colombia', viewport, { showLabel: true }),
			pointFeature('Caribbean Sea', 'context', [-80.2, 10.2]),
			pointFeature('Pacific Ocean', 'context', [-80.2, 7.6]),
		].filter(Boolean);
		const canalRoute = [
			[-79.92, 9.36],
			[-79.75, 9.12],
			[-79.65, 8.95],
			[-79.56, 8.75],
		];
		const beforeRoute = lineFeature('Canal route absent', 'removed', canalRoute, { showLabel: false });
		const afterRoute = lineFeature('Panama Canal', 'added', canalRoute, { showLabel: false });
		const colon = pointFeature('Colon', 'boundary', [-79.9, 9.36]);
		const panamaCity = pointFeature('Panama City', 'boundary', [-79.53, 8.98]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeRoute, colon, panamaCity]),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterRoute, colon, panamaCity]),
			mapSourceNote: 'Curated Panama Canal comparison based on 1914 Panama Canal opening references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'zaire-name' || event.id === 'zaire-dr-congo') {
		const viewport = { west: 10, south: -14, east: 32, north: 7 };
		const context = africaContext(viewport, ['Republic of the Congo', 'Angola', 'Zambia', 'Central African Republic', 'Rwanda', 'Burundi', 'Uganda']);
		const congoBeforeName = event.id === 'zaire-name' ? 'Congo' : 'Zaire';
		const congoAfterName = event.id === 'zaire-name' ? 'Zaire' : 'DR Congo';
		const beforeCongo = countryFeature('Dem. Rep. Congo', 'removed', congoBeforeName, viewport, {
			showLabel: true,
			labelPosition: [22.0, -3.5],
			labelSize: 'large',
		});
		const afterCongo = countryFeature('Dem. Rep. Congo', 'added', congoAfterName, viewport, {
			showLabel: true,
			labelPosition: [22.0, -3.5],
			labelSize: 'large',
		});
		const kinshasa = pointFeature('Kinshasa', 'boundary', [15.3, -4.3]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, beforeCongo, kinshasa].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, afterCongo, kinshasa].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Democratic Republic of the Congo outline interpreted against Congo/Zaire name-change references; simplified for the checklist.',
		};
	}

	if (event.id === 'soviet-union' || event.id === 'soviet-dissolution') {
		const viewport = { west: 0, south: 30, east: 180, north: 75 };
		const context = europeanContext(viewport, ['Poland', 'Romania', 'Turkey', 'Iran', 'Finland', 'China']);
		const country = (name, role, label, options = {}) => countryFeature(name, role, label, viewport, {
			showLabel: true,
			...options,
		});

		if (event.id === 'soviet-union') {
			const foundingStates = [
				country('Russia', 'removed', 'Soviet Russia', { labelPosition: [39.5, 57.0], labelSize: 'large' }),
				country('Ukraine', 'removed', 'Ukraine', { labelPosition: [31.0, 49.0] }),
				country('Belarus', 'removed', 'Belarus', { labelPosition: [28.0, 53.5] }),
				country('Georgia', 'removed', 'Transcaucasian SFSR', { showLabel: false }),
				country('Armenia', 'removed', 'Transcaucasian SFSR', { showLabel: false }),
				country('Azerbaijan', 'removed', 'Transcaucasian SFSR', { showLabel: false }),
				pointFeature('Transcaucasian SFSR', 'removed', [45.2, 42.1], [45.2, 42.1]),
			].filter(Boolean);
			const ussrParts = [
				country('Russia', 'added', 'USSR', { labelPosition: [39.5, 57.0], labelSize: 'large' }),
				country('Ukraine', 'added', 'USSR', { showLabel: false }),
				country('Belarus', 'added', 'USSR', { showLabel: false }),
				country('Georgia', 'added', 'USSR', { showLabel: false }),
				country('Armenia', 'added', 'USSR', { showLabel: false }),
				country('Azerbaijan', 'added', 'USSR', { showLabel: false }),
			].filter(Boolean);

			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...foundingStates].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, ...ussrParts].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived founding Soviet republic outlines interpreted against 1922 USSR formation references; simplified for the checklist.',
			};
		}

		const ussrParts = [
			country('Russia', 'removed', 'USSR', { labelPosition: [54.0, 56.2], labelSize: 'large' }),
			country('Ukraine', 'removed', 'USSR', { showLabel: false }),
			country('Belarus', 'removed', 'USSR', { showLabel: false }),
			country('Kazakhstan', 'removed', 'USSR', { showLabel: false }),
			country('Georgia', 'removed', 'USSR', { showLabel: false }),
			country('Armenia', 'removed', 'USSR', { showLabel: false }),
			country('Azerbaijan', 'removed', 'USSR', { showLabel: false }),
			country('Estonia', 'removed', 'USSR', { showLabel: false }),
			country('Latvia', 'removed', 'USSR', { showLabel: false }),
			country('Lithuania', 'removed', 'USSR', { showLabel: false }),
		].filter(Boolean);
		const postSovietStates = [
			country('Russia', 'added', 'Russia', { labelPosition: [54.0, 56.2], labelSize: 'large' }),
			country('Ukraine', 'added', 'Ukraine', { labelPosition: [31.0, 49.0] }),
			country('Belarus', 'added', 'Belarus', { labelPosition: [28.0, 53.5] }),
			country('Kazakhstan', 'added', 'Kazakhstan', { labelPosition: [64.5, 47.0] }),
			country('Georgia', 'added', 'Caucasus republics', { showLabel: false }),
			country('Armenia', 'added', 'Caucasus republics', { showLabel: false }),
			country('Azerbaijan', 'added', 'Caucasus republics', { showLabel: false }),
			pointFeature('Caucasus republics', 'added', [45.2, 42.1], [45.2, 42.1]),
			country('Estonia', 'added', 'Baltic states', { showLabel: false }),
			country('Latvia', 'added', 'Baltic states', { showLabel: false }),
			country('Lithuania', 'added', 'Baltic states', { showLabel: false }),
			pointFeature('Baltic states', 'added', [24.9, 56.5], [24.9, 56.5]),
		].filter(Boolean);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...ussrParts].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, ...postSovietStates].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Soviet republic outlines interpreted against 1991 USSR dissolution references; simplified for the checklist.',
		};
	}

	if (event.id === 'finland-independence') {
		const viewport = { west: 16, south: 58, east: 34, north: 70.5 };
		const context = [
			countryFeature('Sweden', 'context', 'Sweden', viewport, { showLabel: true, labelPosition: [18.8, 62.8] }),
			countryFeature('Norway', 'context', 'Norway', viewport, { showLabel: false }),
			countryFeature('Russia', 'context', 'Russia', viewport, { showLabel: false }),
			countryFeature('Estonia', 'context', 'Estonia', viewport, { showLabel: true }),
		].filter(Boolean);
		const russianFinland = countryFeature('Finland', 'removed', 'Russian Finland', viewport, { labelSize: 'large', showLabel: true });
		const finland = countryFeature('Finland', 'added', 'Finland', viewport, { labelSize: 'large', showLabel: true });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, russianFinland].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, finland].filter(Boolean)),
			mapSourceNote: 'Curated Finland independence comparison based on 1917 Finland independence references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'baltic-independence') {
		const viewport = { west: 18, south: 53.2, east: 31, north: 60.2 };
		const context = [
			countryFeature('Poland', 'context', 'Poland', viewport, { showLabel: true }),
			countryFeature('Belarus', 'context', 'Belarus', viewport, { showLabel: true }),
			countryFeature('Finland', 'context', 'Finland', viewport, { showLabel: true }),
			countryFeature('Russia', 'context', 'Russia', viewport, { showLabel: false }),
		].filter(Boolean);
		const russianLithuania = countryFeature('Lithuania', 'removed', 'Lithuania', viewport, { showLabel: false });
		const russianLatvia = countryFeature('Latvia', 'removed', 'Latvia', viewport, { showLabel: false });
		const russianEstonia = countryFeature('Estonia', 'removed', 'Estonia', viewport, { showLabel: false });
		const russianBalticsLabel = pointFeature('Russian Baltic provinces', 'removed', [24.7, 56.7], [24.7, 56.7]);
		const lithuania = countryFeature('Lithuania', 'added', 'Lithuania', viewport, { showLabel: true, labelPosition: [23.8, 54.8] });
		const latvia = countryFeature('Latvia', 'added', 'Latvia', viewport, { showLabel: true, labelPosition: [24.8, 56.7] });
		const estonia = countryFeature('Estonia', 'added', 'Estonia', viewport, { showLabel: true, labelPosition: [25.3, 58.7] });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, russianLithuania, russianLatvia, russianEstonia, russianBalticsLabel].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, lithuania, latvia, estonia].filter(Boolean)),
			mapSourceNote: 'Curated Baltic independence comparison based on Baltic independence references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'czechoslovakia') {
		const viewport = { west: 9.5, south: 47, east: 24, north: 52.5 };
		const context = europeanContext(viewport, ['Germany', 'Poland', 'Austria', 'Hungary']);
		const czechWithin = countryFeature('Czechia', 'removed', 'Czech lands', viewport, { showLabel: false });
		const slovakiaWithin = countryFeature('Slovakia', 'removed', 'Slovak lands', viewport, { showLabel: false });
		const czechoslovakia = pointFeature('Czechoslovakia', 'removed', [17.0, 49.7], [17.0, 49.7]);
		const czechRepublic = countryFeature('Czechia', 'added', 'Czech Republic', viewport, {
			showLabel: true,
			labelPosition: [14.9, 49.8],
		});
		const slovakia = countryFeature('Slovakia', 'added', 'Slovakia', viewport, {
			showLabel: true,
			labelPosition: [19.4, 48.9],
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, czechWithin, slovakiaWithin, czechoslovakia].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, czechRepublic, slovakia].filter(Boolean)),
			mapSourceNote: 'Curated Czechoslovakia split comparison based on Czechoslovak dissolution references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'austria-hungary-dissolution') {
		const viewport = { west: 8, south: 42, east: 28, north: 53 };
		const context = europeanContext(viewport, ['Germany', 'Italy', 'Romania', 'Serbia']);
		const empireParts = [
			countryFeature('Austria', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			countryFeature('Hungary', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			countryFeature('Czechia', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			countryFeature('Slovakia', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			countryFeature('Slovenia', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			countryFeature('Croatia', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			countryFeature('Bosnia and Herz.', 'removed', 'Austria-Hungary', viewport, { showLabel: false }),
			pointFeature('Austria-Hungary', 'removed', [17.0, 47.2], [17.0, 47.2]),
		].filter(Boolean);
		const austria = countryFeature('Austria', 'added', 'Austria', viewport, { showLabel: true, labelPosition: [13.2, 47.6] });
		const hungary = countryFeature('Hungary', 'added', 'Hungary', viewport, { showLabel: true, labelPosition: [19.4, 47.0] });
		const czechia = countryFeature('Czechia', 'added', 'Czechoslovakia', viewport, { showLabel: false });
		const slovakia = countryFeature('Slovakia', 'added', 'Czechoslovakia', viewport, { showLabel: false });
		const czechoslovakia = pointFeature('Czechoslovakia', 'added', [17.1, 49.7], [17.1, 49.7]);
		const yugoslaviaParts = [
			countryFeature('Slovenia', 'added', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('Croatia', 'added', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('Bosnia and Herz.', 'added', 'Yugoslavia', viewport, { showLabel: false }),
		].filter(Boolean);
		const yugoslavia = pointFeature('Yugoslavia', 'added', [17.0, 44.8], [17.0, 44.8]);
		const poland = pointFeature('Poland', 'added', [20.0, 51.0]);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...empireParts].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, austria, hungary, czechia, slovakia, czechoslovakia, ...yugoslaviaParts, yugoslavia, poland].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Central European country outlines grouped into Austria-Hungary and successor-state labels based on post-WWI references; simplified for the checklist.',
		};
	}

	if (event.id === 'austria-annexed') {
		const viewport = { west: 5.5, south: 45.5, east: 18, north: 55.2 };
		const context = [
			countryFeature('France', 'context', 'France', viewport, { showLabel: true }),
			countryFeature('Switzerland', 'context', 'Switzerland', viewport, { showLabel: true }),
			countryFeature('Italy', 'context', 'Italy', viewport, { showLabel: true }),
			countryFeature('Czechia', 'context', 'Czechoslovakia', viewport, { showLabel: true }),
			countryFeature('Poland', 'context', 'Poland', viewport, { showLabel: true }),
		].filter(Boolean);
		const germany = countryFeature('Germany', 'context', 'Germany', viewport, {
			showLabel: true,
			labelPosition: [10.4, 51.2],
		});
		const austria = countryFeature('Austria', 'removed', 'Austria', viewport, {
			showLabel: true,
			labelPosition: [13.2, 47.6],
			labelSize: 'large',
		});
		const greaterGermany = countryFeature('Germany', 'added', 'Greater Germany', viewport, {
			showLabel: true,
			labelPosition: [10.4, 51.2],
			labelSize: 'large',
		});
		const annexedAustria = countryFeature('Austria', 'added', 'Greater Germany', viewport, {
			showLabel: false,
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, germany, austria].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, greaterGermany, annexedAustria].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Germany/Austria outlines interpreted against 1938 Anschluss references; simplified for the checklist.',
		};
	}

	if (event.id === 'east-west-germany' || event.id === 'german-reunification') {
		const viewport = { west: 4.5, south: 46.5, east: 16, north: 55.5 };
		const context = [
			...europeanContext(viewport, ['France', 'Netherlands', 'Belgium', 'Poland', 'Austria', 'Switzerland', 'Denmark']),
			pointFeature('Berlin', 'boundary', [13.4, 52.5], [14.7, 54.3]),
		];
		const germany = countryFeature('Germany', event.id === 'east-west-germany' ? 'removed' : 'added', 'Germany', viewport, {
			showLabel: true,
			labelPosition: [10.6, 51.0],
			labelSize: 'large',
		});
		const westGermany = polygonFeature('West Germany', event.id === 'east-west-germany' ? 'added' : 'removed', [
			[5.9, 47.4],
			[10.4, 47.4],
			[10.1, 48.7],
			[11.4, 50.1],
			[10.3, 51.3],
			[10.0, 52.2],
			[9.6, 53.6],
			[7.2, 53.8],
			[6.6, 52.4],
			[6.0, 51.5],
			[6.2, 49.5],
			[7.6, 48.1],
		], { labelPosition: [8.2, 50.6] });
		const eastGermany = polygonFeature('East Germany', event.id === 'east-west-germany' ? 'added' : 'removed', [
			[9.6, 53.6],
			[10.0, 52.2],
			[10.3, 51.3],
			[11.4, 50.1],
			[12.6, 50.2],
			[14.9, 51.1],
			[14.2, 53.8],
			[13.2, 54.5],
			[11.0, 54.4],
		], { labelPosition: [12.5, 52.7] });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, event.id === 'east-west-germany' ? [...context, germany].filter(Boolean) : [...context, westGermany, eastGermany]),
			afterMap: mapCollection('After', event.afterLabel, event.id === 'east-west-germany' ? [...context, westGermany, eastGermany] : [...context, germany].filter(Boolean)),
			mapSourceNote: 'Curated Germany split/reunification comparison based on Cold War Germany references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'yugoslavia-dissolution' || event.id === 'serbia-montenegro' || event.id === 'montenegro-independence' || event.id === 'serbia-2006') {
		const viewport = { west: 12, south: 39, east: 25, north: 48 };
		const context = europeanContext(viewport, ['Italy', 'Austria', 'Hungary', 'Romania', 'Bulgaria', 'Albania']);
		const yugoslaviaParts = [
			countryFeature('Slovenia', 'removed', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('Croatia', 'removed', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('Bosnia and Herz.', 'removed', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('Serbia', 'removed', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('Montenegro', 'removed', 'Yugoslavia', viewport, { showLabel: false }),
			countryFeature('North Macedonia', 'removed', 'Yugoslavia', viewport, { showLabel: false }),
			pointFeature('Yugoslavia', 'removed', [18.4, 43.8], [18.4, 43.8]),
		].filter(Boolean);
		const slovenia = countryFeature('Slovenia', 'added', 'Slovenia', viewport, { showLabel: true, labelPosition: [14.9, 46.0], labelSize: 'small' });
		const croatia = countryFeature('Croatia', 'added', 'Croatia', viewport, { showLabel: true, labelPosition: [16.0, 44.8] });
		const bosnia = countryFeature('Bosnia and Herz.', 'added', 'Bosnia-Herzegovina', viewport, { showLabel: true, labelPosition: [17.4, 44.0] });
		const macedonia = countryFeature('North Macedonia', 'added', 'Macedonia', viewport, { showLabel: true, labelPosition: [21.8, 41.5], labelSize: 'small' });
		const serbia = countryFeature('Serbia', 'added', 'Serbia', viewport, { showLabel: true, labelPosition: [20.9, 43.8] });
		const montenegro = countryFeature('Montenegro', 'added', 'Montenegro', viewport, { showLabel: true, labelPosition: [19.3, 42.7], labelSize: 'small' });
		const serbiaMontenegro = [
			countryFeature('Serbia', event.id === 'serbia-montenegro' ? 'added' : 'removed', 'Serbia and Montenegro', viewport, { showLabel: false }),
			countryFeature('Montenegro', event.id === 'serbia-montenegro' ? 'added' : 'removed', 'Serbia and Montenegro', viewport, { showLabel: false }),
			pointFeature('Serbia and Montenegro', event.id === 'serbia-montenegro' ? 'added' : 'removed', [20.5, 43.4], [20.5, 43.4]),
		].filter(Boolean);
		const serbiaOutline = countryFeature('Serbia', 'added', 'Serbia', viewport, {
			showLabel: true,
			labelPosition: [20.9, 44.0],
		});
		const montenegroOutline = countryFeature('Montenegro', 'added', 'Montenegro', viewport, {
			showLabel: true,
			labelPosition: [19.3, 42.7],
			labelSize: 'small',
		});
		const serbiaMontenegroSerbia = countryFeature('Serbia', 'removed', 'Serbia', viewport, { showLabel: false });
		const serbiaMontenegroMontenegro = countryFeature('Montenegro', 'removed', 'Montenegro', viewport, { showLabel: false });
		const serbiaMontenegroLabel = pointFeature('Serbia and Montenegro', 'removed', [20.6, 43.6], [20.6, 43.6]);

		if (event.id === 'yugoslavia-dissolution') {
			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...yugoslaviaParts].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, slovenia, croatia, bosnia, serbia, montenegro, macedonia].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived post-Yugoslav country outlines interpreted against Yugoslavia breakup references; simplified for the checklist.',
			};
		}

		if (event.id === 'serbia-montenegro') {
			return {
				mapViewport: viewport,
				beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...yugoslaviaParts].filter(Boolean)),
				afterMap: mapCollection('After', event.afterLabel, [...context, ...serbiaMontenegro].filter(Boolean)),
				mapSourceNote: 'Natural Earth-derived Serbia and Montenegro outlines interpreted against Yugoslavia / Serbia and Montenegro name references; simplified for the checklist.',
			};
		}

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, serbiaMontenegroSerbia, serbiaMontenegroMontenegro, serbiaMontenegroLabel].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, serbiaOutline, montenegroOutline].filter(Boolean)),
			mapSourceNote: 'Curated Serbia-Montenegro separation comparison based on Montenegro independence and Serbia statehood references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'belgium') {
		const viewport = { west: 1.5, south: 48.8, east: 7.6, north: 53.8 };
		const context = europeanContext(viewport, ['France', 'Germany', 'Luxembourg']);
		const unitedNetherlandsNorth = countryFeature('Netherlands', 'removed', 'United Netherlands', viewport, {
			showLabel: false,
		});
		const unitedNetherlandsSouth = countryFeature('Belgium', 'removed', 'United Netherlands', viewport, {
			showLabel: false,
		});
		const unitedNetherlandsLabel = pointFeature('United Netherlands', 'removed', [4.7, 51.9], [4.7, 51.9]);
		const northNetherlands = countryFeature('Netherlands', 'context', 'Netherlands', viewport, {
			showLabel: true,
			labelPosition: [5.2, 52.5],
		});
		const belgium = countryFeature('Belgium', 'added', 'Belgium', viewport, {
			showLabel: true,
			labelPosition: [4.5, 50.65],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, unitedNetherlandsNorth, unitedNetherlandsSouth, unitedNetherlandsLabel].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, northNetherlands, belgium].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Netherlands and Belgium outlines interpreted against Belgian Revolution independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'germany-unification') {
		const viewport = { west: 4.5, south: 46, east: 18.5, north: 55.8 };
		const context = europeanContext(viewport, ['France', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Denmark', 'Poland']);
		const germanStates = countryFeature('Germany', 'removed', 'German states', viewport, {
			showLabel: true,
			labelPosition: [10.7, 51.2],
			labelSize: 'large',
		});
		const prussia = pointFeature('Prussia', 'removed', [13.0, 52.8], [13.0, 52.8]);
		const bavaria = pointFeature('Bavaria', 'removed', [11.6, 48.9], [11.6, 48.9]);
		const saxony = pointFeature('Saxony', 'removed', [13.4, 51.0], [13.4, 51.0]);
		const empire = countryFeature('Germany', 'added', 'German Empire', viewport, {
			showLabel: true,
			labelPosition: [10.7, 51.2],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, germanStates, prussia, bavaria, saxony].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, empire].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Germany outline with curated German-state labels, interpreted against 1871 German unification references; simplified for the checklist.',
		};
	}

	if (event.id === 'romania-unification') {
		const viewport = { west: 20, south: 42.5, east: 31, north: 49 };
		const context = europeanContext(viewport, ['Austria', 'Hungary', 'Serbia', 'Bulgaria', 'Ukraine']);
		const moldavia = polygonFeature('Moldavia', 'removed', [
			[25.5, 45.2],
			[27.0, 45.3],
			[28.6, 45.5],
			[29.7, 46.1],
			[29.3, 47.4],
			[28.6, 48.2],
			[26.8, 48.4],
			[25.8, 47.5],
			[25.2, 46.4],
			[25.0, 45.7],
		], { labelPosition: [27.6, 46.8] });
		const wallachia = polygonFeature('Wallachia', 'removed', [
			[22.4, 43.8],
			[24.0, 43.6],
			[26.2, 43.7],
			[27.8, 44.0],
			[28.6, 45.0],
			[27.4, 45.4],
			[25.4, 45.6],
			[23.4, 45.1],
			[22.4, 44.5],
		], { labelPosition: [25.3, 44.6] });
		const romania = countryFeature('Romania', 'added', 'Romania', viewport, {
			showLabel: true,
			labelPosition: [26.2, 45.7],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, moldavia, wallachia]),
			afterMap: mapCollection('After', event.afterLabel, [...context, romania].filter(Boolean)),
			mapSourceNote: 'Curated Moldavia-Wallachia comparison with Natural Earth-derived Romania outline, based on Romanian unification historical references; simplified for the checklist.',
		};
	}

	if (event.id === 'venetia-italy') {
		const viewport = { west: 7, south: 43.5, east: 15, north: 48.6 };
		const context = europeanContext(viewport, ['France', 'Switzerland', 'Austria', 'Slovenia']);
		const italy = countryFeature('Italy', 'context', 'Italy', viewport, { showLabel: true });
		const venetia = polygonFeature('Austrian Venetia', 'removed', [
			[10.2, 44.8],
			[11.4, 44.9],
			[12.3, 45.1],
			[13.6, 45.3],
			[13.7, 46.0],
			[13.2, 46.5],
			[12.2, 46.8],
			[11.1, 46.6],
			[10.4, 46.0],
			[10.1, 45.3],
		], { labelPosition: [12.0, 45.7], labelSize: 'large' });
		const italianVenetia = {
			...venetia,
			properties: { ...venetia.properties, label: 'Italian Venetia', role: 'added' },
		};

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, italy, venetia].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, italy, italianVenetia].filter(Boolean)),
			mapSourceNote: 'Curated Venetia transfer comparison based on Italian unification historical references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'austria-hungary') {
		const viewport = { west: 8, south: 42, east: 27, north: 52 };
		const context = europeanContext(viewport, ['Germany', 'Italy', 'Serbia', 'Romania', 'Poland']);
		const empireParts = [
			countryFeature('Austria', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			countryFeature('Hungary', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			countryFeature('Czechia', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			countryFeature('Slovakia', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			countryFeature('Slovenia', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			countryFeature('Croatia', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			countryFeature('Bosnia and Herz.', 'removed', 'Austrian Empire', viewport, { showLabel: false }),
			pointFeature('Austrian Empire', 'removed', [17.0, 47.1], [17.0, 47.1]),
		].filter(Boolean);
		const cisleithania = [
			countryFeature('Austria', 'added', 'Austria', viewport, { showLabel: true, labelPosition: [13.2, 47.6] }),
			countryFeature('Czechia', 'added', 'Austria', viewport, { showLabel: false }),
			countryFeature('Slovenia', 'added', 'Austria', viewport, { showLabel: false }),
		].filter(Boolean);
		const hungary = [
			countryFeature('Hungary', 'added', 'Hungary', viewport, { showLabel: true, labelPosition: [20.0, 47.1] }),
			countryFeature('Slovakia', 'added', 'Hungary', viewport, { showLabel: false }),
			countryFeature('Croatia', 'added', 'Hungary', viewport, { showLabel: false }),
		].filter(Boolean);

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...empireParts].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, ...cisleithania, ...hungary].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Central European outlines grouped into Austrian Empire and Dual Monarchy labels based on the 1867 Ausgleich; simplified for the checklist.',
		};
	}

	if (event.id === 'balkan-independence-1878') {
		const viewport = { west: 18, south: 38.5, east: 30.5, north: 47.8 };
		const context = europeanContext(viewport, ['Austria', 'Hungary', 'Bulgaria', 'Greece']);
		const ottomanBalkans = [
			countryFeature('Serbia', 'removed', 'Ottoman suzerainty', viewport, { showLabel: false }),
			countryFeature('Montenegro', 'removed', 'Ottoman suzerainty', viewport, { showLabel: false }),
			countryFeature('Romania', 'removed', 'Ottoman suzerainty', viewport, { showLabel: false }),
			pointFeature('Ottoman suzerainty', 'removed', [24.3, 44.5], [24.3, 44.5]),
		].filter(Boolean);
		const serbia = countryFeature('Serbia', 'added', 'Serbia', viewport, { showLabel: true, labelPosition: [20.7, 43.8] });
		const montenegro = countryFeature('Montenegro', 'added', 'Montenegro', viewport, { showLabel: true, labelPosition: [19.3, 42.3], labelSize: 'small' });
		const romania = countryFeature('Romania', 'added', 'Romania', viewport, { showLabel: true, labelPosition: [25.9, 45.8] });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ...ottomanBalkans].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, serbia, montenegro, romania].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Serbia, Montenegro, and Romania outlines interpreted against Treaty of Berlin independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'norway-independence') {
		const viewport = { west: -6, south: 52, east: 38, north: 74 };
		const context = [
			countryFeature('Denmark', 'context', 'Denmark', viewport, { showLabel: true }),
			countryFeature('Finland', 'context', 'Finland', viewport, { showLabel: true, labelPosition: [25.5, 64.5] }),
			countryFeature('Russia', 'context', 'Russia', viewport, { showLabel: false }),
		].filter(Boolean);
		const unionNorway = countryFeature('Norway', 'removed', 'Norway', viewport, { showLabel: false });
		const unionSweden = countryFeature('Sweden', 'removed', 'Sweden', viewport, { showLabel: false });
		const unionLabel = pointFeature('Sweden-Norway', 'removed', [13.4, 63.2], [13.4, 63.2]);
		const norway = countryFeature('Norway', 'added', 'Norway', viewport, { showLabel: true, labelPosition: [9.6, 63.2], labelSize: 'large' });
		const sweden = countryFeature('Sweden', 'context', 'Sweden', viewport, { showLabel: true, labelPosition: [16.8, 62.2] });

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, unionNorway, unionSweden, unionLabel].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, sweden, norway].filter(Boolean)),
			mapSourceNote: 'Curated Sweden-Norway/Norway comparison based on 1905 Norwegian independence historical references and Natural Earth-derived regional context; simplified for the checklist.',
		};
	}

	if (event.id === 'bulgaria-independence') {
		const viewport = { west: 20, south: 39, east: 30, north: 45.5 };
		const context = europeanContext(viewport, ['Romania', 'Serbia', 'Greece', 'Turkey']);
		const ottomanBulgaria = countryFeature('Bulgaria', 'removed', 'Ottoman Bulgaria', viewport, {
			showLabel: true,
			labelPosition: [25.2, 42.7],
			labelSize: 'large',
		});
		const bulgaria = countryFeature('Bulgaria', 'added', 'Bulgaria', viewport, {
			showLabel: true,
			labelPosition: [25.2, 42.7],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ottomanBulgaria].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, bulgaria].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Bulgaria outline interpreted against Bulgarian independence references; simplified for the checklist.',
		};
	}

	if (event.id === 'albania-independence') {
		const viewport = { west: 18, south: 38.5, east: 23, north: 43.5 };
		const context = europeanContext(viewport, ['Montenegro', 'Serbia', 'Greece']);
		const ottomanAlbania = countryFeature('Albania', 'removed', 'Ottoman Albania', viewport, {
			showLabel: true,
			labelPosition: [20.0, 41.1],
			labelSize: 'large',
		});
		const albania = countryFeature('Albania', 'added', 'Albania', viewport, {
			showLabel: true,
			labelPosition: [20.0, 41.1],
			labelSize: 'large',
		});

		return {
			mapViewport: viewport,
			beforeMap: mapCollection('Before', event.beforeLabel, [...context, ottomanAlbania].filter(Boolean)),
			afterMap: mapCollection('After', event.afterLabel, [...context, albania].filter(Boolean)),
			mapSourceNote: 'Natural Earth-derived Albania outline interpreted against Albanian independence references; simplified for the checklist.',
		};
	}

	return null;
}

function mapPackForEvent(event) {
	const manualMapPack = manualMapPackForEvent(event);
	if (manualMapPack) {
		return manualMapPack;
	}

	const focusNames = eventCountries(event);
	const focusFeatures = focusNames.map((name) => countryByName.get(name)).filter(Boolean);
	const focusBox = mergeBboxes(focusFeatures.map(bboxForFeature));
	const viewport = padViewport(focusBox, event.region, event.id);
	const context = [...contextCountries(viewport, focusNames), ...contextPoints(event.id)];
	const afterLabel = event.afterLabel;
	const beforeLabel = event.beforeLabel;
	const marker = markerOverrides[event.id];
	const line = lineOverrides[event.id];
	const singleFocus = focusNames.length === 1;
	const usePointOrLineFocus = Boolean(marker || line);
	const beforeFocus = focusNames
		.map((name, index) => countryFeature(name, usePointOrLineFocus ? 'context' : 'removed', singleFocus ? (usePointOrLineFocus ? name : beforeLabel) : name, viewport, { labelSize: singleFocus && !usePointOrLineFocus ? 'large' : 'normal', showLabel: usePointOrLineFocus ? false : index < 8 }))
		.filter(Boolean);
	const afterFocus = focusNames
		.map((name, index) => countryFeature(name, usePointOrLineFocus ? 'context' : 'added', singleFocus ? (usePointOrLineFocus ? name : afterLabel) : name, viewport, { labelSize: singleFocus && !usePointOrLineFocus ? 'large' : 'normal', showLabel: usePointOrLineFocus ? false : index < 8 }))
		.filter(Boolean);

	if (!beforeFocus.length && marker) {
		beforeFocus.push(pointFeature(compactMarkerLabel(beforeLabel), 'removed', marker));
		afterFocus.push(pointFeature(compactMarkerLabel(afterLabel), 'added', marker));
	}

	if (!beforeFocus.length) {
		const fallbackCenter = [(viewport.west + viewport.east) / 2, (viewport.south + viewport.north) / 2];
		beforeFocus.push(pointFeature(beforeLabel, 'removed', fallbackCenter));
		afterFocus.push(pointFeature(afterLabel, 'added', fallbackCenter));
	}

	if (marker) {
		beforeFocus.push(pointFeature(compactMarkerLabel(beforeLabel), 'removed', marker));
		afterFocus.push(pointFeature(compactMarkerLabel(afterLabel), 'added', marker));
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
