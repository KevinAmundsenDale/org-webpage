import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterGraph,searchTopics} from '../src/graph-data.js';
import {Graph} from '../src/graph.js';
const {topics}=JSON.parse(await readFile(new URL('../data/topics.json',import.meta.url)));
const {edges}=JSON.parse(await readFile(new URL('../data/relationships.json',import.meta.url)));
test('complete graph, inclusive thresholds and isolated focus',()=>{
  assert.equal(filterGraph(topics,edges,.01).links.length,8646);
  assert.equal(filterGraph(topics,edges,.88).links.length,333);
  const isolated=filterGraph(topics,edges,1,'organisasjon');
  assert.deepEqual(isolated.nodes.map(n=>n.id),['organisasjon']);assert.equal(isolated.links.length,0);
  assert.equal(filterGraph(topics,edges,1).nodes.length,132);
});
test('focus follows every reachable hop, excludes other components and never invents edges',()=>{
  const nodes=['a','b','c','d'].map(id=>({id}));const links=[{source:'a',target:'b',weight:.9},{source:'b',target:'c',weight:.8},{source:'c',target:'d',weight:.2}];
  assert.deepEqual(filterGraph(nodes,links,.8,'a').nodes.map(n=>n.id),['a','b','c']);
  assert.equal(filterGraph(nodes,links,.8,'a').links.length,2);
  assert.throws(()=>filterGraph(nodes,links,.8,'unknown'));assert.throws(()=>filterGraph(nodes,links,0));
});
test('search understands Norwegian characters, aliases and names',()=>{
  assert.ok(searchTopics(topics,'malforskyvning').some(t=>t.id==='maalforskyvning'));
  assert.ok(searchTopics(topics,'Mintzberg').length>=5);
});
test('a selected overlapping node remains the drag target when a layout is frozen',()=>{
  const selected={id:'a',x:0,y:0},overlap={id:'b',x:2,y:2};
  assert.equal(Graph.prototype.hitNode.call({nodes:[selected,overlap],selected:'a',world:(x,y)=>[x,y]},0,0),selected);
});
