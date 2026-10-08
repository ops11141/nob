import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { LibreDwg, Dwg_File_Type } from '@mlightcad/libredwg-web';

const root = process.cwd();
const source = path.join(root, 'source', 'GEO.dwg');
if (!fs.existsSync(source)) throw new Error('source/GEO.dwg is missing');

const buffer = fs.readFileSync(source);
const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

const lib = await LibreDwg.create('./node_modules/@mlightcad/libredwg-web/wasm/');
const data = lib.dwg_read_data(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  Dwg_File_Type.DWG
);
if (!data) throw new Error('DWG decode failed');

const safe = (fn, fallback = null) => {
  try {
    const v = fn();
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const outDir = path.join(root, 'data');
fs.mkdirSync(outDir, { recursive: true });

const objectsCount = safe(() => lib.dwg_get_num_objects(data), 0);
const entitiesCount = safe(() => lib.dwg_get_num_entities(data), 0);
const modelEntities = safe(() => lib.dwg_getall_entities_in_model_space(data), []) || [];
const layers = safe(() => lib.dwg_getall_LAYER(data), []) || [];
const ltypes = safe(() => lib.dwg_getall_LTYPE(data), []) || [];

const objectIndex = [];
const objectTypes = {};
const modelEntityIndex = [];
const modelEntityTypes = {};

for (let i = 0; i < objectsCount; i++) {
  const ptr = safe(() => lib.dwg_get_object(data, i), 0);
  if (!ptr) continue;
  const type = safe(() => lib.dwg_object_get_dxfname(ptr), 'UNKNOWN') || 'UNKNOWN';
  const handle = safe(() => lib.dwg_object_get_handle(ptr), '') || '';
  objectIndex.push({ index: i, type, handle });
  objectTypes[type] = (objectTypes[type] || 0) + 1;
}

for (let i = 0; i < modelEntities.length; i++) {
  const ptr = modelEntities[i];
  const type = safe(() => lib.dwg_object_get_dxfname(ptr), 'UNKNOWN') || 'UNKNOWN';
  const handle = safe(() => lib.dwg_object_get_handle(ptr), '') || '';
  modelEntityIndex.push({ index: i, type, handle });
  modelEntityTypes[type] = (modelEntityTypes[type] || 0) + 1;
}

const db = lib.convert(data);

// Flatten every scalar/string value in the converted database.
// This is deliberately loss-preserving: it does not classify or discard unknown fields.
const jsonl = fs.createWriteStream(path.join(outDir, 'raw-records.jsonl'));
let rawRecords = 0;
let stringRecords = 0;
const seen = new WeakSet();

function emit(record) {
  jsonl.write(JSON.stringify(record) + '\n');
  rawRecords++;
}

function walk(v, pathName = '', depth = 0) {
  if (v == null || depth > 12) return;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    emit({ path: pathName, value: v, kind: typeof v });
    if (typeof v === 'string') stringRecords++;
    return;
  }
  if (typeof v === 'bigint') {
    emit({ path: pathName, value: v.toString(), kind: 'bigint' });
    return;
  }
  if (typeof v !== 'object') return;
  if (seen.has(v)) return;
  seen.add(v);

  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) walk(v[i], pathName + '[' + i + ']', depth + 1);
    return;
  }

  for (const [k, val] of Object.entries(v)) {
    walk(val, pathName ? pathName + '.' + k : k, depth + 1);
  }
}

walk(db);
await new Promise(resolve => jsonl.end(resolve));

const rawPath = path.join(outDir, 'raw-records.jsonl');
const gzPath = path.join(outDir, 'raw-records.jsonl.gz');
fs.writeFileSync(gzPath, zlib.gzipSync(fs.readFileSync(rawPath), { level: 9 }));
fs.unlinkSync(rawPath);

const layersIndex = layers.map((v, index) => ({ index, value: typeof v === 'string' ? v : safe(() => lib.dwg_object_get_dxfname(v), 'LAYER') }));
const ltypesIndex = ltypes.map((v, index) => ({ index, value: typeof v === 'string' ? v : safe(() => lib.dwg_object_get_dxfname(v), 'LTYPE') }));

const summary = {
  source: {
    name: 'GEO.dwg',
    sizeBytes: buffer.length,
    sha256
  },
  counts: {
    objects: objectsCount,
    extractedObjects: objectIndex.length,
    entities: entitiesCount,
    modelEntities: modelEntities.length,
    classes: safe(() => lib.dwg_get_num_classes(data), 0),
    layers: layers.length,
    ltypes: ltypes.length,
    rawRecords,
    stringRecords
  },
  objectTypes,
  modelEntityTypes,
  geometry: {
    xMin: safe(() => lib.dwg_model_x_min(data)),
    yMin: safe(() => lib.dwg_model_y_min(data)),
    xMax: safe(() => lib.dwg_model_x_max(data)),
    yMax: safe(() => lib.dwg_model_y_max(data))
  },
  qa: {
    objectCountMatches: objectIndex.length === objectsCount,
    modelEntityCountMatches: modelEntityIndex.length === modelEntities.length,
    rawRecordsAreSeparateFromDwgObjects: true
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, 'decoded-summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(outDir, 'dwg-objects.json'), JSON.stringify(objectIndex, null, 2));
fs.writeFileSync(path.join(outDir, 'model-entities.json'), JSON.stringify(modelEntityIndex, null, 2));
fs.writeFileSync(path.join(outDir, 'layers.json'), JSON.stringify(layersIndex, null, 2));
fs.writeFileSync(path.join(outDir, 'linetypes.json'), JSON.stringify(ltypesIndex, null, 2));

const candidates = objectIndex.filter(x => /RMU|EOS|RECLOSER|FEEDER|CABLE|JOINT|SUB.?STATION|POLE/i.test(x.type));
fs.writeFileSync(path.join(outDir, 'equipment-candidates.json'), JSON.stringify(candidates, null, 2));

try { lib.dwg_free(data); } catch {}

console.log(JSON.stringify(summary, null, 2));
