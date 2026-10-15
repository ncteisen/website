import assert from 'node:assert/strict';
import { createGame, otherTeam, packs, parseSave, remaining, restoreGame, toggleCard, type Pack } from '../../src/games/codewords/engine';

for (const pack of Object.keys(packs) as Pack[]) {
	for (let seed = 0; seed < 100; seed++) {
		const game = createGame(`board-${seed}`, pack);
		assert.equal(game.cards.length, 25);
		assert.equal(new Set(game.cards.map(card => card.word)).size, 25);
		assert.deepEqual([remaining(game, 'red'), remaining(game, 'blue')].sort(), [8, 9]);
		assert.equal(game.cards.filter(card => card.identity === 'neutral').length, 7);
		assert.equal(game.cards.filter(card => card.identity === 'assassin').length, 1);
		assert.deepEqual(game, createGame(` BOARD-${seed} `, pack));
	}
}

// Existing shared seeds must keep their original board layout.
const fixture = createGame('805583');
assert.deepEqual(fixture.cards.slice(0, 5).map(card => card.word), ['CHANGE', 'STICK', 'BEAT', 'WEB', 'RAY']);
assert.equal(fixture.cards[0].identity, 'neutral');
assert.equal(remaining(fixture, 'blue'), 9);
const initial = createGame('test');
for (const identity of ['red', 'blue', 'neutral', 'assassin'] as const) {
	const index = initial.cards.findIndex(card => card.identity === identity);
	const marked = toggleCard(initial, index);
	assert.equal(marked.cards[index].selected, true);
	assert.equal(initial.cards[index].selected, false, 'A mark does not mutate another copy of the board');
	if (identity === 'red' || identity === 'blue') {
		assert.equal(remaining(marked, identity), remaining(initial, identity) - 1);
		assert.equal(remaining(marked, otherTeam(identity)), remaining(initial, otherTeam(identity)));
	}
	assert.deepEqual(toggleCard(marked, index), initial, 'A second tap clears the mark');
}
let allMarked = initial;
for (let index = 0; index < 25; index++) allMarked = toggleCard(allMarked, index);
assert.equal(allMarked.cards.every(card => card.selected), true, 'No lockout after an assassin or completed team');
assert.equal(remaining(allMarked, 'red') + remaining(allMarked, 'blue'), 0);
for (let index = 0; index < 25; index++) allMarked = toggleCard(allMarked, index);
assert.deepEqual(allMarked, initial);
for (const index of [-1, 25, 1.5, NaN]) assert.equal(toggleCard(initial, index), initial);

const save = { version: 2, seed: 'test', pack: 'classic', selected: [0, 3, 7] };
const parsed = parseSave(JSON.stringify(save));
assert.ok(parsed);
assert.equal(restoreGame(parsed).cards.filter(card => card.selected).length, 3);
assert.deepEqual(restoreGame(parsed).cards.map(card => card.word), initial.cards.map(card => card.word));
const old = parseSave(JSON.stringify({ version: 1, seed: 'test', pack: 'classic', actions: [{kind:'clue',word:'hello',count:2}, {kind:'reveal',index:3}, {kind:'pass'}] }));
assert.deepEqual(old?.selected, [3], 'Old saved reveals are retained without turns or clues');
for (const value of [null, {...save,version:9}, {...save,pack:'__proto__'}, {...save,selected:[-1]}, {...save,selected:[25]}, {...save,selected:[0,0]}, {...save,selected:['0']}, {...save,seed:null}]) assert.equal(parseSave(JSON.stringify(value)), null);
assert.equal(parseSave('{broken'), null);
console.log('Codewords checks passed: 600 deterministic boards, existing seed compatibility, reversible marks, counts, no lockouts, and saved-state migration.');
