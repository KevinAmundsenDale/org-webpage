import {forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY, select, zoom, zoomIdentity} from 'd3';

export const RADIUS=56;
export const PALETTE=['#416eab','#398c89','#6b63ae','#b87636','#af5e81','#588449','#c66c55','#397eab','#897241','#8270a4','#3f8c75','#ad5871'];
export class Graph {
  constructor(canvas, categories, callbacks) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.callbacks=callbacks;this.categories=categories;
    this.colors=new Map(categories.map((c,i)=>[c.id,PALETTE[i%PALETTE.length]]));
    this.pool=new Map();this.nodes=[];this.links=[];this.transform=zoomIdentity;this.dynamic=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sim=forceSimulation().stop().alphaDecay(.035).velocityDecay(.45).force('charge',forceManyBody().strength(-650).distanceMax(1600)).force('collision',forceCollide(RADIUS+13).iterations(3)).on('tick',()=>{if(this.centered)this.center(this.centered,false);this.schedule();});
    this.zoom=zoom().scaleExtent([.1,4]).filter(e=>e.type==='wheel'||(!e.button&&!this.hitNode(e.offsetX??e.touches?.[0]?.clientX,e.offsetY??e.touches?.[0]?.clientY))).on('zoom',e=>{if(e.sourceEvent)this.centered=null;this.transform=e.transform;this.callbacks.zoom?.(Math.round(e.transform.k*100));this.schedule();});
    select(canvas).call(this.zoom).on('dblclick.zoom',null);
    canvas.addEventListener('pointerdown',e=>this.pointerDown(e));
    canvas.addEventListener('pointermove',e=>this.pointerMove(e));
    canvas.addEventListener('pointerup',e=>this.pointerUp(e));
    canvas.addEventListener('pointercancel',e=>this.pointerUp(e));
    canvas.addEventListener('contextmenu',e=>{e.preventDefault();const n=this.hitNode(e.offsetX,e.offsetY);if(n){this.select(n.id);this.callbacks.details(n.id);}});
    canvas.addEventListener('dblclick',e=>{const n=this.hitNode(e.offsetX,e.offsetY);if(n)this.callbacks.details(n.id);});
    canvas.addEventListener('pointerleave',()=>{if(!this.drag){this.hover=null;this.callbacks.hover(null);this.schedule();}});
    canvas.addEventListener('keydown',e=>{
      if(e.key==='+'||e.key==='='){e.preventDefault();this.scale(1.25);}else if(e.key==='-'){e.preventDefault();this.scale(.8);}
      else if(e.key==='0'){e.preventDefault();this.fit();}
      else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();this.pan(e.key==='ArrowLeft'?80:e.key==='ArrowRight'?-80:0,e.key==='ArrowUp'?80:e.key==='ArrowDown'?-80:0);}
      else if((e.key==='Enter'||e.key==='ContextMenu')&&this.selected)this.callbacks.details(this.selected);
    });
    new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);
  }
  update(topics,edges,focus=null) {
    this.focus=focus;
    const n=topics.length;
    this.nodes=topics.map((t,i)=>{
      let node=this.pool.get(t.id);
      if(!node){const angle=i*Math.PI*(3-Math.sqrt(5)),radius=110*Math.sqrt(i);node={id:t.id,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};this.pool.set(t.id,node);}
      Object.assign(node,{label:t.short_label,title:t.title,category_id:t.category_id});node.fx=null;node.fy=null;
      return node;
    });
    const byid=new Map(this.nodes.map(n=>[n.id,n]));
    this.links=edges.map(e=>({...e,source:byid.get(e.source),target:byid.get(e.target)}));
    this.sim.nodes(this.nodes);
    this.sim.force('links',forceLink(this.links).id(n=>n.id).distance(e=>155+(1-e.weight)*200).strength(Math.min(.48,16/Math.max(16,edges.length/Math.max(n,1)))));
    const origin=focus?byid.get(focus):{x:0,y:0};
    this.origin={x:origin?.x||0,y:origin?.y||0};
    this.sim.force('x',forceX(this.origin.x).strength(.018)).force('y',forceY(this.origin.y).strength(.018));
    this.sim.alpha(.72);
    if(this.dynamic)this.sim.restart();else this.sim.stop();
    this.schedule();
  }
  setDynamic(value){this.dynamic=value;if(value)this.sim.alpha(.4).restart();else this.sim.stop();this.schedule();}
  settle(ticks=160){this.sim.stop();this.sim.tick(ticks);if(this.dynamic)this.sim.alpha(.08).restart();this.schedule();}
  resize(){const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);if(this.centered&&this.pool.has(this.centered))this.center(this.centered,false);this.schedule();}
  schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=null;this.draw();});}
  world(x,y){return this.transform.invert([x,y]);}
  screen(n){return this.transform.apply([n.x,n.y]);}
  hitNode(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return null;const p=this.world(x,y);for(let i=this.nodes.length-1;i>=0;i--){const n=this.nodes[i];if(Math.hypot(n.x-p[0],n.y-p[1])<=RADIUS)return n;}return null;}
  hitEdge(x,y){const p=this.world(x,y),limit=7/this.transform.k;let best=null,distance=limit;for(const e of this.links){const a=e.source,b=e.target,dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(.05,Math.min(.95,((p[0]-a.x)*dx+(p[1]-a.y)*dy)/(dx*dx+dy*dy||1)));const d=Math.hypot(p[0]-a.x-t*dx,p[1]-a.y-t*dy);if(d<distance){distance=d;best=e;}}return best;}
  pointerDown(e){if(e.button!==0)return;this.down={x:e.offsetX,y:e.offsetY};const n=this.hitNode(e.offsetX,e.offsetY);if(!n)return;this.drag={node:n,x:e.offsetX,y:e.offsetY,moved:false};this.centered=null;this.canvas.setPointerCapture(e.pointerId);n.fx=n.x;n.fy=n.y;if(this.dynamic)this.sim.alphaTarget(.15).restart();}
  pointerMove(e){if(this.drag){const d=this.drag;if(Math.hypot(e.offsetX-d.x,e.offsetY-d.y)>4)d.moved=true;if(d.moved){const[x,y]=this.world(e.offsetX,e.offsetY);Object.assign(d.node,{fx:x,fy:y,x,y});this.schedule();}return;}
    const node=this.hitNode(e.offsetX,e.offsetY),edge=node?null:this.hitEdge(e.offsetX,e.offsetY);this.hover=node?.id||null;this.hoverEdge=edge;this.canvas.style.cursor=node?'grab':edge?'pointer':'grab';this.callbacks.hover(node?{text:node.title+' · Høyreklikk for detaljer',x:e.offsetX,y:e.offsetY}:edge?{text:`${edge.source.label} ↔ ${edge.target.label} · ${edge.weight.toFixed(2)} · Klikk for forklaring`,x:e.offsetX,y:e.offsetY}:null);this.schedule();
  }
  pointerUp(e){if(this.drag){const d=this.drag;this.drag=null;d.node.fx=null;d.node.fy=null;this.sim.alphaTarget(0);if(this.dynamic)this.sim.alpha(.3).restart();if(!d.moved){this.select(d.node.id);this.callbacks.select(d.node.id);}if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.schedule();}else if(this.down&&Math.hypot(e.offsetX-this.down.x,e.offsetY-this.down.y)<4&&e.button===0){const edge=this.hitEdge(e.offsetX,e.offsetY);if(edge)this.callbacks.edge(edge);}this.down=null;}
  select(id){this.selected=id;this.center(id,true);if(this.dynamic)this.sim.alpha(.18).restart();this.schedule();}
  center(id,zoomIn=true){const n=this.pool.get(id);if(!n)return;this.centered=id;const k=zoomIn?Math.max(this.transform.k,.95):this.transform.k;select(this.canvas).call(this.zoom.transform,zoomIdentity.translate(this.w/2-n.x*k,this.h/2-n.y*k).scale(k));}
  fit(){if(!this.nodes.length)return;this.centered=null;const xs=this.nodes.map(n=>n.x),ys=this.nodes.map(n=>n.y),minX=Math.min(...xs)-RADIUS-35,maxX=Math.max(...xs)+RADIUS+35,minY=Math.min(...ys)-RADIUS-35,maxY=Math.max(...ys)+RADIUS+35;const k=Math.max(.1,Math.min(1.25,(this.w-70)/(maxX-minX),(this.h-140)/(maxY-minY)));select(this.canvas).call(this.zoom.transform,zoomIdentity.translate(this.w/2-(minX+maxX)/2*k,this.h/2+15-(minY+maxY)/2*k).scale(k));}
  scale(factor){this.centered=null;select(this.canvas).call(this.zoom.scaleBy,factor);}
  pan(x,y){this.centered=null;select(this.canvas).call(this.zoom.translateBy,x/this.transform.k,y/this.transform.k);}
  wrap(label){const c=this.ctx;let size=14,lines=[];for(;size>=10;size--){c.font=`600 ${size}px "Segoe UI",sans-serif`;const words=label.split(/\s+/);if(size>10&&words.some(word=>c.measureText(word).width>94))continue;lines=[''];for(const word of words){let parts=[word];if(c.measureText(word).width>94){const count=Math.ceil(c.measureText(word).width/85),length=Math.ceil(word.length/count);parts=[];for(let i=0;i<word.length;i+=length)parts.push(word.slice(i,i+length)+(i+length<word.length?'-':''));}for(const part of parts){const i=lines.length-1,candidate=lines[i]?lines[i]+' '+part:part;if(c.measureText(candidate).width>94&&lines[i])lines.push(part);else lines[i]=candidate;}}if(lines.length<=4)break;}return {size:Math.max(10,size),lines};}
  draw(){if(!this.w||!this.h)return;const c=this.ctx,k=this.transform.k;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.w,this.h);c.save();c.translate(this.transform.x,this.transform.y);c.scale(k,k);
    const selected=this.selected||this.focus,adjacent=new Set([selected]);if(selected)for(const e of this.links){if(e.source.id===selected)adjacent.add(e.target.id);if(e.target.id===selected)adjacent.add(e.source.id);}
    const ordered=[...this.links].sort((a,b)=>Number(a.source.id===selected||a.target.id===selected)-Number(b.source.id===selected||b.target.id===selected));
    for(const e of ordered){const strong=e.source.id===selected||e.target.id===selected,hover=e===this.hoverEdge;c.beginPath();c.moveTo(e.source.x,e.source.y);c.lineTo(e.target.x,e.target.y);c.strokeStyle=hover?'#107e84':strong?'#7cacae':this.links.length>1500?'#8ba1b51a':'#8ba1b54a';c.lineWidth=(hover?2.4:strong?1.6:.85)/k;c.stroke();}
    // Place every on-screen edge weight along its line, preferring free space.
    // A spatial grid avoids an all-pairs label collision pass at low thresholds.
    const dense=this.links.length>700;
    const grid=new Map(),cells=box=>{const result=[];for(let x=Math.floor(box.x/48);x<=Math.floor((box.x+box.w)/48);x++)for(let y=Math.floor(box.y/48);y<=Math.floor((box.y+box.h)/48);y++)result.push(x+','+y);return result;};
    const occupy=box=>{for(const key of cells(box)){if(!grid.has(key))grid.set(key,[]);grid.get(key).push(box);}};
    const collisions=box=>{const seen=new Set();let score=0;for(const key of cells(box))for(const b of grid.get(key)||[]){if(seen.has(b))continue;seen.add(b);if(box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y)score+=b.node?10:1;}return score;};
    if(!dense)for(const n of this.nodes){const[x,y]=this.screen(n);occupy({x:x-RADIUS*k,y:y-RADIUS*k,w:RADIUS*k*2,h:RADIUS*k*2,node:true});}
    c.textAlign='center';c.textBaseline='middle';
    for(const e of [...ordered].reverse()){const strong=e.source.id===selected||e.target.id===selected,hover=e===this.hoverEdge;const size=Math.max(10,Math.min(13,11/k));c.font=`${strong||hover?650:500} ${size}px "Segoe UI",sans-serif`;const width=c.measureText(e.weight.toFixed(2)).width+8,height=size+5;let best=null;
      for(const t of dense?[.5]:[.5,.4,.6,.3,.7,.2,.8]){const x=e.source.x+(e.target.x-e.source.x)*t,y=e.source.y+(e.target.y-e.source.y)*t,[sx,sy]=this.transform.apply([x,y]);if(sx<0||sx>this.w||sy<0||sy>this.h)continue;const box={x:sx-width*k/2-2,y:sy-height*k/2-2,w:width*k+4,h:height*k+4},score=dense?0:collisions(box);if(!best||score<best.score)best={x,y,box,score};if(score===0)break;}if(!best)continue;if(!dense)occupy(best.box);const{x,y}=best;c.fillStyle=hover?'#167c82':strong?'#eff8f7':'#f7f9fce8';c.beginPath();c.roundRect(x-width/2,y-height/2,width,height,3);c.fill();c.fillStyle=hover?'white':strong?'#287b80':'#71879b';c.fillText(e.weight.toFixed(2),x,y+.5);
    }
    for(const n of this.nodes){const[sx,sy]=this.screen(n);if(sx<-RADIUS*k||sy<-RADIUS*k||sx>this.w+RADIUS*k||sy>this.h+RADIUS*k)continue;const color=this.colors.get(n.category_id)||'#416eab',active=n.id===selected;const hovered=n.id===this.hover;c.globalAlpha=1;c.beginPath();c.arc(n.x,n.y,RADIUS,0,Math.PI*2);c.fillStyle=active?color:'#ffffff';c.shadowColor='#19354d14';c.shadowBlur=active?16:6;c.shadowOffsetY=2;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.globalAlpha=selected&&!adjacent.has(n.id)? .63:1;c.strokeStyle=color;c.lineWidth=active?3:hovered?2.5:1.6;c.stroke();
      if(n.id===this.focus){c.beginPath();c.arc(n.x,n.y,RADIUS+6,0,Math.PI*2);c.setLineDash([3,4]);c.lineWidth=1.5;c.stroke();c.setLineDash([]);}
      const layout=this.wrap(n.label);c.font=`${active?650:600} ${layout.size}px "Segoe UI",sans-serif`;c.fillStyle=active?'#ffffff':'#244057';c.textAlign='center';c.textBaseline='middle';layout.lines.forEach((line,i)=>c.fillText(line,n.x,n.y+(i-(layout.lines.length-1)/2)*(layout.size+3)));c.globalAlpha=1;
    }c.restore();
  }
  snapshot(){return {dynamic:this.dynamic,selected:this.selected,focus:this.focus,zoom:this.transform.k,width:this.w,height:this.h,nodes:this.nodes.map(n=>({id:n.id,x:n.x,y:n.y,screen:this.screen(n),radius:RADIUS})),edgeCount:this.links.length};}
}
