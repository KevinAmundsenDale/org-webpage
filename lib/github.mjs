import {gunzipSync,gzipSync} from 'node:zlib';
import {sha} from './content.mjs';
export function repository(value){if(typeof value!=='string'||!/^[-\w]+\/[-.\w]+$/.test(value))throw new Error('Ugyldig GitHub-repository.');return value;}
export async function download(url,max=35e6,fetcher=fetch){
  for(let hop=0;hop<6;hop++){
    const parsed=new URL(url);if(parsed.protocol!=='https:'||!(parsed.hostname==='github.com'||parsed.hostname==='api.github.com'||parsed.hostname.endsWith('.githubusercontent.com')))throw new Error('Uventet nedlastingsadresse.');
    const response=await fetcher(url,{redirect:'manual',headers:{'User-Agent':'Sammenheng','Accept':'application/octet-stream'},signal:AbortSignal.timeout(30000)});
    if([301,302,303,307,308].includes(response.status)){url=new URL(response.headers.get('location'),url).href;continue;}
    if(!response.ok)throw new Error(response.status===404?'Ingen offentlig utgave funnet. Repositoryet kan være privat eller mangle publiserte utgaver.':response.status===403||response.status===429?'GitHub begrenser forespørslene. Prøv igjen senere.':'Kunne ikke laste ned fra GitHub.');
    if(Number(response.headers.get('content-length'))>max)throw new Error('Nedlastingen er for stor.');
    const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>max)throw new Error('Nedlastingen er for stor.');chunks.push(chunk);}return Buffer.concat(chunks);
  }throw new Error('For mange videresendinger.');
}
export async function findContent(repo,fetcher=fetch){
  repository(repo);const releases=JSON.parse((await download(`https://api.github.com/repos/${repo}/releases?per_page=100`,4e6,fetcher)).toString('utf8'));
  if(!Array.isArray(releases))throw new Error('Ugyldig svar fra GitHub.');
  const available=releases.filter(r=>!r.draft&&!r.prerelease&&/^content-v\d+$/.test(r.tag_name)).sort((a,b)=>Number(b.tag_name.slice(9))-Number(a.tag_name.slice(9)));
  if(!available.length)return null;const release=available[0],tag=release.tag_name;
  const manifest=JSON.parse((await download(`https://github.com/${repo}/releases/download/${tag}/content-manifest.json`,200000,fetcher)).toString('utf8'));
  if(manifest.format!==1||manifest.version!==Number(tag.slice(9))||!Number.isSafeInteger(manifest.version)||manifest.version<1||!/^\d+\.\d+\.\d+$/.test(manifest.min_app_version)||! /^[a-f0-9]{64}$/.test(manifest.sha256)||!Number.isSafeInteger(manifest.size)||manifest.size<=0||manifest.size>35e6||typeof manifest.notes!=='string'||manifest.notes.length>20000)throw new Error('Ugyldig oppdateringsmanifest.');
  return {...manifest,url:`https://github.com/${repo}/releases/download/${tag}/content.json.gz`};
}
export async function fetchContent(manifest,fetcher=fetch){const bytes=await download(manifest.url,manifest.size,fetcher);if(bytes.length!==manifest.size||sha(bytes)!==manifest.sha256)throw new Error('Kontrollsummen stemmer ikke. Oppdateringen er ikke brukt.');const bundle=JSON.parse(gunzipSync(bytes,{maxOutputLength:160e6}).toString('utf8'));if(bundle.version!==manifest.version||bundle.min_app_version!==manifest.min_app_version)throw new Error('Innholdsversjonen stemmer ikke.');return bundle;}
export function encodeBundle(bundle){const bytes=gzipSync(Buffer.from(JSON.stringify(bundle)),{level:9});return {bytes,manifest:{format:1,version:bundle.version,min_app_version:bundle.min_app_version,notes:bundle.notes,size:bytes.length,sha256:sha(bytes)}};}
export function supports(current,minimum){const a=current.split('.').map(Number),b=minimum.split('.').map(Number);for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false;}return true;}
