import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
const profile=await mkdtemp(join(tmpdir(),'sammenheng-desktop-test-'));
let instance;
try{
  const executable=process.argv.find(a=>a.startsWith('--executable='))?.slice('--executable='.length);
  const packaged=!!executable||process.argv.includes('--packaged');
  instance=await electron.launch({...(packaged?{executablePath:resolve(executable||'release/win-unpacked/Sammenheng.exe'),args:[]}:{args:['.']}),env:{...process.env,SAMMENHENG_TEST_PROFILE:profile}});
  const page=await instance.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>window.orgGraph);
  assert.equal(await page.evaluate(()=>typeof window.require),'undefined');assert.equal(await page.evaluate(()=>!!window.desktop),true);
  await page.locator('#focus').selectOption('organisasjon');
  await page.locator('[data-distance="1"]').click();assert.equal(await page.evaluate(()=>orgGraph.snapshot().nodes.length),4);
  await page.locator('[data-distance="5"]').click();assert.equal(await page.evaluate(()=>orgGraph.snapshot().nodes.length),128);
  await page.locator('#clear-focus').click();assert.equal(await page.evaluate(()=>orgGraph.snapshot().nodes.length),132);
  const prefs=await instance.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration};});assert.deepEqual(prefs,{sandbox:true,contextIsolation:true,nodeIntegration:false});
  assert.equal(await page.evaluate(async()=>{try{await desktop.installUpdate();return false;}catch{return true;}}),true);
  assert.equal(await page.evaluate(async()=>{try{await desktop.openExternal('https://example.com');return false;}catch{return true;}}),true);
  await page.locator('#updates-button').click();await page.locator('#native-check').waitFor();
  if(!packaged){await page.locator('#native-check').click();await page.getByText('Automatisk appoppdatering er tilgjengelig i den installerte appen.',{exact:true}).waitFor();}
  await instance.evaluate(({app})=>{process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')('electron-updater').autoUpdater.emit('update-available',{version:'9.9.9'});});await page.locator('#native-download').waitFor();
  await instance.evaluate(({app})=>{process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')('electron-updater').autoUpdater.emit('download-progress',{percent:42});});await page.getByText('Laster ned appoppdatering · 42 %',{exact:true}).waitFor();
  await instance.evaluate(({app})=>{process.getBuiltinModule('module').createRequire(app.getAppPath()+'/package.json')('electron-updater').autoUpdater.emit('update-downloaded',{version:'9.9.9'});});await page.locator('#native-install').waitFor();
  assert.deepEqual(errors,[]);console.log(`PASS: ${packaged?'packaged '+process.platform:'development'} desktop loads, isolated profile, sandboxed renderer, restricted external URLs and IPC, app-update UI states (simulated updater events; no real installation performed).`);
}finally{if(instance)await instance.close();assert.ok(resolve(profile).startsWith(resolve(tmpdir())+sep+'sammenheng-desktop-test-'));await rm(profile,{recursive:true,force:true});}
