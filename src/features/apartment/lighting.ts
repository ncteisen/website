import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function lightApartment(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
	const environment = new RoomEnvironment();
	const generator = new THREE.PMREMGenerator(renderer);
	scene.environment = generator.fromScene(environment).texture;
	scene.environmentIntensity = .16;
	environment.dispose();generator.dispose();
	const sky = new THREE.HemisphereLight('#e4edf2', '#746042', 1.15);
	const ambient = new THREE.AmbientLight('#e9dfce', .2);
	const sun = new THREE.DirectionalLight('#fff0d5', 2.7);
	sun.position.set(-26, 35, -24);sun.target.position.set(-7, 0, 24);
	sun.castShadow = true;sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, {left:-38,right:38,top:45,bottom:-45,far:130});
	sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;
	const fill = new THREE.DirectionalLight('#cbe2ed', .5);fill.position.set(15, 15, 55);
	scene.add(sky, ambient, sun, sun.target, fill);
	const lamps:THREE.PointLight[]=[];
	for(const [x,y,z] of [[-14,5.4,1.9],[-16.3,5.4,12.6],[-11.8,7.3,17.4],[-2.1,7.5,15.5],[-10,7.3,28],[3,7.3,35],[-15.7,3.1,40.3],[-15.7,3.1,47.9]]){
		const light=new THREE.PointLight('#ffd3a0',0,18,2);light.position.set(x,y,z);scene.add(light);lamps.push(light);
	}
	return (setting:'day'|'evening') => {
		const evening=setting==='evening';
		sky.intensity=evening?.48:1.15;sun.intensity=evening?.18:2.7;fill.intensity=evening?.2:.5;
		scene.environmentIntensity=evening?.12:.16;
		for(const lamp of lamps)lamp.intensity=evening?40:3;
		renderer.setClearColor(evening?'#69736f':'#bdc7bf');
		renderer.toneMappingExposure=evening?1.05:.94;
	};
}
