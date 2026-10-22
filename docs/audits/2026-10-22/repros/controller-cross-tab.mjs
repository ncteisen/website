import vm from 'node:vm';
import {build} from 'esbuild';
const stubs={
 Renderer:'export class Renderer { ready=Promise.resolve(); viewportHeight=600; resize(){return 600} render(){} reset(){} update(){} bounce(){} }',
 InputHandler:'export class InputHandler { reset(){} cleanup(){} read(){return {axis:0,target:null}} }',
 GameAudio:'export class GameAudio { enabled=true; unlock(){} play(){} cleanup(){} }',
};
const result=await build({entryPoints:['src/games/sarah-jumps/js/core/GameEngine.ts'],bundle:true,write:false,format:'iife',globalName:'game',define:{'import.meta.env.PUBLIC_ARCADE_API_URL':'""'},plugins:[{name:'stub-visual-dependencies',setup(builder){builder.onResolve({filter:/\/(Renderer|InputHandler|GameAudio)$/},args=>({path:args.path.split('/').at(-1),namespace:'audit'}));builder.onLoad({filter:/.*/,namespace:'audit'},args=>({contents:stubs[args.path]}));}}]});
class Element extends EventTarget {textContent='';dataset={};disabled=false;hidden=false;setAttribute(){}focus(){}}
class Root {dataset={};elements=new Map();querySelector(selector){if(!this.elements.has(selector))this.elements.set(selector,new Element());return this.elements.get(selector)}}
const values=new Map();
const context=vm.createContext({localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},window:new EventTarget(),document:Object.assign(new EventTarget(),{hidden:false,hasFocus:()=>true}),AbortController,ResizeObserver:class{observe(){}disconnect(){}},cancelAnimationFrame:()=>{}});
vm.runInContext(result.outputFiles[0].text,context);
// Two independent game controller instances see the same initial stored best (0).
// Rendering, input and audio are stubbed; the GameEngine controller and storage are real.
const a=new context.game.GameEngine(new Root()), b=new context.game.GameEngine(new Root());
a.state='playing';a.world.score=100;a.pause();
const afterA=values.get('sarahJumpsHighScore');
b.state='playing';b.world.score=20;b.pause();
console.log(JSON.stringify({case:'two-real-controller-instances-with-shared-storage',afterHigherScoringTabPaused:afterA,afterStaleLowerScoringTabPaused:values.get('sarahJumpsHighScore')}));
