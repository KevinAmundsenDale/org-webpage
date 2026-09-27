import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile,cp,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {Store} from '../lib/store.mjs';
import {sha,editable,mergeFields,buildContentBundle,unpackBundle,validateTopicFactory} from '../lib/content.mjs';
import {findContent,fetchContent,encodeBundle} from '../lib/github.mjs';
const root=resolve('.'),schema=JSON.parse(await readFile('data/topics.schema.json','utf8'));
const contentVersion=JSON.parse(await readFile('data/content-version.json','utf8'));
const check=validateTopicFactory(schema),bundle=await buildContentBundle(root,{...contentVersion,notes:'Test'});
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'sammenheng-test-'));try{const store=await new Store({root,profileDir:dir,bundleDataDir:join(root,'data')}).init();await fn(store,dir);}finally{assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep+'sammenheng-test-'));await rm(dir,{recursive:true,force:true});}}
function nextBundle(mutator,version=bundle.version+1){const b=structuredClone(bundle);b.version=version;const json=name=>JSON.parse(Buffer.from(b.files.find(f=>f.path==='data/'+name).data,'base64'));const topics=json('topics.json'),relations=json('relationships.json'),analysis=json('relationship-analysis.json'),matrix=json('relationship-matrix.json');mutator(topics,relations,analysis,matrix);
  for(const t of topics.topics){const{content_hash,...body}=t;t.content_hash=sha(body);}
  const manifest=topics.topics.map(t=>({id:t.id,revision:t.revision,content_hash:t.content_hash})).sort((a,b)=>a.id<b.id?-1:1);for(const d of [relations,matrix]){d.topic_manifest=manifest;d.topics_fingerprint=sha(manifest);}analysis.topics_fingerprint=sha(manifest);
  for(const[name,v]of [['topics.json',topics],['relationships.json',relations],['relationship-analysis.json',analysis],['relationship-matrix.json',matrix]]){const file=b.files.find(f=>f.path==='data/'+name),bytes=Buffer.from(JSON.stringify(v));file.data=bytes.toString('base64');file.sha256=sha(bytes);}return b;
}
async function save(store,id,fields,notes='private'){const t=store.topic(id);return store.save(id,{version:t._edit.version,base_content_hash:t.content_hash,fields,notes});}
test('three-way merge updates untouched nested fields and detects only genuine conflicts',()=>{
  const old={title:'A',content:{explanation:'old',key_points:['a']}},mine={title:'B',content:{explanation:'old',key_points:['a']}},shared={title:'A',content:{explanation:'new',key_points:['a']}};
  assert.deepEqual(mergeFields(old,mine,shared).fields,{title:'B',content:{explanation:'new',key_points:['a']}});
  shared.title='C';const plan=mergeFields(old,mine,shared);assert.equal(plan.conflicts.length,1);assert.equal(mergeFields(old,mine,shared,{title:'shared'}).fields.title,'C');
});
test('complete bundle validates and rejects corrupt, traversing and mismatched data',()=>{
  unpackBundle(bundle,check);const corrupt=structuredClone(bundle);corrupt.files[0].sha256='0'.repeat(64);assert.throws(()=>unpackBundle(corrupt,check));
  const traversal=structuredClone(bundle);traversal.files[0].path='../evil';assert.throws(()=>unpackBundle(traversal,check));
  assert.throws(()=>unpackBundle(nextBundle((_t,r)=>r.edges.pop()),check));
  assert.throws(()=>unpackBundle(nextBundle((_t,_r,_a,m)=>m.values[0][1]=.99),check));
});
test('content update keeps private edits and notes, resolves conflicts and survives restart',()=>fixture(async(store,dir)=>{
  await save(store,'organisasjon',{title:'My title'});
  const b=nextBundle(t=>{const n=t.topics.find(t=>t.id==='organisasjon');n.content.explanation='Shared correction';n.title='New shared title';n.revision++;});
  const plan=await store.prepareUpdate(b);assert.equal(plan.conflicts.length,1);assert.equal(plan.conflicts[0].path,'title');
  await assert.rejects(store.applyUpdate(plan.id,{}));
  await store.applyUpdate(plan.id,{[plan.conflicts[0].key]:'local'});
  assert.equal(store.topic('organisasjon').title,'My title');assert.equal(store.topic('organisasjon').content.explanation,'Shared correction');assert.equal(store.topic('organisasjon')._edit.notes,'private');
  const restarted=await new Store({root,profileDir:dir,bundleDataDir:join(root,'data')}).init();assert.equal(restarted.status().content_version,b.version);assert.equal(restarted.topic('organisasjon').title,'My title');
  const next=await restarted.prepareUpdate(nextBundle(t=>{t.topics.find(t=>t.id==='organisasjon').title='Third title';},b.version+1));await save(restarted,'produksjonssystem',{title:'Concurrent edit'});await assert.rejects(restarted.applyUpdate(next.id,{}),/utdatert/);
}));
test('choosing shared text removes the private override; notes still never enter proposals',()=>fixture(async store=>{
  await save(store,'organisasjon',{title:'Private title'},'SECRET-NOTE');
  const proposal=store.proposal('organisasjon');assert.equal(proposal.changes.length,1);assert.equal(JSON.stringify(proposal).includes('SECRET-NOTE'),false);
  assert.throws(()=>store.proposal('organisasjon',['notes']));
  const plan=await store.prepareUpdate(nextBundle(t=>{t.topics.find(t=>t.id==='organisasjon').title='Official title';}));await store.applyUpdate(plan.id,{[plan.conflicts[0].key]:'shared'});
  assert.equal(store.topic('organisasjon').title,'Official title');assert.equal(store.topic('organisasjon')._edit.has_changes,false);assert.equal(store.topic('organisasjon')._edit.notes,'SECRET-NOTE');
}));
test('backup import previews conflicts and restores notes without silently overwriting existing work',()=>fixture(async store=>{
  await save(store,'organisasjon',{title:'First title'},'First notes');const backup=store.exportBackup();
  await save(store,'organisasjon',{title:'Later title'},'Later notes');const plan=store.prepareImport(backup);assert.equal(plan.conflicts.length,2);
  await assert.rejects(store.applyImport(plan.id,{}));await store.applyImport(plan.id,Object.fromEntries(plan.conflicts.map(c=>[c.key,'local'])));
  assert.equal(store.topic('organisasjon').title,'First title');assert.equal(store.topic('organisasjon')._edit.notes,'First notes');
}));
test('GitHub update path chooses content releases and verifies download integrity',async()=>{
  const {bytes,manifest}=encodeBundle(nextBundle(()=>{}));const fetcher=async url=>{
    if(url.includes('/releases?'))return new Response(JSON.stringify([{tag_name:'v9.0.0',draft:false,prerelease:false},{tag_name:`content-v${manifest.version}`,draft:false,prerelease:false}]));
    if(url.endsWith('content-manifest.json'))return new Response(JSON.stringify(manifest));return new Response(bytes);
  };
  const update=await findContent('owner/repo',fetcher);assert.equal(update.version,bundle.version+1);assert.equal((await fetchContent(update,fetcher)).version,bundle.version+1);
  await assert.rejects(fetchContent({...update,sha256:'0'.repeat(64)},fetcher));
});
test('removed topics retain private text and notes in an accessible archive',()=>fixture(async store=>{
  await save(store,'organisasjon',{title:'Archived private title'},'Archived private notes');
  const next=nextBundle((t,r,a,m)=>{
    t.topics=t.topics.filter(n=>n.id!=='organisasjon');for(const n of t.topics){n.connection_hints=n.connection_hints.filter(h=>h.target_topic_id!=='organisasjon');if(n.parent_topic_id==='organisasjon')n.parent_topic_id=null;}
    r.edges=r.edges.filter(e=>e.source!=='organisasjon'&&e.target!=='organisasjon');r.node_ids=r.node_ids.filter(id=>id!=='organisasjon');r.node_count--;r.edge_count=r.edges.length;a.edges=a.edges.filter(e=>r.edges.some(x=>x.id===e.edge_id));
    const index=m.node_ids.indexOf('organisasjon');m.node_ids.splice(index,1);m.values.splice(index,1);for(const row of m.values)row.splice(index,1);m.node_count--;m.edge_count=r.edge_count;
  });
  const plan=await store.prepareUpdate(next);assert.equal(plan.removed.length,1);await store.applyUpdate(plan.id,{});
  assert.equal(store.topic('organisasjon'),null);assert.equal(store.status().archived[0].notes,'Archived private notes');assert.equal(store.exportBackup().topics.organisasjon.fields.title,'Archived private title');
}));
test('legacy edits migrate without freezing untouched official fields',()=>fixture(async(store,dir)=>{
  const t=store.base.topics[0],fields=editable(t);fields.title='Legacy edit';
  await writeFile(join(dir,'edits.json'),JSON.stringify({version:1,topics:{[t.id]:{version:2,updated_at:'2026-09-25',base_content_hash:t.content_hash,fields,notes:'Legacy note'}}}));
  const migrated=await new Store({root,profileDir:dir,bundleDataDir:join(root,'data')}).init();assert.equal(migrated.state.version,2);
  const plan=await migrated.prepareUpdate(nextBundle(data=>data.topics.find(n=>n.id===t.id).content.explanation='New explanation'));assert.equal(plan.conflicts.length,0);await migrated.applyUpdate(plan.id,{});assert.equal(migrated.topic(t.id).title,'Legacy edit');assert.equal(migrated.topic(t.id).content.explanation,'New explanation');
}));
test('maintainer proposal applies only after explicit weight review and updates hashes consistently',()=>fixture(async(store,dir)=>{
  await save(store,'organisasjon',{title:'Accepted suggestion'});const proposal=store.proposal('organisasjon');const file=join(dir,'proposal.json');await writeFile(file,JSON.stringify(proposal));await mkdir(join(dir,'data'));for(const name of ['topics.json','relationships.json','relationship-analysis.json','relationship-matrix.json','topics.schema.json'])await cp(join(root,'data',name),join(dir,'data',name));
  const command=join(root,'scripts/apply-proposal.mjs');
  const denied=spawnSync(process.execPath,[command,file,'--apply'],{cwd:dir,encoding:'utf8'});assert.notEqual(denied.status,0);
  const accepted=spawnSync(process.execPath,[command,file,'--apply','--weights-reviewed'],{cwd:dir,encoding:'utf8'});assert.equal(accepted.status,0,accepted.stderr);const t=JSON.parse(await readFile(join(dir,'data/topics.json'))).topics.find(t=>t.id==='organisasjon');assert.equal(t.title,'Accepted suggestion');const{content_hash,...body}=t;assert.equal(sha(body),content_hash);
}));
