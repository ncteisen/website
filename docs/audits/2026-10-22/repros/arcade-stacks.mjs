import vm from 'node:vm';
import {build} from 'esbuild';
const bundled=await build({entryPoints:['src/games/arcade/collection/Stacks.ts'],bundle:true,write:false,format:'iife',globalName:'m'});
const ctx=vm.createContext({});vm.runInContext(bundled.outputFiles[0].text,ctx);
const world=new ctx.m.Stacks(), input={axis:0,target:null,held:false};
for(let i=0;i<21600&&!world.ended;i++){world.update(1/120,input);if(!world.cooldown&&Math.abs(world.moving.x-world.top.x)<2)world.act('primary');if(world.top.width===400)break;}
console.log(JSON.stringify({stage:'42-perfect-drops',score:world.score,time:world.time,moving:world.moving,top:world.top}));
for(let i=0;i<240;i++)world.update(1/120,input);
console.log(JSON.stringify({stage:'wait-two-seconds',score:world.score,moving:world.moving,top:world.top}));
world.act('primary');
console.log(JSON.stringify({stage:'next-drop',ended:world.ended,reason:world.reason}));
