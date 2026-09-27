import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

export const EDITABLE=['title','short_label','aliases','attribution','tags','content','analysis','figures','source_refs'];
export const DATA_FILES=['topics.json','relationships.json','relationship-analysis.json','relationship-matrix.json','source-map.json'];
export const canonical=v=>JSON.stringify(sort(v));
function sort(v){if(Array.isArray(v))return v.map(sort);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]));return v;}
export const sha=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:canonical(v)).digest('hex');
export const equal=(a,b)=>canonical(a)===canonical(b);
export const editable=t=>Object.fromEntries(EDITABLE.map(k=>[k,structuredClone(t[k])]));
export function flat(value,prefix='',out={}){for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw new Error('Ugyldig feltnavn.');const path=prefix?prefix+'.'+key:key;if(v&&typeof v==='object'&&!Array.isArray(v))flat(v,path,out);else out[path]=v;}return out;}
export function setPath(object,path,value){const parts=path.split('.');if(parts.some(k=>['__proto__','constructor','prototype'].includes(k)))throw new Error('Ugyldig felt.');let node=object;for(const key of parts.slice(0,-1)){node[key]??={};node=node[key];}node[parts.at(-1)]=structuredClone(value);}
export function mergeFields(oldBase,local,newBase,choices={},prefix=''){
  const a=oldBase?flat(oldBase):null,b=flat(local),c=flat(newBase),result=structuredClone(newBase),conflicts=[];
  for(const path of Object.keys(b)){
    if(a&&equal(b[path],a[path]))continue;
    if(equal(b[path],c[path]))continue;
    if(!a||!equal(c[path],a[path])){
      const key=prefix+path;conflicts.push({key,path,previous:a?.[path]??null,local:b[path],shared:c[path]??null});
      if(choices[key]==='shared')continue;
    }
    setPath(result,path,b[path]);
  }
  return {fields:result,conflicts};
}
export function validateTopicFactory(schema){
  const check=new Ajv2020({strict:false,allErrors:true}).compile({$defs:schema.$defs,$ref:'#/$defs/topic'});
  return (t,sources)=>{
    if(!check(t)||!t.title.trim()||!t.short_label.trim())throw new Error('Kontroller feltene. Nodenavnet må ha 1–32 tegn, og fagfeltene må følge datastrukturen.');
    function walk(v){if(Array.isArray(v))return v.forEach(walk);if(!v||typeof v!=='object')return;if(v.source_id&&!sources.has(v.source_id))throw new Error('Ukjent kilde.');if(v.src&&!/^assets\/figures\/[a-zA-Z0-9_-]+\.png$/.test(v.src))throw new Error('Ugyldig figursti.');Object.values(v).forEach(walk);}
    walk(t);return true;
  };
}
export function validateDataset(topics,relationships,analysis,checkTopic){
  if(topics.dataset_id!=='organisasjon-ledelse-etikk'||!Array.isArray(topics.topics)||topics.topics.length>1000)throw new Error('Ukjent eller for stort datasett.');
  const map=new Map(topics.topics.map(t=>[t.id,t])),sources=new Set(topics.sources.map(s=>s.id)),categories=new Set(topics.categories.map(c=>c.id));
  if(map.size!==topics.topics.length)throw new Error('Dupliserte temaer.');
  for(const t of map.values()){checkTopic(t,sources);const {content_hash,...rest}=t;if(sha(rest)!==content_hash)throw new Error('Innholdshash stemmer ikke: '+t.id);if(!categories.has(t.category_id)||(t.parent_topic_id&&!map.has(t.parent_topic_id))||t.connection_hints.some(h=>!map.has(h.target_topic_id)))throw new Error('Ugyldig temareferanse.');}
  const manifest=[...map.values()].sort((a,b)=>a.id<b.id?-1:1).map(t=>({id:t.id,revision:t.revision,content_hash:t.content_hash}));
  if(relationships.topics_fingerprint!==sha(manifest)||analysis.topics_fingerprint!==sha(manifest)||analysis.relationship_revision!==relationships.relationship_revision||!equal(relationships.topic_manifest,manifest))throw new Error('Temaer og relasjoner tilhører ulike utgaver.');
  if(relationships.directed!==false||relationships.complete!==true||relationships.dataset_id!==topics.dataset_id||relationships.dataset_revision!==topics.dataset_revision||relationships.node_count!==map.size||relationships.edge_count!==map.size*(map.size-1)/2||!equal([...relationships.node_ids].sort(),[...map.keys()].sort()))throw new Error('Relasjonsoversikten stemmer ikke.');
  const pairs=new Set();for(const e of relationships.edges){const key=[e.source,e.target].sort().join('--');if(!map.has(e.source)||!map.has(e.target)||e.source===e.target||e.id!==key||pairs.has(key)||!Number.isFinite(e.weight)||e.weight<=0||e.weight>1)throw new Error('Ugyldig relasjon.');pairs.add(key);}
  if(pairs.size!==map.size*(map.size-1)/2||analysis.edges.length!==pairs.size||new Set(analysis.edges.map(e=>e.edge_id)).size!==pairs.size||analysis.edges.some(e=>!pairs.has(e.edge_id)||typeof e.reason!=='string'))throw new Error('Ufullstendige relasjoner eller forklaringer.');
  return true;
}
export async function buildContentBundle(root,versionInfo){
  const files=[];
  async function add(path,source){const bytes=await readFile(source);files.push({path,sha256:sha(bytes),data:bytes.toString('base64')});}
  for(const name of DATA_FILES)await add('data/'+name,join(root,'data',name));
  for(const name of (await readdir(join(root,'public/assets/figures'))).sort())if(name.endsWith('.png'))await add('assets/figures/'+name,join(root,'public/assets/figures',name));
  return {...versionInfo,format:1,files};
}
export function unpackBundle(bundle,checkTopic){
  if(bundle.format!==1||!Number.isSafeInteger(bundle.version)||bundle.version<1||!/^\d+\.\d+\.\d+$/.test(bundle.min_app_version)||typeof bundle.notes!=='string'||bundle.notes.length>20000||!Array.isArray(bundle.files)||bundle.files.length>2000)throw new Error('Ugyldig innholdspakke.');
  const files=new Map();let total=0;
  for(const f of bundle.files){if(typeof f.path!=='string'||!(DATA_FILES.some(n=>f.path==='data/'+n)||/^assets\/figures\/[a-zA-Z0-9_-]+\.png$/.test(f.path))||files.has(f.path)||typeof f.data!=='string')throw new Error('Uventet fil i innholdspakken.');const bytes=Buffer.from(f.data,'base64');total+=bytes.length;if(bytes.length>40e6||total>120e6||sha(bytes)!==f.sha256)throw new Error('Innholdspakken er skadet eller for stor.');if(f.path.endsWith('.png')&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Ugyldig bildefil.');files.set(f.path,bytes);}
  if(DATA_FILES.some(n=>!files.has('data/'+n)))throw new Error('Innholdspakken mangler filer.');
  const data=Object.fromEntries(DATA_FILES.map(n=>[n,JSON.parse(files.get('data/'+n).toString('utf8'))]));
  validateDataset(data['topics.json'],data['relationships.json'],data['relationship-analysis.json'],checkTopic);
  const matrix=data['relationship-matrix.json'],relations=data['relationships.json'];
  if(matrix.topics_fingerprint!==relations.topics_fingerprint||matrix.relationship_revision!==relations.relationship_revision||matrix.dataset_revision!==relations.dataset_revision||!equal(matrix.node_ids,relations.node_ids)||matrix.values.length!==relations.node_ids.length||matrix.values.some(r=>r.length!==matrix.values.length))throw new Error('Ugyldig matrise.');
  const idx=new Map(matrix.node_ids.map((id,i)=>[id,i]));for(let i=0;i<matrix.values.length;i++)if(matrix.values[i][i]!==null)throw new Error('Ugyldig matrisediagonal.');for(const e of relations.edges){const i=idx.get(e.source),j=idx.get(e.target);if(matrix.values[i][j]!==e.weight||matrix.values[j][i]!==e.weight)throw new Error('Matrisen stemmer ikke med relasjonene.');}
  for(const t of data['topics.json'].topics)for(const f of t.figures)if(f.src&&!files.has(f.src))throw new Error('En figur mangler.');
  return {files,data};
}
