import { loadWorld } from './core/world.js';
import { DimensionGear } from './core/dimension-gear.js';
import { AgendaBook } from './core/agenda.js';
import { EntityRegistry } from './core/entities.js';
import { PlayerState } from './core/player.js';
import { Simulation } from './core/simulation.js';
import { Navigator } from './core/navigation.js';
import { SaveSystem } from './core/save.js';
import { TravelSystem } from './core/travel.js';
import { RIONNE, BARMAID, RIONNE_AGENDA, BARMAID_AGENDA } from './content/data.js';
import { GAME_START, SCENE_CONTENT } from './content/game.js';
import { buildLabel } from './content/build.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const app=$('#app'), scene=$('#scene'), overlay=$('#overlay'), preview=$('#preview'), fade=$('#fade'), toast=$('#toast');
const welcome=$('#welcomeScreen'), startupBlack=$('#startupBlack'), holdRing=$('#holdRing'), holdProgress=$('#holdProgress');
const buildPlaque=$('#buildPlaque'), rotationMask=$('#rotationMask');
let targetScene=null, motion=true, toastTimer, startupLeaving=false;

function say(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}
function page(id){$$('.page').forEach(node=>node.classList.toggle('active',node.id===id))}
function sceneMeta(world, sceneId){
    const worldScene=world.scene(sceneId);
    if(!worldScene) throw new Error(`Unknown World scene: ${sceneId}`);
    const presentation=SCENE_CONTENT[sceneId] || {};
    return {
        title: presentation.title || sceneId.replaceAll('_',' '),
        subtitle: presentation.subtitle || '',
        image: worldScene.background ? `./${worldScene.background.replace(/^\.\//,'')}` : ''
    };
}
function renderPlayerScene(world, player){
    const data=sceneMeta(world,player.sceneId);
    scene.style.backgroundImage=data.image?`url('${data.image}')`:'none';
    scene.dataset.scene=player.sceneId;
}
function renderLocations(world, player){
    const list=$('#locationList');list.replaceChildren();
    for(const sceneId of player.discoveredScenes){
        if(!world.hasScene(sceneId))continue;
        const data=sceneMeta(world,sceneId);
        const button=document.createElement('button');button.className='loc';button.type='button';button.dataset.scene=sceneId;
        const img=document.createElement('img');img.src=data.image;img.alt='';
        const text=document.createElement('span');text.className='loctext';
        const name=document.createElement('span');name.className='locname';name.textContent=data.title;
        const meta=document.createElement('span');meta.className='locmeta';meta.textContent=data.subtitle;
        text.append(name,meta);button.append(img,text);list.append(button);
    }
}
function presentationState(){return {motion}}

