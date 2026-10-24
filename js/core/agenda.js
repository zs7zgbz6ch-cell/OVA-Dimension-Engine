const hm=s=>{const[h,m]=s.split(":").map(Number);return h*60+m};
const dateMatch=(r,c)=>r.recurrence==="daily"||r.recurrence==="weekly"&&(r.weekdays||[]).includes(c.weekday)||r.recurrence==="monthly"&&(r.days||[]).includes(c.day)||r.recurrence==="yearly"&&(r.dates||[]).some(x=>x.month===c.month&&x.day===c.day)||r.recurrence==="once"&&r.date?.year===c.year&&r.date?.month===c.month&&r.date?.day===c.day;
const active=(b,c)=>{if(!dateMatch(b,c))return false;const n=c.hour*60+c.minute,s=hm(b.start),e=hm(b.end);return s<=e?n>=s&&n<e:n>=s||n<e};
export class AgendaBook{
 constructor(){this.map=new Map()} register(a){if(this.map.has(a.id))throw Error(`Duplicate agenda ${a.id}`);this.map.set(a.id,a)}
 resolve(id,c){const a=this.map.get(id);if(!a)throw Error(`Unknown agenda ${id}`);return a.blocks.filter(b=>active(b,c)).sort((x,y)=>(y.priority||0)-(x.priority||0))[0]||a.fallback||null}
}
