// Extend the current published dataset with the remaining distinct themes in
// Kaufmann, Kaufmann and Hærem (2023), chapter 9. Run once from repo root.
import fs from 'node:fs';
import {sha,validateDataset,validateTopicFactory} from '../../lib/content.mjs';
import {nodes} from './chapter9.mjs';
const read=name=>JSON.parse(fs.readFileSync(name,'utf8'));
const save=(name,data)=>fs.writeFileSync(name,JSON.stringify(data,null,2)+'\n');
const topics=read('data/topics.json'),relations=read('data/relationships.json');
const matrix=read('data/relationship-matrix.json'),oldAnalysis=read('data/relationship-analysis.json');
const profileDoc=read('scripts/review-2026-09/reviewed-profiles.json');
const pairsDoc=read('scripts/review-2026-09/reviewed-pairs.json');
const rubric=read('scripts/review-2026-09/reviewed-rubric.json');
const version=read('data/content-version.json');
if(version.version!==4||topics.topics.length!==157)throw Error('Expected current content v4 with 157 topics.');
const byId=new Map(topics.topics.map(t=>[t.id,t]));
const idOf=(a,b)=>[a,b].sort().join('--');
const oldEdges=new Map(relations.edges.map(e=>[e.id,e]));
const oldDetail=new Map(oldAnalysis.edges.map(e=>[e.edge_id,e]));
const profiles=new Map(profileDoc.profiles.map(p=>[p.topic_id,p]));
const reviews=new Map(pairsDoc.reviews.map(p=>[idOf(p.source,p.target),p]));
const addedReviews=[];
for(const n of nodes){
 if(byId.has(n.id))throw Error('Duplicate topic '+n.id);
 if(!['motivasjon','makt'].includes(n.category))throw Error('Unexpected category '+n.category);
 const links=n.links.map(([id,weight,reason])=>{
  if(!byId.has(id)&&!nodes.some(other=>other.id===id))throw Error('Unknown link '+id);
  const[source,target]=[n.id,id].sort(),pairId=idOf(source,target);
  const p={source,target,weight,reason,basis:'chapter9_editorial_pair_review'};
  if(reviews.has(pairId)){
   const prior=reviews.get(pairId);
   if(prior.basis!=='chapter9_editorial_pair_review'||Math.abs(prior.weight-weight)>.03)throw Error('Inconsistent reviewed edge '+pairId);
  }else{reviews.set(pairId,p);addedReviews.push(p);}
  return{target_topic_id:id,relationship_type:'related_to',bridge:reason,basis:'editorial_inference',source_refs:n.pages};
 });
 const shortLabels={'stereotypier-fordommer-diskriminering':'Stereotypier og fordommer','karasek-krav-kontroll':'Krav–kontroll','konstruktiv-destruktiv-konflikt':'Konflikttyper','mobbing-trakassering':'Mobbing/trakassering','progresjonsprinsippet':'Progresjonsprinsippet'};
 const t={id:n.id,revision:1,title:n.title,short_label:shortLabels[n.id]||n.title,kind:'concept',aliases:n.aliases||[],attribution:(n.attribution||[]).map(name=>({name,role:'Modell eller perspektiv omtalt i det leverte bokutdraget.',basis:'source_explicit'})),category_id:n.category,parent_topic_id:null,granularity:'topic',tags:n.id.split('-').filter(w=>w.length>3),content:{short_definition:n.definition,explanation:n.explanation,key_points:n.points,examples:[{title:'Konstruert praksiseksempel',text:n.example,basis:'editorial_example',source_refs:[]}],expressions:[]},analysis:{basis:'editorial_inference',central_questions:[`Hvordan kan ${n.title.toLowerCase()} brukes til å forstå en konkret organisasjonssituasjon?`],mechanisms:n.points.slice(0,3),level_of_analysis:['individual','group','organization'],writing_uses:[`Bruk ${n.title} til å undersøke et konkret forløp og drøft alternative forklaringer.`,...n.links.slice(0,2).map(l=>l[2])],limitations_and_tensions:['Pensumutdraget gir en avgrenset fremstilling. Bruk ikke figuren eller eksemplet som bevis for en bestemt årsakssammenheng.']},connection_hints:links,figures:[],source_refs:n.pages,provenance:{content_basis:'source_paraphrase',analysis_basis:'editorial_inference',external_verification:false},review:{status:'source_checked',notes:['Parafrase av brukerlevert bokutdrag, kapittel 9, trykte sider angitt under Kilder. Praksiseksemplet og relasjonsvektene er redaksjonelle.']}};
 const{content_hash,...body}=t;t.content_hash=sha(body);topics.topics.push(t);byId.set(t.id,t);
 profiles.set(t.id,{topic_id:t.id,...n.profile});
}
const ids=[...byId.keys()].sort(),dimensions=['concepts','mechanisms','applications'];
for(const id of ids)if(!profiles.has(id))throw Error('Missing semantic profile '+id);
for(const kind of dimensions)for(const p of profiles.values())for(const feature of Object.keys(p[kind]))if(!profileDoc.feature_registries[kind][feature])throw Error('Unregistered feature '+kind+':'+feature);
const specificity={};
for(const kind of dimensions){
 specificity[kind]={};
 for(const feature of Object.keys(profileDoc.feature_registries[kind]))specificity[kind][feature]=1+Math.log((ids.length+1)/(1+ids.filter(id=>profiles.get(id)[kind][feature]).length));
}
profileDoc.profile_version='1.2.0';profileDoc.profiles=ids.map(id=>profiles.get(id));profileDoc.specificity_weights=specificity;
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
function estimate(a,b){
 const scores={},shared={};
 for(const kind of dimensions){
  const x=profiles.get(a)[kind],y=profiles.get(b)[kind],idf=specificity[kind];
  shared[kind]=Object.keys(x).filter(feature=>y[feature]).sort();
  const total=o=>Object.entries(o).reduce((sum,[feature,strength])=>sum+strength*idf[feature],0);
  const overlap=shared[kind].reduce((sum,feature)=>sum+Math.min(x[feature],y[feature])*idf[feature],0);
  scores[kind]=2*overlap/(total(x)+total(y));
 }
 return{weight:round(.08+.78*(.35*scores.concepts+.4*scores.mechanisms+.25*scores.applications)**.6),scores,shared};
}
const adjacency=new Map(ids.map(id=>[id,[]]));
for(const p of reviews.values())if(p.weight>=.8){adjacency.get(p.source).push({id:p.target,weight:p.weight});adjacency.get(p.target).push({id:p.source,weight:p.weight});}
for(const entries of adjacency.values())entries.sort((a,b)=>a.id.localeCompare(b.id,'en'));
const forbidden=new Set(['organisasjon','ledelse','organisasjonskultur','beslutningsprosesser','organisatorisk-laering','formelle-uformelle-trekk','koordinering']);
for(const t of topics.topics)if(t.granularity==='overview'||t.review.status==='needs_source_expansion')forbidden.add(t.id);
const paths=new Map();
for(const start of ids){
 function walk(route,weights){
  const end=route.at(-1);
  if(weights.length>=2){
   const weight=round((weights.length===2?.66:.42)*Math.pow(weights.reduce((a,b)=>a*b,1),1/weights.length));
   const key=idOf(start,end),prior=paths.get(key),normalized=start<end?route:[...route].reverse();
   if(!prior||weight>prior.weight||(weight===prior.weight&&normalized.join('|')<prior.node_ids.join('|')))paths.set(key,{weight,node_ids:normalized,edge_weights:start<end?weights:[...weights].reverse(),hops:weights.length});
  }
  if(weights.length===3||(route.length>1&&forbidden.has(end)))return;
  for(const next of adjacency.get(end))if(!route.includes(next.id))walk([...route,next.id],[...weights,next.weight]);
 }
 walk([start],[]);
}
const edges=[],details=[],changedOld=[];
for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
 const source=ids[i],target=ids[j],id=idOf(source,target),a=byId.get(source),b=byId.get(target);
 const direct=reviews.get(id),est=estimate(source,target),path=paths.get(id);
 const usePath=!direct&&path&&path.weight>est.weight;
 const method=direct?'pair_review':usePath?'mediated_path':'semantic_profile';
 const weight=direct?.weight??Math.max(est.weight,path?.weight??0);
 const limited=[a,b].some(t=>t.review.status!=='source_checked');
 const weak=[a,b].some(t=>t.review.status==='needs_source_expansion');
 const sharedTerms=dimensions.flatMap(k=>est.shared[k].map(f=>profileDoc.feature_registries[k][f]));
 const reason=direct?.reason??(usePath?`Mulig indirekte skrivevei: ${path.node_ids.map(nodeId=>byId.get(nodeId).short_label).join(' → ')}. Hvert trinn er særskilt vurdert; dette er ikke bevis på direkte likhet eller årsakssammenheng.`:sharedTerms.length?`Redaksjonelt profilestimat. Temaene møtes særlig gjennom ${sharedTerms.slice(0,5).join(', ')}. Forklar forbindelsen i lys av oppgaven; scoren er ikke målt korrelasjon.`:'Perifer, men positiv forbindelse i kursets brede tema. Profilene har ingen kodet overlapp; en faglig overgang krever ekstra begrunnelse og kontekst.');
 edges.push({id,source,target,weight,confidence:weak?'low':direct&&!limited?'high':'medium',assessment_method:method,relationship_type:oldEdges.get(id)?.relationship_type??'related_to'});
 details.push({edge_id:id,reason,reason_basis:direct?.basis??method,profile_estimate:est.weight,profile_dimensions:Object.fromEntries(Object.entries(est.scores).map(([k,v])=>[k,Math.round(v*10000)/10000])),shared_features:est.shared,cross_category:a.category_id!==b.category_id,source_refs:{source:a.source_refs,target:b.source_refs},evidence_notes:[a,b].filter(t=>t.review.status!=='source_checked').map(t=>({topic_id:t.id,review_status:t.review.status,notes:t.review.notes})),...(usePath?{writing_path:{...path,steps:path.node_ids.slice(0,-1).map((nodeId,k)=>({source:nodeId,target:path.node_ids[k+1],reason:reviews.get(idOf(nodeId,path.node_ids[k+1])).reason}))}}:{})});
 if(oldEdges.has(id)&&oldEdges.get(id).weight!==weight)changedOld.push(id);
}
topics.dataset_revision++;
topics.editorial_policy.source_scope+=' Kapittel 9 er gjennomgått på nytt i oktober 2026; nye temaer om arbeidsmiljø og konflikt er lagt til som parafraser.';
const manifest=ids.map(id=>{const t=byId.get(id);return{id,revision:t.revision,content_hash:t.content_hash}}),fingerprint=sha(manifest);
const reviewed=[...reviews.values()].sort((a,b)=>idOf(a.source,a.target).localeCompare(idOf(b.source,b.target),'en'));
for(const d of [relations,matrix])Object.assign(d,{dataset_revision:topics.dataset_revision,relationship_revision:4,rubric_version:'1.2.0',topics_fingerprint:fingerprint,semantic_profiles_fingerprint:sha(profileDoc),pair_reviews_fingerprint:sha(reviewed),node_count:ids.length,edge_count:edges.length,node_ids:ids,topic_manifest:manifest});
relations.edges=edges.sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id,'en'));
const index=new Map(ids.map((id,i)=>[id,i]));matrix.values=ids.map(()=>ids.map(()=>null));
for(const e of edges){const i=index.get(e.source),j=index.get(e.target);matrix.values[i][j]=matrix.values[j][i]=e.weight;}
const analysis={schema_version:'1.0.0',topics_fingerprint:fingerprint,relationship_revision:4,edges:details};
const checkTopic=validateTopicFactory(read('data/topics.schema.json'));
for(const t of topics.topics)try{checkTopic(t,new Set(topics.sources.map(s=>s.id)));}catch(error){throw Error(`${t.id}: ${error.message}`);}
validateDataset(topics,relations,analysis,validateTopicFactory(read('data/topics.schema.json')));
save('data/topics.json',topics);save('data/relationships.json',relations);save('data/relationship-analysis.json',analysis);save('data/relationship-matrix.json',matrix);
save('data/content-version.json',{version:5,min_app_version:'1.1.0',notes:`Kapittel 9 hos Kaufmann, Kaufmann og Hærem (2023) er utdypet med ${nodes.length} nye temaer, praksiseksempler og kildehenvisninger. ${edges.length} forbindelser er vurdert eller beregnet i et fullstendig kart, med ${addedReviews.length} nye direkte vurderinger. Lokale endringer beholdes; eventuelle konflikter kan gjennomgås.`});
save('scripts/review-2026-09/reviewed-profiles.json',profileDoc);
save('scripts/review-2026-09/reviewed-pairs.json',{review_version:'1.2.0',reviews:reviewed});
rubric.version='1.2.0';rubric.pair_reviews.count=reviewed.length;rubric.limitations.push('2026-10: Nye par fra Kaufmann kapittel 9 er faglige og redaksjonelle vurderinger; ureviewerte par er fortsatt estimater.');
save('scripts/review-2026-09/reviewed-rubric.json',rubric);
save('docs/content-review-2026-10.json',{source:'course-2026-14',printed_pages:'315–350',added_nodes:nodes.map(n=>({id:n.id,title:n.title,pages:n.pages.flatMap(r=>r.pages)})),new_direct_pair_reviews:addedReviews.length,existing_weights_changed:changedOld.length,edges:edges.length,notes:['Kilde-PDF distribueres ikke; nye tekster og eksempler er redaksjonelle parafraser.','Alle ulike par har positiv symmetrisk vekt. Direkte parvurderinger er skilt fra profil- og stiestimater.','Eksisterende direkte vurderinger er beholdt. Avledede scorer er beregnet på nytt for hele kartet.']});
console.log(JSON.stringify({nodes:ids.length,edges:edges.length,newNodes:nodes.length,directReviewsAdded:addedReviews.length,existingWeightsChanged:changedOld.length},null,2));
