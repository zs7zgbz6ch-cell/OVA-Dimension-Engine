export const RIONNE={id:"CHARACTER_01",name:"Rionne",kind:"character",agendaId:"AGENDA_RIONNE",content:{characterCard:true,assetFamily:"rionne"},start:{location:{scene:"RIONNES_ROOM",spot:"SPOT_02"},activity:"ROOM"}};
export const BARMAID={id:"NPC_01",name:"Barmaid",kind:"npc",agendaId:"AGENDA_BARMAID",content:{characterCard:false,assetFamily:"barmaid"},start:{location:{scene:"BERKLITH_TAVERN",spot:"SPOT_05"},activity:"WORK_BAR"}};
export const RIONNE_AGENDA={id:"AGENDA_RIONNE",fallback:{id:"RIONNE_FALLBACK",activity:"ROOM",destination:{scene:"RIONNES_ROOM",spot:"SPOT_02"},priority:-100},blocks:[
{id:"RIONNE_ROOM_AM",recurrence:"daily",start:"00:00",end:"07:00",activity:"ROOM",destination:{scene:"RIONNES_ROOM",spot:"SPOT_02"}},
{id:"RIONNE_WORK_AM",recurrence:"daily",start:"07:00",end:"10:00",activity:"WORK_BAR",destination:{scene:"BERKLITH_TAVERN",spot:"SPOT_04"}},
{id:"RIONNE_ROOM_DAY",recurrence:"daily",start:"10:00",end:"17:35",activity:"ROOM",destination:{scene:"RIONNES_ROOM",spot:"SPOT_02"}},
{id:"RIONNE_SEARCH",recurrence:"daily",start:"17:35",end:"17:55",priority:10,activity:"SEARCH_ROOM",destination:{scene:"RIONNES_ROOM",spot:"SPOT_02"}},
{id:"RIONNE_WORK_PM",recurrence:"daily",start:"17:55",end:"22:30",activity:"WORK_BAR",destination:{scene:"BERKLITH_TAVERN",spot:"SPOT_04"}},
{id:"RIONNE_ROOM_PM",recurrence:"daily",start:"22:30",end:"00:00",activity:"WIND_DOWN",destination:{scene:"RIONNES_ROOM",spot:"SPOT_02"}}]};
export const BARMAID_AGENDA={id:"AGENDA_BARMAID",fallback:{id:"BARMAID_OFF",activity:"OFF_DUTY",destination:{scene:"BERKLITH_TAVERN",spot:"SPOT_01"},priority:-100},blocks:[
{id:"BARMAID_WORK_AM",recurrence:"daily",start:"06:30",end:"09:00",activity:"WORK_BAR",destination:{scene:"BERKLITH_TAVERN",spot:"SPOT_05"}},
{id:"BARMAID_FLOOR",recurrence:"daily",start:"09:00",end:"09:20",priority:5,activity:"FLOOR_WORK",destination:{scene:"BERKLITH_TAVERN",spot:"SPOT_07"}},
{id:"BARMAID_WORK_DAY",recurrence:"daily",start:"09:20",end:"22:00",activity:"WORK_BAR",destination:{scene:"BERKLITH_TAVERN",spot:"SPOT_05"}}]};
