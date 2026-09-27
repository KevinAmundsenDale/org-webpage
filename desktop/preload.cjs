const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  updateStatus:()=>ipcRenderer.invoke('updates:status'),
  checkUpdates:()=>ipcRenderer.invoke('updates:check'),
  downloadUpdate:()=>ipcRenderer.invoke('updates:download'),
  installUpdate:()=>ipcRenderer.invoke('updates:install'),
  openExternal:url=>ipcRenderer.invoke('links:open',url),
  onUpdate:callback=>{const listener=(_event,value)=>callback(value);ipcRenderer.on('updates:changed',listener);return ()=>ipcRenderer.removeListener('updates:changed',listener);}
});
