export type GlobeAnswer = 'yes' | 'no' | 'unsure';

export interface GlobeClue {
	id: string;
	year: number;
	beforeAnswerIsInconclusive?: boolean;
}

export interface GlobeRange<T extends GlobeClue> {
	earliestYear: number;
	latestYear: number;
	lowerBoundEvent: T | null;
	upperBoundEvent: T | null;
}

export function initialGlobeRange<T extends GlobeClue>(earliestYear: number, latestYear: number): GlobeRange<T> {
	return { earliestYear, latestYear, lowerBoundEvent: null, upperBoundEvent: null };
}

export function applyGlobeConstraint<T extends GlobeClue>(range: GlobeRange<T>, event: T, answer: GlobeAnswer): GlobeRange<T> {
	if (answer === 'yes' && event.year >= range.earliestYear) {
		return { ...range, earliestYear: event.year, lowerBoundEvent: event };
	}

	if (answer === 'no' && !event.beforeAnswerIsInconclusive && event.year <= range.latestYear) {
		// A clue records only its transition year, so "before" can still be earlier
		// in that same year. Do not invent month/day precision or erase conflicts.
		return { ...range, latestYear: event.year, upperBoundEvent: event };
	}

	return range;
}

export const hasGlobeConflict = (range: { earliestYear: number; latestYear: number }) => range.earliestYear > range.latestYear;

export function nextGlobeEvent<T extends GlobeClue>(events: readonly T[], askedIds: ReadonlySet<string>, range: GlobeRange<T>): T | null {
	if (hasGlobeConflict(range)) return null;
	const candidates = events.filter((event) => !askedIds.has(event.id)
		&& event.year >= range.earliestYear && event.year <= range.latestYear);
	return candidates[Math.floor((candidates.length - 1) / 2)] ?? null;
}

export function parseGlobeAnswers<T extends GlobeClue>(state: string, eventsById: ReadonlyMap<string, T>): { event: T; answer: GlobeAnswer }[] {
	const seen = new Set<string>();
	const answers: { event: T; answer: GlobeAnswer }[] = [];
	for (const entry of state.split(',')) {
		const [id, code, extra] = entry.split(':');
		const event = eventsById.get(id);
		const answer = code === 'y' ? 'yes' : code === 'n' ? 'no' : code === 'u' ? 'unsure' : null;
		if (!event || !answer || extra !== undefined || seen.has(id)) continue;
		seen.add(id);
		answers.push({ event, answer });
	}
	return answers;
}
