export function filterGraph(topics, edges, threshold, focusId = null, maxDistance = 2, categoryId = null) {
  if (!Number.isFinite(threshold) || threshold < .01 || threshold > 1) throw new Error('Invalid threshold');
  if (!Number.isInteger(maxDistance) || maxDistance < 1 || maxDistance > 5) throw new Error('Invalid focus distance');
  if(categoryId&&!topics.some(t=>t.category_id===categoryId))throw new Error('Unknown category');
  topics=categoryId?topics.filter(t=>t.category_id===categoryId):topics;
  const ids = new Set(topics.map(t => t.id));
  if (focusId && !ids.has(focusId)) throw new Error('Unknown focus topic');
  const links = edges.filter(e => e.weight >= threshold && ids.has(e.source) && ids.has(e.target));
  if (!focusId) return { nodes: topics, links };
  const adjacency = new Map([...ids].map(id => [id, []]));
  for (const e of links) { adjacency.get(e.source)?.push(e.target); adjacency.get(e.target)?.push(e.source); }
  // Breadth-first search measures the shortest path using only visible edges.
  const reachable = new Map([[focusId, 0]]), queue = [focusId];
  for (let i = 0; i < queue.length; i++) {
    const distance = reachable.get(queue[i]);
    if (distance >= maxDistance) continue;
    for (const id of adjacency.get(queue[i])) {
      if (!reachable.has(id)) { reachable.set(id, distance + 1); queue.push(id); }
    }
  }
  return { nodes: topics.filter(t => reachable.has(t.id)), links: links.filter(e => reachable.has(e.source) && reachable.has(e.target)) };
}
export const normalize = value => value.toLocaleLowerCase('nb').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('ø', 'o').replaceAll('æ', 'ae');
export function searchTopics(topics, query) {
  return searchTopicMatches(topics,query).map(result=>result.topic);
}
export function searchTopicMatches(topics,query){
  const q=normalize(query.trim()).replace(/\s+/g,' ');
  const clean=s=>normalize(String(s??'')).replace(/\s+/g,' ');
  const occurrences=s=>q?s.split(q).length-1:0;
  return topics.map(topic=>{
    const names=[topic.title,topic.short_label,...(topic.aliases||[]),...(topic.attribution||[]).map(a=>a.name)].map(clean);
    const c=topic.content||{},a=topic.analysis||{};
    const body=clean([c.short_definition,c.explanation,...(c.key_points||[]),...(c.examples||[]).flatMap(e=>[e.title,e.text]),...(c.expressions||[]).flatMap(e=>[e.latex,e.explanation]),...(topic.tags||[]),...(a.central_questions||[]),...(a.mechanisms||[]),...(a.writing_uses||[]),...(a.limitations_and_tensions||[]),topic._edit?.notes].filter(Boolean).join('\n'));
    const rank=!q?0:names.includes(q)?0:names.some(n=>n.startsWith(q))?1:names.some(n=>n.includes(q))?2:3;
    return {topic,matchKind:rank<3?'name':'body',count:occurrences(body),rank};
  }).filter(r=>r.rank<3||r.count>0).sort((a,b)=>a.rank-b.rank||(q?b.count-a.count:0)||a.topic.short_label.localeCompare(b.topic.short_label,'nb'));
}
