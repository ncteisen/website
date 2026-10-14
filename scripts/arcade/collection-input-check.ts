import assert from 'node:assert/strict';
import { Input } from '../../src/games/arcade/collection/Input';
import type { Action, CollectionId } from '../../src/games/arcade/collection/core';
class ElementStub extends EventTarget {
	closest() { return null; }
	focus() {}
	setPointerCapture() {}
	getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 700 }; }
	querySelectorAll() { return []; }
}
class ButtonStub extends ElementStub {}
const win = new EventTarget();
Object.assign(globalThis, { window: win, HTMLElement: ElementStub, HTMLButtonElement: ButtonStub });
function dispatch(target: EventTarget, type: string, properties: Record<string, unknown>, source?: EventTarget) {
	const event = new Event(type, { cancelable: true }); Object.assign(event, properties);
	if (source) Object.defineProperty(event, 'target', { value: source }); target.dispatchEvent(event); return event;
}
for (const kind of ['sarah-skis', 'crossy-sarah', 'sarah-swings', 'sarah-stacks', 'sarah-rolls'] as CollectionId[]) {
	const canvas = new ElementStub(), root = new ElementStub(); const actions: Action[] = []; let wakes = 0, pauses = 0;
	const input = new Input(canvas as unknown as HTMLCanvasElement, root as unknown as HTMLElement, kind, action => actions.push(action), () => { wakes++; return true; }, () => pauses++);
	const touch = { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 300, clientY: 250 };
	assert.ok(dispatch(canvas, 'pointerdown', touch).defaultPrevented);
	dispatch(canvas, 'pointerdown', { ...touch, pointerId: 2, isPrimary: false }); assert.equal(wakes, 1, 'secondary touches are ignored');
	if (kind === 'sarah-skis') { assert.equal(input.controls.target, 300); dispatch(canvas, 'pointermove', { ...touch, clientX: 80 }); assert.equal(input.controls.target, 80); }
	if (kind === 'sarah-rolls') assert.equal(input.controls.axis, 1, 'right half rolls right');
	if (kind === 'sarah-stacks' || kind === 'sarah-swings') assert.deepEqual(actions, ['primary'], 'one action on contact');
	dispatch(root, 'pointerup', { ...touch, clientX: 210 }, canvas);
	if (kind === 'crossy-sarah') assert.equal(actions[0], 'left', 'horizontal swipe hops sideways');
	assert.equal(input.controls.axis, 0); assert.equal(input.controls.held, false); assert.equal(input.controls.target, null);
	dispatch(canvas, 'pointerdown', touch); actions.length = 0; dispatch(root, 'pointercancel', touch, canvas);
	assert.deepEqual(actions, ['release'], 'canceled touches never create a hop/drop');
	dispatch(win, 'keydown', { code: 'ArrowRight', repeat: false }); assert.equal(input.controls.axis, 1);
	const count = actions.length; dispatch(win, 'keydown', { code: 'ArrowRight', repeat: true }); assert.equal(actions.length, count, 'key repeat is ignored');
	dispatch(win, 'keyup', { code: 'ArrowRight' }); assert.equal(input.controls.axis, 0);
	dispatch(win, 'keydown', { code: 'KeyP', repeat: false }); assert.equal(pauses, 1);
	input.clear(); assert.equal(input.controls.held, false);
	input.cleanup(); const oldWakes = wakes; dispatch(canvas, 'pointerdown', touch); assert.equal(wakes, oldWakes, 'cleanup removes handlers');
}
console.log(JSON.stringify({ passed: true, collectionInput: ['touch capture', 'drag steering', 'swipe hopping', 'hold/release', 'cancellation', 'secondary touches', 'key repeat', 'pause', 'cleanup'] }));
