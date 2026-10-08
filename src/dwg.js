import { Dwg_File_Type, LibreDwg } from '@mlightcad/libredwg-web';
let enginePromise;
export async function getEngine(){if(!enginePromise)enginePromise=LibreDwg.create(import.meta.env.BASE_URL+'assets');return enginePromise}
function safeCall(fn,fallback=0){try{return fn()??fallback}catch{return fallback}}
export async function inspectDwg(file,onProgress=()=>{}){
 if(!file)throw new Error('لم يتم اختيار ملف.');
 if(!/\.dwg$/i.test(file.name))throw new Error('الملف المطلوب يجب أن يكون DWG.');
 onProgress(8,'قراءة الملف في الذاكرة');const buffer=await file.arrayBuffer();
 onProgress(18,'تشغيل محرك LibreDWG');const engine=await getEngine();
 onProgress(35,'فك ترميز DWG');const data=engine.dwg_read_data(buffer,Dwg_File_Type.DWG);
 if(!data)throw new Error('تعذر فك ملف DWG.');
 onProgress(48,'استخراج العدادات الأساسية');
 const objects=safeCall(()=>engine.dwg_get_num_objects(data));
 const entities=safeCall(()=>engine.dwg_get_num_entities(data));
 const classes=safeCall(()=>engine.dwg_get_num_classes(data));
 const layers=safeCall(()=>engine.dwg_getall_LAYER(data).length);
 const ltypes=safeCall(()=>engine.dwg_getall_LTYPE(data).length);
 const modelEntities=safeCall(()=>engine.dwg_getall_entities_in_model_space(data).length);
 let entityTypes={};
 try{const list=engine.dwg_getall_entities_in_model_space(data)||[];onProgress(62,'تصنيف العناصر الهندسية');
  for(let i=0;i<list.length;i++){const ptr=list[i];const name=safeCall(()=>engine.dwg_object_get_dxfname(ptr),'UNKNOWN');entityTypes[name]=(entityTypes[name]||0)+1;if(i%500===0)onProgress(62+Math.round((i/Math.max(1,list.length))*18),'تصنيف العناصر الهندسية')}
 }catch{}
 onProgress(84,'بناء قاعدة النتائج');let databaseKeys=[];try{const db=engine.convert(data);databaseKeys=Object.keys(db||{})}catch{}
 const result={source:{name:file.name,sizeBytes:file.size,lastModified:file.lastModified},counts:{objects,entities,modelEntities,classes,layers,ltypes},entityTypes,databaseKeys,generatedAt:new Date().toISOString()};
 try{engine.dwg_free(data)}catch{}onProgress(100,'اكتمل التحليل');return result;
}