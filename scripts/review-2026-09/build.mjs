/** Reproduce this editorial release from its recorded Git base. Run from repository root.
 * Does not read or publish the private PDFs. See docs/CONTENT-REVIEW-2026-09.md.
 */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {sha,validateDataset,validateTopicFactory} from '../../lib/content.mjs';
import {additions,updates,ref} from './content.mjs';
import {examples} from './examples.mjs';
import {profiles as addedProfiles,enrich,vocabulary,pairUpdates} from './profiles.mjs';
const base='f98e5eaa6813284593877806e39c475ee7fc4466';
const read=n=>JSON.parse(fs.readFileSync(n,'utf8'));
const original=n=>JSON.parse(execFileSync('git',['show',`${base}:data/${n}.json`],{encoding:'utf8',maxBuffer:50e6,windowsHide:true}));
const save=(n,d)=>fs.writeFileSync(n,JSON.stringify(d,null,2)+'\n');
const dir='scripts/review-2026-09/';
const topics=original('topics'),relations=original('relationships'),matrix=original('relationship-matrix');
const oldEdges=new Map(relations.edges.map(e=>[e.id,e]));
const oldAnalysis=original('relationship-analysis');
const originalTopics=structuredClone(topics.topics);
const inventory=read(dir+'source-inventory.json');
const titles=['Introduksjon til emnet','Endring i organisasjoner','Sentrale ledelsesteorier','Tjenende lederskap','Etikk og ledelse','Mål, strategi og effektivitet','Organisasjonskultur','Motivasjon, ytelse og personlighet','Jobbholdninger og psykososialt arbeidsmiljø','Beslutningsprosesser','Organisasjonens omgivelser','Læring og innovasjon','Organisasjonsstruktur','Psykologi i organisasjon og ledelse: kapittel 9','Psykologi i organisasjon og ledelse: kapittel 4'];
for(const [i,s]of inventory.entries())topics.sources.push({id:`course-2026-${String(i+1).padStart(2,'0')}`,type:i<13?'notes':'chapter',title:titles[i],authors:i<13?['Reidar Hillesund']:['Geir Kaufmann','Astrid Kaufmann','Thorvald Hærem'],year:i<13?2026:2023,edition:i<13?null:'6',filename:s.filename,sha256:s.sha256,access:'user_supplied_private_pdf',notes:['Original PDF er ikke distribuert. Henvisninger viser PDF-sider; for bokutdrag vises også trykte sider.','Kompatibilitetsregel: paragraph_start/end angir PDF-siden som kildeenhet for disse PDF-kildene, ikke et bokavsnitt.',...(i===14?['Filnavnet oppgir 2015/5. utgave/kapittel 4–5, men omslag og innhold viser 2023/6. utgave/kapittel 4, s. 127–165. Kapittel 5 er ikke med.']:[])]});
const byId=new Map(topics.topics.map(t=>[t.id,t]));
for(const [id,refs,explanation,points] of updates){const t=byId.get(id);if(!t)throw Error(id);t.content.explanation=explanation;if(points)t.content.key_points=points.split('|');t.source_refs.push(...refs);t.review.notes.push('Forklaring kontrollert og presisert mot supplerende kursmateriale i september 2026.');}
// Precise supplemental references, without claiming all original material was present in the lectures.
const confirmed={
 'schein-kulturnivaaer':[ref(7,10,15)],artefakter:[ref(7,14),ref(7,22)],organisasjonskultur:[ref(7,10,20)],
 'kulturell-aapenhet':[ref(7,27,30)],'endringsmotstand':[ref(2,23),ref(2,36)],'endringsgjennomfoering':[ref(2,22,26)],
 'hackman-oldham':[ref(15,34,37)],herzberg:[ref(15,30,32)],'indre-ytre-motivasjon':[ref(15,19,23)],
 'beloenningssystemer':[ref(15,23,27)],'organisatorisk-laering':[ref(12,7,8)],'argyris-laeringskretser':[ref(12,13)],
 'nonaka-kunnskap':[ref(12,15,17)],'laerende-organisasjoner':[ref(12,31)],'toyota-hvorfor':[ref(12,32)],
 'omgivelsesusikkerhet':[ref(11,9,14)],'haandtere-tekniske-omgivelser':[ref(11,15)],
 'kommunikativ-rasjonalitet':[ref(10,17)],'beslutningsmodeller':[ref(10,13,20)],'begrenset-rasjonalitet':[ref(10,10)],
 'sentralisering':[ref(13,21)],koordinering:[ref(13,13)],'mintzberg-konfigurasjoner':[ref(13,25)],
 'produksjonssystem':[ref(1,36,45)],'maalhierarki':[ref(6,6,9)],'maalforskyvning':[ref(6,26)],
 'interorganisatoriske-relasjoner':[ref(4,38,41)]
};
for(const[id,refs]of Object.entries(confirmed))byId.get(id).source_refs.push(...refs);
for(const id of ['kompetanseledelse','selznick-verdibasert-ledelse']){byId.get(id).review={status:'source_checked',notes:['Tidligere kort sammendragsseksjon er utdypet med det leverte forelesningsmaterialet. Ingen kontroll mot hele originalverket.']};}
byId.get('hersey-blanchard').review={status:'source_issue',notes:['Forelesningen blander eldre beredskapsmodell (PDF-side 24) og senere utviklingsmodell (PDF-side 25–30). Forklaring og eksempel skiller variantene.']};
byId.get('uplanlagt-endring').title='Perspektiver på uplanlagt endring';
byId.get('organisatorisk-tilknytning').title='Meyer og Allen: organisasjonstilknytning';
byId.get('kompetanseledelse').content.short_definition='Å utvikle og mobilisere kompetanse i samsvar med organisasjonens oppgaver og mål.';
byId.get('selvbestemmelsesteori').content.short_definition='Et perspektiv på motivasjonens kvalitet, internalisering og behovene for autonomi, kompetanse og tilhørighet.';
byId.get('selvbestemmelsesteori').review={status:'source_checked',notes:['Behovsgrunnlaget er utdypet med forelesningen. Dette er en avgrenset kursoversikt, ikke alle delteorier eller reguleringsformer i selvbestemmelsesteori.']};
byId.get('organisatorisk-tilknytning').content.short_definition='Affektive, normative og kalkulerende bånd som påvirker hvorfor medarbeidere blir i organisasjonen.';
byId.get('forventningsteori').content.expressions=[{latex:'M = E \\times I \\times V',explanation:'Pedagogisk treleddsmodell: forventning om at innsats gir prestasjon (E), instrumentalitet mellom prestasjon og utfall (I), og utfallets valens (V). Ikke en presis måling eller en sikker prediksjon av faktisk ytelse.',basis:'source_paraphrase',source_refs:[ref(15,11,13)]}];
byId.get('selznick-verdibasert-ledelse').content.short_definition='Institusjonell ledelse som gir formål, forankrer verdier og beskytter organisasjonens integritet.';
byId.get('uplanlagt-endring').content.short_definition='Forklaringer på endring gjennom utviklingsfaser, seleksjon, interessekamp og tilfeldighet.';
const sources=new Set(topics.sources.map(s=>s.id));
for(const a of additions){
 const t={id:a.id,revision:1,title:a.title,short_label:a.title,kind:'concept',aliases:[],attribution:[],category_id:a.category,parent_topic_id:null,granularity:'topic',tags:a.title.toLowerCase().split(/[: ]+/).filter(x=>x.length>3),content:{short_definition:a.definition,explanation:a.explanation,key_points:a.points,examples:[],expressions:[]},analysis:{basis:'editorial_inference',central_questions:[a.definition],mechanisms:a.points.slice(0,3),level_of_analysis:['individual','group','organization'],writing_uses:[`Bruk ${a.title} til å analysere en konkret situasjon og prøv forklaringen mot alternative perspektiver.`,...a.links.slice(0,2).map(l=>l[2])],limitations_and_tensions:['Et undervisningsperspektiv må brukes med hensyn til situasjon og kildegrunnlag; eksemplet er konstruert og dokumenterer ingen kausal effekt.']},connection_hints:a.links.map(([target,weight,bridge])=>({target_topic_id:target,relationship_type:'related_to',bridge,basis:'editorial_inference',source_refs:a.source})),figures:[],source_refs:a.source,provenance:{content_basis:'source_paraphrase',analysis_basis:'editorial_inference',external_verification:false},review:{status:'source_checked',notes:['Parafrase av levert kursmateriale; originalverkene er ikke separat kontrollert. Eksempel og relasjonsvurderinger er redaksjonelle.']}};
 if(a.id==='tjenende-ledelse')t.aliases=['servant leadership','Greenleaf'];
 if(a.id==='organisatorisk-rettferdighet')t.aliases=['likeverdsteori','equity','Adams','prosedyrerettferdighet','fordelingsrettferdighet','interaksjonsrettferdighet'];
 if(a.id==='kotter-endring')t.kind='framework';
 const named={'tjenende-ledelse':['Robert Greenleaf'],'kotter-endring':['John Kotter'],pliktetikk:['Immanuel Kant'],dydsetikk:['Aristoteles'],diskursetikk:['Jürgen Habermas'],jobbstress:['McGrath'],'psykologisk-kapital':['Fred Luthans'],'organisatorisk-rettferdighet':['J. Stacy Adams'],'mcclelland-behov':['David McClelland'],'thorsrud-jobbkrav':['Einar Thorsrud'],'alderfer-erg':['Clayton Alderfer']};
 t.attribution=(named[a.id]||[]).map(name=>({name,role:a.id==='organisatorisk-rettferdighet'?'Likeverdsteori; den bredere rettferdighetstilnærmingen omfatter flere forskere.':'Teori eller tradisjon omtalt i levert kursmateriale.',basis:'source_explicit'}));
 topics.topics.push(t);byId.set(t.id,t);examples[t.id]=a.example;
}
for(const t of topics.topics){
 if(!examples[t.id])throw Error('Missing authored example: '+t.id);
 t.content.examples.push({title:'Konstruert praksiseksempel',text:examples[t.id],basis:'editorial_example',source_refs:[]});
 if(originalTopics.some(x=>x.id===t.id))t.revision++;
 const{content_hash,...body}=t;t.content_hash=sha(body);
}
topics.dataset_revision++;
topics.editorial_policy.source_scope='Brukerens opprinnelige sammendrag med figurer, 13 leverte forelesningsfiler og to bokutdrag. Supplerende PDF-er er private; kun parafraser og kildemetadata distribueres. Kapittel 5 i filnavnet er ikke levert.';
topics.editorial_policy.analysis_scope+=' Praksiseksemplene er konstruerte redaksjonelle illustrasjoner, ikke hendelser fra kildene eller forskningsfunn. Kildene under noden støtter teorigrunnlaget.';
const profileDoc=read(dir+'semantic-profiles.json');
for(const k of ['concepts','mechanisms','applications'])Object.assign(profileDoc.feature_registries[k],vocabulary[k]);
const pm=new Map(profileDoc.profiles.map(p=>[p.topic_id,p]));
for(const[id,extra]of Object.entries(enrich))for(const k of ['concepts','mechanisms','applications'])Object.assign(pm.get(id)[k],extra[k]);
for(const[id,p]of Object.entries(addedProfiles))pm.set(id,{topic_id:id,...p});
const ids=[...byId.keys()].sort(),dimensions=['concepts','mechanisms','applications'];
if(pm.size!==ids.length||ids.some(id=>!pm.has(id)))throw Error('Incomplete profiles');
const idf={};
for(const k of dimensions){idf[k]={};for(const f of Object.keys(profileDoc.feature_registries[k]))idf[k][f]=1+Math.log((ids.length+1)/(1+ids.filter(id=>pm.get(id)[k][f]).length));for(const p of pm.values())for(const f of Object.keys(p[k]))if(!idf[k][f])throw Error('Unknown feature '+f);}
profileDoc.specificity_weights=idf;profileDoc.profiles=ids.map(id=>pm.get(id));profileDoc.profile_version='1.1.0';
const pair=(a,b)=>[a,b].sort().join('--');
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
const reviews=new Map();
// Preserve direct editorial judgments from the shipped data, rather than restoring stale copies.
for(const e of relations.edges)if(e.assessment_method==='pair_review'){const detail=oldAnalysis.edges.find(x=>x.edge_id===e.id);reviews.set(e.id,{source:e.source,target:e.target,weight:e.weight,reason:detail.reason,basis:'retained_editorial_pair_review'});}
const editedReviews=[];
for(const[a,b,weight,reason]of [...additions.flatMap(a=>a.links.map(l=>[a.id,...l])),...pairUpdates]){
 if(!byId.has(a)||!byId.has(b))throw Error('Unknown review endpoint');
 const [source,target]=[a,b].sort(),id=pair(a,b);reviews.set(id,{source,target,weight,reason,basis:'course_material_editorial_pair_review'});editedReviews.push({id,source,target,before:oldEdges.get(id)?.weight??null,after:weight,reason});
}
const adjacency=new Map(ids.map(id=>[id,[]]));
for(const e of reviews.values())if(e.weight>=.8){adjacency.get(e.source).push({id:e.target,weight:e.weight,reason:e.reason});adjacency.get(e.target).push({id:e.source,weight:e.weight,reason:e.reason});}
for(const a of adjacency.values())a.sort((a,b)=>a.id.localeCompare(b.id,'en'));
const forbidden=new Set(['organisasjon','ledelse','organisasjonskultur','beslutningsprosesser','organisatorisk-laering','formelle-uformelle-trekk','koordinering']);
for(const t of topics.topics)if(t.granularity==='overview'||t.review.status==='needs_source_expansion')forbidden.add(t.id);
const paths=new Map();
for(const start of ids){
 function walk(nodes,weights,steps){const end=nodes.at(-1);if(weights.length>=2){const w=round((weights.length===2?.66:.42)*Math.pow(weights.reduce((a,b)=>a*b,1),1/weights.length));const key=pair(start,end),old=paths.get(key);const normalized=nodes[0]<end?nodes:[...nodes].reverse();if(!old||w>old.weight||(w===old.weight&&normalized.join('|')<old.node_ids.join('|')))paths.set(key,{weight:w,node_ids:normalized,edge_weights:nodes[0]<end?weights:[...weights].reverse(),hops:weights.length});}if(weights.length===3||(nodes.length>1&&forbidden.has(end)))return;for(const next of adjacency.get(end))if(!nodes.includes(next.id))walk([...nodes,next.id],[...weights,next.weight],steps);}
 walk([start],[],[]);
}
function estimate(a,b){const scores={},shared={};for(const k of dimensions){const x=pm.get(a)[k],y=pm.get(b)[k];shared[k]=Object.keys(x).filter(f=>y[f]).sort();const total=o=>Object.entries(o).reduce((s,[f,v])=>s+v*idf[k][f],0);const overlap=shared[k].reduce((s,f)=>s+Math.min(x[f],y[f])*idf[k][f],0);scores[k]=2*overlap/(total(x)+total(y));}return{weight:round(.08+.78*(.35*scores.concepts+.4*scores.mechanisms+.25*scores.applications)**.6),scores,shared};}
const edges=[],details=[],changes=[];
for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
 const source=ids[i],target=ids[j],id=pair(source,target),a=byId.get(source),b=byId.get(target),direct=reviews.get(id),est=estimate(source,target),path=paths.get(id);
 const usePath=!direct&&path&&path.weight>est.weight;
 const weight=direct?.weight??Math.max(est.weight,path?.weight??0);
 const weak=[a,b].some(t=>t.review.status==='needs_source_expansion'),limited=[a,b].some(t=>t.review.status!=='source_checked');
 const method=direct?'pair_review':usePath?'reviewed_path_inference':'semantic_profile_estimate';
 const sharedTerms=dimensions.flatMap(k=>est.shared[k].map(f=>profileDoc.feature_registries[k][f]));
 let reason=direct?.reason??(usePath?`Mulig indirekte skrivevei: ${path.node_ids.map(id=>byId.get(id).short_label).join(' → ')}. Hvert trinn er særskilt vurdert; dette er ikke bevis på direkte likhet eller årsakssammenheng.`:sharedTerms.length?`Redaksjonelt profilestimat. Temaene møtes særlig gjennom ${sharedTerms.slice(0,5).join(', ')}. Forklar forbindelsen i lys av oppgaven; scoren er ikke målt korrelasjon.`:`Perifer, men positiv forbindelse i kursets brede tema. Profilene har ingen kodet overlapp; en faglig overgang krever ekstra begrunnelse og kontekst.`);
 edges.push({id,source,target,weight,confidence:weak?'low':direct&&!limited?'high':'medium',assessment_method:method,relationship_type:oldEdges.get(id)?.relationship_type??'related_to'});
 details.push({edge_id:id,reason,reason_basis:direct?.basis??method,profile_estimate:est.weight,profile_dimensions:Object.fromEntries(Object.entries(est.scores).map(([k,v])=>[k,Math.round(v*10000)/10000])),shared_features:est.shared,cross_category:a.category_id!==b.category_id,source_refs:{source:a.source_refs,target:b.source_refs},evidence_notes:[a,b].filter(t=>t.review.status!=='source_checked').map(t=>({topic_id:t.id,review_status:t.review.status,notes:t.review.notes})),...(usePath?{writing_path:{...path,steps:path.node_ids.slice(0,-1).map((source,i)=>({source,target:path.node_ids[i+1],reason:reviews.get(pair(source,path.node_ids[i+1])).reason}))}}:{})});
 const before=oldEdges.get(id)?.weight??null;if(before!==weight)changes.push({id,before,after:weight,method});
}
const manifest=ids.map(id=>{const t=byId.get(id);return{id,revision:t.revision,content_hash:t.content_hash}}),fingerprint=sha(manifest),reviewList=[...reviews.values()].sort((a,b)=>pair(a.source,a.target).localeCompare(pair(b.source,b.target),'en'));
for(const d of [relations,matrix]){Object.assign(d,{dataset_revision:topics.dataset_revision,relationship_revision:3,rubric_version:'1.1.0',topics_fingerprint:fingerprint,semantic_profiles_fingerprint:sha(profileDoc),pair_reviews_fingerprint:sha(reviewList),node_count:ids.length,edge_count:edges.length,node_ids:ids,topic_manifest:manifest});}
relations.edges=edges.sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id,'en'));
const index=new Map(ids.map((id,i)=>[id,i]));matrix.values=ids.map(()=>ids.map(()=>null));for(const e of edges){const i=index.get(e.source),j=index.get(e.target);matrix.values[i][j]=matrix.values[j][i]=e.weight;}
const analysis={schema_version:'1.0.0',topics_fingerprint:fingerprint,relationship_revision:3,edges:details};
validateDataset(topics,relations,analysis,validateTopicFactory(read('data/topics.schema.json')));
for(const [n,d]of Object.entries({topics,relationships:relations,'relationship-analysis':analysis,'relationship-matrix':matrix}))save('data/'+n+'.json',d);
save('data/content-version.json',{version:3,min_app_version:'1.1.0',notes:`Gjennomgang av 13 forelesninger og to bokutdrag: ${additions.length} nye temaer, presiserte forklaringer, konstruerte praksiseksempler til alle ${ids.length} noder og reviderte relasjonsvekter. Kildehenvisninger skiller PDF-sider og boksider. Lokale endringer beholdes og eventuelle konflikter kan gjennomgås.`});
const rubric=read(dir+'scoring-rubric.json');rubric.version='1.1.0';rubric.pair_reviews.count=reviewList.length;rubric.pair_reviews.selection='Tidligere direkte vurderinger beholdt etter semantisk gjennomgang; supplerende teori gir nye direkte par og presiseringer. Alle øvrige par beregnes på nytt fra reviderte profiler og korte skriveveier.';rubric.limitations.push('2026-09: Vurdert mot leverte forelesninger og bokutdrag, ikke fullstendig ekstern fagkontroll. Eksemplenes felles kontekst inngår ikke i skåringen.');
fs.mkdirSync('docs',{recursive:true});
save('docs/content-review-2026-09.json',{base_commit:base,source_count:inventory.length,original_node_count:originalTopics.length,node_count:ids.length,edge_count:edges.length,added_nodes:additions.map(a=>({id:a.id,title:a.title})),rewritten_nodes:updates.map(x=>x[0]),supplemental_references:Object.keys(confirmed),example_count:ids.length,direct_pair_reviews:editedReviews,preserved_direct_review_count:reviewList.filter(x=>x.basis==='retained_editorial_pair_review').length,existing_weights_changed:changes.filter(x=>x.before!==null).length,new_edges:changes.filter(x=>x.before===null).length,changes});
save(dir+'reviewed-profiles.json',profileDoc);save(dir+'reviewed-pairs.json',{review_version:'1.1.0',reviews:reviewList});save(dir+'reviewed-rubric.json',rubric);
console.log(JSON.stringify({nodes:ids.length,edges:edges.length,examples:ids.length,rewritten:updates.length,changedExistingWeights:changes.filter(x=>x.before!==null).length,newEdges:changes.filter(x=>x.before===null).length,directReviews:reviewList.length},null,2));
