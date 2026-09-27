import {readFile,writeFile} from 'node:fs/promises';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: node scripts/proposal-from-issue.mjs issue.json proposal.json');
const issue=JSON.parse(await readFile(input,'utf8'));
if(typeof issue.body!=='string'||issue.body.length>1000000||issue.pull_request)throw new Error('Not a supported issue.');
const proposals=[];
for(const match of issue.body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
  try{const p=JSON.parse(match[1]);if(p.format==='sammenheng-topic-proposal')proposals.push(p);}catch{}
}
if(proposals.length!==1)throw new Error('Expected exactly one proposal JSON block from the app. Use the saved proposal file manually for other issue formats.');
await writeFile(output,JSON.stringify(proposals[0],null,2)+'\n');
