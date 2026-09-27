const {app,BrowserWindow,ipcMain,shell,dialog,Menu}=require('electron');
const {join}=require('node:path');
const {pathToFileURL}=require('node:url');
const {autoUpdater}=require('electron-updater');
const config=require('../distribution.json');
app.setName('Sammenheng');
const profileRoot=process.env.SAMMENHENG_TEST_PROFILE||join(app.getPath('appData'),'Sammenheng');
require('node:fs').mkdirSync(profileRoot,{recursive:true});
app.setPath('userData',profileRoot);
let service,window,update={phase:'idle',version:app.getVersion()},checking=false;
const lock=app.requestSingleInstanceLock();
if(!lock){app.quit();}else{
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
  app.whenReady().then(async()=>{
    const {createAppServer}=await import(pathToFileURL(join(__dirname,'../server.mjs')).href);
    service=await createAppServer({root:join(__dirname,'..'),profileDir:join(app.getPath('userData'),'profile'),port:0,desktop:true});
    const allowedRepos=new Set(Object.values(config));
    async function external(url){const parsed=new URL(url);const repo=parsed.pathname.split('/').slice(1,3).join('/');if(parsed.protocol!=='https:'||parsed.hostname!=='github.com'||!allowedRepos.has(repo)||url.length>20000)throw new Error('Denne adressen er ikke godkjent.');return shell.openExternal(url);}
    const own=(event)=>{if(!window||event.sender!==window.webContents||event.senderFrame?.url?.split('/').slice(0,3).join('/')!==service.url)throw new Error('Ugyldig vindu.');};
    ipcMain.handle('updates:status',event=>{own(event);return update;});
    ipcMain.handle('updates:check',async event=>{own(event);await check();return update;});
    ipcMain.handle('updates:download',async event=>{own(event);if(update.phase!=='available')throw new Error('Ingen appoppdatering klar.');setUpdate({phase:'downloading',percent:0});try{await autoUpdater.downloadUpdate();}catch{setUpdate({phase:'error',message:'Nedlastingen mislyktes. Prøv igjen senere.'});}return update;});
    ipcMain.handle('updates:install',event=>{own(event);if(update.phase!=='ready')throw new Error('Oppdateringen er ikke ferdig lastet ned.');setImmediate(()=>autoUpdater.quitAndInstall(false,true));return true;});
    ipcMain.handle('links:open',async(event,url)=>{own(event);return external(url);});
    window=new BrowserWindow({width:1440,height:940,minWidth:720,minHeight:560,title:'Sammenheng',backgroundColor:'#f7f9fc',icon:join(__dirname,'../build/icon.png'),show:false,webPreferences:{preload:join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
    window.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith(service.url+'/assets/figures/'))return {action:'allow',overrideBrowserWindowOptions:{webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}}};external(url).catch(()=>{});return {action:'deny'};});
    window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(service.url+'/')){event.preventDefault();external(url).catch(()=>{});}});
    window.webContents.session.setPermissionRequestHandler((_webContents,permission,callback)=>callback(permission==='clipboard-sanitized-write'));
    window.webContents.on('will-prevent-unload',event=>{const response=dialog.showMessageBoxSync(window,{type:'question',buttons:['Fortsett redigering','Forkast og lukk'],defaultId:0,cancelId:0,message:'Du har ulagrede endringer.'});if(response===1)event.preventDefault();});
    window.webContents.session.on('will-download',(_event,item)=>item.setSaveDialogOptions({defaultPath:join(app.getPath('downloads'),item.getFilename())}));
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform==='darwin'?[{role:'appMenu'}]:[]),{label:'Rediger',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
      {label:'Vis',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'},...(!app.isPackaged?[{role:'toggleDevTools'}]:[])]},
      {label:'Hjelp',submenu:[{label:'Se etter appoppdateringer',click:()=>check()},{label:'Utgaver på GitHub',click:()=>external(`https://github.com/${config.releaseRepository}/releases`)}]}
    ]));
    window.once('ready-to-show',()=>{if(!process.env.SAMMENHENG_TEST_PROFILE)window.show();});window.on('closed',()=>window=null);await window.loadURL(service.url);
    autoUpdater.autoDownload=false;autoUpdater.autoInstallOnAppQuit=false;autoUpdater.allowPrerelease=false;autoUpdater.allowDowngrade=false;
    autoUpdater.on('checking-for-update',()=>setUpdate({phase:'checking'}));
    autoUpdater.on('update-available',info=>setUpdate({phase:'available',availableVersion:info.version}));
    autoUpdater.on('update-not-available',()=>setUpdate({phase:'current'}));
    autoUpdater.on('download-progress',p=>setUpdate({phase:'downloading',percent:Math.round(p.percent)}));
    autoUpdater.on('update-downloaded',info=>setUpdate({phase:'ready',availableVersion:info.version}));
    autoUpdater.on('error',()=>setUpdate({phase:'error',message:'Kunne ikke hente en appoppdatering. Sjekk internett eller prøv senere. Mac-utgaver må være signert for automatisk oppdatering.'}));
    if(app.isPackaged)setTimeout(check,15000).unref();
  }).catch(error=>{dialog.showErrorBox('Sammenheng kunne ikke starte',error.message);app.quit();});
  app.on('window-all-closed',()=>app.quit());
  app.on('will-quit',()=>{service?.server.close();service?.server.closeAllConnections();});
}
function setUpdate(change){update={...update,...change};window?.webContents.send('updates:changed',update);}
async function check(){if(checking)return;if(!app.isPackaged){setUpdate({phase:'development',message:'Automatisk appoppdatering er tilgjengelig i den installerte appen.'});return;}checking=true;try{await autoUpdater.checkForUpdates();}catch{setUpdate({phase:'error',message:'Ingen tilgjengelig apputgave funnet. Sjekk internett og at en utgave er publisert på GitHub.'});}finally{checking=false;}}
