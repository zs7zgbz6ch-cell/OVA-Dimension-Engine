export class Simulation{
 constructor({gear,entities,agendas}){Object.assign(this,{gear,entities,agendas});this.log=[]}
 initialize(){this.evaluate(this.gear.snapshot(),"INITIALIZE")}
 advance(minutes){const x=this.gear.advance(minutes);for(let i=1;i<=minutes;i++){const t=x.old.epochMinute+i,d=new Date(t*60000);this.evaluate({year:d.getUTCFullYear()-1999,month:d.getUTCMonth()+1,day:d.getUTCDate(),weekday:d.getUTCDay(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),epochMinute:t},"TIME")}return x}
 evaluate(c,reason){for(const e of this.entities.all()){const i=this.agendas.resolve(e.agendaId,c);if(!i)continue;if(this.entities.apply(e.id,i,c.epochMinute))this.log.push({time:`${String(c.hour).padStart(2,"0")}:${String(c.minute).padStart(2,"0")}`,name:e.name,activity:e.state.activity,location:e.state.location,reason})}}
}
