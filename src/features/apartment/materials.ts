import * as THREE from 'three';

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512) {
	const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d')!; draw(ctx, size);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.anisotropy = 4; return texture;
}
let seed = 42;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
export function makeMaterials(loadPhotos = true) {
	seed=42;
	const loader=new THREE.TextureLoader();
	function photo(name:string,repeat=false) {
		const texture=loadPhotos?loader.load(`/images/apartment/${name}.webp`):new THREE.Texture();
		texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
		if(repeat)texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;
		return texture;
	}
	const photoMaterial=(name:string,roughness=.85,repeat=false)=>new THREE.MeshStandardMaterial({map:photo(name,repeat),roughness});
	const woodTexture = canvasTexture((c, s) => {
		c.fillStyle = '#a97d48'; c.fillRect(0, 0, s, s);
		for (let row = 0; row < 16; row++) {
			const y = row * 32;
			c.fillStyle = `hsl(${29 + random() * 7}, ${36 + random() * 11}%, ${43 + random() * 15}%)`; c.fillRect(0, y, s, 31);
			for (let j = 0; j < 22; j++) { c.strokeStyle = `rgba(67,36,14,${random() * 0.12})`; c.beginPath(); const yy = y + random() * 30; c.moveTo(0, yy); c.bezierCurveTo(120, yy + 2, 330, yy - 3, s, yy); c.stroke(); }
			c.fillStyle = '#775a393b'; const offset = (row % 3) * 85; for (let x = offset; x < s; x += 256) c.fillRect(x, y, 1, 32);
		}
	}); woodTexture.repeat.set(2, 2);
	const rugTexture = canvasTexture((c,s) => {
		c.fillStyle = '#c6b999'; c.fillRect(0,0,s,s);
		for(let i=0;i<14000;i++){ c.fillStyle = ['#e0d4b5','#988f77','#b4ad99','#eee6d1'][i%4];c.fillRect(random()*s,random()*s,1+random()*3,1+random()*3); }
		for(let i=0;i<5;i++){c.strokeStyle=['#847c66','#ded1ae'][i%2];c.lineWidth=2;c.strokeRect(12+i*5,12+i*5,s-24-i*10,s-24-i*10);}
		c.strokeStyle='#98876d66';c.lineWidth=2;
		for(let x=60;x<s-40;x+=48) for(let y=60;y<s-40;y+=48){c.beginPath();c.moveTo(x,y-17);c.lineTo(x+12,y);c.lineTo(x,y+17);c.lineTo(x-12,y);c.closePath();c.stroke();}
	});
	const tileTexture = canvasTexture((c,s)=>{c.fillStyle='#e5e2d7';c.fillRect(0,0,s,s);c.strokeStyle='#b5b7ab';c.lineWidth=3;for(let i=0;i<=s;i+=64){c.beginPath();c.moveTo(i,0);c.lineTo(i,s);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(s,i);c.stroke();}});
	const grain=photo('wood',true);grain.repeat.set(1,2);
	const weave=photo('linen',true);weave.repeat.set(2,2);
	const mat = (color: string, roughness = .8) => new THREE.MeshStandardMaterial({color,roughness});
	const timber=(color:string)=>new THREE.MeshStandardMaterial({color,map:grain,roughness:.52,bumpMap:grain,bumpScale:.018});
	const fabric=(color:string)=>new THREE.MeshStandardMaterial({color,map:weave,roughness:1,bumpMap:weave,bumpScale:.025});
	return {
		wall:mat('#c4c1b8'), ivory:mat('#f0ede2'), trim:mat('#eeeae1'), wood:timber('#a88a66'), oak:timber('#d1bd99'), darkWood:timber('#66513e'),
		floor:new THREE.MeshStandardMaterial({map:loadPhotos?grain:woodTexture,roughness:.48,bumpMap:grain,bumpScale:.025}), rug:loadPhotos?photoMaterial('rug',1,true):new THREE.MeshStandardMaterial({map:rugTexture,roughness:1}),
		tile:new THREE.MeshStandardMaterial({map:tileTexture,roughness:.38}), sage:fabric('#8a9579'), blue:fabric('#72838b'), sofa:fabric('#dedcd4'),
		fireplace:photoMaterial('fireplace'), fireplaceArt:photoMaterial('fireplace-art'), bookcase:photoMaterial('bookcase'), pianoArt:photoMaterial('piano-art'), buffet:photoMaterial('buffet'),
		quilt:photoMaterial('quilt',1,true), bedroomRug:photoMaterial('bedroom-rug',1,true), curtain:photoMaterial('shower-curtain',1), officeCurtain:photoMaterial('office-curtain',1),
		courtyard:new THREE.MeshBasicMaterial({map:photo('courtyard'),color:'#d9e1df'}),
		bayView:new THREE.MeshBasicMaterial({map:photo('bay-view'),color:'#f5f2dd'}),
		white:mat('#eee9dc'), rust:fabric('#c1845d'), black:mat('#222424'), brass:new THREE.MeshStandardMaterial({color:'#b69b60',metalness:.75,roughness:.3}), chrome:new THREE.MeshStandardMaterial({color:'#c7ceca',metalness:.85,roughness:.2}),
		leaf:mat('#466b40'), leafLight:mat('#71854b'), soil:mat('#3e3326'), pot:mat('#c7b69c'), screen:mat('#252e32',.3),
		glass:new THREE.MeshStandardMaterial({color:'#bad0cc',transparent:true,opacity:.27,roughness:.22,side:THREE.DoubleSide,depthWrite:false}),
		lamp:new THREE.MeshStandardMaterial({color:'#f2e6bd',emissive:'#efcc89',emissiveIntensity:.28,roughness:.9}),
		base:mat('#534e43'), shadow:new THREE.MeshBasicMaterial({color:'#403a2c',transparent:true,opacity:.09,depthWrite:false}),
	};
}
export type Materials = ReturnType<typeof makeMaterials>;
