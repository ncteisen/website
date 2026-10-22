import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';

// Exercise the real lifecycle controllers with shared browser storage; visual/audio
// dependencies are irrelevant to the stale-tab save and are intentionally stubbed.
const stubs = {
	Renderer: 'export class Renderer { ready=Promise.resolve(); viewportHeight=600; resize(){return 600} render(){} reset(){} update(){} bounce(){} }',
	InputHandler: 'export class InputHandler { reset(){} cleanup(){} read(){return {axis:0,target:null}} }',
	FlapInput: 'export class FlapInput { cleanup(){} }',
	Input: 'export class Input { controls={axis:0,target:null,held:false}; clear(){} cleanup(){} }',
	GameAudio: 'export class GameAudio { enabled=true; unlock(){} play(){} cleanup(){} }',
};
const { outputFiles } = await build({
	stdin: { contents: `export { GameEngine } from './src/games/sarah-jumps/js/core/GameEngine';
		export { FlappySarah } from './src/games/flappy-sarah/FlappySarah';
		export { Game } from './src/games/arcade/collection/Game';`, resolveDir: process.cwd() },
	bundle: true, write: false, format: 'iife', globalName: 'controllers',
	define: { 'import.meta.env.PUBLIC_ARCADE_API_URL': '""' },
	plugins: [{ name: 'visual-stubs', setup(builder) {
		builder.onResolve({ filter: /\/(Renderer|InputHandler|FlapInput|Input|GameAudio)$/ }, args => ({ path: args.path.split('/').at(-1), namespace: 'stub' }));
		builder.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ contents: stubs[args.path] }));
	} }],
});
class Element extends EventTarget {
	textContent = ''; dataset = {}; disabled = false; hidden = false;
	setAttribute() {} focus() {}
}
class Root {
	dataset = {}; elements = new Map();
	querySelector(selector) { if (!this.elements.has(selector)) this.elements.set(selector, new Element()); return this.elements.get(selector); }
}
for (const [name, id, key] of [
	['GameEngine', undefined, 'sarahJumpsHighScore'],
	['FlappySarah', undefined, 'flappySarahHighScore'],
	['Game', 'sarah-stacks', 'sarahStacksHighScore'],
]) {
	const values = new Map(); let denyWrites = false;
	const window = new EventTarget();
	const context = vm.createContext({
		localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (denyWrites) throw new Error('Quota'); values.set(key, value); } },
		window, document: Object.assign(new EventTarget(), { hidden: false, hasFocus: () => true }),
		AbortController, ResizeObserver: class { observe() {} disconnect() {} }, cancelAnimationFrame() {},
	});
	vm.runInContext(outputFiles[0].text, context);
	const rootA = new Root(), rootB = new Root();
	const a = new context.controllers[name](rootA, id), b = new context.controllers[name](rootB, id);
	a.state = 'playing'; a.world.score = 100; a.pause();
	b.state = 'playing'; b.world.score = 20; b.pause();
	assert.equal(values.get(key), '100', `${name}: a stale lower-scoring tab cannot overwrite the best`);
	assert.equal(rootB.querySelector('[data-best]').textContent, '100', `${name}: the stale controller adopts the saved best`);
	values.set(key, '250');
	window.dispatchEvent(Object.assign(new Event('storage'), { key }));
	assert.equal(rootA.querySelector('[data-best]').textContent, '250', `${name}: other-tab bests update the HUD`);
	values.set(key, '300'); window.dispatchEvent(new Event('pageshow'));
	assert.equal(rootB.querySelector('[data-best]').textContent, '300', `${name}: a restored page refreshes its best`);
	denyWrites = true;
	a.state = 'playing'; a.world.score = 400; a.pause();
	assert.equal(rootA.querySelector('[data-best]').textContent, '400', `${name}: failed writes retain the session best`);
	a.cleanup(); b.cleanup();
}
console.log('Local best checks passed: stale controller saves, storage events, page restores and failed writes.');
