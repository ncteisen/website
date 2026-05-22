import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');
const { dateMyGlobeEvents } = await import(resolve(repoRoot, 'src/data/dateMyGlobeEvents.ts'));

const projectPoint = ([lon, lat], viewport) => [
	((lon - viewport.west) / (viewport.east - viewport.west)) * 100,
	((viewport.north - lat) / (viewport.north - viewport.south)) * 100,
];

function ringsForFeature(feature) {
	if (feature.geometry.type === 'MultiPolygon') {
		return feature.geometry.coordinates.flat();
	}

	if (feature.geometry.type === 'Polygon') {
		return feature.geometry.coordinates;
	}

	return [];
}

function geometryPoints(feature) {
	if (feature.geometry.type === 'Point') {
		return [feature.geometry.coordinates];
	}

	if (feature.geometry.type === 'LineString') {
		return feature.geometry.coordinates;
	}

	return ringsForFeature(feature).flat();
}

function projectedBox(features, viewport) {
	const points = features.flatMap((feature) => geometryPoints(feature).map((point) => projectPoint(point, viewport)));
	if (!points.length) {
		return null;
	}

	return points.reduce((box, [x, y]) => ({
		left: Math.min(box.left, x),
		top: Math.min(box.top, y),
		right: Math.max(box.right, x),
		bottom: Math.max(box.bottom, y),
	}), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
}

function boxArea(box) {
	if (!box) return 0;
	return Math.max(0, box.right - box.left) * Math.max(0, box.bottom - box.top);
}

function boxCenterDistance(box) {
	if (!box) return 100;
	return Math.hypot(((box.left + box.right) / 2) - 50, ((box.top + box.bottom) / 2) - 50);
}

function featureSummary(map) {
	return map.features.reduce((summary, feature) => {
		const role = feature.properties.role;
		const type = feature.geometry.type;
		summary.roles[role] = (summary.roles[role] ?? 0) + 1;
		summary.geometry[type] = (summary.geometry[type] ?? 0) + 1;
		return summary;
	}, { roles: {}, geometry: {} });
}

function labelIssues(map, viewport) {
	return map.features
		.filter((feature) => feature.properties.showLabel !== false && feature.properties.label && feature.properties.labelPosition)
		.map((feature) => {
			const [x, y] = projectPoint(feature.properties.labelPosition, viewport);
			return { label: feature.properties.label, x, y };
		})
		.filter(({ x, y }) => x < 3 || y < 3 || x > 97 || y > 97);
}

function labelClipIssues(map, viewport) {
	return map.features
		.filter((feature) => feature.properties.showLabel !== false && feature.properties.label && feature.properties.labelPosition)
		.map((feature) => labelBox(feature, viewport))
		.filter((box) => box.left < 1 || box.top < 1 || box.right > 99 || box.bottom > 99);
}

function labelSize(feature) {
	if (feature.properties.labelSize === 'large') {
		return 4.2;
	}

	if (feature.properties.labelSize === 'small' || feature.properties.role === 'context') {
		return 2.7;
	}

	return 3.4;
}

function labelBox(feature, viewport) {
	const [x, y] = projectPoint(feature.properties.labelPosition, viewport);
	const size = labelSize(feature);
	const width = Math.max(4, String(feature.properties.label).length * size * 0.48);
	const height = size * 1.15;

	return {
		label: feature.properties.label,
		role: feature.properties.role,
		left: x - width / 2,
		top: y - height / 2,
		right: x + width / 2,
		bottom: y + height / 2,
	};
}

function overlapArea(a, b) {
	return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
		Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

function labelOverlapIssues(map, viewport) {
	const labels = map.features
		.filter((feature) => feature.properties.showLabel !== false && feature.properties.label && feature.properties.labelPosition)
		.map((feature) => labelBox(feature, viewport));
	const overlaps = [];

	for (let index = 0; index < labels.length; index += 1) {
		for (let compareIndex = index + 1; compareIndex < labels.length; compareIndex += 1) {
			const first = labels[index];
			const second = labels[compareIndex];
			const hasFocusLabel = first.role !== 'context' || second.role !== 'context';

			if (hasFocusLabel && overlapArea(first, second) > 3) {
				overlaps.push(`${first.label} / ${second.label}`);
			}
		}
	}

	return overlaps;
}

function focusFeatures(map) {
	return map.features.filter((feature) => !['context', 'boundary'].includes(feature.properties.role));
}

function focusSignature(map) {
	return focusFeatures(map)
		.map((feature) => [
			feature.properties.role,
			feature.geometry.type,
			feature.properties.label,
			feature.properties.showLabel === false ? 'hidden' : 'shown',
		].join(':'))
		.sort()
		.join('|');
}

function visibleFocusLabels(map) {
	return focusFeatures(map)
		.filter((feature) => feature.properties.showLabel !== false && feature.properties.label)
		.map((feature) => feature.properties.label);
}

const issues = [];
const warnings = [];
const pointOnlyAllowedEventIds = new Set([
	'dutch-east-india-company',
	'budapest-name',
	'petrograd-name',
	'leningrad-name',
	'oslo-name',
	'istanbul-name',
]);

for (const event of dateMyGlobeEvents) {
	const before = event.beforeMap;
	const after = event.afterMap;
	const viewport = event.mapViewport;
	const problemPrefix = `${event.id} (${event.year})`;

	if (!viewport || !before || !after) {
		issues.push(`${problemPrefix}: missing map data`);
		continue;
	}

	if (focusSignature(before) === focusSignature(after)) {
		warnings.push(`${problemPrefix}: before/after focus features have identical signatures`);
	}

	const beforeVisibleFocus = new Set(visibleFocusLabels(before));
	const sharedVisibleFocusLabels = visibleFocusLabels(after).filter((label) => beforeVisibleFocus.has(label));
	if (sharedVisibleFocusLabels.length) {
		warnings.push(`${problemPrefix}: before/after reuse visible focus labels: ${sharedVisibleFocusLabels.join(', ')}`);
	}

	for (const [side, map] of [['before', before], ['after', after]]) {
		const summary = featureSummary(map);
		const mapFocusFeatures = map.features.filter((feature) => feature.properties.role !== 'context');
		const datedFocusFeatures = focusFeatures(map);
		const focusBox = projectedBox(mapFocusFeatures, viewport);
		const labelsNearEdge = labelIssues(map, viewport);
		const labelsClipped = labelClipIssues(map, viewport);
		const labelsOverlapping = labelOverlapIssues(map, viewport);

		if (!mapFocusFeatures.length) {
			issues.push(`${problemPrefix}: ${side} has no focus feature`);
		}

		if (!summary.roles.context) {
			warnings.push(`${problemPrefix}: ${side} has no surrounding context geography`);
		}

		if (
			datedFocusFeatures.length &&
			datedFocusFeatures.every((feature) => feature.geometry.type === 'Point') &&
			!pointOnlyAllowedEventIds.has(event.id)
		) {
			warnings.push(`${problemPrefix}: ${side} uses only point focus features outside the allowed city/name-label clues`);
		}

		if (
			datedFocusFeatures.length &&
			datedFocusFeatures.every((feature) => feature.geometry.type === 'Point') &&
			(summary.roles.context ?? 0) < 3
		) {
			warnings.push(`${problemPrefix}: ${side} point-only clue has too little surrounding context`);
		}

		if (boxArea(focusBox) < 18 && !summary.geometry.Point && !summary.geometry.LineString) {
			warnings.push(`${problemPrefix}: ${side} focus polygon is very small in the card`);
		}

		if (
			datedFocusFeatures.length &&
			datedFocusFeatures.some((feature) => feature.geometry.type !== 'Point') &&
			boxArea(projectedBox(datedFocusFeatures, viewport)) < 12
		) {
			warnings.push(`${problemPrefix}: ${side} dated focus area is too small to read clearly`);
		}

		if (
			datedFocusFeatures.length &&
			datedFocusFeatures.some((feature) => feature.geometry.type !== 'Point') &&
			boxCenterDistance(projectedBox(datedFocusFeatures, viewport)) > 35
		) {
			warnings.push(`${problemPrefix}: ${side} dated focus is too far from the card center`);
		}

		if (boxArea(focusBox) > 8500) {
			warnings.push(`${problemPrefix}: ${side} focus feature fills almost the entire card`);
		}

		if (labelsNearEdge.length) {
			warnings.push(`${problemPrefix}: ${side} labels near edge: ${labelsNearEdge.map((label) => label.label).join(', ')}`);
		}

		if (labelsClipped.length) {
			warnings.push(`${problemPrefix}: ${side} labels may clip at edge: ${labelsClipped.map((label) => label.label).join(', ')}`);
		}

		if (labelsOverlapping.length) {
			warnings.push(`${problemPrefix}: ${side} overlapping labels: ${labelsOverlapping.join(', ')}`);
		}
	}
}

const report = {
	totalEvents: dateMyGlobeEvents.length,
	issues: issues.length,
	warnings: warnings.length,
	sampleWarnings: warnings.slice(0, 40),
};

console.log(JSON.stringify(report, null, 2));

if (issues.length) {
	throw new Error(`Date My Globe map audit found blocking issues:\n${issues.join('\n')}`);
}
