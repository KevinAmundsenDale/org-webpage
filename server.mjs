import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store,StoreError} from './lib/store.mjs';
import {buildContentBundle} from './lib/content.mjs';
import {findContent,fetchContent,supports,repository} from './lib/github.mjs';

const ROOT=dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8','.map':'application/json'};
export async function createAppServer(options={}){
  const root=options.root||ROOT,profileDir=options.profileDir||process.env.ORG_DATA_DIR||join(root,'data');
  const store=await new Store({root,profileDir,bundleDataDir:options.bundleDataDir||process.env.ORG_DATA_DIR||join(root,'data')}).init();
  const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
  const config=JSON.parse(await readFile(join(root,'distribution.json'),'utf8'));Object.values(config).forEach(repository);
  let candidate=null;
  function json(res,status,data){res.writeHead(status,{'Content-Type':mime['.json'],'Cache-Control':'no-store'});res.end(JSON.stringify(data));}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try{
      const port=server.address().port;if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host))return json(res,403,{error:'Local host only'});
      const url=new URL(req.url,`http://${req.headers.host}`),path=url.pathname;let body;
      if(['POST','PUT'].includes(req.method)){
        if(req.headers.origin!==`http://${req.headers.host}`||!req.headers['content-type']?.startsWith('application/json'))return json(res,403,{error:'Ugyldig forespørsel.'});
        let raw='';const max=path==='/api/backup/preview'?20e6:300000;for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>max)return json(res,413,{error:'For mye tekst.'});}
        try{body=JSON.parse(raw);}catch{return json(res,400,{error:'Ugyldig JSON.'});}
      }
      if(req.method==='GET'&&path==='/api/topics')return json(res,200,store.dataset());
      if(req.method==='GET'&&path==='/api/relationships')return json(res,200,store.relationships);
      if(req.method==='GET'&&path.startsWith('/api/relationships/')){store.analysis||=JSON.parse(await readFile(join(store.contentDir,'data/relationship-analysis.json'),'utf8'));const edge=store.analysis.edges.find(e=>e.edge_id===decodeURIComponent(path.slice('/api/relationships/'.length)));return json(res,edge?200:404,edge||{error:'Ukjent forbindelse.'});}
      if(req.method==='PUT'&&path.startsWith('/api/topics/'))return json(res,200,await store.save(decodeURIComponent(path.slice('/api/topics/'.length)),body));
      if(req.method==='GET'&&path==='/api/status')return json(res,200,{...store.status(),app_version:pkg.version,desktop:!!options.desktop,repositories:config});
      if(req.method==='POST'&&path==='/api/content/check'){
        let remote,error;try{remote=await findContent(config.contentRepository,options.fetcher);}catch(e){error=e.message;}
        const bundled=store.status().bundled_update;
        candidate=bundled&&(!remote||bundled.version>=remote.version)?{...bundled,bundled:true}:remote;
        if(candidate&&candidate.version<=store.status().content_version)candidate=null;
        if(!candidate&&error)throw new StoreError(error,503);
        return json(res,200,{available:!!candidate,update:candidate?{version:candidate.version,notes:candidate.notes,compatible:supports(pkg.version,candidate.min_app_version),min_app_version:candidate.min_app_version}:null});
      }
      if(req.method==='POST'&&path==='/api/content/preview'){
        if(!candidate)throw new StoreError('Sjekk etter oppdateringer først.');
        if(!supports(pkg.version,candidate.min_app_version))throw new StoreError('Oppdater appen før du laster inn denne innholdsutgaven.');
        const bundle=candidate.bundled?await buildContentBundle(root,store.bundledInfo):await fetchContent(candidate,options.fetcher);
        return json(res,200,await store.prepareUpdate(bundle));
      }
      if(req.method==='POST'&&path==='/api/content/apply'){const result=await store.applyUpdate(body?.id,body?.choices);candidate=null;return json(res,200,result);}
      if(req.method==='GET'&&path==='/api/backup/export'){res.setHeader('Content-Disposition','attachment; filename="Sammenheng-sikkerhetskopi.json"');return json(res,200,store.exportBackup());}
      if(req.method==='POST'&&path==='/api/backup/preview')return json(res,200,store.prepareImport(body));
      if(req.method==='POST'&&path==='/api/backup/apply')return json(res,200,await store.applyImport(body?.id,body?.choices));
      if(req.method==='GET'&&path.startsWith('/api/proposals/'))return json(res,200,store.proposal(decodeURIComponent(path.slice('/api/proposals/'.length))));
      if(req.method==='POST'&&path.startsWith('/api/proposals/')){
        const proposal=store.proposal(decodeURIComponent(path.slice('/api/proposals/'.length)),body?.paths,body?.explanation||'');
        if(!proposal.changes.length)throw new StoreError('Velg minst én endring.');
        const text=`## Faglig endringsforslag: ${proposal.topic_title}\n\n${proposal.explanation||'Ingen ekstra begrunnelse.'}\n\nForslaget gjelder bare valgte fagfelt. Egne notater er ikke inkludert.\n\n`+proposal.changes.map(c=>`### ${c.path}\n**Før:**\n${typeof c.before==='string'?c.before:JSON.stringify(c.before,null,2)}\n\n**Forslag:**\n${typeof c.after==='string'?c.after:JSON.stringify(c.after,null,2)}\n`).join('\n')+`\n<details><summary>Forslagsdata for vedlikeholder</summary>\n\n\`\`\`json\n${JSON.stringify(proposal,null,2)}\n\`\`\`\n</details>`;
        const title='Fagforslag: '+proposal.topic_title,base=`https://github.com/${config.suggestionsRepository}/issues/new`;
        const full=base+'?'+new URLSearchParams({title,body:text});const url=full.length<7500?full:base+'?'+new URLSearchParams({title});
        return json(res,200,{proposal,text,url,needs_paste:full.length>=7500});
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
      const staticRoot=path.startsWith('/assets/figures/')?store.contentDir:join(root,'dist'),file=resolve(staticRoot,'.'+decodeURIComponent(path==='/'?'/index.html':path));
      if(!file.startsWith(resolve(staticRoot)+sep))return json(res,403,{error:'Ugyldig filsti.'});
      const bytes=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:bytes);
    }catch(e){if(e.code==='ENOENT')return json(res,404,{error:'Filen finnes ikke.'});if(!(e instanceof StoreError))console.error(e.message);return json(res,e.status||400,{error:e.message||'Handlingen kunne ikke fullføres. Ingen endringer er brukt.'});}
  });
  await new Promise((yes,no)=>{server.once('error',no);server.listen(options.port??Number(process.env.PORT||4317),'127.0.0.1',yes);});
  return {server,store,url:`http://localhost:${server.address().port}`,close:()=>new Promise(r=>{server.close(r);server.closeAllConnections();})};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--dev')){const{context}=await import('esbuild');const ctx=await context({entryPoints:[join(ROOT,'src/app.js')],bundle:true,outdir:join(ROOT,'dist'),sourcemap:true});await ctx.watch();}
  createAppServer().then(app=>console.log('Org webpage: '+app.url)).catch(e=>{console.error(e.code==='EADDRINUSE'?'Porten er i bruk. Åpne den eksisterende siden eller velg en annen PORT.':e.message);process.exitCode=1;});
}
