import { Dwg_File_Type, LibreDwg } from '@mlightcad/libredwg-web';

let enginePromise;
export async function getEngine(){
  if(!enginePromise) enginePromise=LibreDwg.create(import.meta.env.BASE_URL+'assets');
  return enginePromise;
}

function safeCall(fn,fallback=0){
  try{
    const v=fn();
    return v ?? fallback;
  }catch{
    return fallback;
  }
}

function readBounds(engine,data){
  const value=(name)=>safeCall(()=>engine[name](data),null);
  return {
    xMin:value('dwg_model_x_min'),
    yMin:value('dwg_model_y_min'),
    xMax:value('dwg_model_x_max'),
    yMax:value('dwg_model_y_max')
  };
}

export async function inspectDwg(file,onProgress=()=>{}){
  if(!file) throw new Error('لم يتم اختيار ملف.');
  if(!/\.dwg$/i.test(file.name)) throw new Error('الملف المطلوب يجب أن يكون DWG.');

  onProgress(8,'قراءة الملف في الذاكرة');
  const buffer=await file.arrayBuffer();

  onProgress(18,'تشغيل محرك LibreDWG');
  const engine=await getEngine();

  onProgress(35,'فك ترميز DWG');
  const data=engine.dwg_read_data(buffer,Dwg_File_Type.DWG);
  if(!data) throw new Error('تعذر فك ملف DWG.');

  onProgress(46,'استخراج العدادات الأساسية');
  const objects=safeCall(()=>engine.dwg_get_num_objects(data));
  const entities=safeCall(()=>engine.dwg_get_num_entities(data));
  const classes=safeCall(()=>engine.dwg_get_num_classes(data));
  const layers=safeCall(()=>engine.dwg_getall_LAYER(data).length);
  const ltypes=safeCall(()=>engine.dwg_getall_LTYPE(data).length);
  const list=safeCall(()=>engine.dwg_getall_entities_in_model_space(data),[]) || [];

  const entityTypes={};
  const typeSamples={};
  const objectsIndex=[];
  onProgress(50,'استخراج كائنات DWG الفعلية');
  for(let i=0;i<objects;i++){
    const ptr=safeCall(()=>engine.dwg_get_object(data,i),0);
    if(!ptr) continue;
    const type=safeCall(()=>engine.dwg_object_get_dxfname(ptr),'UNKNOWN') || 'UNKNOWN';
    const handle=safeCall(()=>engine.dwg_object_get_handle(ptr),'');
    objectsIndex.push({index:i,type,handle});
    if(i%25===0) onProgress(50+Math.round((i/Math.max(1,objects))*7),'استخراج كائنات DWG الفعلية');
  }

  onProgress(58,'تصنيف العناصر الهندسية');
  for(let i=0;i<list.length;i++){
    const ptr=list[i];
    const name=safeCall(()=>engine.dwg_object_get_dxfname(ptr),'UNKNOWN') || 'UNKNOWN';
    entityTypes[name]=(entityTypes[name]||0)+1;
    if(!typeSamples[name]) typeSamples[name]=[];
    if(typeSamples[name].length<5){
      typeSamples[name].push({
        index:i,
        handle:safeCall(()=>engine.dwg_object_get_handle(ptr),'')
      });
    }
    if(i%500===0){
      onProgress(58+Math.round((i/Math.max(1,list.length))*22),'تصنيف العناصر الهندسية');
    }
  }

  onProgress(84,'قراءة حدود الرسم');
  const modelBounds=readBounds(engine,data);

  onProgress(90,'بناء نتيجة التحليل');
  const result={
    source:{name:file.name,sizeBytes:file.size,lastModified:file.lastModified},
    counts:{objects,entities,modelEntities:list.length,classes,layers,ltypes,extractedObjects:objectsIndex.length},
    objects:objectsIndex,
    geometry:{
      modelBounds,
      hasBounds:Object.values(modelBounds).every(v=>typeof v==='number' && Number.isFinite(v))
    },
    entityTypes,
    typeSamples,
    generatedAt:new Date().toISOString()
  };

  try{engine.dwg_free(data)}catch{}
  onProgress(100,'اكتمل التحليل');
  return result;
}
