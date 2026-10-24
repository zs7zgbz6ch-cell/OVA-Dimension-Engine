const M=60000;
export class DimensionGear{
 constructor(){this.date=new Date(Date.UTC(2000,0,1,6,55))}
 get epochMinute(){return Math.floor(this.date.getTime()/M)}
 snapshot(){const d=this.date;return{year:d.getUTCFullYear()-1999,month:d.getUTCMonth()+1,day:d.getUTCDate(),weekday:d.getUTCDay(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),epochMinute:this.epochMinute}}
 advance(minutes){if(!Number.isInteger(minutes)||minutes<0)throw Error("Invalid time advance");const old=this.snapshot();this.date=new Date(this.date.getTime()+minutes*M);return{old,now:this.snapshot()}}
 format(){const s=this.snapshot(),wd=["SUN","MON","TUE","WED","THU","FRI","SAT"];return`Y${s.year} · M${String(s.month).padStart(2,"0")} · D${String(s.day).padStart(2,"0")} · ${wd[s.weekday]} · ${String(s.hour).padStart(2,"0")}:${String(s.minute).padStart(2,"0")}`}
}
