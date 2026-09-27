import {readFile,writeFile,mkdir,rename,copyFile,readdir,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DATA_FILES,EDITABLE,editable,equal,flat,setPath,mergeFields,validateTopicFactory,unpackBundle,sha} from './content.mjs';

export class StoreError extends Error{constructor(message,status=400){super(message);this.status=status;}}
async function readJSON(path){return JSON.parse(await readFile(path,'utf8'));}
export class Store {
  constructor(options){Object.assign(this,options);this.queue=Promise.resolve();}
  serial(fn){const task=this.queue.then(fn);this.queue=task.catch(()=>{});return task;}
  async init(){
    await mkdir(this.profileDir,{recursive:true});
    this.checkTopic=validateTopicFactory(await readJSON(join(this.root,'data/topics.schema.json')));
    this.bundledInfo=await readJSON(join(this.root,'data/content-version.json'));
    try{this.state=await readJSON(join(this.profileDir,'edits.json'));}catch(e){if(e.code!=='ENOENT')throw new Error('Kunne ikke lese egne notater. Filen er ikke endret.');this.state={version:2,generation:0,topics:{}};}
    if(![1,2].includes(this.state.version)||!this.state.topics||typeof this.state.topics!=='object')throw new Error('Ukjent format for egne notater.');
    if(!this.state.active_content){
      const dir='v'+this.bundledInfo.version+'-'+randomUUID();const target=join(this.profileDir,'.content',dir);await mkdir(join(target,'data'),{recursive:true});
      for(const name of DATA_FILES)await copyFile(join(this.bundleDataDir,name),join(target,'data',name));
      await mkdir(join(target,'assets/figures'),{recursive:true});
      for(const file of await readdir(join(this.root,'public/assets/figures')))if(/^[\w-]+\.png$/.test(file))await copyFile(join(this.root,'public/assets/figures',file),join(target,'assets/figures',file));
      this.state.active_content={directory:dir,...this.bundledInfo};await this.loadBase();
      for(const[id,record]of Object.entries(this.state.topics)){const original=this.base.topics.find(t=>t.id===id);record.base_fields=original&&record.base_content_hash===original.content_hash?editable(original):null;record.base_topic=original;}
      this.state.version=2;this.state.generation||=0;await this.persist(this.state);
    }else await this.loadBase();
    return this;
  }
  async loadBase(){const dir=this.state.active_content.directory;if(!/^v\d+-[a-zA-Z0-9-]+$/.test(dir))throw new Error('Ugyldig innholdsmappe.');this.contentDir=join(this.profileDir,'.content',dir);this.base=await readJSON(join(this.contentDir,'data/topics.json'));this.relationships=await readJSON(join(this.contentDir,'data/relationships.json'));this.analysis=null;this.sources=new Set(this.base.sources.map(s=>s.id));}
  async persist(next){
    const backup=join(this.profileDir,'backups');await mkdir(backup,{recursive:true});
    try{await copyFile(join(this.profileDir,'edits.json'),join(backup,`edits-${Date.now()}-${randomUUID()}.json`));}catch(e){if(e.code!=='ENOENT')throw e;}
    const temp=join(this.profileDir,`edits-${randomUUID()}.tmp`);await writeFile(temp,JSON.stringify(next,null,2)+'\n');await rename(temp,join(this.profileDir,'edits.json'));this.state=next;
    try{const files=(await readdir(backup)).filter(f=>/^edits-.*\.json$/.test(f)).sort();for(const f of files.slice(0,-20))await unlink(join(backup,f));}catch{}
  }
  topic(id){const t=this.base.topics.find(t=>t.id===id),record=this.state.topics[id];if(!t)return null;return {...t,...record?.fields,_edit:{version:record?.version||0,notes:record?.notes||'',updated_at:record?.updated_at,relationships_need_review:!!record&&!equal(editable(t),record.fields),has_changes:!!record&&!equal(editable(t),record.fields)}};}
  dataset(){return {...this.base,content_version:this.state.active_content.version,topics:this.base.topics.map(t=>this.topic(t.id))};}
  status(){return {content_version:this.state.active_content.version,content_notes:this.state.active_content.notes,generation:this.state.generation,edited_topics:Object.keys(this.state.topics).length,archived:Object.entries(this.state.topics).filter(([id])=>!this.base.topics.some(t=>t.id===id)).map(([id,e])=>({id,title:e.fields.title,notes:e.notes,fields:e.fields})),bundled_update:this.bundledInfo.version>this.state.active_content.version?this.bundledInfo:null};}
  async save(id,body){return this.serial(async()=>{
    const current=this.topic(id);if(!current)throw new StoreError('Temaet finnes ikke.',404);
    if(!body||body.version!==current._edit.version||body.base_content_hash!==current.content_hash)throw new StoreError('Temaet er endret siden du åpnet det. Lukk redigeringen og åpne temaet på nytt.',409);
    if(typeof body.notes!=='string'||body.notes.length>30000||!body.fields||typeof body.fields!=='object'||Object.keys(body.fields).some(k=>!EDITABLE.includes(k)))throw new StoreError('Ugyldige felt.');
    const {_edit,...candidate}={...current,...body.fields};this.checkTopic(candidate,this.sources);
    const original=this.base.topics.find(t=>t.id===id),next=structuredClone(this.state);
    next.topics[id]={version:current._edit.version+1,updated_at:new Date().toISOString(),base_content_hash:original.content_hash,base_fields:editable(original),base_topic:original,fields:editable(candidate),notes:body.notes};next.generation++;
    await this.persist(next);return {topic:this.topic(id)};
  });}
  updatePlan(base,choices={}){
    const conflicts=[],records=structuredClone(this.state.topics),removed=[];
    for(const[id,record]of Object.entries(records)){
      const original=base.topics.find(t=>t.id===id);if(!original){removed.push({id,title:record.fields.title});continue;}
      const merged=mergeFields(record.base_fields,record.fields,editable(original),choices,id+'::');
      conflicts.push(...merged.conflicts.map(c=>({...c,topic_id:id,title:original.short_label})));
      Object.assign(record,{fields:merged.fields,base_fields:editable(original),base_topic:original,base_content_hash:original.content_hash,version:record.version+1});
    }
    return {records,conflicts,removed};
  }
  async prepareUpdate(bundle){
    const checked=unpackBundle(bundle,this.checkTopic);
    if(bundle.version<=this.state.active_content.version)throw new StoreError('Du har allerede denne eller en nyere innholdsutgave.');
    const plan=this.updatePlan(checked.data['topics.json']),oldIds=new Set(this.base.topics.map(t=>t.id)),newIds=new Set(checked.data['topics.json'].topics.map(t=>t.id));
    this.pending={id:randomUUID(),type:'content',generation:this.state.generation,bundle,checked};
    return {id:this.pending.id,type:'content',version:bundle.version,notes:bundle.notes,conflicts:plan.conflicts,removed:plan.removed,added:[...newIds].filter(id=>!oldIds.has(id)).length,removed_count:[...oldIds].filter(id=>!newIds.has(id)).length};
  }
  async applyUpdate(id,choices={}){return this.serial(async()=>{
    const p=this.pending;if(!p||p.id!==id||p.type!=='content'||p.generation!==this.state.generation)throw new StoreError('Forhåndsvisningen er utdatert. Sjekk oppdateringen på nytt.',409);
    const plan=this.updatePlan(p.checked.data['topics.json'],choices);if(plan.conflicts.some(c=>!['local','shared'].includes(choices[c.key])))throw new StoreError('Velg hvilken tekst du vil beholde for hver konflikt.');
    const sources=new Set(p.checked.data['topics.json'].sources.map(s=>s.id));for(const[id,r]of Object.entries(plan.records)){const original=p.checked.data['topics.json'].topics.find(t=>t.id===id);if(original)this.checkTopic({...original,...r.fields},sources);}
    const dir='v'+p.bundle.version+'-'+randomUUID(),target=join(this.profileDir,'.content',dir);
    for(const[path,bytes]of p.checked.files){const parts=path.split('/');await mkdir(join(target,...parts.slice(0,-1)),{recursive:true});await writeFile(join(target,...parts),bytes);}
    const next=structuredClone(this.state);next.active_content={directory:dir,format:1,version:p.bundle.version,min_app_version:p.bundle.min_app_version,notes:p.bundle.notes};next.topics=plan.records;next.generation++;
    await this.persist(next);await this.loadBase();this.pending=null;return this.status();
  });}
  exportBackup(){return {format:'sammenheng-personal-backup',version:1,dataset_id:this.base.dataset_id,exported_at:new Date().toISOString(),content_version:this.state.active_content.version,topics:structuredClone(this.state.topics)};}
  importPlan(backup,choices={}){
    if(backup?.format!=='sammenheng-personal-backup'||backup.version!==1||backup.dataset_id!==this.base.dataset_id||!backup.topics||Array.isArray(backup.topics)||Object.keys(backup.topics).length>2000)throw new StoreError('Ugyldig sikkerhetskopi.');
    const records=structuredClone(this.state.topics),conflicts=[];
    for(const[id,entry]of Object.entries(backup.topics)){
      if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||typeof entry.notes!=='string'||entry.notes.length>30000||!entry.fields||Object.keys(entry.fields).some(k=>!EDITABLE.includes(k)))throw new StoreError('Ugyldig temanotat i sikkerhetskopien.');
      const original=this.base.topics.find(t=>t.id===id),existing=records[id],baseTopic=original||entry.base_topic;
      if(!baseTopic||baseTopic.id!==id)throw new StoreError('Sikkerhetskopien mangler grunnlaget for et tema.');
      this.checkTopic({...baseTopic,...entry.fields},new Set((original?this.base.sources:entry.base_topic.source_refs.map(s=>({id:s.source_id}))).map(s=>s.id)));
      const target=existing?.fields||editable(baseTopic),merge=mergeFields(entry.base_fields,entry.fields,target,choices,id+'::');
      conflicts.push(...merge.conflicts.map(c=>({...c,topic_id:id,title:baseTopic.short_label})));
      let notes=entry.notes||existing?.notes||'';
      if(existing?.notes&&entry.notes&&existing.notes!==entry.notes){const key=id+'::_notes';conflicts.push({key,path:'Egne notater',topic_id:id,title:baseTopic.short_label,previous:null,local:entry.notes,shared:existing.notes});if(choices[key]==='shared')notes=existing.notes;}
      records[id]={version:(existing?.version||0)+1,updated_at:new Date().toISOString(),base_content_hash:baseTopic.content_hash,base_fields:editable(baseTopic),base_topic:baseTopic,fields:merge.fields,notes};
    }
    return {records,conflicts};
  }
  prepareImport(backup){const plan=this.importPlan(backup);this.pending={id:randomUUID(),type:'backup',generation:this.state.generation,backup};return {id:this.pending.id,type:'backup',conflicts:plan.conflicts,count:Object.keys(backup.topics).length};}
  async applyImport(id,choices={}){return this.serial(async()=>{const p=this.pending;if(!p||p.id!==id||p.type!=='backup'||p.generation!==this.state.generation)throw new StoreError('Forhåndsvisningen er utdatert. Åpne filen på nytt.',409);const plan=this.importPlan(p.backup,choices);if(plan.conflicts.some(c=>!['local','shared'].includes(choices[c.key])))throw new StoreError('Velg hvilken tekst du vil beholde for hver konflikt.');const next=structuredClone(this.state);next.topics=plan.records;next.generation++;await this.persist(next);this.pending=null;return this.status();});}
  proposal(id,paths,explanation=''){
    const original=this.base.topics.find(t=>t.id===id),current=this.topic(id);if(!original||!current)throw new StoreError('Ukjent tema.');
    const allowed=['title','short_label','content.short_definition','content.explanation','content.key_points'],a=flat(editable(original)),b=flat(editable(current));
    const available=allowed.filter(path=>!equal(a[path],b[path]));
    const selected=paths||available;if(!Array.isArray(selected)||selected.some(p=>!available.includes(p))||new Set(selected).size!==selected.length||typeof explanation!=='string'||explanation.length>4000)throw new StoreError('Ugyldig forslag.');
    return {format:'sammenheng-topic-proposal',version:1,dataset_id:this.base.dataset_id,content_version:this.state.active_content.version,topic_id:id,topic_title:original.title,base_content_hash:original.content_hash,explanation,changes:selected.map(path=>({path,before:a[path],after:b[path]}))};
  }
}
