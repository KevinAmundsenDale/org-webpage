import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
function checkSigningEnvironment(signing,checks){
  const result=spawnSync(process.execPath,['-e',`
    const assert=require('node:assert/strict');
    const config=require('./electron-builder.cjs');
    require('app-builder-lib');
    const {PlatformPackager}=require('app-builder-lib/out/platformPackager.js');
    const packager={info:{config},platformSpecificBuildOptions:{}};
    const link=name=>PlatformPackager.prototype.getCscLink.call(packager,name);
    ${checks}
  `],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,...signing}});
  assert.equal(result.status,0,result.stderr||result.stdout);
}

test('unset GitHub signing secrets skip certificate import instead of resolving to the project directory',()=>{
  checkSigningEnvironment({CSC_LINK:'',WIN_CSC_LINK:'',CSC_INSTALLER_LINK:'',CSC_IDENTITY_AUTO_DISCOVERY:'false'},`
    assert.equal(link(),undefined);
    assert.equal(link('WIN_CSC_LINK'),undefined);
    assert.equal(process.env.CSC_INSTALLER_LINK,undefined);
    assert.equal(process.env.CSC_IDENTITY_AUTO_DISCOVERY,'false');
  `);
});

test('configured signing certificates and intentionally empty passwords are preserved',()=>{
  checkSigningEnvironment({CSC_LINK:'mac-certificate.p12',WIN_CSC_LINK:'windows-certificate.pfx',CSC_INSTALLER_LINK:'installer-certificate.p12',CSC_KEY_PASSWORD:'',WIN_CSC_KEY_PASSWORD:''},`
    assert.equal(link(),'mac-certificate.p12');
    assert.equal(link('WIN_CSC_LINK'),'windows-certificate.pfx');
    assert.equal(process.env.CSC_INSTALLER_LINK,'installer-certificate.p12');
    assert.equal(process.env.CSC_KEY_PASSWORD,'');
    assert.equal(process.env.WIN_CSC_KEY_PASSWORD,'');
  `);
});
