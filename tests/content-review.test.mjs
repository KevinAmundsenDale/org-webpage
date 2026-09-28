import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {sha} from '../lib/content.mjs';
const json=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const data=await json('data/topics.json'),relations=await json('data/relationships.json');
const inventory=await json('scripts/review-2026-09/source-inventory.json');

test('complete topic document follows schema, examples are original and references resolve to supplied PDF pages',async()=>{
 const validate=new Ajv({strict:false,allErrors:true}).compile(await json('data/topics.schema.json'));
 assert.ok(validate(data),JSON.stringify(validate.errors));
 const seen=new Set();
 for(const t of data.topics){
  const example=t.content.examples.find(e=>e.title==='Konstruert praksiseksempel');
  assert.ok(example,`Missing case: ${t.id}`);assert.equal(example.basis,'editorial_example');
  assert.ok(example.text.split(/\s+/).length>=70,`Too little case detail: ${t.id}`);
  assert.ok(!seen.has(example.text),`Repeated case: ${t.id}`);seen.add(example.text);
  for(const r of t.source_refs.filter(r=>r.source_id.startsWith('course-2026-'))){
   const number=Number(r.source_id.slice(-2)),source=inventory[number-1];
   assert.ok(source&&r.paragraph_start>=1&&r.paragraph_end>=r.paragraph_start&&r.paragraph_end<=source.pages,`${t.id}: invalid PDF locator`);
   const offset=number===14?313:number===15?125:0;
   assert.deepEqual(r.pages,Array.from({length:r.paragraph_end-r.paragraph_start+1},(_,i)=>r.paragraph_start+i+offset));
  }
 }
 const schein=data.topics.find(t=>t.id==='schein-kulturnivaaer').content.examples.at(-1).text;
 for(const part of ['artefakter','verdi','norm','grunnleggende antakelse'])assert.ok(schein.toLowerCase().includes(part));
 const servant=data.topics.find(t=>t.id==='tjenende-ledelse').content.examples.at(-1).text;
 for(const part of ['myndiggjøring','ydmykhet','autentisitet','aksept','retning','forvalteransvar'])assert.ok(servant.includes(part));
 assert.equal(data.sources.find(s=>s.id==='course-2026-15').year,2023);
 assert.match(data.sources.find(s=>s.id==='course-2026-15').notes.join(' '),/Kapittel 5 er ikke med/);
});

test('reviewed scoring inputs match distributed fingerprints and every new topic has direct writing bridges',async()=>{
 const profiles=await json('scripts/review-2026-09/reviewed-profiles.json'),pairs=await json('scripts/review-2026-09/reviewed-pairs.json'),report=await json('docs/content-review-2026-09.json');
 assert.equal(sha(profiles),relations.semantic_profiles_fingerprint);
 assert.equal(sha(pairs.reviews),relations.pair_reviews_fingerprint);
 const byPair=new Map(relations.edges.map(e=>[e.id,e]));
 for(const p of pairs.reviews)assert.equal(byPair.get([p.source,p.target].sort().join('--')).weight,p.weight);
 for(const t of report.added_nodes){const links=relations.edges.filter(e=>(e.source===t.id||e.target===t.id)&&e.assessment_method==='pair_review'&&e.weight>=.65);assert.ok(links.length>=2,`Missing direct bridges: ${t.id}`);}
 assert.equal(relations.node_count,data.topics.length);assert.equal(relations.edge_count,data.topics.length*(data.topics.length-1)/2);
});
