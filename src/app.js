import './style.css';
import {Graph,PALETTE} from './graph.js';
import {filterGraph,searchTopics} from './graph-data.js';
import {setupSync} from './sync-ui.js';

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={topics:[],edges:[],threshold:.88,focus:null,selected:null,editing:false,dirty:false,detailId:null};
let dataset,graph,searchResults=[],searchIndex=-1,toastTimer,filterTimer;
const sync=setupSync({canLeave:()=>{const editing=state.editing;if(!canLeave())return false;if(editing&&state.detailId)renderDetail(state.detailId);return true;},reload:reloadData,toast});
const category=id=>dataset.categories.find(c=>c.id===id);
const color=id=>PALETTE[dataset.categories.findIndex(c=>c.id===id)%PALETTE.length];
const topic=id=>state.topics.find(t=>t.id===id);
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
async function api(path,options){const response=await fetch(path,options);const value=await response.json();if(!response.ok)throw new Error(value.error||'Kunne ikke hente data.');return value;}
function canLeave(){if(!state.dirty)return true;if(!confirm('Du har ulagrede endringer. Vil du forkaste dem?'))return false;state.dirty=false;state.editing=false;return true;}
function focusOptions(){const control=$('#focus');control.innerHTML='<option value="">Hele fagkartet</option>'+dataset.categories.map(c=>`<optgroup label="${esc(c.title)}">${state.topics.filter(t=>t.category_id===c.id).sort((a,b)=>a.short_label.localeCompare(b.short_label,'nb')).map(t=>`<option value="${esc(t.id)}">${esc(t.short_label)}</option>`).join('')}</optgroup>`).join('');control.value=state.focus||'';}
function updateGraph(center=false){
  const filtered=filterGraph(state.topics,state.edges,state.threshold,state.focus);
  graph.update(filtered.nodes,filtered.links,state.focus);
  if(state.selected&&!filtered.nodes.some(t=>t.id===state.selected)){state.selected=state.focus;graph.selected=state.focus;}
  const cross=filtered.links.filter(e=>topic(e.source).category_id!==topic(e.target).category_id).length;
  $('#graph-count').textContent=`${filtered.nodes.length} av ${state.topics.length} temaer · ${filtered.links.length.toLocaleString('nb-NO')} forbindelser · ${cross.toLocaleString('nb-NO')} på tvers`;
  $('#view-title').textContent=state.focus?topic(state.focus).short_label:'Hele fagkartet';
  $('#focus-note').hidden=!state.focus;$('#clear-focus').hidden=!state.focus;
  $('#density-note').hidden=filtered.links.length<700;
  if(center&&state.focus){graph.selected=state.focus;graph.center(state.focus);}
  else if(center){graph.fit();}
  if(state.detailId&&!state.editing)renderDetail(state.detailId);
}
function setThreshold(value){if(!Number.isFinite(value)||value<.01||value>1)return;state.threshold=Math.round(value*100)/100;$('#threshold').value=state.threshold;$('#threshold-value').value=state.threshold.toFixed(2);clearTimeout(filterTimer);filterTimer=setTimeout(()=>updateGraph(Boolean(state.focus)),65);}
function setFocus(id){if(id&&!topic(id))throw new Error('Ukjent tema.');state.focus=id||null;$('#focus').value=id||'';if(id)state.selected=id;updateGraph(true);}
function chooseTopic(id){
  if(state.focus&&!graph.nodes.some(n=>n.id===id)){setFocus(id);toast('Fokus flyttet til søketreffet.');}
  state.selected=id;graph.select(id);$('#search').value='';closeSearch();
}
function closeSearch(){$('#search-results').hidden=true;$('#search').setAttribute('aria-expanded','false');$('#search').removeAttribute('aria-activedescendant');searchIndex=-1;}
function showSearch(){const query=$('#search').value;searchResults=searchTopics(state.topics,query);searchIndex=-1;$('#search-results').innerHTML=searchResults.length?searchResults.slice(0,40).map((t,i)=>`<button class="result" role="option" aria-selected="false" tabindex="-1" id="result-${i}" data-id="${esc(t.id)}"><strong>${esc(t.short_label)}</strong><small>${esc(category(t.category_id).title)}</small></button>`).join(''):'<div class="empty-result">Ingen temaer funnet. Prøv et annet ord.</div>';$('#search-results').hidden=false;$('#search').setAttribute('aria-expanded','true');}
function section(title,items){return items?.length?`<h3>${title}</h3><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';}
function panelTop(edit=false){return `<div class="panel-top"><span class="eyebrow">${edit?'REDIGER TEMA':'TEMANOTAT'}</span><button class="small-button" id="edit-topic">${edit?'Lagre':'✎ Rediger'}</button><button class="close-button" id="close-sidebar" aria-label="Lukk temadetaljer">×</button></div>`;}
function wirePanel(){
  $('#close-sidebar').onclick=()=>{if(!canLeave())return;$('#sidebar').hidden=true;state.detailId=null;state.editing=false;};
  $('#edit-topic').onclick=()=>{if(state.editing)$('#edit-form').requestSubmit();else renderEditor(state.detailId);};
}
function renderDetail(id){
  const t=topic(id);if(!t)return;
  state.detailId=id;state.editing=false;$('#sidebar').hidden=false;
  const neighbors=state.edges.filter(e=>(e.source===id||e.target===id)&&e.weight>=state.threshold).slice(0,10);
  $('#sidebar-content').innerHTML=panelTop()+`<div class="panel-body"><div class="category-tag"><span class="swatch" style="background:${color(t.category_id)}"></span>${esc(category(t.category_id).title)}</div><h2>${esc(t.title)}</h2>${t.attribution.length?`<div class="attribution">${t.attribution.map(a=>esc(a.name)).join(' · ')}</div>`:''}<p class="definition">${esc(t.content.short_definition)}</p><button class="focus-topic" id="focus-topic">${state.focus===id?'Fjern fokus og vis hele kartet':'Sett dette temaet i fokus'}</button>${t._edit?.version?'<p class="review-note">Endret av deg. Relasjonsvektene bygger fortsatt på den opprinnelige teksten.</p>':''}<h3>Forklaring</h3><p>${esc(t.content.explanation)}</p>${section('Hovedpunkter',t.content.key_points)}${section('Bruk i en drøfting',t.analysis.writing_uses)}${section('Begrensninger og spenninger',t.analysis.limitations_and_tensions)}${t.content.examples.length?'<h3>Eksempler</h3>'+t.content.examples.map(e=>`<p><strong>${esc(e.title)}</strong><br>${esc(e.text)}</p>`).join(''):''}${t.content.expressions.length?'<h3>Uttrykk</h3>'+t.content.expressions.map(e=>`<p><code>${esc(e.latex)}</code><br>${esc(e.explanation)}</p>`).join(''):''}${t.figures.map(f=>f.src?`<figure><a href="/${esc(f.src)}" target="_blank" rel="noopener"><img src="/${esc(f.src)}" alt="${esc(f.alt)}" loading="lazy"></a><figcaption>${esc(f.caption)}${f.notes?.length?'<br>'+f.notes.map(esc).join(' '):''}</figcaption></figure>`:`<p class="muted">${esc(f.caption)} ${f.notes?.map(esc).join(' ')||''}</p>`).join('')}${t._edit?.notes?`<h3>Egne notater</h3><p class="notes">${esc(t._edit.notes)}</p>`:''}<h3>Nære forbindelser ≥ ${state.threshold.toFixed(2)}</h3>${neighbors.length?neighbors.map(e=>{const other=topic(e.source===id?e.target:e.source);return `<div><button class="related-row" data-edge="${esc(e.id)}"><span>${esc(other.short_label)}</span><span class="weight-chip">${e.weight.toFixed(2)}</span><span>＋</span></button><div class="reason-slot" hidden></div></div>`;}).join(''):'<p class="muted">Ingen forbindelser ved denne terskelen. Senk terskelen for å se flere.</p>'}<details><summary class="muted" style="font-size:13px;margin-top:25px;cursor:pointer">Faglig analyse og kildegrunnlag</summary>${section('Sentrale spørsmål',t.analysis.central_questions)}${section('Mekanismer',t.analysis.mechanisms)}${t.review.notes.length?`<p class="review-note">${t.review.notes.map(esc).join(' ')}</p>`:''}<h3>Kilder</h3>${t.source_refs.map(r=>`<p class="sources">${esc(dataset.sources.find(s=>s.id===r.source_id)?.title||r.source_id)}<br>${esc(r.locator)}${r.pages?.length?' · s. '+r.pages.join(', '):''}</p>`).join('')}</details></div>`;
  const suggest=document.createElement('button');suggest.className='small-button suggest-topic';suggest.id='suggest-topic';suggest.textContent='Foreslå endring til felles kart';$('#focus-topic').after(suggest);suggest.onclick=()=>sync.propose(id);
  wirePanel();$('#focus-topic').onclick=()=>setFocus(state.focus===id?null:id);
  document.querySelectorAll('[data-edge]').forEach(button=>button.onclick=async()=>{const slot=button.nextElementSibling;if(!slot.hidden){slot.hidden=true;return;}slot.hidden=false;slot.textContent='Henter forklaring…';try{const edge=await api('/api/relationships/'+encodeURIComponent(button.dataset.edge));slot.innerHTML=`<p class="related-reason">${esc(edge.reason)}</p>`;}catch(e){slot.textContent=e.message;}});
}
function openDetail(id){if(!canLeave())return;chooseTopic(id);renderDetail(id);requestAnimationFrame(()=>graph.center(id,false));}
function renderEditor(id){
  const t=topic(id);state.editing=true;state.dirty=false;
  const extra={aliases:t.aliases,attribution:t.attribution,tags:t.tags,examples:t.content.examples,expressions:t.content.expressions,analysis:{basis:t.analysis.basis,central_questions:t.analysis.central_questions,mechanisms:t.analysis.mechanisms,level_of_analysis:t.analysis.level_of_analysis},figures:t.figures,source_refs:t.source_refs};
  $('#sidebar-content').innerHTML=panelTop(true)+`<div class="panel-body"><h2>Rediger temanotat</h2><form id="edit-form" class="editor"><label for="edit-title">Full tittel</label><input id="edit-title" name="title" required value="${esc(t.title)}"><label for="edit-label">Navn på noden</label><input id="edit-label" name="short_label" required maxlength="32" value="${esc(t.short_label)}"><small>Maks. 32 tegn, slik at navnet får plass i sirkelen.</small><label for="edit-definition">Kort definisjon</label><textarea id="edit-definition" name="short_definition">${esc(t.content.short_definition)}</textarea><label for="edit-explanation">Forklaring</label><textarea id="edit-explanation" class="long-text" name="explanation">${esc(t.content.explanation)}</textarea><label for="edit-points">Hovedpunkter – ett per linje</label><textarea id="edit-points" name="key_points">${esc(t.content.key_points.join('\n'))}</textarea><label for="edit-uses">Bruk i en drøfting – ett punkt per linje</label><textarea id="edit-uses" name="writing_uses">${esc(t.analysis.writing_uses.join('\n'))}</textarea><label for="edit-limitations">Begrensninger – ett punkt per linje</label><textarea id="edit-limitations" name="limitations">${esc(t.analysis.limitations_and_tensions.join('\n'))}</textarea><label for="edit-notes">Egne notater</label><textarea id="edit-notes" name="notes" placeholder="Tanker, eksempler eller en idé til en drøfting…">${esc(t._edit?.notes||'')}</textarea><details><summary>Flere fagfelt og figurer (JSON)</summary><p class="muted">Her kan du endre eksempler, teoretikere, analyse, figurtekster og kildehenvisninger.</p><label for="edit-extra">Øvrige felt</label><textarea id="edit-extra" name="extra" class="json-text" spellcheck="false">${esc(JSON.stringify(extra,null,2))}</textarea></details><p class="review-note">Endringene lagres på maskinen din. Vektene oppdateres ikke automatisk når faginnholdet endres.</p><p id="save-error" class="error-text" role="alert" hidden></p><div class="save-row"><button class="primary-button" type="submit">Lagre endringer</button><button class="small-button" id="cancel-edit" type="button">Avbryt</button></div></form></div>`;
  wirePanel();$('#edit-form').addEventListener('input',()=>state.dirty=true);
  $('#cancel-edit').onclick=()=>{if(canLeave())renderDetail(id);};
  $('#edit-form').onsubmit=async event=>{
    event.preventDefault();const form=event.currentTarget,fd=new FormData(form);const lines=key=>String(fd.get(key)).split('\n').map(s=>s.trim()).filter(Boolean);
    const error=$('#save-error');error.hidden=true;
    try {
      const extra=JSON.parse(fd.get('extra'));
      if(!extra||typeof extra!=='object'||Array.isArray(extra))throw new Error('De øvrige feltene må være et JSON-objekt.');
      const fields={title:String(fd.get('title')).trim(),short_label:String(fd.get('short_label')).trim(),aliases:extra.aliases,attribution:extra.attribution,tags:extra.tags,content:{...t.content,short_definition:String(fd.get('short_definition')),explanation:String(fd.get('explanation')),key_points:lines('key_points'),examples:extra.examples,expressions:extra.expressions},analysis:{...extra.analysis,writing_uses:lines('writing_uses'),limitations_and_tensions:lines('limitations')},figures:extra.figures,source_refs:extra.source_refs};
      form.querySelector('[type=submit]').disabled=true;$('#edit-topic').disabled=true;
      const result=await api('/api/topics/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:t._edit?.version||0,base_content_hash:t.content_hash,fields,notes:String(fd.get('notes'))})});
      state.topics=state.topics.map(x=>x.id===id?result.topic:x);state.dirty=false;state.editing=false;focusOptions();updateGraph();renderDetail(id);toast('Endringene er lagret.');
    }catch(e){error.textContent=e instanceof SyntaxError?'Kontroller JSON-feltene. Teksten din er beholdt.':e.message;error.hidden=false;error.scrollIntoView({block:'nearest'});form.querySelector('[type=submit]').disabled=false;$('#edit-topic').disabled=false;}
  };
}
async function openEdge(edge){if(!canLeave())return;const e=await api('/api/relationships/'+encodeURIComponent(edge.id)).catch(()=>null);if(!e)return;state.detailId=null;state.editing=false;$('#sidebar').hidden=false;$('#sidebar-content').innerHTML=`<div class="panel-top"><span class="eyebrow">FORBINDELSE</span><button class="close-button" id="close-edge" aria-label="Lukk forbindelse">×</button></div><div class="panel-body"><span class="weight-chip">Relasjonsvekt ${edge.weight.toFixed(2)}</span><h2>${esc(edge.source.label)}<br><span class="muted">↔</span> ${esc(edge.target.label)}</h2><p class="definition">${esc(e.reason)}</p><p class="muted">${edge.assessment_method==='pair_review'?'Særskilt vurdert forbindelse.':edge.assessment_method==='mediated_path'?'Indirekte skrivevei gjennom andre temaer.':'Anslag basert på faglige profiler.'}</p><p class="sources">Vekten beskriver relevans i en drøfting, ikke statistisk korrelasjon.</p><button class="focus-topic" id="edge-source">Åpne ${esc(edge.source.label)}</button><button class="focus-topic" id="edge-target">Åpne ${esc(edge.target.label)}</button></div>`;$('#close-edge').onclick=()=>$('#sidebar').hidden=true;$('#edge-source').onclick=()=>openDetail(edge.source.id);$('#edge-target').onclick=()=>openDetail(edge.target.id);}

async function start(){
  [dataset,{edges:state.edges}]=await Promise.all([api('/api/topics'),api('/api/relationships')]);state.topics=dataset.topics;
  graph=new Graph($('#graph'),dataset.categories,{zoom:value=>$('#zoom-level').textContent=value+' %',select:id=>{state.selected=id;},details:openDetail,edge:openEdge,hover:info=>{const el=$('#edge-tooltip');el.hidden=!info;if(info){el.textContent=info.text;el.style.left=Math.min(info.x+16,Math.max(8,graph.w-300))+'px';el.style.top=Math.min(info.y+16,graph.h-85)+'px';}}});
  focusOptions();updateGraph();graph.settle(180);graph.resize();graph.center('organisasjon');$('#graph-loading').hidden=true;
  $('#chapter-legend').innerHTML=dataset.categories.map(c=>`<div class="legend-item"><span class="swatch" style="background:${color(c.id)}"></span>${esc(c.title)}</div>`).join('');
  $('#search').addEventListener('input',showSearch);$('#search').addEventListener('focus',showSearch);
  $('#search-results').addEventListener('click',e=>{const result=e.target.closest('[data-id]');if(result)chooseTopic(result.dataset.id);});
  $('#search').addEventListener('keydown',e=>{
    const count=Math.min(searchResults.length,40);
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if($('#search-results').hidden)showSearch();if(!count)return;searchIndex=(searchIndex+(e.key==='ArrowDown'?1:-1)+count)%count;document.querySelectorAll('.result').forEach((r,i)=>r.setAttribute('aria-selected',String(i===searchIndex)));$('#search').setAttribute('aria-activedescendant','result-'+searchIndex);$('#result-'+searchIndex)?.scrollIntoView({block:'nearest'});}
    else if(e.key==='Enter'&&count){e.preventDefault();chooseTopic(searchResults[Math.max(0,searchIndex)].id);$('#graph').focus();}
    else if(e.key==='Escape')closeSearch();
  });
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-control'))closeSearch();});
  $('#focus').onchange=e=>setFocus(e.target.value);$('#clear-focus').onclick=()=>setFocus(null);
  $('#threshold').oninput=e=>setThreshold(Number(e.target.value));$('#threshold-value').onchange=e=>{if(!e.target.checkValidity()){e.target.value=state.threshold.toFixed(2);return;}setThreshold(Number(e.target.value));};
  function mode(dynamic){graph.setDynamic(dynamic);$('#dynamic').setAttribute('aria-pressed',String(dynamic));$('#static').setAttribute('aria-pressed',String(!dynamic));}
  mode(graph.dynamic);$('#dynamic').onclick=()=>mode(true);$('#static').onclick=()=>mode(false);
  $('#zoom-in').onclick=()=>graph.scale(1.25);$('#zoom-out').onclick=()=>graph.scale(.8);$('#fit').onclick=()=>graph.fit();
  $('#chapters-toggle').onclick=()=>{const el=$('#chapter-legend');el.hidden=!el.hidden;$('#chapters-toggle').setAttribute('aria-expanded',String(!el.hidden));};
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}if(e.key==='Escape'&&!$('#search-results').hidden)closeSearch();});
  addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
  // Read-only diagnostics also make canvas behavior accessible to browser checks.
  window.orgGraph={snapshot:()=>({...graph.snapshot(),threshold:state.threshold,focus:state.focus,detailId:state.detailId}),topic:id=>structuredClone(topic(id))};
  const registry=document.modelContext;
  if(registry?.registerTool){const lifecycle=new AbortController();addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
    const specs=[{name:'read_graph_state',description:'Read current visible topic IDs, threshold, focus and edge count.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({threshold:state.threshold,focus:state.focus,node_ids:graph.nodes.map(n=>n.id),edge_count:graph.links.length})},{name:'configure_graph_view',description:'Set the visible relevance threshold and optional focus topic. Does not edit topic content.',inputSchema:{type:'object',properties:{threshold:{type:'number',minimum:.01,maximum:1},focus_id:{type:['string','null']}},required:['threshold'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!input||!Number.isFinite(input.threshold)||input.threshold<.01||input.threshold>1||('focus_id'in input&&input.focus_id!==null&&!topic(input.focus_id)))throw new Error('Invalid graph view');setThreshold(input.threshold);clearTimeout(filterTimer);if('focus_id'in input)setFocus(input.focus_id);else updateGraph();await new Promise(requestAnimationFrame);return {threshold:state.threshold,focus:state.focus,node_count:graph.nodes.length,edge_count:graph.links.length};}}];
    for(const spec of specs)try{Promise.resolve(registry.registerTool(spec,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  }
}
async function reloadData(){
  [dataset,{edges:state.edges}]=await Promise.all([api('/api/topics'),api('/api/relationships')]);state.topics=dataset.topics;state.editing=false;state.dirty=false;
  if(state.focus&&!topic(state.focus))state.focus=null;
  if(state.detailId&&!topic(state.detailId)){state.detailId=null;$('#sidebar').hidden=true;}
  graph.categories=dataset.categories;graph.colors=new Map(dataset.categories.map((c,i)=>[c.id,PALETTE[i%PALETTE.length]]));
  focusOptions();updateGraph(true);
  $('#chapter-legend').innerHTML=dataset.categories.map(c=>`<div class="legend-item"><span class="swatch" style="background:${color(c.id)}"></span>${esc(c.title)}</div>`).join('');
  $('#chapters-toggle span').textContent=dataset.categories.length;
}
// Header height can change with viewport size or browser text enlargement.
new ResizeObserver(()=>{const h=$('header').getBoundingClientRect().height;$('main').style.height=`calc(100dvh - ${h}px)`;if(innerWidth<=700)$('#sidebar').style.top=h+'px';else $('#sidebar').style.top='';}).observe($('header'));
start().catch(e=>{$('#graph-loading').textContent='Kunne ikke laste fagkartet: '+e.message;});
