import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,cp,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {topics,edges,visibleAtDefault,focusedCount} from './content-fixture.mjs';
import {filterGraph,searchTopicMatches} from '../src/graph-data.js';
const data=await mkdtemp(join(tmpdir(),'org-webpage-test-'));
for(const name of ['topics.json','relationships.json','relationship-analysis.json','relationship-matrix.json','source-map.json'])await cp('data/'+name,join(data,name));
let server,browser;
const errors=[];
async function startServer(){server=spawn(process.execPath,['server.mjs'],{cwd:resolve('.'),env:{...process.env,PORT:'4318',ORG_DATA_DIR:data},stdio:['ignore','pipe','pipe']});await new Promise((yes,no)=>{server.stdout.on('data',v=>{if(v.toString().includes('http://'))yes();});server.stderr.on('data',v=>no(new Error(v.toString())));server.on('error',no);});}
try {
  await startServer();browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.testTools={};Object.defineProperty(document,'modelContext',{value:{registerTool:tool=>window.testTools[tool.name]=tool}});});
  await page.goto('http://localhost:4318');await page.waitForFunction(()=>window.orgGraph);
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).edgeCount,visibleAtDefault);
  assert.equal(await page.locator('[data-distance="1"]').isDisabled(),true);
  // Names precede body matches, and selecting either kind establishes focus.
  await page.locator('#search').fill('tillit');
  const expected=searchTopicMatches(topics,'tillit').slice(0,40);
  assert.deepEqual(await page.locator('.result').evaluateAll(els=>els.map(el=>el.dataset.id)),expected.map(m=>m.topic.id));
  const bodyMatch=expected.find(m=>m.matchKind==='body');assert.ok(bodyMatch);
  await page.locator(`.result[data-id="${bodyMatch.topic.id}"]`).click();
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).focus,bodyMatch.topic.id);
  // Category focus includes isolated nodes; paths cannot leave the category.
  const categoryId=topics.find(t=>t.id==='schein-kulturnivaaer').category_id;
  await page.locator('#category').selectOption(categoryId);
  let categoryState=await page.evaluate(()=>orgGraph.snapshot());
  assert.equal(categoryState.focus,null);
  assert.deepEqual(categoryState.nodes.map(n=>n.id).sort(),topics.filter(t=>t.category_id===categoryId).map(t=>t.id).sort());
  await page.locator('#focus').selectOption('schein-kulturnivaaer');
  categoryState=await page.evaluate(()=>orgGraph.snapshot());
  assert.deepEqual(categoryState.nodes.map(n=>n.id).sort(),filterGraph(topics,edges,.88,'schein-kulturnivaaer',2,categoryId).nodes.map(t=>t.id).sort());
  await page.locator('#search').fill('organisasjon');await page.locator('.result[data-id="organisasjon"]').click();
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).category,null);
  await page.locator('#clear-focus').click();await page.locator('#static').click();
  // Right-click a node while the whole graph is visible.
  await page.locator('#fit').click();
  const whole=await page.evaluate(()=>orgGraph.snapshot()),target=whole.nodes.find(n=>n.id==='organisasjon');
  const canvasBox=await page.locator('canvas').boundingBox();
  await page.mouse.click(canvasBox.x+target.screen[0],canvasBox.y+target.screen[1],{button:'right'});
  await page.locator('#edit-topic').waitFor();
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).focus,'organisasjon');
  const neighbor=page.locator('[data-focus-id]').first(),neighborId=await neighbor.getAttribute('data-focus-id');
  await page.locator('[data-edge]').first().click();await page.locator('.related-reason').first().waitFor();
  await neighbor.click();
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).focus,neighborId);
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).detailId,neighborId);
  // Declining navigation retains unsaved text and the existing focus/filter.
  await page.locator('#edit-topic').click();await page.locator('#edit-notes').fill('Unsaved navigation check');
  page.once('dialog',dialog=>dialog.dismiss());await page.locator('#category').selectOption(categoryId);
  assert.equal(await page.locator('#category').inputValue(),'');
  assert.equal(await page.locator('#edit-notes').inputValue(),'Unsaved navigation check');
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).focus,neighborId);
  page.once('dialog',dialog=>dialog.accept());await page.locator('#cancel-edit').click();
  await page.locator('#close-sidebar').click();await page.locator('#dynamic').click();
  await page.locator('#focus').selectOption('organisasjon');
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).maxDistance,2);
  for(const distance of [1,2,3,4,5]){
    const count=focusedCount(distance);
    await page.locator(`[data-distance="${distance}"]`).click();
    const state=await page.evaluate(()=>orgGraph.snapshot());
    assert.equal(state.nodes.length,count);assert.equal(state.maxDistance,distance);
    assert.equal(await page.locator(`[data-distance="${distance}"]`).getAttribute('aria-pressed'),'true');
    const focus=state.nodes.find(n=>n.id==='organisasjon');
    assert.ok(Math.abs(focus.screen[0]-state.width/2)<4);assert.ok(Math.abs(focus.screen[1]-state.height/2)<4);
  }
  await page.locator('[data-distance="1"]').focus();await page.locator('[data-distance="1"]').press('Enter');
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).nodes.length,focusedCount(1));
  await page.locator('#search').fill('begrenset');await page.locator('.result').first().click();
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).focus,'begrenset-rasjonalitet');
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).maxDistance,1);
  await page.locator('#clear-focus').click();
  assert.equal((await page.evaluate(()=>orgGraph.snapshot())).nodes.length,topics.length);
  assert.equal(await page.locator('[data-distance="1"]').isDisabled(),true);
  await page.locator('#search').fill('begrenset');await page.locator('.result').first().click();
  await page.waitForTimeout(400);
  let s=await page.evaluate(()=>orgGraph.snapshot());assert.equal(s.selected,'begrenset-rasjonalitet');
  let n=s.nodes.find(n=>n.id===s.selected);assert.ok(Math.abs(n.screen[0]-s.width/2)<4);assert.ok(Math.abs(n.screen[1]-s.height/2)<4);
  const rect=await page.locator('canvas').boundingBox();await page.mouse.click(n.screen[0]+rect.x,n.screen[1]+rect.y,{button:'right'});
  await page.locator('#edit-topic').waitFor();assert.equal(await page.locator('#sidebar').isVisible(),true);
  await page.locator('#edit-topic').click();await page.locator('#edit-notes').fill('Persistenssjekk: æøå <script>test</script>');await page.locator('#edit-explanation').fill('Testforklaring som lagres og overlever omstart.');await page.locator('#edit-topic').click();await page.getByText('Endringene er lagret.',{exact:true}).waitFor();
  const edits=JSON.parse(await readFile(join(data,'edits.json'),'utf8'));assert.equal(edits.topics['begrenset-rasjonalitet'].version,1);
  const stale=await page.evaluate(async()=>{const t=await fetch('/api/topics').then(r=>r.json());const topic=t.topics.find(t=>t.id==='begrenset-rasjonalitet');return (await fetch('/api/topics/begrenset-rasjonalitet',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:0,notes:'bad',fields:{title:topic.title}})})).status;});assert.equal(stale,409);
  await page.reload();await page.waitForFunction(()=>window.orgGraph);assert.equal(await page.evaluate(()=>orgGraph.topic('begrenset-rasjonalitet').content.explanation),'Testforklaring som lagres og overlever omstart.');
  const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;await startServer();await page.reload();await page.waitForFunction(()=>window.orgGraph);assert.equal(await page.evaluate(()=>orgGraph.topic('begrenset-rasjonalitet')._edit.notes),'Persistenssjekk: æøå <script>test</script>');
  await page.locator('#focus').selectOption('organisasjon');await page.locator('#threshold-value').fill('1.00');await page.locator('#threshold-value').press('Tab');await page.waitForTimeout(170);s=await page.evaluate(()=>orgGraph.snapshot());assert.equal(s.nodes.length,1);assert.equal(s.edgeCount,0);
  await page.locator('#clear-focus').click();s=await page.evaluate(()=>orgGraph.snapshot());assert.equal(s.nodes.length,topics.length);
  await page.locator('#threshold-value').fill('0.01');await page.locator('#threshold-value').press('Tab');await page.waitForTimeout(220);s=await page.evaluate(()=>orgGraph.snapshot());assert.equal(s.edgeCount,edges.length);
  await page.locator('#threshold-value').fill('0.88');await page.locator('#threshold-value').press('Tab');await page.waitForTimeout(150);
  await page.locator('#static').click();const before=await page.evaluate(()=>orgGraph.snapshot().nodes);await page.waitForTimeout(250);const after=await page.evaluate(()=>orgGraph.snapshot().nodes);assert.deepEqual(before,after);
  await page.locator('#search').fill('organisasjon');await page.locator('.result[data-id="organisasjon"]').click();
  s=await page.evaluate(()=>orgGraph.snapshot());n=s.nodes.find(n=>n.id==='organisasjon');const box=await page.locator('canvas').boundingBox();
  await page.mouse.move(n.screen[0]+box.x,n.screen[1]+box.y);await page.mouse.down();await page.mouse.move(n.screen[0]+box.x+85,n.screen[1]+box.y+30,{steps:8});await page.mouse.up();
  const moved=await page.evaluate(()=>orgGraph.snapshot().nodes.find(n=>n.id==='organisasjon'));assert.ok(Math.abs(moved.x-n.x)*s.zoom>60,JSON.stringify({before:n.x,after:moved.x,zoom:s.zoom}));
  await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>orgGraph.snapshot().nodes.find(n=>n.id==='organisasjon'))).x,moved.x);
  await page.locator('#dynamic').click();await page.waitForTimeout(350);const elastic=await page.evaluate(()=>orgGraph.snapshot().nodes.find(n=>n.id==='organisasjon'));assert.notEqual(elastic.x,moved.x);
  const zoom=(await page.evaluate(()=>orgGraph.snapshot())).zoom;await page.locator('#zoom-in').click();assert.ok((await page.evaluate(()=>orgGraph.snapshot())).zoom>zoom);
  await page.locator('#fit').click();
  const tools=await page.evaluate(()=>Object.keys(window.testTools));assert.deepEqual(tools.sort(),['configure_graph_view','read_graph_state']);
  const toolResult=await page.evaluate(()=>testTools.configure_graph_view.execute({threshold:1,focus_id:'organisasjon'}));assert.equal(toolResult.node_count,1);
  const distanceResult=await page.evaluate(()=>testTools.configure_graph_view.execute({threshold:.88,focus_id:'organisasjon',max_distance:3}));assert.equal(distanceResult.node_count,focusedCount(3));assert.equal(distanceResult.max_distance,3);
  assert.equal(await page.evaluate(()=>testTools.read_graph_state.execute().max_distance),3);
  assert.equal(await page.evaluate(async()=>{try{await testTools.configure_graph_view.execute({threshold:.88,max_distance:6});return false;}catch{return true;}}),true);
  assert.equal(await page.evaluate(async()=>{try{await testTools.configure_graph_view.execute({threshold:0});return false;}catch{return true;}}),true);
  await page.evaluate(()=>testTools.configure_graph_view.execute({threshold:.88,focus_id:null}));
  for(const width of [1800,1500,1121,1000,720,700,390,320]){
    await page.setViewportSize({width,height:844});await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow at ${width}px`);
    const controls=await page.locator('.toolbar > *').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
    for(let a=0;a<controls.length;a++)for(let b=a+1;b<controls.length;b++)assert.ok(controls[a].right<=controls[b].x||controls[b].right<=controls[a].x||controls[a].bottom<=controls[b].y||controls[b].bottom<=controls[a].y,`No overlapping controls at ${width}px`);
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  await page.locator('#focus').selectOption('organisasjon');await page.locator('[data-distance="1"]').click();assert.equal((await page.evaluate(()=>orgGraph.snapshot())).nodes.length,focusedCount(1));
  await page.locator('#clear-focus').click();
  await page.locator('#search').fill('organisasjon');await page.locator('.result[data-id="organisasjon"]').click();await page.locator('canvas').press('Enter');assert.equal(await page.locator('#sidebar').isVisible(),true);
  assert.ok((await page.locator('#edit-topic').boundingBox()).x>=0);
  await page.locator('#close-sidebar').click();await page.setViewportSize({width:1500,height:1000});
  for(const id of ['schein-kulturnivaaer','tjenende-ledelse']){
    const t=topics.find(t=>t.id===id);
    await page.locator('#search').fill(t.short_label);await page.locator(`.result[data-id="${id}"]`).click();await page.locator('canvas').press('Enter');
    const example=page.locator('#sidebar-content p').filter({has:page.getByText('Konstruert praksiseksempel',{exact:true})});
    await example.scrollIntoViewIfNeeded();assert.ok((await example.textContent()).includes(t.content.examples.at(-1).text));
    if(id==='schein-kulturnivaaer'){await mkdir('.runtime',{recursive:true});await page.screenshot({path:'.runtime/practice-example.png'});}
    await page.locator('#close-sidebar').click();
  }
  await page.locator('canvas').press('Enter');
  assert.deepEqual(errors,[]);
  await page.locator('#close-sidebar').click();await page.locator('#updates-button').click();await page.locator('#content-check').waitFor();assert.ok(await page.locator('#backup-export').isVisible());await page.locator('#sync-close').click();
  console.log('PASS: browser load, search centering, right-click, saved edits, restart persistence, stale-write protection, focus reachability, threshold extremes, static drag, elasticity, zoom, mobile, keyboard, WebMCP valid/invalid inputs; no browser errors.');
} finally {if(browser)await browser.close();if(server&&server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done;}assert.ok(resolve(data).startsWith(resolve(tmpdir())+sep+'org-webpage-test-'));await rm(data,{recursive:true,force:true});}
