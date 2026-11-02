import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Vector3 } from 'three';
const temp = await mkdtemp(join(tmpdir(), 'apartment-check-'));
try {
	const outfile = join(temp, 'model.mjs');
	await build({entryPoints:['src/features/apartment/model.ts'],bundle:true,format:'esm',platform:'node',outfile});
	const layoutFile = join(temp, 'layout.mjs');
	await build({entryPoints:['src/features/apartment/layout.ts'],bundle:true,format:'esm',platform:'node',outfile:layoutFile});
	// Disable photo I/O; procedural fallback textures only need a drawing surface.
	const context = new Proxy({}, {get:()=>()=>{},set:()=>true});
	globalThis.document = {createElement:()=>({getContext:()=>context})};
	const {buildApartment} = await import(pathToFileURL(outfile));
	const {rooms,measured,canStand} = await import(pathToFileURL(layoutFile));
	const apartment = buildApartment(false);
	const barriers = [...apartment.barriers,...apartment.furnitureBarriers];
	assert.equal(measured.livingWidth*measured.livingDepth,207);
	assert.equal(measured.bayDepth,19/12);
	assert.equal(rooms.find(r=>r.id==='hall').bounds[3]-rooms.find(r=>r.id==='hall').bounds[1],21);
	for(const room of rooms)assert.ok(canStand(...room.entry,barriers),`${room.id} spawn must be clear`);
	assert.ok(!canStand(0,5,barriers),'Cannot walk through outer walls');
	assert.ok(!canStand(-9,5.9,barriers),'Cannot walk through coffee table');
	assert.ok(canStand(-9,5.9,apartment.barriers),'Hidden furniture must not block movement');
	assert.ok(rooms.find(r=>r.id==='living').bounds[0]<rooms.find(r=>r.id==='hall').bounds[0],'Living room must extend left of the hall when facing the bay');
	const orientation=apartment.root.children.find(o=>o.name==='Corrected apartment orientation');
	assert.equal(orientation.scale.x,-1,'Geometry must use the same handedness as collisions and room locations');
	const fireplaceWall=apartment.wallSections.find(w=>w.center.x===-18);
	apartment.updateCutaway(new Vector3(0,10,5),'dollhouse',.65);
	assert.ok(fireplaceWall.plane.constant>measured.ceiling,'Far walls retain their full height');
	apartment.updateCutaway(new Vector3(-30,10,5),'dollhouse',.65);
	assert.equal(fireplaceWall.plane.constant,.65,'Near walls expose the interior');
	apartment.updateCutaway(new Vector3(-30,10,5),'walk',.65);
	assert.ok(fireplaceWall.plane.constant>measured.ceiling,'Walkthrough restores the complete enclosure');
	// Flood the actual collision map: every room must be accessible from the living room.
	const resolution=.2, key=(x,z)=>`${x},${z}`;
	const start=rooms[0].entry.map(v=>Math.round(v/resolution));const queue=[start],visited=new Set([key(...start)]);
	for(let i=0;i<queue.length;i++){
		const [x,z]=queue[i];
		for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
			const nx=x+dx,nz=z+dz,k=key(nx,nz);
			if(visited.has(k)||!canStand(nx*resolution,nz*resolution,barriers))continue;
			visited.add(k);queue.push([nx,nz]);
		}
	}
	for(const room of rooms){const [x,z]=room.entry.map(v=>Math.round(v/resolution));assert.ok(visited.has(key(x,z)),`${room.id} must connect to the rest of the apartment`);}
	let meshCount=0;
	apartment.root.traverse(o=>{if(o.isMesh){meshCount++;const p=o.geometry.attributes.position.array;assert.ok(p.every(Number.isFinite),'Geometry must be finite');}});
	assert.ok(meshCount<220,`Independently clipped walls should stay below 220 meshes (got ${meshCount})`);
	console.log(`Apartment checks passed: all ${rooms.length} room spawns and connecting routes, collisions, measured scale, finite geometry, ${meshCount} meshes.`);
} finally {delete globalThis.document;await rm(temp,{recursive:true,force:true});}
