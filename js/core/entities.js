export class EntityRegistry{
 constructor(world){this.world=world;this.map=new Map()}
 register(d){if(this.map.has(d.id))throw Error(`Duplicate entity ${d.id}`);if(!this.world.has(d.start.location))throw Error(`Bad start for ${d.id}`);const e={...d,state:{location:structuredClone(d.start.location),agendaBlockId:null,activity:d.start.activity,sinceEpochMinute:null}};this.map.set(e.id,e);return e}
 all(){return[...this.map.values()]}
 apply(id,i,t){const e=this.map.get(id);if(!this.world.has(i.destination))throw Error(`Bad destination for ${id}`);const s=e.state,l=s.location,changed=s.agendaBlockId!==i.id||s.activity!==i.activity||l.scene!==i.destination.scene||l.spot!==i.destination.spot;if(changed)e.state={location:structuredClone(i.destination),agendaBlockId:i.id,activity:i.activity,sinceEpochMinute:t};return changed}
}
