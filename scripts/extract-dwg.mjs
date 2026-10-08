import fs from 'node:fs';
import path from 'node:path';
import { LibreDwg, Dwg_File_Type } from '@mlightcad/libredwg-web';

const root=process.cwd();
const source=path.join(root,'source','GEO.dwg');
if(!fs.existsSync(source)) throw new Error('source/GEO.dwg is missing');

const buffer=fs.readFileSync(source);
const lib=await LibreDwg.create('./node_modules/@mlightcad/libredwg-web/wasm/');
const data=lib.dwg_read_data(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),Dwg_File_Type.DWG);
if(!data) throw new Error('DWG decode failed');

const safe=(fn,f=0)=>{try{return fn()??f}catch{return f}};
const list=safe(()=>lib.dwg_getall_entities_in_model_space(data),[]);
const types={};
for(const ptr of list){
  const type=safe(()=>lib.dwg_object_get_dxfname(ptr),'UNKNOWN');
  types[type]=(types[type]||0)+1;
}

const db=lib.convert(data);
const seen=new WeakSet();
const hits=[];
const wanted=/\\b(RMU|EOS|RECLOSER|FEEDER|CABLE|JOINT|SUB\\s*STATION|SUBSTATION|POLE)\\b/i;
function walk(v,pathName='',depth=0){
  if(depth>8||v==null)return;
  if(typeof v==='string'){
    if(wanted.test(v))hits.push({path:pathName,value:v.slice(0,500)});
    return;
  }
  if(typeof v!=='object')return;
  if(seen.has(v))return; seen.add(v);
  if(Array.isArray(v)){for(let i=0;i<Math.min(v.length,200000);i++)walk(v[i],pathName+'['+i+']',depth+1);return;}
  for(const [k,val] of Object.entries(v))walk(val,pathName?pathName+'.'+k:k,depth+1);
}
walk(db);

const out={
 source:{name:'GEO.dwg',sizeBytes:buffer.length,sha256:null},
 counts:{
  objects:safe(()=>lib.dwg_get_num_objects(data)),
  entities:safe(()=>lib.dwg_get_num_entities(data)),
  modelEntities:list.length,
  classes:safe(()=>lib.dwg_get_num_classes(data)),
  layers:safe(()=>lib.dwg_getall_LAYER(data).length),
  ltypes:safe(()=>lib.dwg_getall_LTYPE(data).length)
 },
 entityTypes:types,
 candidateText:hits,
 generatedAt:new Date().toISOString()
};

fs.mkdirSync(path.join(root,'data'),{recursive:true});
fs.writeFileSync(path.join(root,'data','decoded-summary.json'),JSON.stringify(out,null,2));
fs.writeFileSync(path.join(root,'data','equipment-candidates.json'),JSON.stringify(hits,null,2));
try{lib.dwg_free(data)}catch{}
console.log(JSON.stringify(out.counts,null,2));
