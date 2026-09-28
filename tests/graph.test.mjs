import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterGraph,searchTopics,searchTopicMatches} from '../src/graph-data.js';
import {Graph} from '../src/graph.js';
const {topics}=JSON.parse(await readFile(new URL('../data/topics.json',import.meta.url)));
const {edges}=JSON.parse(await readFile(new URL('../data/relationships.json',import.meta.url)));
test('complete graph, inclusive thresholds and isolated focus',()=>{
  assert.equal(filterGraph(topics,edges,.01).links.length,topics.length*(topics.length-1)/2);
  assert.equal(filterGraph(topics,edges,.88).links.length,edges.filter(e=>e.weight>=.88).length);
  const isolated=filterGraph(topics,edges,1,'organisasjon');
  assert.deepEqual(isolated.nodes.map(n=>n.id),['organisasjon']);assert.equal(isolated.links.length,0);
  assert.equal(filterGraph(topics,edges,1).nodes.length,topics.length);
});
test('focus follows reachable hops within the distance limit and excludes other components',()=>{
  const nodes=['a','b','c','d'].map(id=>({id}));const links=[{source:'a',target:'b',weight:.9},{source:'b',target:'c',weight:.8},{source:'c',target:'d',weight:.2}];
  assert.deepEqual(filterGraph(nodes,links,.8,'a').nodes.map(n=>n.id),['a','b','c']);
  assert.equal(filterGraph(nodes,links,.8,'a').links.length,2);
  assert.throws(()=>filterGraph(nodes,links,.8,'unknown'));assert.throws(()=>filterGraph(nodes,links,0));
});
test('focus distance includes the boundary node and excludes the next hop for every limit',()=>{
  const nodes=['a','b','c','d','e','f','g','isolated'].map(id=>({id}));
  const links=nodes.slice(0,6).map((n,i)=>({source:n.id,target:nodes[i+1].id,weight:.8}));
  for(let distance=1;distance<=5;distance++){
    const result=filterGraph(nodes,links,.8,'a',distance);
    assert.deepEqual(result.nodes.map(n=>n.id),nodes.slice(0,distance+1).map(n=>n.id));
    assert.equal(result.links.length,distance);
  }
  assert.equal(filterGraph(nodes,links,.8,null,1).nodes.length,8);
  assert.deepEqual(filterGraph(nodes,links,.81,'a',5).nodes.map(n=>n.id),['a']);
  for(const bad of [0,6,1.5,NaN,Infinity,'2',null])assert.throws(()=>filterGraph(nodes,links,.8,'a',bad),/distance/);
});

test('focus distance uses the shortest undirected path and recalculates when shortcuts are filtered',()=>{
  const nodes=['a','b','c','d','e'].map(id=>({id}));
  const links=[['a','b',.9],['b','c',.9],['c','d',.9],['d','e',.9],['d','a',.8]].map(([source,target,weight])=>({source,target,weight}));
  const shortcut=filterGraph(nodes,links,.8,'a',2);
  assert.deepEqual(shortcut.nodes.map(n=>n.id),['a','b','c','d','e']);
  assert.equal(shortcut.links.length,5);
  assert.deepEqual(filterGraph(nodes,links,.9,'a',2).nodes.map(n=>n.id),['a','b','c']);
  assert.deepEqual(filterGraph(nodes,links,.9,'e',1).nodes.map(n=>n.id),['d','e']);
});

test('search understands Norwegian characters, aliases and names',()=>{
  assert.ok(searchTopics(topics,'malforskyvning').some(t=>t.id==='maalforskyvning'));
  assert.ok(searchTopics(topics,'Mintzberg').length>=5);
});

test('search prioritizes names over frequent body matches and includes examples and edited text',()=>{
 const topic=(id,title,explanation='',extra={})=>({id,title,short_label:title,aliases:[],tags:[],attribution:[],content:{explanation,...extra}});
 const data=[topic('many','Annet','tillit tillit tillit'),topic('one','En teori','tillit'),topic('name','Tillit'),topic('prefix','Tillitsledelse'),topic('example','Praksis','',{examples:[{title:'Case',text:'TILLIT i møte med andre'}]}),topic('absent','Ingen treff')];
 assert.deepEqual(searchTopics(data,'tillit').map(t=>t.id),['name','prefix','many','one','example']);
 assert.deepEqual(searchTopics(data,'MØTE').map(t=>t.id),['example']);
 assert.equal(searchTopicMatches(data,'tillit').find(r=>r.topic.id==='many').count,3);
 assert.equal(searchTopicMatches(data,'tillit')[0].matchKind,'name');
 data[5].content.explanation='Nå er tillit lagt til';assert.ok(searchTopics(data,'tillit').some(t=>t.id==='absent'));
 assert.deepEqual(searchTopics(data,'  ').map(t=>t.short_label),data.map(t=>t.short_label).sort((a,b)=>a.localeCompare(b,'nb')));
 assert.equal(searchTopics(data,'<script>').length,0);
});

test('category view retains isolates and focus paths cannot travel outside the category',()=>{
 const nodes=[{id:'a',category_id:'x'},{id:'b',category_id:'y'},{id:'c',category_id:'x'},{id:'d',category_id:'x'}];
 const links=[{source:'a',target:'b',weight:.9},{source:'b',target:'c',weight:.9},{source:'a',target:'c',weight:.5}];
 assert.deepEqual(filterGraph(nodes,links,.8,null,2,'x'),{nodes:[nodes[0],nodes[2],nodes[3]],links:[]});
 assert.deepEqual(filterGraph(nodes,links,.8,'a',5,'x').nodes.map(t=>t.id),['a']);
 assert.deepEqual(filterGraph(nodes,links,.5,'a',1,'x').nodes.map(t=>t.id),['a','c']);
 assert.throws(()=>filterGraph(nodes,links,.8,'b',2,'x'),/focus/);
 assert.throws(()=>filterGraph(nodes,links,.8,null,2,'missing'),/category/);
});
test('a selected overlapping node remains the drag target when a layout is frozen',()=>{
  const selected={id:'a',x:0,y:0},overlap={id:'b',x:2,y:2};
  assert.equal(Graph.prototype.hitNode.call({nodes:[selected,overlap],selected:'a',world:(x,y)=>[x,y]},0,0),selected);
});