async function boot(){
    const world=await loadWorld();
    const gear=new DimensionGear();
    const agendas=new AgendaBook();
    const entities=new EntityRegistry(world);
    const player=new PlayerState({world,start:GAME_START});
    player.setInteraction('STARTUP');
    agendas.register(RIONNE_AGENDA);agendas.register(BARMAID_AGENDA);
    entities.register(RIONNE);entities.register(BARMAID);
    const navigator=new Navigator({world,entities});
    const simulation=new Simulation({gear,entities,agendas,navigator});
    simulation.initialize();
    const travel=new TravelSystem({world,player});
    const saves=new SaveSystem({gear,entities,player});

    function updateClockLocal(){const el=$('#worldTimeReadout');if(el)el.textContent=`WORLD TIME · ${gear.format()}`}
    function openMenu(){page('mainPage');updateClockLocal();player.setInteraction('MENU');overlay.classList.add('open')}
    function closeMenu(){overlay.classList.remove('open');player.setInteraction('FREE')}
    function openLocationPreview(sceneId){
        if(!travel.canTravelTo(sceneId))return;
        targetScene=sceneId;
        const data=sceneMeta(world,sceneId);
        $('#previewImg').src=data.image;$('#previewTitle').textContent=data.title;$('#previewSub').textContent=data.subtitle;preview.classList.add('open');
    }
    function travelToTarget(){
        if(!targetScene || !travel.canTravelTo(targetScene))return;
        player.setInteraction('TRAVEL');fade.classList.add('on');
        setTimeout(()=>{
            travel.travelTo(targetScene);targetScene=null;renderPlayerScene(world,player);preview.classList.remove('open');overlay.classList.remove('open');
            requestAnimationFrame(()=>requestAnimationFrame(()=>{fade.classList.remove('on');player.setInteraction('FREE')}));
        },720);
    }

    buildPlaque.textContent=buildLabel();
    renderLocations(world,player);updateClockLocal();renderPlayerScene(world,player);

    welcome.addEventListener('pointerup',()=>{
        if(startupLeaving)return;startupLeaving=true;startupBlack.classList.remove('reveal');startupBlack.classList.add('on');
        setTimeout(()=>welcome.classList.add('dismissed'),80);
        setTimeout(()=>{app.classList.remove('startup');startupBlack.classList.add('reveal');startupBlack.classList.remove('on');player.setInteraction('FREE')},1250);
        setTimeout(()=>startupBlack.classList.remove('reveal'),2900);
    });

    $('#closeBtn').addEventListener('click',closeMenu);
    overlay.addEventListener('click',event=>{if(event.target===overlay)closeMenu()});
    $$('[data-page]').forEach(button=>button.addEventListener('click',()=>page(button.dataset.page)));
    $('#locationList').addEventListener('click',event=>{const button=event.target.closest('.loc');if(button)openLocationPreview(button.dataset.scene)});
    $('#previewBack').addEventListener('click',()=>{preview.classList.remove('open');targetScene=null});
    $('#goBtn').addEventListener('click',travelToTarget);
    $$('[data-action]').forEach(button=>button.addEventListener('click',()=>{
        if(button.dataset.action==='save'){saves.save(presentationState());say('World saved.')}
        if(button.dataset.action==='load'){
            try{
                const state=saves.load();if(!state){say('No save data yet.');return}
                motion=state.motion!==false;document.documentElement.style.setProperty('--motion',motion?'1':'0');$('#motionBtn').textContent=`MENU MOTION · ${motion?'ON':'REDUCED'}`;
                renderPlayerScene(world,player);renderLocations(world,player);updateClockLocal();closeMenu();say('Save loaded.');
            }catch(error){console.error(error);say('Save could not be loaded.')}
        }
    }));
    $('#motionBtn').addEventListener('click',event=>{motion=!motion;document.documentElement.style.setProperty('--motion',motion?'1':'0');event.currentTarget.textContent=`MENU MOTION · ${motion?'ON':'REDUCED'}`;say(motion?'Full menu motion.':'Reduced menu motion.')});
    $$('[data-dev-min]').forEach(button=>button.addEventListener('click',()=>{simulation.advance(Number(button.dataset.devMin));updateClockLocal()}));
    $('#resetBtn').addEventListener('click',()=>$('#confirm').classList.add('open'));
    $('#cancelReset').addEventListener('click',()=>$('#confirm').classList.remove('open'));
    $('#confirmReset').addEventListener('click',()=>{saves.clear();location.reload()});

    let holdDelayTimer=null,holdTimer=null,holdStart=0,holdX=0,holdY=0,holding=false,ringActive=false;
    const HOLD_DELAY_MS=180,HOLD_FILL_MS=500,MOVE_LIMIT=18;
    function blocked(target){return !!target.closest('button,.overlay,.preview,.confirm,.welcome-screen,.interactive,[data-interactive]')||overlay.classList.contains('open')||preview.classList.contains('open')||$('#confirm').classList.contains('open')||!welcome.classList.contains('dismissed')}
    function clearHold(){holding=false;ringActive=false;clearTimeout(holdDelayTimer);clearTimeout(holdTimer);holdDelayTimer=null;holdTimer=null;holdRing.classList.remove('visible','complete');holdProgress.style.strokeDashoffset='100'}
    function updateRing(){if(!holding||!ringActive)return;const progress=Math.max(0,Math.min(1,(performance.now()-holdStart)/HOLD_FILL_MS));holdProgress.style.strokeDashoffset=String(100-progress*100);if(progress<1)requestAnimationFrame(updateRing)}
    function beginRing(){if(!holding)return;ringActive=true;holdStart=performance.now();holdRing.classList.add('visible');requestAnimationFrame(updateRing);holdTimer=setTimeout(()=>{if(!holding||!ringActive)return;holdRing.classList.add('complete');holding=false;ringActive=false;holdTimer=null;requestAnimationFrame(()=>{holdRing.classList.remove('visible','complete');holdProgress.style.strokeDashoffset='100';openMenu()})},HOLD_FILL_MS)}
    app.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;if(blocked(event.target))return;clearHold();holding=true;holdX=event.clientX;holdY=event.clientY;holdRing.style.left=event.clientX+'px';holdRing.style.top=event.clientY+'px';holdDelayTimer=setTimeout(beginRing,HOLD_DELAY_MS)});
    app.addEventListener('pointermove',event=>{if(holding&&Math.hypot(event.clientX-holdX,event.clientY-holdY)>MOVE_LIMIT)clearHold()});
    app.addEventListener('pointerup',clearHold);app.addEventListener('pointercancel',clearHold);app.addEventListener('pointerleave',clearHold);

    window.OVAD={world,gear,agendas,entities,player,navigator,simulation,travel,saves};
}

// Orientation belongs to the shell. It never changes Player or World state.
// One settle controller owns both orientation and viewport resize notifications.
let rotationSettleTimer = null;
let rotationStartedAt = 0;
let lastViewport = null;
const ROTATION_QUIET_MS = 220;
const ROTATION_MAX_MS = 1600;
function viewportSize(){
    const view = window.visualViewport;
    return [Math.round(view?.width ?? innerWidth), Math.round(view?.height ?? innerHeight)];
}
function finishRotationWhenStable(){
    const current = viewportSize();
    const stable = lastViewport && current.every((value,index)=>Math.abs(value-lastViewport[index])<=1);
    lastViewport = current;
    if(stable || performance.now()-rotationStartedAt >= ROTATION_MAX_MS){
        rotationMask.classList.remove('active');
        rotationSettleTimer = null;
        return;
    }
    rotationSettleTimer = setTimeout(finishRotationWhenStable, ROTATION_QUIET_MS);
}
function stabilizeOrientation(){
    if(!rotationMask.classList.contains('active')) rotationStartedAt=performance.now();
    rotationMask.classList.add('active');
    lastViewport=null;
    clearTimeout(rotationSettleTimer);
    rotationSettleTimer=setTimeout(finishRotationWhenStable, ROTATION_QUIET_MS);
}
window.addEventListener('orientationchange',stabilizeOrientation);
window.addEventListener('resize',stabilizeOrientation);
window.visualViewport?.addEventListener('resize',stabilizeOrientation);

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
boot().catch(error=>{console.error(error);welcome.classList.add('dismissed');say(`BOOT ERROR · ${error.message}`)});
