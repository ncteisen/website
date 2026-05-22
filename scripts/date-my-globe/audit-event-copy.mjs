import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');
const { dateMyGlobeEvents } = await import(resolve(repoRoot, 'src/data/dateMyGlobeEvents.ts'));

const weakWords = [
	'clue',
	'marker',
	'useful',
	'date',
	'dating',
];

const preferredSourcePattern = /wikipedia\.org|britannica\.com/i;
const genericDescriptionPatterns = [
	/It changed the relevant label or boundary/,
	/The visible result was/,
	/part of the evolving language/,
	/broader shift/,
	/older political unit into a new arrangement/,
	/distinct political entity/,
];
const issues = [];
const warnings = [];

function sentenceCount(text) {
	return text
		.split(/(?<=[.!?])\s+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean)
		.length;
}

for (const event of dateMyGlobeEvents) {
	const prefix = `${event.id} (${event.year})`;
	const description = event.description?.trim() ?? '';
	const sourceLabel = event.sourceLabel?.trim() ?? '';
	const sourceUrl = event.sourceUrl?.trim() ?? '';

	if (!description) {
		issues.push(`${prefix}: missing description`);
		continue;
	}

	const sentences = sentenceCount(description);
	if (sentences < 2 || sentences > 3) {
		warnings.push(`${prefix}: description should be 2-3 sentences, found ${sentences}`);
	}

	const lowerDescription = description.toLowerCase();
	const weakMatches = weakWords.filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(lowerDescription));
	if (weakMatches.length) {
		warnings.push(`${prefix}: description uses dating-helper language: ${weakMatches.join(', ')}`);
	}

	const genericMatches = genericDescriptionPatterns.filter((pattern) => pattern.test(description));
	if (genericMatches.length) {
		warnings.push(`${prefix}: description still looks template-generated`);
	}

	if (!sourceLabel || !sourceUrl) {
		issues.push(`${prefix}: missing source label or URL`);
		continue;
	}

	if (!preferredSourcePattern.test(sourceUrl)) {
		warnings.push(`${prefix}: source is not Wikipedia or Britannica: ${sourceUrl}`);
	}
}

const report = {
	totalEvents: dateMyGlobeEvents.length,
	issues: issues.length,
	warnings: warnings.length,
	sampleIssues: issues.slice(0, 40),
	sampleWarnings: warnings.slice(0, 80),
};

console.log(JSON.stringify(report, null, 2));

if (issues.length) {
	throw new Error(`Date My Globe event-copy audit found blocking issues:\n${issues.join('\n')}`);
}

if (warnings.length) {
	throw new Error(`Date My Globe event-copy audit found quality warnings:\n${warnings.join('\n')}`);
}
