// Content-only category update for the eleven topics introduced in Faginnhold 5.
import {readFile,writeFile} from 'node:fs/promises';
import {sha} from '../../lib/content.mjs';

const read=async name=>JSON.parse(await readFile(`data/${name}.json`,'utf8'));
const write=async(name,value)=>writeFile(`data/${name}.json`,JSON.stringify(value,null,2)+'\n');
const topics=await read('topics'),relationships=await read('relationships');
const analysis=await read('relationship-analysis'),matrix=await read('relationship-matrix');
const version=await read('content-version');
const review=JSON.parse(await readFile('docs/content-review-2026-10.json','utf8'));
if(version.version!==5||topics.topics.length!==168||review.added_nodes.length!==11)throw Error('Expected Faginnhold 5 with exactly eleven chapter 9 additions.');

const categoryId='jobbholdninger-arbeidsmiljo';
if(topics.categories.some(c=>c.id===categoryId))throw Error('Category already exists.');
topics.categories.push({id:categoryId,title:'Jobbholdninger og psykososialt arbeidsmiljø',order:13});
const byId=new Map(topics.topics.map(t=>[t.id,t]));
for(const{id}of review.added_nodes){
 const topic=byId.get(id);
 if(!topic)throw Error('Missing topic '+id);
 topic.category_id=categoryId;
 topic.revision++;
 const{content_hash,...body}=topic;topic.content_hash=sha(body);
}
topics.dataset_revision++;
const manifest=topics.topics.map(({id,revision,content_hash})=>({id,revision,content_hash})).sort((a,b)=>a.id<b.id?-1:1);
const fingerprint=sha(manifest);
for(const data of [relationships,matrix]){
 data.dataset_revision=topics.dataset_revision;
 data.topic_manifest=manifest;
 data.topics_fingerprint=fingerprint;
}
analysis.topics_fingerprint=fingerprint;
for(const edge of analysis.edges){
 const[source,target]=edge.edge_id.split('--');
 if(!byId.has(source)||!byId.has(target))throw Error('Unknown edge '+edge.edge_id);
 edge.cross_category=byId.get(source).category_id!==byId.get(target).category_id;
}
await write('topics',topics);
await write('relationships',relationships);
await write('relationship-analysis',analysis);
await write('relationship-matrix',matrix);
await write('content-version',{...version,version:6,notes:'De 11 nye temaene fra Kaufmann, Kaufmann og Hærem kapittel 9 er samlet i fagområdet «Jobbholdninger og psykososialt arbeidsmiljø». Forklaringer, kilder og relasjonsvekter er uendret. Egne endringer og notater beholdes.'});
console.log(`Faginnhold 6: ${review.added_nodes.length} topics grouped in one category; ${relationships.edges.length} edge weights retained.`);
