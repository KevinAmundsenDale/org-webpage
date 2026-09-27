export function filterGraph(topics, edges, threshold, focusId = null, maxDistance = 2) {
  if (!Number.isFinite(threshold) || threshold < .01 || threshold > 1) throw new Error('Invalid threshold');
  if (!Number.isInteger(maxDistance) || maxDistance < 1 || maxDistance > 5) throw new Error('Invalid focus distance');
  const ids = new Set(topics.map(t => t.id));
  if (focusId && !ids.has(focusId)) throw new Error('Unknown focus topic');
  const links = edges.filter(e => e.weight >= threshold);
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
  const q = normalize(query.trim());
  return topics.filter(t => normalize([t.title, t.short_label, ...t.aliases, ...t.tags, ...t.attribution.map(a=>a.name)].join(' ')).includes(q))
    .sort((a,b) => Number(normalize(b.short_label).startsWith(q))-Number(normalize(a.short_label).startsWith(q)) || a.short_label.localeCompare(b.short_label,'nb'));
}
