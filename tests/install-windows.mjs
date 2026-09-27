import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,access,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

// Installing/uninstalling changes the current user's app registration and
// shortcuts. Run this only on a disposable hosted CI runner, never a user's PC.
assert.equal(process.platform,'win32');
assert.equal(process.env.GITHUB_ACTIONS,'true','Installer test requires a disposable GitHub Actions runner');
assert.ok(process.env.RUNNER_TEMP);
const runnerTemp=resolve(process.env.RUNNER_TEMP);
const work=await mkdtemp(join(runnerTemp,'sammenheng-install-test-'));
assert.ok(resolve(work).startsWith(runnerTemp+sep+'sammenheng-install-test-'));
const installDir=join(work,'App with spaces');
const profile=join(work,'personal-profile');
const {version}=JSON.parse(await readFile('package.json','utf8'));
const installer=resolve(`release/Sammenheng-${version}-win-x64.exe`);
const executable=join(installDir,'Sammenheng.exe');
const uninstaller=join(installDir,'Uninstall Sammenheng.exe');
const run=promisify(execFile);
let instance;

async function setup(file,install=false){
  // NSIS requires /D to be the last parameter with an unquoted path. Pass
  // paths through environment variables so spaces remain intact without eval.
  await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',`
    $arguments='/S'
    if ($env:SAMMENHENG_CI_INSTALL -eq '1') { $arguments += ' /D=' + $env:SAMMENHENG_CI_DESTINATION }
    $installerProcess=Start-Process -FilePath $env:SAMMENHENG_CI_INSTALLER -ArgumentList $arguments -PassThru -WindowStyle Hidden
    if (-not $installerProcess.WaitForExit(120000)) { throw 'Installer exceeded two minutes' }
    exit $installerProcess.ExitCode
  `],{windowsHide:true,timeout:150000,env:{...process.env,SAMMENHENG_CI_INSTALLER:file,SAMMENHENG_CI_INSTALL:install?'1':'0',SAMMENHENG_CI_DESTINATION:installDir}});
}
async function launch(){
  instance=await electron.launch({executablePath:executable,args:[],env:{...process.env,SAMMENHENG_TEST_PROFILE:profile}});
  const page=await instance.firstWindow();
  await page.waitForFunction(()=>window.orgGraph);
  return page;
}

try{
  await setup(installer,true);
  await access(uninstaller);
  let page=await launch();
  await page.locator('#search').fill('organisasjon');
  await page.locator('.result[data-id="organisasjon"]').click();
  await page.locator('canvas').press('Enter');
  await page.locator('#edit-topic').click();
  await page.locator('#edit-notes').fill('Saved note survives installer replacement');
  await page.locator('#edit-topic').click();
  await page.getByText('Endringene er lagret.',{exact:true}).waitFor();
  const closed=instance.waitForEvent('close',{timeout:150000});
  await Promise.all([setup(installer),closed]);
  instance=null;
  page=await launch();
  assert.equal(await page.evaluate(()=>orgGraph.topic('organisasjon')._edit.notes),'Saved note survives installer replacement');
  await instance.close();instance=null;
  await setup(uninstaller);
  for(let i=0;i<60;i++){
    const exists=await access(executable).then(()=>true,()=>false);
    if(!exists)break;
    await delay(500);
  }
  await assert.rejects(access(executable));
  const saved=JSON.parse(await readFile(join(profile,'profile/edits.json'),'utf8'));
  assert.equal(saved.topics.organisasjon.notes,'Saved note survives installer replacement');
  console.log('PASS: actual Windows installer, launch, replacement while running, saved-note persistence and uninstall.');
}finally{
  if(instance)await instance.close().catch(()=>{});
  // The directory belongs exclusively to this test on the disposable runner.
  assert.ok(resolve(work).startsWith(runnerTemp+sep+'sammenheng-install-test-'));
  await rm(work,{recursive:true,force:true,maxRetries:5,retryDelay:500});
}
