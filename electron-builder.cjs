const config=require('./distribution.json');
const [owner,repo]=config.releaseRepository.split('/');
module.exports={
  appId:'no.sammenheng.org',productName:'Sammenheng',directories:{output:'release',buildResources:'build'},
  files:['dist/**/*','public/assets/figures/**/*','data/topics.json','data/topics.schema.json','data/relationships.json','data/relationship-analysis.json','data/relationship-matrix.json','data/source-map.json','data/content-version.json','desktop/**/*','lib/**/*','build/icon.png','server.mjs','distribution.json','package.json'],
  asar:true,artifactName:'Sammenheng-${version}-${os}-${arch}.${ext}',
  publish:[{provider:'github',owner,repo,releaseType:'draft'}],
  win:{target:[{target:'nsis',arch:['x64']}],icon:'build/icon.ico'},
  nsis:{oneClick:true,perMachine:false,allowElevation:false,deleteAppDataOnUninstall:false,createDesktopShortcut:true,createStartMenuShortcut:true},
  mac:{target:[{target:'dmg',arch:['universal']},{target:'zip',arch:['universal']}],category:'public.app-category.education',icon:'build/icon.icns',hardenedRuntime:true,entitlements:'desktop/entitlements.mac.plist'},
  dmg:{title:'Sammenheng ${version}'}
};
