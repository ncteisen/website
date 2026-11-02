import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildApartment } from './model';
import { canStand, measured, rooms } from './layout';

type Mode = 'dollhouse' | 'plan' | 'walk';
const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const viewer = element<HTMLDivElement>('viewer');
const host = element<HTMLElement>('apartment');
const labels = element<HTMLDivElement>('room-labels');
const wallInput = element<HTMLInputElement>('wall-height');
const furnitureInput = element<HTMLInputElement>('show-furniture');
const labelsInput = element<HTMLInputElement>('show-labels');
const caption = element<HTMLElement>('current-room');
const detail = element<HTMLElement>('room-detail');
const help = element<HTMLElement>('view-help');
const allButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode], [data-room], #reset-view, #download-model');
let failed = false;
function showFailure(message = 'The 3D view couldn’t start') {
	failed = true;element('loading').hidden = true;element('fallback').hidden = false;
	element('fallback').querySelector('h2')!.textContent = message;
	allButtons.forEach(b => b.disabled = true);wallInput.disabled = true;furnitureInput.disabled = true;labelsInput.disabled = true;
	labels.hidden = true; viewer.querySelector('canvas')?.remove(); help.textContent = 'Approximate floor plan';
}

async function start() {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
	renderer.setClearColor('#eeeee5');renderer.shadowMap.enabled = true;renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.localClippingEnabled = true;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1.17;
	renderer.domElement.setAttribute('aria-hidden', 'true');viewer.prepend(renderer.domElement);
	renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); showFailure('The 3D view was interrupted. Reload to try again.'); });
	const scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight('#fffaf0', '#a5ac9c', 2.25));
	const sun = new THREE.DirectionalLight('#fff4df', 3.2);sun.position.set(-18,42,-15);sun.target.position.set(6,0,25);scene.add(sun,sun.target);
	sun.castShadow = true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.far=130;sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;
	const fill = new THREE.DirectionalLight('#dce8ef', .75);fill.position.set(20,16,55);scene.add(fill);
	const apartment = buildApartment();scene.add(apartment.root);
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.ShadowMaterial({opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-.34;ground.receiveShadow=true;scene.add(ground);
	apartment.ceilings.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=false;});
	const orbitCamera = new THREE.OrthographicCamera(-35,35,25,-25,.1,500);
	const planCamera = new THREE.OrthographicCamera(-30,30,30,-30,.1,200);planCamera.up.set(0,0,-1);
	const walkCamera = new THREE.PerspectiveCamera(68,1,.08,150);walkCamera.rotation.order='YXZ';
	let camera: THREE.Camera = orbitCamera;
	const controls = new OrbitControls(orbitCamera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.maxPolarAngle=Math.PI*.49;controls.minZoom=.6;controls.maxZoom=6;
	const planControls = new OrbitControls(planCamera,renderer.domElement);planControls.enableRotate=false;planControls.enableDamping=true;planControls.enabled=false;planControls.minZoom=.65;planControls.maxZoom=5;
	planControls.mouseButtons.LEFT=THREE.MOUSE.PAN;planControls.touches.ONE=THREE.TOUCH.PAN;
	let mode:Mode='dollhouse';let selected:string|null=null;
	let yaw=0,pitch=0;const keys=new Set<string>();const moving=new Set<string>();
	const labelNodes=new Map<string,HTMLButtonElement>();
	for(const room of rooms){const b=document.createElement('button');b.type='button';b.className='map-label';b.textContent=room.name;b.setAttribute('aria-label',`Explore ${room.name}`);b.addEventListener('click',()=>selectRoom(room.id));labels.append(b);labelNodes.set(room.id,b);}
	let transition:{from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;start:number}|null=null;
	const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
	function fitWhole() {
		const aspect=viewer.clientWidth/Math.max(1,viewer.clientHeight);
		const bounds=new THREE.Box3().setFromObject(apartment.root);
		const target=bounds.getCenter(new THREE.Vector3());
		const direction=new THREE.Vector3(aspect<1?.28:.65,1,.95).normalize();
		controls.target.copy(target);orbitCamera.position.copy(target).addScaledVector(direction,90);orbitCamera.zoom=1;controls.update();orbitCamera.updateMatrixWorld(true);
		let maxX=0,maxY=0;
		for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
			const p=new THREE.Vector3(x,y,z).applyMatrix4(orbitCamera.matrixWorldInverse);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));
		}
		const halfH=Math.max(maxY,maxX/aspect)*1.13;
		orbitCamera.left=-halfH*aspect;orbitCamera.right=halfH*aspect;orbitCamera.top=halfH;orbitCamera.bottom=-halfH;orbitCamera.updateProjectionMatrix();
		planCamera.position.set(5.5,85,24.5);planControls.target.set(5.5,0,24.5);planCamera.zoom=1;planCamera.updateProjectionMatrix();planControls.update();
	}
	function resize() {
		const w=viewer.clientWidth,h=viewer.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);
		walkCamera.aspect=w/h;walkCamera.updateProjectionMatrix();
		const halfH=Math.max(29,15/(w/h));planCamera.left=-halfH*w/h;planCamera.right=halfH*w/h;planCamera.top=halfH;planCamera.bottom=-halfH;planCamera.updateProjectionMatrix();
		if(mode!=='walk') {const room=selected;fitWhole();if(room)selectRoom(room);}
	}
	function updateRoomButtons(){document.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===selected)));}
	function selectRoom(id:string) {
		const room=rooms.find(r=>r.id===id);if(!room)return;
		selected=id;updateRoomButtons();caption.textContent=room.name;detail.textContent=room.note;
		const [a,b,c,d]=room.bounds;const target=new THREE.Vector3((a+c)/2,.6,(b+d)/2);
		if(mode==='walk'){
			walkCamera.position.set(room.entry[0],5.35,room.entry[1]);yaw=Math.atan2(room.entry[0]-room.look[0],room.entry[1]-room.look[1]);pitch=0;walkCamera.rotation.set(pitch,yaw,0);
			viewer.focus({preventScroll:true});
		}else if(mode==='plan'){
			planControls.target.copy(target);planCamera.position.set(target.x,85,target.z);planCamera.zoom=1.6;planCamera.updateProjectionMatrix();planControls.update();
		}else{
			const extent=Math.max(c-a,d-b,10);const to=target.clone().add(orbitCamera.position.clone().sub(controls.target).normalize().multiplyScalar(90));
			orbitCamera.zoom=Math.min(4.5,(orbitCamera.top-orbitCamera.bottom)/(extent*1.65));orbitCamera.updateProjectionMatrix();
			if(reducedMotion){orbitCamera.position.copy(to);controls.target.copy(target);controls.update();}
			else transition={from:orbitCamera.position.clone(),to,targetFrom:controls.target.clone(),targetTo:target,start:performance.now()};
		}
	}
	function updateWalls(){
		apartment.clip.constant=mode==='walk'?measured.ceiling+.1:mode==='plan'?.4:Number(wallInput.value);
		element('wall-value').textContent=Number(wallInput.value)>8.5?'Full walls':`${Number(wallInput.value).toFixed(1)} ft`;
	}
	function setMode(next:Mode){
		transition=null;keys.clear();moving.clear();mode=next;host.dataset.mode=next;
		controls.enabled=next==='dollhouse';planControls.enabled=next==='plan';
		camera=next==='walk'?walkCamera:next==='plan'?planCamera:orbitCamera;
		apartment.ceilings.visible=next==='walk';wallInput.disabled=next!=='dollhouse';labelsInput.disabled=next==='walk';
		element('walk-controls').hidden=next!=='walk';labels.hidden=next==='walk'||!labelsInput.checked;
		document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));
		help.textContent=next==='walk'?'Drag to look · WASD / arrows to walk':next==='plan'?'Drag to pan · scroll to zoom':'Drag to orbit · scroll to zoom';
		updateWalls();
		if(next==='walk')selectRoom(selected??'living');
		else {selected=null;updateRoomButtons();caption.textContent='The whole apartment';detail.textContent=next==='plan'?'An overhead view. Room dimensions outside the measured living room and hallway are approximate.':'A roof-off view of the apartment. Choose a room to take a closer look.';fitWhole();}
	}
	const furnishedBarriers=[...apartment.barriers,...apartment.furnitureBarriers];
	function step(dt:number){
		if(mode!=='walk')return;
		let forward=(keys.has('w')||keys.has('arrowup')||moving.has('forward')?1:0)-(keys.has('s')||keys.has('arrowdown')||moving.has('back')?1:0);
		let sideways=(keys.has('d')||moving.has('right')?1:0)-(keys.has('a')||moving.has('left')?1:0);
		if(keys.has('arrowleft'))yaw+=dt*1.5;if(keys.has('arrowright'))yaw-=dt*1.5;
		walkCamera.rotation.set(pitch,yaw,0);
		const magnitude=Math.hypot(forward,sideways);if(!magnitude)return;forward/=magnitude;sideways/=magnitude;
		const speed=(keys.has('shift')?7:4.5)*dt;
		const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*sideways)*speed;
		const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*sideways)*speed;
		if(canStand(walkCamera.position.x+dx,walkCamera.position.z,(furnitureInput.checked?furnishedBarriers:apartment.barriers)))walkCamera.position.x+=dx;
		if(canStand(walkCamera.position.x,walkCamera.position.z+dz,(furnitureInput.checked?furnishedBarriers:apartment.barriers)))walkCamera.position.z+=dz;
		const room=rooms.find(({bounds:[a,b,c,d]})=>walkCamera.position.x>=a&&walkCamera.position.x<=c&&walkCamera.position.z>=b&&walkCamera.position.z<=d);
		if(room&&selected!==room.id){selected=room.id;updateRoomButtons();caption.textContent=room.name;detail.textContent=room.note;}
	}
	let drag:{id:number;x:number;y:number}|null=null;
	renderer.domElement.addEventListener('pointerdown',e=>{viewer.focus({preventScroll:true});if(mode!=='walk')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
	renderer.domElement.addEventListener('pointermove',e=>{if(mode!=='walk'||!drag||e.pointerId!==drag.id)return;yaw-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.003,-1.25,1.25);drag.x=e.clientX;drag.y=e.clientY;walkCamera.rotation.set(pitch,yaw,0);});
	const endDrag=()=>{drag=null;};renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
	viewer.addEventListener('keydown',e=>{if(mode==='walk'&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(e.key.toLowerCase())){keys.add(e.key.toLowerCase());e.preventDefault();}});
	window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();moving.clear();drag=null;});
	viewer.addEventListener('focusout',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();moving.clear();});
	for(const button of document.querySelectorAll<HTMLButtonElement>('[data-move]')){
		button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);moving.add(button.dataset.move!);});
		const stop=()=>moving.delete(button.dataset.move!);button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
		button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();moving.add(button.dataset.move!);}});button.addEventListener('keyup',stop);button.addEventListener('blur',stop);
	}
	for(const button of document.querySelectorAll<HTMLButtonElement>('[data-mode]'))button.addEventListener('click',()=>setMode(button.dataset.mode as Mode));
	for(const button of document.querySelectorAll<HTMLButtonElement>('[data-room]'))button.addEventListener('click',()=>selectRoom(button.dataset.room!));
	element('reset-view').addEventListener('click',()=>{selected=null;setMode(mode);});
	wallInput.addEventListener('input',updateWalls);furnitureInput.addEventListener('change',()=>apartment.furniture.visible=furnitureInput.checked);labelsInput.addEventListener('change',()=>labels.hidden=!labelsInput.checked||mode==='walk');
	const fullscreen=element<HTMLButtonElement>('fullscreen');if(!document.fullscreenEnabled)fullscreen.hidden=true;
	fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await host.requestFullscreen();}catch{detail.textContent='Full-screen view is unavailable in this browser.';}});
	document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'Exit expanded ↙':'Expand ↗';resize();});
	element<HTMLButtonElement>('download-model').addEventListener('click',async()=>{
		const button=element<HTMLButtonElement>('download-model');button.disabled=true;button.textContent='Preparing model…';
		try {
			const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
			const exportRoot=apartment.root.clone(true);exportRoot.scale.setScalar(.3048);exportRoot.userData={units:'meters',source:'Photo-informed reconstruction; unmeasured dimensions are estimates.'};
			exportRoot.traverse(o=>{o.visible=o.name!=='Ceilings';if(o instanceof THREE.Mesh){o.material=(o.material as THREE.Material).clone();o.material.clippingPlanes=[];}});
			const result=await new GLTFExporter().parseAsync(exportRoot,{binary:true});
			const url=URL.createObjectURL(new Blob([result as ArrayBuffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='the-apartment.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
		}catch{detail.textContent='The model could not be exported. Please try again.';}
		finally{button.disabled=false;button.textContent='Download 3D model ↓';}
	});
	function drawLabels(){
		if(labels.hidden)return;const occupied:{x:number;y:number}[]=[];
		for(const room of rooms){const node=labelNodes.get(room.id)!;const [a,b,c,d]=room.bounds;const p=new THREE.Vector3((a+c)/2,mode==='plan'?.2:1.5,(b+d)/2).project(camera);const x=(p.x*.5+.5)*viewer.clientWidth,y=(-p.y*.5+.5)*viewer.clientHeight;
			const hide=p.z>1||p.z< -1||x<35||x>viewer.clientWidth-35||y<20||y>viewer.clientHeight-50||(selected!==null&&selected!==room.id)||occupied.some(o=>Math.abs(o.x-x)<75&&Math.abs(o.y-y)<24);
			node.hidden=hide;if(!hide){node.style.left=`${x}px`;node.style.top=`${y}px`;occupied.push({x,y});}
		}
	}
	let last=performance.now(),inView=true;
	new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;}).observe(viewer);
	function frame(now:number){if(failed)return;requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden||!inView)return;
		if(transition){const t=Math.min((now-transition.start)/650,1),ease=t*t*(3-2*t);orbitCamera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,ease);if(t===1)transition=null;}
		step(dt);if(mode==='dollhouse')controls.update();if(mode==='plan')planControls.update();renderer.render(scene,camera);drawLabels();
	}
	controls.addEventListener('start',()=>transition=null);
	new ResizeObserver(resize).observe(viewer);resize();fitWhole();updateWalls();element('loading').hidden=true;host.dataset.ready='true';host.dataset.mode=mode;requestAnimationFrame(frame);
}
start().catch(error=>{console.error('Apartment initialization failed',error);showFailure();});
