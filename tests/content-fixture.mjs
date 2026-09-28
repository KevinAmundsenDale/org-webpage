import {readFile} from 'node:fs/promises';
import {filterGraph} from '../src/graph-data.js';
export const {topics}=JSON.parse(await readFile(new URL('../data/topics.json',import.meta.url)));
export const {edges}=JSON.parse(await readFile(new URL('../data/relationships.json',import.meta.url)));
// UI/desktop smoke tests compare the controls with the current shipped dataset.
// Independent, hand-authored graph fixtures test the algorithm in graph.test.mjs.
export const visibleAtDefault=edges.filter(e=>e.weight>=.88).length;
export const focusedCount=distance=>filterGraph(topics,edges,.88,'organisasjon',distance).nodes.length;
