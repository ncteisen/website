import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeMaterials } from './materials';
import { measured, sourceRooms as rooms, reflectBarrier, type Barrier } from './layout';

type Material = THREE.Material;
type Opening = { at: number; width: number; bottom?: number; height?: number; wood?: boolean };
export function buildApartment(loadPhotos = true) {
	const root = new THREE.Group(); root.name = 'Apartment — feet';
	const reflected = new THREE.Group(); reflected.name = 'Corrected apartment orientation'; reflected.scale.x=-1;root.add(reflected);
	const shell = new THREE.Group(); shell.name = 'Architecture';
	const furniture = new THREE.Group(); furniture.name = 'Furniture';
	const floors = new THREE.Group(); floors.name = 'Floors';
	const ceilings = new THREE.Group(); ceilings.name = 'Ceilings';
	const walls = new THREE.Group();walls.name='Cutaway walls';
	reflected.add(floors, shell, furniture, ceilings,walls);
	const m = makeMaterials(loadPhotos); const barriers: Barrier[] = []; const furnitureBarriers: Barrier[] = [];
	const clip = new THREE.Plane(new THREE.Vector3(0,-1,0), measured.ceiling+.1);
	type Wall = {group:THREE.Group;plane:THREE.Plane;center:THREE.Vector3;normal:THREE.Vector3;materials:Map<Material,Material>};
	const wallSections:Wall[]=[];let activeWall:Wall|null=null;
	const architectureMaterials = new Map<Material,Material>();
	function archMaterial(material: Material) {
		const cache=activeWall?.materials??architectureMaterials;
		let result = cache.get(material);
		if(!result) { result=material.clone();result.clippingPlanes=[activeWall?.plane??clip];result.clipShadows=true;cache.set(material,result); }
		return result;
	}
	function box(parent: THREE.Object3D, x:number,y:number,z:number,w:number,h:number,d:number,material:Material,round=0) {
		const geo = round ? new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)) : new THREE.BoxGeometry(w,h,d);
		const mesh = new THREE.Mesh(geo,parent===shell?archMaterial(material):material);
		mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;(parent===shell&&activeWall?activeWall.group:parent).add(mesh);return mesh;
	}
	function cylinder(parent:THREE.Object3D,x:number,y:number,z:number,r:number,h:number,material:Material,rTop=r) {
		const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,r,h,16),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
	}
	function sphere(parent:THREE.Object3D,x:number,y:number,z:number,sx:number,sy:number,sz:number,material:Material) {
		const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
	}
	function rod(parent:THREE.Object3D,a:number[],b:number[],r:number,mat:Material) {
		const start=new THREE.Vector3(...a as [number,number,number]);const end=new THREE.Vector3(...b as [number,number,number]);const delta=end.clone().sub(start);
		const mesh=cylinder(parent,0,0,0,r,delta.length(),mat);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
	}
	function group(x:number,z:number,rotation=0) {const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;furniture.add(g);return g;}
	function photoFace(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,material:Material,rotation=0) {
		const geometry=new THREE.PlaneGeometry(w,h);const uv=geometry.attributes.uv;
		// Reflection fixes the layout; undo it in photo UVs so artwork stays readable.
		for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i));
		const face=new THREE.Mesh(geometry,activeWall?archMaterial(material):material);face.position.set(x,y,z);face.rotation.y=rotation;
		face.receiveShadow=true;parent.add(face);return face;
	}
	function curtain(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,material:Material,rotation=0){
		const geo=new THREE.PlaneGeometry(w,h,32,12);const positions=geo.attributes.position;
		for(let i=0;i<positions.count;i++){const u=(positions.getX(i)+w/2)/w;positions.setZ(i,Math.sin(u*Math.PI*14)*.09);}
		geo.computeVertexNormals();const materialCopy=material.clone();materialCopy.side=THREE.DoubleSide;
		const mesh=new THREE.Mesh(geo,materialCopy);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
	}
	function obstacle(x:number,z:number,w:number,d:number) {furnitureBarriers.push({x1:x-w/2,z1:z-d/2,x2:x+w/2,z2:z+d/2});}
	function wall(x1:number,z1:number,x2:number,z2:number,openings:Opening[]=[],wood=false) {
		const length=Math.hypot(x2-x1,z2-z1);const dx=(x2-x1)/length,dz=(z2-z1)/length;
		const cx=(x1+x2)/2,cz=(z1+z2)/2;
		// Prefer the larger adjacent room when a partition serves two rooms.
		const adjacent=rooms.filter(({bounds:[a,b,c,d]})=>cx>=a-.3&&cx<=c+.3&&cz>=b-.3&&cz<=d+.3)
			.sort((a,b)=>(b.bounds[2]-b.bounds[0])*(b.bounds[3]-b.bounds[1])-(a.bounds[2]-a.bounds[0])*(a.bounds[3]-a.bounds[1]));
		const room=adjacent[0];const inside=room?new THREE.Vector3((room.bounds[0]+room.bounds[2])/2-cx,0,(room.bounds[1]+room.bounds[3])/2-cz):new THREE.Vector3(9-cx,0,5-cz);
		const normal=new THREE.Vector3(-dz,0,dx);if(normal.dot(inside)<0)normal.negate();normal.x*=-1;
		const wallGroup=new THREE.Group();wallGroup.name=`Wall ${wallSections.length+1}`;walls.add(wallGroup);
		activeWall={group:wallGroup,plane:clip.clone(),center:new THREE.Vector3(-cx,0,cz),normal,materials:new Map()};wallSections.push(activeWall);
		const place=(along:number,y:number,w:number,h:number,depth:number,mat:Material) => {const b=box(shell,x1+dx*along,y,z1+dz*along,w,h,depth,mat);b.rotation.y=-Math.atan2(dz,dx);return b;};
		const trim=wood?m.wood:m.trim;
		const segment=(from:number,to:number)=>{
			if(to-from<.01)return;
			place((from+to)/2,measured.ceiling/2,to-from,measured.ceiling,.24,m.wall);
			place((from+to)/2,wood?.44:.27,to-from,wood?.88:.54,.32,trim);
			if(wood)place((from+to)/2,.92,to-from,.1,.38,trim);
			barriers.push({x1:Math.min(x1+dx*from,x1+dx*to)-.12,z1:Math.min(z1+dz*from,z1+dz*to)-.12,x2:Math.max(x1+dx*from,x1+dx*to)+.12,z2:Math.max(z1+dz*from,z1+dz*to)+.12});
		};
		let end=0;
		for(const o of [...openings].sort((a,b)=>a.at-b.at)){
			const start=o.at-o.width/2,stop=o.at+o.width/2,bottom=o.bottom??0,height=o.height??7.15,top=bottom+height;
			segment(end,start);
			place(o.at,(top+measured.ceiling)/2,o.width,measured.ceiling-top,.24,m.wall);
			if(bottom>0){place(o.at,bottom/2,o.width,bottom,.24,m.wall);place(o.at,.27,o.width,.54,.32,trim);barriers.push({x1:Math.min(x1+dx*start,x1+dx*stop)-.12,z1:Math.min(z1+dz*start,z1+dz*stop)-.12,x2:Math.max(x1+dx*start,x1+dx*stop)+.12,z2:Math.max(z1+dz*start,z1+dz*stop)+.12});}
			const frame=o.wood?m.wood:trim;
			for(const offset of [-1,1])place(o.at+offset*(o.width/2+.06),bottom+height/2,.19,height+.16,.44,frame);
			place(o.at,top+.08,o.width+.42,.24,.45,frame);
			if(bottom>0){
				place(o.at,bottom,o.width+.35,.15,.59,frame);place(o.at,bottom+height/2,o.width,.07,.18,frame);
				place(o.at,bottom+height/2,.07,height,.18,frame);place(o.at,bottom+height/2,o.width,height,.035,m.glass);
				if(z1>=40&&z2>=40)photoFace(wallGroup,x1+dx*o.at,bottom+height/2,z1+dz*o.at+.15,o.width,height,m.courtyard,Math.PI);
				if(z1<=0&&z2<=0){
					const exterior=photoFace(wallGroup,x1+dx*o.at+dz*.1,bottom+height/2,z1+dz*o.at-dx*.1,o.width,height,m.bayView,-Math.atan2(dz,dx));
					exterior.castShadow=false;
					place(o.at,top-.5,o.width,1,.12,m.ivory);
					for(let slat=0;slat<12;slat++)place(o.at,top-slat*.085,o.width,.025,.16,m.trim);
				}
			}
			end=stop;
		}
		segment(end,length);
		place(length/2,7.55,length,.10,.3,m.trim);
		place(length/2,8.57,length,.19,.38,m.trim);
		activeWall=null;
	}
	for(const room of rooms){
		const [a,b,c,d]=room.bounds;const isTile=['kitchen','wc','bath'].includes(room.id);
		box(floors,(a+c)/2,-.16,(b+d)/2,c-a,.3,d-b,m.base);
		const floorMat=(isTile?m.tile:m.floor).clone();floorMat.map=floorMat.map!.clone();floorMat.map.repeat.set((c-a)/7,(d-b)/7);
		box(floors,(a+c)/2,.005,(b+d)/2,c-a,.025,d-b,floorMat);
		box(ceilings,(a+c)/2,measured.ceiling+.06,(b+d)/2,c-a,.12,d-b,m.ivory);
	}
	// The bay is a shallow three-sided recess, measured at 19 inches.
	const bay=new THREE.Shape();bay.moveTo(3,0);bay.lineTo(4.6,-measured.bayDepth);bay.lineTo(13.4,-measured.bayDepth);bay.lineTo(15,0);bay.closePath();
	const bayMaterial=m.floor.clone();bayMaterial.side=THREE.DoubleSide;const bayFloor=new THREE.Mesh(new THREE.ShapeGeometry(bay),bayMaterial);bayFloor.rotation.x=Math.PI/2;bayFloor.position.y=.02;floors.add(bayFloor);
	// Front room and its two connections to the hall and dining room.
	wall(0,0,3,0,[],true);wall(15,0,18,0,[],true);
	wall(3,0,4.6,-measured.bayDepth,[{at:1.12,width:1.85,bottom:2,height:5.3}],true);
	wall(4.6,-measured.bayDepth,13.4,-measured.bayDepth,[{at:2.2,width:3.9,bottom:2,height:5.3},{at:6.6,width:3.9,bottom:2,height:5.3}],true);
	wall(13.4,-measured.bayDepth,15,0,[{at:1.12,width:1.85,bottom:2,height:5.3}],true);
	wall(0,0,0,11.5,[],true);wall(18,0,18,23.3,[],true);
	wall(0,11.5,18,11.5,[{at:2.05,width:2.8,wood:true},{at:12.25,width:5.6,wood:true}],true);
	wall(0,11.5,0,19,[],true);wall(4.2,11.5,4.2,19,[{at:3.8,width:4.7,wood:true}],true);
	wall(0,19,4.2,19,[{at:1.7,width:2.9,wood:true}],true);
	wall(4.2,19,4.2,23.3,[],true);
	wall(4.2,23.3,18,23.3,[{at:8.1,width:2.8}],false);
	wall(3.4,19,3.4,36,[{at:6,width:2.6}]);
	// Rooms off the long hallway.
	wall(0,19,0,40,[{at:4.9,width:2.45},{at:9.5,width:2.3},{at:15.7,width:2.5}]);
	wall(-4.8,21.5,0,21.5);wall(-4.8,21.5,-4.8,26.3,[{at:2.4,width:2.15,bottom:4.1,height:3.3}]);wall(-4.8,26.3,0,26.3);
	wall(-6.2,31,0,31);wall(-6.2,31,-6.2,38.2,[{at:3.6,width:2.3,bottom:4.1,height:3.25}]);wall(-6.2,38.2,0,38.2);
	// Closet facing the hall (closed).
	box(shell,-.03,3.5,28.5,.2,7,2.25,m.ivory);cylinder(shell,.14,3.2,29.2,.06,.12,archMaterial(m.brass));
	wall(3.4,32.6,15.5,32.6,[{at:4.1,width:3.2,bottom:3.5,height:3.9},{at:8.3,width:2.75,bottom:3.5,height:3.9}]);
	wall(15.5,23.3,15.5,32.6,[{at:2.1,width:2.7,bottom:.2,height:6.7},{at:5.1,width:2.4,bottom:3.5,height:3.9}]);
	wall(3.4,36,3.4,50.5,[{at:2.4,width:2.7}]);
	wall(3.4,36,17,36);wall(17,36,17,50.5);
	wall(3.4,50.5,17,50.5,[{at:6.6,width:6.5,bottom:2.35,height:5.05}]);
	wall(-5.2,40,3.4,40,[{at:6.9,width:2.7}]);wall(-5.2,40,-5.2,50.5);
	wall(-5.2,50.5,3.4,50.5,[{at:4.5,width:6.5,bottom:2.35,height:5.05}]);
	// Room-scale helpers. Furniture fronts face +z before rotation.
	function rug(x:number,z:number,w:number,d:number,material=m.rug,round=false) {
		if(round)cylinder(furniture,x,.045,z,w/2,.025,material);else box(furniture,x,.045,z,w,.025,d,material);
	}
	function legs(g:THREE.Object3D,w:number,d:number,h:number,material=m.wood){for(const x of [-1,1])for(const z of [-1,1])box(g,x*(w/2-.13),h/2,z*(d/2-.13),.14,h,.14,material);}
	function table(x:number,z:number,w:number,d:number,h:number,rotation=0){const g=group(x,z,rotation);legs(g,w,d,h-.12);box(g,0,h,0,w,.17,d,m.wood,.04);return g;}
	function chair(x:number,z:number,rotation=0){const g=group(x,z,rotation);legs(g,1.3,1.3,1.4);box(g,0,1.4,0,1.4,.18,1.35,m.oak,.04);for(const x of [-.58,.58])box(g,x,2.05,-.55,.11,1.8,.12,m.oak);for(const y of [2,2.4,2.8])box(g,0,y,-.55,1.24,.12,.12,m.oak);}
	function pillow(g:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,color:Material,tilt=.15){const p=box(g,x,y,z,w,h,.3,color,.15);p.rotation.x=tilt;p.rotation.z=x*.04;}
	function couch(x:number,z:number,width:number,rotation=0,material=m.sofa){
		const g=group(x,z,rotation);legs(g,width,2.65,.6,m.darkWood);box(g,0,.83,0,width,1.0,2.7,material,.15);
		box(g,0,1.75,-1.05,width,1.7,.65,material,.18);
		for(const side of [-1,1])box(g,side*(width/2-.25),1.35,0,.5,1.15,2.7,material,.16);
		const count=width>5?3:1;for(let i=0;i<count;i++)box(g,(i-(count-1)/2)*(width-.95)/count,1.4,.1,(width-.95)/count-.04,.35,1.9,material,.14);
		pillow(g,-width/2+.8,2,-.5,.8,.85,m.white);pillow(g,width/2-.8,2,-.5,.8,.85,m.sage);
		return g;
	}
	function plant(x:number,z:number,height=3,size=.45,parent:THREE.Object3D=furniture,y=0){
		cylinder(parent,x,y+size*.6,z,size*.72,size*1.2,m.pot,size);cylinder(parent,x,y+size*1.2,z,size*.88,.03,m.soil);
		for(let i=0;i<9;i++) {const a=i*2.4;const tip=[x+Math.cos(a)*size*1.9,y+height*(.6+(i%3)*.18),z+Math.sin(a)*size*1.9];rod(parent,[x,y+size,z],tip,.015,m.leaf);const leaf=sphere(parent,tip[0],tip[1],tip[2],size*.42,size*.75,size*.13,i%2?m.leaf:m.leafLight);leaf.rotation.set(.4,a,.4);}
	}
	function books(g:THREE.Object3D,x:number,y:number,z:number,count:number){const colors=[m.sage,m.white,m.rust,m.blue,m.darkWood];for(let i=0;i<count;i++){const height=.55+(i%3)*.12;const b=box(g,x+i*.13,y+height/2,z,.11,height,.45,colors[i%colors.length]);if(i%7===4)b.rotation.z=.12;}}
	function cabinet(x:number,z:number,w:number,h:number,d:number,rotation=0,material=m.wood){const g=group(x,z,rotation);box(g,0,h/2,0,w,h,d,material,.035);box(g,0,h+.08,0,w+.15,.16,d+.14,material);return g;}
	function picture(parent:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,rotation=0,image?:Material){
		const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
		box(g,0,0,0,w,h,.065,m.darkWood);box(g,0,0,.04,w-.09,h-.09,.02,m.ivory);
		photoFace(g,0,0,.057,w-.16,h-.16,image??m.pianoArt);
	}
	function lamp(x:number,z:number,h=5.6){cylinder(furniture,x,.1,z,.42,.15,m.black);cylinder(furniture,x,h/2,z,.035,h,m.brass);cylinder(furniture,x,h-.25,z,.52,.5,m.lamp,.3);}
	function pendant(x:number,z:number){cylinder(ceilings,x,8.1,z,.018,1.2,m.black);sphere(ceilings,x,7.35,z,.65,.4,.65,m.lamp);for(let i=0;i<9;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.62*Math.sin((i+1)*Math.PI/10),.008,4,32),m.ivory);ring.rotation.x=Math.PI/2;ring.position.set(x,7.35+.4*Math.cos((i+1)*Math.PI/10),z);ceilings.add(ring);}}
	function monitor(parent:THREE.Object3D,x:number,y:number,z:number,width=1.7){box(parent,x,y+.62,z,width,1.05,.10,m.black,.03);box(parent,x,y+.62,z+.06,width-.09,.94,.015,m.screen);box(parent,x,y+.15,z,.08,.3,.07,m.chrome);box(parent,x,y,z+.1,.65,.045,.45,m.black);}
	function desk(x:number,z:number,w:number,rotation=0,standing=false){const h=standing?3.65:2.5;const g=table(x,z,w,1.8,h,rotation);monitor(g,0,h+.05,-.35,w*.45);box(g,-w*.2,h+.12,.55,1.2,.06,.4,m.black,.02);plant(w*.37,-.4,.55,.13,g,h);return g;}
	// Living room: bay sofa, armchair + ottoman, fireplace, piano and television.
	rug(9,5.7,12,7.4);couch(9,1.2,7.5,0);obstacle(9,1.2,7.5,2.7);
	couch(15.6,3.7,3.05,-.45);box(furniture,14.5,.78,6,2.4,1.4,1.9,m.sofa,.18);obstacle(15.1,4.7,3.8,4.3);
	const coffee=table(9,5.9,4.7,2.4,1.45);box(coffee,-1,1.58,.1,.8,.09,1.1,m.blue);box(coffee,.3,1.6,-.2,.55,.12,.75,m.white);cylinder(coffee,1.3,1.72,.1,.14,.35,m.white);obstacle(9,5.9,4.7,2.4);
	const tv=cabinet(7,10.65,4.4,2.2,1.25,Math.PI,m.darkWood);box(tv,0,3.35,0,4.05,2.35,.12,m.black,.04);box(tv,0,3.35,.08,3.87,2.17,.02,m.screen);box(tv,0,1.15,.65,4.03,1.6,.035,m.black);box(tv,0,1,.69,4,.09,.04,m.wood);books(tv,-1.7,.25,.77,12);box(tv,1,.5,.72,.7,.45,.5,m.ivory);obstacle(7,10.65,4.4,1.25);
	const fireplace=group(17.45,6.4,-Math.PI/2);
	box(fireplace,0,6.65,-.05,5.4,4.2,.85,m.wall);box(fireplace,0,7.55,.1,5.55,.12,1,m.trim);
	box(fireplace,0,2.2,0,5.5,4.4,.9,m.wood);box(fireplace,0,.10,.55,5.8,.18,1.6,m.darkWood);
	for(let r=0;r<7;r++)for(let c=0;c<8;c++){const x=(c-3.5)*.66+(r%2)*.12; if(Math.abs(x)<1.35&&r<5)continue;box(fireplace,x,.42+r*.49,.5,.62,.44,.12,r%2?m.oak:m.darkWood);}
	box(fireplace,0,1.6,.51,2.6,2.85,.10,m.black);box(fireplace,0,4.5,.1,6.15,.22,1.35,m.darkWood);for(let i=0;i<9;i++)rod(fireplace,[-1.2+i*.3,.3,.72],[-1.2+i*.3,2.1,.72],.025,m.chrome);
	photoFace(fireplace,0,2.2,.63,5.3,4.1,m.fireplace);
	picture(fireplace,0,6.2,.43,3.4,1.6,0,m.fireplaceArt);obstacle(17.45,6.4,1.3,6.1);
	for(const x of [-.6,-.15])cylinder(fireplace,x,4.86,.15,.16,.5,m.pot);
	for(const z of [1.6,10]){const shelf=cabinet(17.4,z,2.5,3.5,1,-Math.PI/2);photoFace(shelf,0,1.8,.52,2.2,3.15,m.bookcase);for(const x of [-1.1,0,1.1])box(shelf,x,1.8,.55,.055,3.2,.055,m.wood);plant(17.2,z,1.3,.23,furniture,3.65);}
	const piano=cabinet(.8,5.3,4.4,3.3,1.35,Math.PI/2,m.black);box(piano,0,2.1,.95,4.3,.2,.65,m.black);for(let i=0;i<30;i++){box(piano,-1.96+i*.135,2.23,1.02,.125,.045,.47,m.ivory);if(i%7!==2&&i%7!==6)box(piano,-1.9+i*.135,2.29,.9,.07,.06,.25,m.black);}table(2.25,5.3,2.1,1,1.6,Math.PI/2);picture(furniture,.16,5.1,4.3,1.5,1.9,Math.PI/2);picture(furniture,.16,5.1,6.4,1.5,1.9,Math.PI/2);obstacle(.8,5.3,1.5,4.4);
	plant(2.9,9.65,3.5,.6);plant(16,1.4,4.5,.45);lamp(14,1.9);pendant(9,5.5);
	// Dining room, including the original built-in sideboard and panel moulding.
	const dining=table(11.8,17.4,5.5,3.1,2.5);box(dining,0,2.6,0,1.25,.025,3,m.rug);cylinder(dining,0,2.9,0,.2,.6,m.sage);for(let i=0;i<15;i++){rod(dining,[0,3,0],[Math.sin(i)*.4,3.6+(i%3)*.08,Math.cos(i)*.3],.01,m.leaf);sphere(dining,Math.sin(i)*.4,3.6+(i%3)*.08,Math.cos(i)*.3,.12,.11,.12,m.brass);}
	for(const x of [10.2,13.4]){chair(x,15,Math.PI);chair(x,19.8);}chair(8.1,17.4,-Math.PI/2);chair(15.5,17.4,Math.PI/2);obstacle(11.8,17.4,6.5,4.5);
	const buffet=cabinet(17.2,16.9,7.1,3.2,1.35,-Math.PI/2);for(let x=-2.8;x<3;x+=1.4){box(buffet,x,1.45,.71,1.2,2.3,.07,m.darkWood);box(buffet,x,1.45,.77,.98,2.05,.025,m.glass);box(buffet,x,2.9,.74,1.2,.3,.07,m.oak);}
	box(buffet,0,4.8,-.3,7.2,.18,.7,m.wood);for(const x of [-3.3,3.3])box(buffet,x,4,-.3,.17,1.6,.4,m.wood);box(buffet,0,4,-.52,5.9,.9,.08,m.chrome);plant(2.6,0,1,.2,buffet,3.35);
	photoFace(buffet,0,1.55,.8,6.8,2.9,m.buffet);
	desk(14,22.3,4.1,Math.PI);chair(14,20.8);lamp(16.3,12.6);pendant(11.8,17.4);
	for(const x of [7,11.3,15.7]){for(const y of [1.7,6.7])box(shell,x,y,23.13,3.5,.06,.06,m.ivory);for(const xx of [-1.75,1.75])box(shell,x+xx,4.2,23.13,.06,5,.06,m.ivory);}
	// Entry: shoes and two bicycles on the left wall.
	const shoes=cabinet(.55,13.8,2.8,1.25,.7,Math.PI/2,m.darkWood);for(let i=0;i<5;i++)box(shoes,-1+i*.43,1.45,0,.28,.25,.6,m.black,.1);
	function bicycle(y:number,z:number){const g=group(.32,z,Math.PI/2);g.position.y=y;for(const x of [-1.3,1.3]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(1,.055,6,32),m.black);wheel.position.set(x,1,0);g.add(wheel);for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(g,[x,1,0],[x+Math.sin(a),1+Math.cos(a),0],.009,m.chrome);}}
		for(const [a,b] of [[[ -1.3,1,0],[-.3,1.9,0]],[[-.3,1.9,0],[.1,.9,0]],[[.1,.9,0],[-1.3,1,0]],[[.1,.9,0],[.9,2,0]],[[.9,2,0],[-.3,1.9,0]],[[.9,2,0],[1.3,1,0]]])rod(g,a,b,.035,m.black);
		box(g,-.35,2.1,0,.5,.1,.23,m.black);rod(g,[.9,2,0],[1,2.4,0],.025,m.chrome);rod(g,[1,2.4,-.25],[1,2.4,.25],.03,m.black);
	}
	bicycle(.2,17.1);bicycle(3.1,17.1);pendant(2.1,15.5);rug(1.7,30,2.3,12,m.blue);
	for(const z of [28.2,30.2])for(const y of [4.5,6])picture(furniture,.16,y,z,1.2,.95,Math.PI/2);
	// Kitchen, with separate runs on either side and the little round breakfast table.
	function kitchenUnit(x:number,z:number,w:number,rotation=0,sink=false){const g=cabinet(x,z,w,2.85,2,rotation,m.ivory);box(g,0,3.02,0,w+.1,.16,2.1,m.white);
		for(let i=0;i<Math.floor(w/1.3);i++){const xx=-w/2+.7+i*1.3;box(g,xx,1.5,1.02,1.17,2.5,.07,m.trim);sphere(g,xx+.35,2.45,1.09,.035,.035,.035,m.black);}
		if(sink){box(g,0,3.12,0,1.7,.04,1.25,m.chrome,.14);box(g,0,3.15,0,1.45,.03,1.02,m.darkWood,.12);rod(g,[0,3.1,-.65],[0,4,-.65],.04,m.chrome);rod(g,[0,4,-.65],[0,4,-.2],.04,m.chrome);}return g;
	}
	kitchenUnit(10.1,31.5,8.8,Math.PI,true);obstacle(10.1,31.5,8.8,2);
	const range=kitchenUnit(7.2,24.4,2.4,0);box(range,0,1.6,1.09,1.85,1.5,.08,m.black);box(range,0,3.15,0,2.3,.09,1.9,m.black);for(const x of [-.6,.6])for(const z of [-.48,.48])cylinder(range,x,3.22,z,.33,.04,m.chrome);cylinder(range,-.6,3.4,.48,.31,.4,m.black);
	box(furniture,7.2,5.75,24,2.7,.28,1.9,m.chrome);box(furniture,7.2,6.9,23.6,.9,2.1,.8,m.chrome);
	kitchenUnit(10,24.4,2.8);const fridge=cabinet(13.5,24.45,2.65,6.2,2.1,0,m.ivory);box(fridge,0,4.5,1.08,2.5,.035,.05,m.chrome);for(const y of [3.2,5.25])box(fridge,-.95,y,1.15,.07,1.3,.09,m.chrome);for(let i=0;i<5;i++)box(fridge,(i%2)*.65-.35,4.8+Math.floor(i/2)*.4,1.1,.48,.32,.015,i%2?m.blue:m.white);
	const cupboard=cabinet(4.7,31.4,2.4,7.1,1.6,Math.PI,m.ivory);for(const y of [2.1,5.5])for(const x of [-.55,.55])box(cupboard,x,y,.85,1.05,2.9,.05,m.trim);
	const breakfast=group(5.1,28.5);cylinder(breakfast,0,.12,0,.6,.18,m.black);cylinder(breakfast,0,1.3,0,.1,2.5,m.black);cylinder(breakfast,0,2.6,0,1.1,.12,m.white);chair(6.8,28.5,Math.PI/2);
	obstacle(9.8,24.4,10.2,2);pendant(10,28);
	// Separate WC.
	const toilet=group(-3.4,23.9,Math.PI/2);box(toilet,0,1.5,-.55,1.25,2.7,.65,m.white,.15);sphere(toilet,0,.8,.15,.72,.75,1,m.white);cylinder(toilet,0,1.3,.25,.58,.12,m.ivory);cylinder(toilet,0,1.38,.25,.4,.025,m.darkWood);box(toilet,0,.3,.2,.75,.6,1,m.white,.16);picture(furniture,-2.3,5.4,21.68,1.4,1.7);obstacle(-3.4,23.9,2.6,1.5);
	// Bath: small white floor tiles, pedestal basin and rectangular tub.
	// Follow-up photos show the sink left and tub right when entering this room.
	const tub=group(-3.8,36.6);box(tub,0,1,0,4.8,1.8,2.5,m.white,.18);box(tub,0,1.93,0,4.42,.08,2.15,m.trim,.25);box(tub,0,1.99,0,3.9,.04,1.62,m.white,.25);obstacle(-3.8,36.6,4.8,2.5);
	box(shell,-3.7,3.45,38.05,4.9,6.8,.08,m.tile);rod(furniture,[-1.5,2.2,37.7],[-1.5,6.4,37.7],.035,m.chrome);rod(furniture,[-1.5,6.4,37.7],[-1.5,6.4,37.1],.035,m.chrome);sphere(furniture,-1.5,6.3,37.1,.15,.07,.18,m.chrome);
	rod(furniture,[-6,7,35.2],[-1.3,7,35.2],.03,m.chrome);
	curtain(furniture,-5.35,4.35,35.2,1.25,5.2,m.curtain);
	const sink=group(-5.45,33.1,Math.PI/2);cylinder(sink,0,1.2,0,.22,2.3,m.white,.3);box(sink,0,2.65,0,1.8,.35,1.4,m.white,.19);sphere(sink,0,2.82,.12,.6,.04,.38,m.chrome);rod(sink,[0,2.8,-.4],[0,3.2,-.4],.035,m.chrome);box(sink,0,4.7,-.5,1.9,2.3,.16,m.white);box(sink,0,4.7,-.4,1.65,2.05,.02,m.chrome);rug(-2.9,33.7,2.7,1.7,m.sage);
	// Back office: daybed on the left, standing desk in front of the window.
	rug(-.8,45.4,6,6,m.blue,true);couch(-3.7,45.5,6.3,Math.PI/2,m.blue);obstacle(-3.7,45.5,2.7,6.3);
	desk(.1,49.3,4.6,Math.PI,true);cylinder(furniture,.1,.12,47.2,.7,.1,m.black);cylinder(furniture,.1,1.05,47.2,.09,1.9,m.chrome);cylinder(furniture,.1,2,47.2,.5,.22,m.black);obstacle(.1,49.3,4.6,1.8);
	const night=cabinet(-3.9,49.3,1.5,2,1.4,0,m.ivory);plant(0,0,.55,.16,night,2.15);picture(furniture,1.5,5,40.16,1.4,2);
	curtain(furniture,.3,4.9,50.18,2.1,6.8,m.officeCurtain);
	box(furniture,.1,.06,48,2.9,.08,1.7,m.black,.15);
	// Main bedroom: bed faces the wardrobe/dresser wall, with sage quilt and rust pillows.
	rug(10.3,44.2,9.5,9.8,m.bedroomRug);const bed=group(12.6,44.1,-Math.PI/2);
	legs(bed,5.3,6.6,.8);box(bed,0,.75,0,5.4,.6,6.8,m.oak,.05);box(bed,0,1.22,0,5.2,.5,6.7,m.white,.16);box(bed,0,1.51,.6,5.3,.18,5.5,m.sage,.12);box(bed,0,1.62,-1.5,5.25,.15,1.1,m.ivory,.09);box(bed,0,2,-3.3,5.4,2.1,.18,m.oak,.05);
	box(bed,0,1.62,.65,5.35,.07,5.1,m.quilt,.03);
	curtain(bed,0,.97,3.42,5.35,1.25,m.quilt);for(const side of [-1,1])curtain(bed,side*2.7,1.05,.7,5.1,1.1,m.quilt,side*Math.PI/2);
	for(const x of [6.65,13.35])curtain(furniture,x,4.5,50.22,1,7.5,m.white);
	for(const x of [-1.25,1.25]){const p=box(bed,x,1.67,-2.5,2.1,.32,1.3,m.white,.18);p.rotation.x=.08;pillow(bed,x,2.1,-2.4,1.5,1,m.rust,.35);}box(bed,-1.2,1.68,.1,1.2,.13,2.2,m.blue,.09);obstacle(12.6,44.1,6.8,5.4);
	for(const z of [40.3,47.9]) {const n=cabinet(15.7,z,1.7,2.05,1.5,-Math.PI/2,m.oak);box(n,0,1.4,.8,1.5,.5,.06,m.wood);sphere(n,0,1.4,.88,.05,.05,.05,m.brass);cylinder(n,0,2.5,0,.06,.8,m.brass);cylinder(n,0,3.05,0,.4,.65,m.lamp,.3);}
	const dresser=cabinet(8.5,36.9,3.25,4.7,1.5,0,m.oak);for(let y=.7;y<4.5;y+=.8){box(dresser,0,y,.79,3,.68,.06,m.wood);for(const x of [-.8,.8])box(dresser,x,y,.86,.27,.08,.08,m.black,.03);}plant(1,0,.9,.2,dresser,4.86);obstacle(8.5,36.9,3.3,1.5);
	box(shell,12.4,3.6,36.18,3.2,7.2,.16,m.ivory);box(shell,12.4,3.5,36.28,2.8,6.6,.04,m.darkWood);rod(shell,[11.2,6,36.4],[13.6,6,36.4],.035,archMaterial(m.chrome));
	for(let i=0;i<10;i++)box(shell,11.25+i*.25,4.65,36.5,.19,2.5,.5,[m.white,m.blue,m.sage][i%3]);
	picture(furniture,5,4.3,36.25,1.7,4.3);plant(6,37.3,3.6,.3);couch(5.2,45,3.5,Math.PI/2,m.blue);pendant(10,43);
	// Merge static meshes by material to keep the detailed model inexpensive on phones.
	function mergeStatic(parent:THREE.Group) {
		parent.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(parent.matrixWorld).invert();
		const buckets=new Map<Material,THREE.BufferGeometry[]>();
		parent.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)){const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));const normalized=g.index?g.toNonIndexed():g;normalized.deleteAttribute('tangent');const list=buckets.get(o.material)||[];list.push(normalized);buckets.set(o.material,list);}});
		parent.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});parent.clear();
		for(const [material,geometries] of buckets){const geo=mergeGeometries(geometries);if(!geo)throw new Error('Unable to combine apartment geometry');const mesh=new THREE.Mesh(geo,material);mesh.castShadow=parent!==floors;mesh.receiveShadow=true;parent.add(mesh);geometries.forEach(g=>g.dispose());}
	}
	for(const g of [shell,furniture,ceilings,...wallSections.map(w=>w.group)])mergeStatic(g);
	ceilings.visible=false;
	function updateCutaway(position:THREE.Vector3,mode:string,height:number) {
		clip.constant=mode==='plan'?.4:measured.ceiling+.1;
		for(const wall of wallSections){
			const inside=position.clone().sub(wall.center).dot(wall.normal)>0;
			wall.plane.constant=mode==='walk'?measured.ceiling+.1:mode==='plan'?.4:inside?measured.ceiling+.1:height;
		}
	}
	return {root,shell,furniture,floors,ceilings,clip,wallSections,updateCutaway,barriers:barriers.map(reflectBarrier),furnitureBarriers:furnitureBarriers.map(reflectBarrier),materials:m};
}
