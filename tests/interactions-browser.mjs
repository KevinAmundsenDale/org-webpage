import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createAppServer} from '../server.mjs';
const profile=await mkdtemp(join(tmpdir(),'sammenheng-interactions-'));
let service,browser;
try {
  service=await createAppServer({profileDir:profile,port:0});
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const snapshot=()=>page.evaluate(()=>orgGraph.snapshot());
  const box=()=>page.locator('#graph').boundingBox();
  const nodePoint=async id=>{const s=await snapshot(),b=await box(),n=s.nodes.find(n=>n.id===id);return {x:b.x+n.screen[0],y:b.y+n.screen[1],node:n};};
  // Choose genuinely empty space, outside node disks, edge hit areas and controls.
  const backgroundPoint=async()=>{
    const s=await snapshot(),b=await box();
    const links=await page.evaluate(async()=> (await fetch('/api/relationships').then(r=>r.json())).edges);
    const visible=new Map(s.nodes.map(n=>[n.id,n]));
    for(let y=140;y<s.height-100;y+=25)for(let x=20;x<s.width-20;x+=25){
      if(s.nodes.some(n=>Math.hypot(x-n.screen[0],y-n.screen[1])<n.radius*s.zoom+15))continue;
      if(links.some(e=>{if(e.weight<s.threshold||!visible.has(e.source)||!visible.has(e.target))return false;const a=visible.get(e.source).screen,z=visible.get(e.target).screen,dx=z[0]-a[0],dy=z[1]-a[1],t=Math.max(.05,Math.min(.95,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<12;}))continue;
      return {x:b.x+x,y:b.y+y};
    }
    throw new Error('No empty background point');
  };
  const open=async id=>{await page.locator('#focus').selectOption(id);await page.locator('#graph').press('Enter');await page.locator('#edit-topic').waitFor();await page.waitForTimeout(60);};
  await page.goto(service.url);await page.waitForFunction(()=>window.orgGraph);await page.locator('#static').click();
  await open('organisasjon');
  const before=await box();await page.locator('#toolbar-toggle').click();
  await page.waitForFunction(()=>document.querySelector('#graph').getBoundingClientRect().height>800);
  assert.ok((await box()).height>before.height+100);assert.equal(await page.locator('#toolbar').isVisible(),false);
  assert.equal((await snapshot()).focus,'organisasjon');assert.equal((await snapshot()).detailId,'organisasjon');
  await page.reload();await page.waitForFunction(()=>window.orgGraph);
  assert.equal(await page.locator('#toolbar').isVisible(),false);
  await page.locator('#graph').press('/');assert.equal(await page.locator('#toolbar').isVisible(),true);
  assert.equal(await page.locator('#search').evaluate(el=>el===document.activeElement),true);
  await page.locator('#search').press('Escape');await page.locator('#static').click();await open('organisasjon');
  const divider=page.locator('#sidebar-resize'),panel=page.locator('#sidebar');
  const initialWidth=(await panel.boundingBox()).width,r=await divider.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x-190,r.y+r.height/2,{steps:10});await page.mouse.up();
  assert.ok((await panel.boundingBox()).width>initialWidth+180);
  assert.equal((await snapshot()).focus,'organisasjon');assert.equal((await snapshot()).detailId,'organisasjon');
  const width=(await panel.boundingBox()).width;await divider.press('ArrowLeft');
  assert.equal((await panel.boundingBox()).width,width+24);
  await divider.press('Home');assert.equal((await panel.boundingBox()).width,320);
  await divider.press('End');assert.ok((await box()).width>=270);
  await divider.press('Home');await divider.press('ArrowLeft');await divider.press('ArrowLeft');
  const savedWidth=(await panel.boundingBox()).width;
  await page.reload();await page.waitForFunction(()=>window.orgGraph);await page.locator('#static').click();await open('organisasjon');
  assert.equal((await panel.boundingBox()).width,savedWidth);

  // Drag a visible neighboring node: selection and definition must stay put.
  await page.locator('#fit').click();
  let s=await snapshot(),other=s.nodes.find(n=>n.id!==s.focus&&n.screen[0]>80&&n.screen[0]<s.width-80&&n.screen[1]>150&&n.screen[1]<s.height-110);
  assert.ok(other);let p=await nodePoint(other.id);
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(400);
  await page.mouse.move(p.x+40,p.y+20,{steps:6});await page.mouse.up();
  s=await snapshot();assert.equal(s.focus,'organisasjon');assert.equal(s.detailId,'organisasjon');
  assert.ok(Math.abs(s.nodes.find(n=>n.id===other.id).x-other.x)*s.zoom>30);
  // Click an unobscured node to change both focus and definition.
  await page.locator('#fit').click();s=await snapshot();
  other=s.nodes.find(n=>n.id!==s.focus&&n.screen[0]>80&&n.screen[0]<s.width-80&&n.screen[1]>150&&n.screen[1]<s.height-110&&s.nodes.every(m=>m.id===n.id||Math.hypot(m.screen[0]-n.screen[0],m.screen[1]-n.screen[1])>m.radius*s.zoom+5));
  assert.ok(other);p=await nodePoint(other.id);await page.mouse.click(p.x,p.y);
  s=await snapshot();assert.equal(s.focus,other.id);assert.equal(s.detailId,other.id);
  assert.ok((await page.locator('#sidebar h2').textContent()).length>0);

  // Unsaved edits survive declined navigation, background clicks and double-clicks.
  await page.locator('#edit-topic').click();await page.locator('#edit-notes').fill('Keep this draft');
  const dismiss=dialog=>dialog.dismiss();page.on('dialog',dismiss);
  let bg=await backgroundPoint();await page.mouse.click(bg.x,bg.y);
  assert.equal(await panel.isVisible(),true);assert.equal(await page.locator('#edit-notes').inputValue(),'Keep this draft');
  bg=await backgroundPoint();await page.mouse.dblclick(bg.x,bg.y);
  assert.equal((await snapshot()).focus,other.id);assert.equal(await page.locator('#edit-notes').inputValue(),'Keep this draft');
  await page.locator('#fit').click();s=await snapshot();const another=s.nodes.find(n=>n.id!==s.focus&&n.screen[0]>80&&n.screen[0]<s.width-80&&n.screen[1]>140&&n.screen[1]<s.height-110);
  assert.ok(another);p=await nodePoint(another.id);await page.mouse.click(p.x,p.y);
  assert.equal((await snapshot()).focus,other.id);assert.equal((await snapshot()).selected,other.id);assert.equal(await page.locator('#edit-notes').inputValue(),'Keep this draft');
  page.off('dialog',dismiss);page.once('dialog',dialog=>dialog.accept());await page.locator('#cancel-edit').click();

  // Panning the background must not close the definition panel.
  bg=await backgroundPoint();await page.mouse.move(bg.x,bg.y);await page.mouse.down();await page.mouse.move(bg.x+35,bg.y+20,{steps:6});await page.mouse.up();
  assert.equal(await panel.isVisible(),true);assert.equal((await snapshot()).focus,other.id);
  // One click closes details and preserves focus. Double-click removes all node highlighting.
  bg=await backgroundPoint();await page.mouse.click(bg.x,bg.y);
  assert.equal(await panel.isVisible(),false);assert.equal(await divider.isVisible(),false);assert.equal((await snapshot()).focus,other.id);
  await page.locator('#graph').press('Enter');await page.waitForTimeout(60);
  bg=await backgroundPoint();await page.mouse.dblclick(bg.x,bg.y);
  s=await snapshot();assert.equal(s.focus,null);assert.equal(s.selected,null);assert.equal(s.detailId,null);assert.equal(await panel.isVisible(),false);
  assert.equal(await page.locator('#focus').inputValue(),'');

  // A closed panel remains closed on an ordinary node click; right-click still opens it.
  await page.locator('#fit').click();p=await nodePoint('organisasjon');await page.mouse.click(p.x,p.y);
  assert.equal(await panel.isVisible(),false);assert.equal((await snapshot()).selected,'organisasjon');
  p=await nodePoint('organisasjon');await page.mouse.click(p.x,p.y,{button:'right'});assert.equal(await panel.isVisible(),true);
  // Keep category and threshold filters when clearing only the node focus.
  const category=await page.evaluate(()=>orgGraph.topic('organisasjon').category_id);
  await page.locator('#category').selectOption(category);await open('organisasjon');
  bg=await backgroundPoint();await page.mouse.dblclick(bg.x,bg.y);
  s=await snapshot();assert.equal(s.category,category);assert.equal(s.threshold,.88);assert.equal(s.focus,null);

  for(const width of [1800,1000,720,700,390,320]){
    await page.setViewportSize({width,height:844});await open('organisasjon');
    await divider.press('End');await page.waitForTimeout(60);
    const bounds=await panel.boundingBox();assert.ok(bounds.x>=0);assert.ok(bounds.x+bounds.width<=width+1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow at ${width}`);
    await page.locator('#toolbar-toggle').click();await page.waitForTimeout(60);
    assert.ok((await panel.boundingBox()).height>500);await page.locator('#toolbar-toggle').click();
    await page.locator('#close-sidebar').click();
  }
  await page.setViewportSize({width:1500,height:1000});await page.locator('#category').selectOption('');await open('organisasjon');
  await divider.press('Home');for(let i=0;i<12;i++)await divider.press('ArrowLeft');
  await page.locator('#toolbar-toggle').click();await mkdir('.runtime',{recursive:true});await page.screenshot({path:'.runtime/graph-interactions.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: collapsible toolbar, search shortcut, persistent/responsive panel resizing, focus and definition click navigation, static dragging, unsaved-edit protection, background pan/click/double-click, category preservation and mobile layouts.');
} finally {if(browser)await browser.close();if(service)await service.close();await rm(profile,{recursive:true,force:true});}
