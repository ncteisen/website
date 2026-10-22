import {randomUUID,randomBytes} from 'node:crypto';
import {createTestHarness} from '../../../../node_modules/wrangler/wrangler-dist/cli.js';
const runtime=createTestHarness({workers:[{configPath:'workers/arcade/wrangler.jsonc'}]});
try {
 await runtime.listen();await runtime.getWorker().applyD1Migrations('DB');
 const player={id:randomUUID(),secret:randomBytes(32).toString('hex')};
 const fake={...player,secret:randomBytes(32).toString('hex')};
 const send=async(p,ip,body,path='/players')=>runtime.fetch('https://scores.example'+path,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://noaheisen.com','CF-Connecting-IP':ip,'Authorization':`Bearer ${p.id}.${p.secret}`},body:JSON.stringify(body)});
 const registered=await send(player,'192.0.2.1',{nickname:'Victim'});
 const statuses=[];
 for(let i=0;i<60;i++){const r=await send(fake,'192.0.2.2',{nickname:'Wrong token'});statuses.push(r.status);}
 const legit=await send(player,'192.0.2.1',{id:randomUUID(),game:'sarah-jumps',score:12,version:1},'/runs');
 console.log(JSON.stringify({registered:registered.status,wrongTokenResponses:statuses.reduce((counts,status)=>({...counts,[status]:(counts[status]||0)+1}),{}),legitimateRunAfterWrongTokenFlood:legit.status,message:await legit.json()}));
}finally {await runtime.close();}
