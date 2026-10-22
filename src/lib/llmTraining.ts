// A deliberately simple teaching step, with room for the unshown vocabulary.
// Preserve sub-percent values and never raise a non-target token to a floor.
export function nextTrainingProbability(current: number, correct: boolean): number {
	return correct ? Math.min(96, current + 8) : Math.max(0, current - Math.min(4, current / 2));
}

export function nextTrainingProbabilities(current: readonly number[], correctIndex: number): number[] {
	const next = current.map((value, index) => nextTrainingProbability(value, index === correctIndex));
	const excess = Math.max(0, next.reduce((sum, value) => sum + value, 0) - 100);
	if (correctIndex >= 0 && correctIndex < next.length) {
		next[correctIndex] -= excess;
	}
	return next;
}
