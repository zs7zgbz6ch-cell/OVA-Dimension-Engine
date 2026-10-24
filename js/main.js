import { loadWorld } from './core/world.js';
import { DimensionGear } from './core/dimension-gear.js';
import { AgendaBook } from './core/agenda.js';
import { EntityRegistry } from './core/entities.js';
import { Simulation } from './core/simulation.js';
import { Navigator } from './core/navigation.js';
import { SaveSystem } from './core/save.js';
import { RIONNE, BARMAID, RIONNE_AGENDA, BARMAID_AGENDA } from './content/data.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const SCENES = {
    BERKLITH_TAVERN: { title: 'MAIN TAVERN', sub: 'BERKLITH TAVERN', image: './assets/berklith-tavern.jpg' },
    RIONNES_ROOM: { title: "RIONNE'S ROOM", sub: 'UPSTAIRS · PRIVATE QUARTERS', image: './assets/rionnes-room.jpg' }
};
const app=$('#app'), scene=$('#scene'), overlay=$('#overlay'), preview=$('#preview'), fade=$('#fade'), toast=$('#toast');
const welcome=$('#welcomeScreen'), startupBlack=$('#startupBlack'), holdRing=$('#holdRing'), holdProgress=$('#holdProgress');
let currentScene='BERKLITH_TAVERN', targetScene=currentScene, motion=true, toastTimer, startupLeaving=false;

function say(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}
function page(id){$$('.page').forEach(node=>node.classList.toggle('active',node.id===id))}
function showScene(id){if(!SCENES[id])throw new Error(`Unknown presentation scene: ${id}`);currentScene=id;scene.style.backgroundImage=`url('${SCENES[id].image}')`}
function openMenu(){page('mainPage');updateClock();overlay.classList.add('open')}
function closeMenu(){overlay.classList.remove('open')}
function presentationState(){return {scene:currentScene,motion}}

async function boot(){
    const world=await loadWorld();
    const gear=new DimensionGear();
    const agendas=new AgendaBook();
    const entities=new EntityRegistry(world);
    agendas.register(RIONNE_AGENDA);agendas.register(BARMAID_AGENDA);
    entities.register(RIONNE);entities.register(BARMAID);
    const navigator=new Navigator({world,entities});
    const simulation=new Simulation({gear,entities,agendas,navigator});
    simulation.initialize();
    const saves=new SaveSystem({gear,entities});

    function updateClockLocal(){const el=$('#worldTimeReadout');if(el)el.textContent=`WORLD TIME · ${gear.format()}`}
    window.updateClock=updateClockLocal;
    updateClockLocal();showScene(currentScene);

    welcome.addEventListener('pointerup',()=>{
        if(startupLeaving)return;startupLeaving=true;startupBlack.classList.remove('reveal');startupBlack.classList.add('on');
        setTimeout(()=>welcome.classList.add('dismissed'),80);
        setTimeout(()=>{app.classList.remove('startup');startupBlack.classList.add('reveal');startupBlack.classList.remove('on')},1250);
        setTimeout(()=>startupBlack.classList.remove('reveal'),2900);
    });

    $('#closeBtn').addEventListener('click',closeMenu);
    overlay.addEventListener('click',event=>{if(event.target===overlay)closeMenu()});
    $$('[data-page]').forEach(button=>button.addEventListener('click',()=>page(button.dataset.page)));
    $$('.loc').forEach(button=>button.addEventListener('click',()=>{
        targetScene=button.dataset.scene;const data=SCENES[targetScene];$('#previewImg').src=data.image;$('#previewTitle').textContent=data.title;$('#previewSub').textContent=data.sub;preview.classList.add('open');
    }));
    $('#previewBack').addEventListener('click',()=>preview.classList.remove('open'));
    $('#goBtn').addEventListener('click',()=>{
        fade.classList.add('on');
        setTimeout(()=>{showScene(targetScene);preview.classList.remove('open');closeMenu();requestAnimationFrame(()=>requestAnimationFrame(()=>fade.classList.remove('on')))},720);
    });
    $$('[data-action]').forEach(button=>button.addEventListener('click',()=>{
        if(button.dataset.action==='save'){saves.save(presentationState());say('World saved.')}
        if(button.dataset.action==='load'){
            try{const state=saves.load();if(!state){say('No save data yet.');return}motion=state.motion!==false;document.documentElement.style.setProperty('--motion',motion?'1':'0');$('#motionBtn').textContent=`MENU MOTION · ${motion?'ON':'REDUCED'}`;showScene(SCENES[state.scene]?state.scene:'BERKLITH_TAVERN');updateClockLocal();closeMenu();say('Save loaded.')}catch(error){console.error(error);say('Save could not be loaded.')}
        }
    }));
    $('#motionBtn').addEventListener('click',event=>{motion=!motion;document.documentElement.style.setProperty('--motion',motion?'1':'0');event.currentTarget.textContent=`MENU MOTION · ${motion?'ON':'REDUCED'}`;say(motion?'Full menu motion.':'Reduced menu motion.')});
    $$('[data-dev-min]').forEach(button=>button.addEventListener('click',()=>{simulation.advance(Number(button.dataset.devMin));updateClockLocal()}));
    $('#resetBtn').addEventListener('click',()=>$('#confirm').classList.add('open'));
    $('#cancelReset').addEventListener('click',()=>$('#confirm').classList.remove('open'));
    $('#confirmReset').addEventListener('click',()=>{saves.clear();location.reload()});

    let holdTimer=null,holdStart=0,holdX=0,holdY=0,holding=false;const HOLD_MS=840,MOVE_LIMIT=18;
    function blocked(target){return !!target.closest('button,.overlay,.preview,.confirm,.welcome-screen,.interactive,[data-interactive]')||overlay.classList.contains('open')||preview.classList.contains('open')||$('#confirm').classList.contains('open')||!welcome.classList.contains('dismissed')}
    function clearHold(){holding=false;clearTimeout(holdTimer);holdTimer=null;holdRing.classList.remove('visible','complete');holdProgress.style.strokeDashoffset='100'}
    function updateRing(){if(!holding)return;const progress=Math.max(0,Math.min(1,(performance.now()-holdStart)/HOLD_MS));holdProgress.style.strokeDashoffset=String(100-progress*100);if(progress<1)requestAnimationFrame(updateRing)}
    app.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;if(blocked(event.target))return;holding=true;holdStart=performance.now();holdX=event.clientX;holdY=event.clientY;holdRing.style.left=event.clientX+'px';holdRing.style.top=event.clientY+'px';holdRing.classList.add('visible');requestAnimationFrame(updateRing);holdTimer=setTimeout(()=>{if(!holding)return;holdRing.classList.add('complete');holding=false;setTimeout(()=>{clearHold();openMenu()},120)},HOLD_MS)});
    app.addEventListener('pointermove',event=>{if(holding&&Math.hypot(event.clientX-holdX,event.clientY-holdY)>MOVE_LIMIT)clearHold()});
    app.addEventListener('pointerup',clearHold);app.addEventListener('pointercancel',clearHold);app.addEventListener('pointerleave',clearHold);

    window.OVAD={world,gear,agendas,entities,navigator,simulation,saves};
}
function updateClock(){window.updateClock?.()}

document.addEventListener('gesturestart',event=>event.preventDefault(),{passive:false});
document.addEventListener('contextmenu',event=>event.preventDefault());
document.addEventListener('selectstart',event=>event.preventDefault());
document.addEventListener('dragstart',event=>event.preventDefault());
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
boot().catch(error=>{console.error(error);welcome.classList.add('dismissed');say(`BOOT ERROR · ${error.message}`)});
