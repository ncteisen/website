import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {build} from 'esbuild';
const repo=process.cwd()+'/';
async function source(file,name,define={}) { return (await build({entryPoints:[repo+file],bundle:true,write:false,format:'iife',globalName:name,define})).outputFiles[0].text; }
const scoreCode=await source('src/games/arcade/scores.ts','client',{'import.meta.env.PUBLIC_ARCADE_API_URL':'"https://scores.example"'});
function scoreEnv(values=new Map()) {
 let denyWrites=false;
 const attempts=[];
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(denyWrites)throw Error('quota');values.set(k,v)},removeItem:k=>values.delete(k),key:i=>[...values.keys()][i],get length(){return values.size}};
 const context=vm.createContext({window:new EventTarget(),localStorage:storage,navigator:{},crypto:webcrypto,CustomEvent,AbortSignal,setTimeout:()=>1,clearTimeout:()=>{},fetch:async(url,opts)=>{attempts.push({url,body:JSON.parse(opts.body||'null')});return Response.json({saved:true})}});
 vm.runInContext(scoreCode,context);
 return {client:context.client,values,attempts,denyWrites:()=>{denyWrites=true}};
}
const cleared=scoreEnv();
await cleared.client.setNickname('Original');
const original=cleared.client.getPlayer().id;
cleared.values.clear();
console.log(JSON.stringify({case:'cleared-identity',retainsOriginalIdentity:cleared.client.getPlayer()?.id===original}));
const quota=scoreEnv();
await quota.client.setNickname('Before');
quota.denyWrites();
const changed=await quota.client.setNickname('After');
console.log(JSON.stringify({case:'quota-rename',result:changed,currentNickname:quota.client.getPlayer().nickname,postedNickname:quota.attempts.at(-1).body.nickname,message:quota.client.scoreMessage()}));
const values=new Map();
for(let i=0;i<50;i++){const run={id:webcrypto.randomUUID(),game:'sarah-skis',score:i,version:1};values.set('sarahArcade.run.v1.'+run.id,JSON.stringify({run,queuedAt:i}));}
const old=scoreEnv(values);
for(let i=0;i<50;i++)old.client.recordRun('sarah-skis',i);
console.log(JSON.stringify({case:'retired-queue',storedRuns:[...values.keys()].filter(k=>k.startsWith('sarahArcade.run')).length}));
await old.client.setNickname('Current');
console.log(JSON.stringify({case:'retired-queue-after-sync',storedRuns:[...values.keys()].filter(k=>k.startsWith('sarahArcade.run')).length,message:old.client.scoreMessage()}));
const bestValues=new Map();
const bestContext=vm.createContext({localStorage:{getItem:k=>bestValues.get(k),setItem:(k,v)=>bestValues.set(k,v)}});
vm.runInContext(await source('src/games/arcade/storage.ts','storage'),bestContext);
bestContext.storage.saveBest('game',100);
bestContext.storage.saveBest('game',20);
console.log(JSON.stringify({case:'best-regression',bestAfterLowerSave:bestContext.storage.readBest('game')}));
const stacksContext=vm.createContext({});
vm.runInContext(await source('src/games/arcade/collection/Stacks.ts','worlds'),stacksContext);
const stack=new stacksContext.worlds.Stacks();
const controls={axis:0,target:null,held:false};
let firstFull=null;
for(let i=0;i<120*180&&!stack.ended;i++){
 stack.update(1/120,controls);
 if(!stack.cooldown&&Math.abs(stack.moving.x-stack.top.x)<2)stack.act('primary');
 if(stack.top.width===400){firstFull={time:stack.time,score:stack.score};break}
}
for(let i=0;i<120*180&&!stack.ended;i++){
 stack.update(1/120,controls);
 if(i%48===0)stack.act('primary');
}
console.log(JSON.stringify({case:'stacks-full-width',firstFull,afterThreeMinutesBlindTapping:{score:stack.score,ended:stack.ended,width:stack.top.width}}));
