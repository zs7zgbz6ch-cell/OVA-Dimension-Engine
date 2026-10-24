export class World{
 constructor(d){this.data=d;this.nodes=new Map();this.edges=new Map();
  for(const [sceneId,scene] of Object.entries(d.scenes))for(const spot of scene.spots){const k=this.key(sceneId,spot.id);this.nodes.set(k,{scene:sceneId,...spot});this.edges.set(k,new Set())}
  for(const {a,b} of d.connections){const A=this.key(a.scene,a.spot),B=this.key(b.scene,b.spot);if(!this.nodes.has(A)||!this.nodes.has(B))throw Error(`Bad World edge ${A} ↔ ${B}`);this.edges.get(A).add(B);this.edges.get(B).add(A)}
 } key(s,p){return `${s}/${p}`} has(l){return l&&this.nodes.has(this.key(l.scene,l.spot))}
 findPath(a,b){const A=this.key(a.scene,a.spot),B=this.key(b.scene,b.spot);if(!this.nodes.has(A)||!this.nodes.has(B))return null;const q=[A],prev=new Map([[A,null]]);
  while(q.length){const c=q.shift();if(c===B){const out=[];for(let x=B;x;x=prev.get(x))out.push(this.nodes.get(x));return out.reverse()}for(const n of this.edges.get(c)){if(!prev.has(n)){prev.set(n,c);q.push(n)}}}return null}
}
export async function loadWorld(){const r=await fetch("./world/world-stage.json",{cache:"no-store"});if(!r.ok)throw Error(`World load ${r.status}`);return new World(await r.json())}
