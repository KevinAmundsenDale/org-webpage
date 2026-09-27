import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {sha,flat,editable,equal,setPath,validateTopicFactory,validateDataset} from '../lib/content.mjs';
const file=process.argv[2];
if(!file){console.error('Usage: npm run proposal:apply -- proposal.json [--apply --weights-reviewed]');process.exit(1);}
const proposal=JSON.parse(await readFile(file,'utf8')),topics=JSON.parse(await readFile('data/topics.json','utf8')),relations=JSON.parse(await readFile('data/relationships.json','utf8')),analysis=JSON.parse(await readFile('data/relationship-analysis.json','utf8')),matrix=JSON.parse(await readFile('data/relationship-matrix.json','utf8'));
const original=topics.topics.find(t=>t.id===proposal.topic_id);
if(proposal.format!=='sammenheng-topic-proposal'||proposal.version!==1||!original||proposal.dataset_id!==topics.dataset_id||proposal.base_content_hash!==original.content_hash)throw new Error('Unknown proposal or base content has changed. Review against current content manually.');
const candidate=structuredClone(original),values=flat(editable(original)),allowed=['title','short_label','content.short_definition','content.explanation','content.key_points'];
if(!Array.isArray(proposal.changes)||!proposal.changes.length||new Set(proposal.changes.map(c=>c.path)).size!==proposal.changes.length)throw new Error('Invalid changes');
for(const change of proposal.changes){if(!allowed.includes(change.path)||!equal(change.before,values[change.path]))throw new Error('Invalid or stale field: '+change.path);setPath(candidate,change.path,change.after);console.log(change.path+':\n  '+JSON.stringify(change.before)+'\n→ '+JSON.stringify(change.after));}
const check=validateTopicFactory(JSON.parse(await readFile('data/topics.schema.json','utf8')));check(candidate,new Set(topics.sources.map(s=>s.id)));
if(!process.argv.includes('--apply')){console.log('Preview only. No files changed. Review the proposal and related weights before using --apply --weights-reviewed.');process.exit(0);}
if(!process.argv.includes('--weights-reviewed'))throw new Error('Explicit --weights-reviewed is required: confirm that existing weights remain valid, or revise weights separately before applying.');
candidate.revision++;const {content_hash,...body}=candidate;candidate.content_hash=sha(body);topics.topics[topics.topics.findIndex(t=>t.id===candidate.id)]=candidate;topics.dataset_revision++;
const manifest=topics.topics.map(t=>({id:t.id,revision:t.revision,content_hash:t.content_hash})).sort((a,b)=>a.id<b.id?-1:1),fingerprint=sha(manifest);
for(const d of [relations,matrix]){d.dataset_revision=topics.dataset_revision;d.topic_manifest=manifest;d.topics_fingerprint=fingerprint;d.relationship_revision++;}analysis.topics_fingerprint=fingerprint;analysis.relationship_revision=relations.relationship_revision;
validateDataset(topics,relations,analysis,check);
const backup=join('.maintainer-backups',String(Date.now()));await mkdir(backup,{recursive:true});
for(const[name,value]of [['topics.json',topics],['relationships.json',relations],['relationship-analysis.json',analysis],['relationship-matrix.json',matrix]]){await copyFile(join('data',name),join(backup,name));await writeFile(join('data',name),JSON.stringify(value,null,2)+'\n');}
console.log('Applied to local canonical files. Bump data/content-version.json, run npm run content:build, review git diff, then publish a content release.');
