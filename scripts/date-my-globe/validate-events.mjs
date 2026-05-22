import { readFileSync } from 'node:fs';

const EXPECTED_EVENT_COUNT = 134;
const html = readFileSync('dist/projects/date-my-globe/index.html', 'utf8');
const match = html.match(/<script type="application\/json" id="date-my-globe-events">([\s\S]*?)<\/script>/);

if (!match) {
	throw new Error('Could not find date-my-globe event JSON in the built page. Run npm run build first.');
}

const events = JSON.parse(match[1]);
const mappedEvents = events.filter((event) => event.mapViewport && event.beforeMap && event.afterMap);
const checklistEvents = mappedEvents.filter((event) => event.includeInChecklist);
const duplicateYears = new Set();
const seenYears = new Set();
const invalidGeometry = [];

for (const event of events) {
	if (seenYears.has(event.year)) {
		duplicateYears.add(event.year);
	}
	seenYears.add(event.year);

	for (const side of ['beforeMap', 'afterMap']) {
		const map = event[side];
		if (!map?.features?.length) {
			invalidGeometry.push(`${event.id}:${side}:missing features`);
			continue;
		}

		for (const feature of map.features) {
			const geometryType = feature.geometry?.type;
			const coordinates = feature.geometry?.coordinates;
			const valid = (
				geometryType === 'Point' && Array.isArray(coordinates) && coordinates.length === 2
			) || (
				geometryType === 'LineString' && Array.isArray(coordinates) && coordinates.length >= 2
			) || (
				geometryType === 'Polygon' && Array.isArray(coordinates) && coordinates.length > 0
			) || (
				geometryType === 'MultiPolygon' && Array.isArray(coordinates) && coordinates.length > 0
			);

			if (!valid) {
				invalidGeometry.push(`${event.id}:${side}:${feature.properties?.label ?? 'feature'}`);
			}
		}
	}
}

const report = {
	totalEvents: events.length,
	mappedEvents: mappedEvents.length,
	checklistEvents: checklistEvents.length,
	duplicateYears: [...duplicateYears].sort((a, b) => a - b),
	invalidGeometry,
};

console.log(JSON.stringify(report, null, 2));

if (events.length !== EXPECTED_EVENT_COUNT) {
	throw new Error(`Expected ${EXPECTED_EVENT_COUNT} events, found ${events.length}.`);
}

if (mappedEvents.length !== EXPECTED_EVENT_COUNT) {
	throw new Error(`Expected ${EXPECTED_EVENT_COUNT} mapped events, found ${mappedEvents.length}.`);
}

if (checklistEvents.length !== EXPECTED_EVENT_COUNT) {
	throw new Error(`Expected ${EXPECTED_EVENT_COUNT} checklist events, found ${checklistEvents.length}.`);
}

if (invalidGeometry.length) {
	throw new Error(`Found invalid map geometry: ${invalidGeometry.join(', ')}`);
}
