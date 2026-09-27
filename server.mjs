import http from 'node:http';
import { readFile, writeFile, mkdir, rename, copyFile, readdir, unlink } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = process.env.ORG_DATA_DIR ? resolve(process.env.ORG_DATA_DIR) : resolve(ROOT, 'data');
const PORT = Number(process.env.PORT || 4317);
const base = JSON.parse(await readFile(resolve(DATA,'topics.json'),'utf8'));
const schema = JSON.parse(await readFile(resolve(ROOT,'data/topics.schema.json'),'utf8'));
const validate = new Ajv2020({allErrors:true,strict:false}).compile({$defs:schema.$defs, $ref:'#/$defs/topic'});
const editable = ['title','short_label','aliases','attribution','tags','content','analysis','figures','source_refs'];
const sourceIds = new Set(base.sources.map(s=>s.id));
let edits;
try { edits = JSON.parse(await readFile(resolve(DATA,'edits.json'),'utf8')); }
catch (e) { if(e.code !== 'ENOENT') throw new Error('Cannot read edits.json; original file was not changed.', {cause:e}); edits={version:1,topics:{}}; }
let writeQueue = Promise.resolve();
function topic(id) {
  const original=base.topics.find(t=>t.id===id), edit=edits.topics[id];
  if (!original) return null;
  return {...original,...edit?.fields, _edit:edit ? {version:edit.version,updated_at:edit.updated_at,notes:edit.notes,relationships_need_review:true} : {version:0,notes:''}};
}
function json(res,status,data) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
async function save(id, body) {
  const current=topic(id);
  if(!current) return [404,{error:'Temaet finnes ikke.'}];
  if(body.version !== current._edit.version) return [409,{error:'Temaet er endret i et annet vindu. Åpne det på nytt før du lagrer.'}];
  if(typeof body.notes!=='string' || body.notes.length>30000 || !body.fields || typeof body.fields!=='object') return [400,{error:'Ugyldige felt.'}];
  if(Object.keys(body.fields).some(k=>!editable.includes(k))) return [400,{error:'Feltet kan ikke endres.'}];
  const { _edit, ...candidate }={...current,...body.fields};
  if(!validate(candidate) || !candidate.title.trim() || !candidate.short_label.trim()) return [400,{error:'Kontroller feltene. Nodenavnet må ha 1–32 tegn og JSON-feltene må følge datastrukturen.',details:validate.errors}];
  function refsValid(v) {
    if(Array.isArray(v)) return v.every(refsValid);
    if(v && typeof v==='object') {
      if(v.source_id && !sourceIds.has(v.source_id)) return false;
      if(v.src && !/^assets\/figures\/image\d+\.png$/.test(v.src)) return false;
      return Object.values(v).every(refsValid);
    }
    return true;
  }
  if(!refsValid(candidate)) return [400,{error:'Ukjent kilde eller ugyldig figursti.'}];
  const fields=Object.fromEntries(editable.map(k=>[k,candidate[k]]));
  const next=structuredClone(edits);
  next.topics[id]={version:current._edit.version+1,updated_at:new Date().toISOString(),base_content_hash:base.topics.find(t=>t.id===id).content_hash,fields,notes:body.notes};
  await mkdir(resolve(DATA,'backups'),{recursive:true});
  try { await copyFile(resolve(DATA,'edits.json'),resolve(DATA,'backups',`edits-${Date.now()}-${randomUUID()}.json`)); } catch(e) { if(e.code!=='ENOENT') throw e; }
  const temporary=resolve(DATA,`edits-${randomUUID()}.tmp`);
  await writeFile(temporary,JSON.stringify(next,null,2)+'\n','utf8');
  await rename(temporary,resolve(DATA,'edits.json'));
  edits=next;
  // Cleanup is best effort after a successful durable commit.
  try { const files=(await readdir(resolve(DATA,'backups'))).filter(n=>/^edits-.*\.json$/.test(n)).sort(); for(const f of files.slice(0,-20)) await unlink(resolve(DATA,'backups',f)); } catch {}
  return [200,{topic:topic(id)}];
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8','.map':'application/json'};
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  try {
    if(![`localhost:${PORT}`,`127.0.0.1:${PORT}`].includes(req.headers.host)) return json(res,403,{error:'Local host only'});
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(req.method==='GET' && url.pathname==='/api/topics') return json(res,200,{...base,topics:base.topics.map(t=>topic(t.id))});
    if(req.method==='GET' && url.pathname==='/api/relationships') {res.setHeader('Content-Type',mime['.json']);return res.end(await readFile(resolve(DATA,'relationships.json')));}
    if(req.method==='GET' && url.pathname.startsWith('/api/relationships/')) {
      const id=decodeURIComponent(url.pathname.slice('/api/relationships/'.length));
      analysis ||= JSON.parse(await readFile(resolve(DATA,'relationship-analysis.json'),'utf8'));
      const edge=analysis.edges.find(e=>e.edge_id===id);
      return json(res,edge?200:404,edge||{error:'Ukjent forbindelse.'});
    }
    if(req.method==='PUT' && url.pathname.startsWith('/api/topics/')) {
      if(req.headers.origin!==`http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) return json(res,403,{error:'Ugyldig forespørsel.'});
      let raw=''; for await(const chunk of req) {raw+=chunk; if(Buffer.byteLength(raw)>300000) return json(res,413,{error:'For mye tekst.'});}
      let body;try {body=JSON.parse(raw);} catch {return json(res,400,{error:'Ugyldig JSON.'});}
      const id=decodeURIComponent(url.pathname.slice('/api/topics/'.length));
      const task=writeQueue.then(()=>save(id,body)); writeQueue=task.catch(()=>{});
      const [status,payload]=await task;return json(res,status,payload);
    }
    if(req.method!=='GET' && req.method!=='HEAD') return json(res,405,{error:'Method not allowed'});
    const staticRoot=resolve(ROOT,'dist'), file=resolve(staticRoot,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(staticRoot+sep)) return json(res,403,{error:'Invalid path'});
    const data=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:data);
  } catch(e) { if(e.code==='ENOENT') return json(res,404,{error:'Filen finnes ikke.'}); console.error(e);json(res,500,{error:'Kunne ikke lagre eller lese filen. Prøv igjen; teksten din er beholdt.'}); }
});
let analysis;
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${PORT} is already in use. Open http://localhost:${PORT} or choose another PORT.`:e);process.exitCode=1;});
if(process.argv.includes('--dev')) { const {context}=await import('esbuild');const ctx=await context({entryPoints:[resolve(ROOT,'src/app.js')],bundle:true,outdir:resolve(ROOT,'dist'),sourcemap:true});await ctx.watch(); }
server.listen(PORT,'127.0.0.1',()=>console.log(`Org webpage: http://localhost:${PORT}`));
