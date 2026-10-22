import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transform } from 'esbuild';
const source=readFileSync('src/pages/index.astro','utf8');
const script=source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/import[^;]+;/g,'');
const js=(await transform(script,{loader:'ts'})).code;
let domReady;const selectors=[];
const document={addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')domReady=fn},querySelectorAll:(selector)=>{selectors.push(selector);return selector==='.latest-activity-map'?[{id:'fixture-map',dataset:{polyline:'_p~iF~ps|U_ulLnnqC_mqNvxq`@'}}]:[]}};
const context={document,window:{},CARTO_TILE_OPTIONS:{},CARTO_TILE_URL:'fixture'};
vm.runInNewContext(js,context);
try{domReady();}catch(error){console.log(JSON.stringify({error:error.message,selectorsVisited:selectors,careerHandlersReached:selectors.includes('[data-career]'),statsHandlersReached:selectors.includes('.period-btn')}));}
