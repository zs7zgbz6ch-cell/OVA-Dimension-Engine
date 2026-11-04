import { loadWorld } from './core/world.js';
import { DimensionGear } from './core/dimension-gear.js';
import { AgendaBook } from './core/agenda.js';
import { EntityRegistry } from './core/entities.js';
import { PlayerState } from './core/player.js';
import { Simulation } from './core/simulation.js';
import { Navigator } from './core/navigation.js';
import { SaveSystem } from './core/save.js';
import { AutosaveCoordinator } from './core/autosave.js';
import { TravelSystem } from './core/travel.js';
import { RIONNE, BARMAID, RIONNE_AGENDA, BARMAID_AGENDA } from './content/data.js';
import { GAME_START } from './content/game.js';
import { mountDevHud } from './ui/dev-hud.js';
import { mountMenu } from './ui/menu.js';
import { mountSaveMenu } from './ui/save-menu.js';
import { mountTravelView } from './ui/travel-view.js';
import { mountHoldInput } from './ui/hold-input.js';
import { renderLocations, renderPlayerScene } from './ui/scene-view.js';

const $ = selector => document.querySelector(selector);
const app = $('#app');
const welcome = $('#welcomeScreen');
const startupBlack = $('#startupBlack');
const rotationMask = $('#rotationMask');
let toastTimer;

function say(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

async function boot() {
    const world = await loadWorld();
    const gear = new DimensionGear();
    const agendas = new AgendaBook();
    const entities = new EntityRegistry(world);
    const player = new PlayerState({ world, start: GAME_START });
    player.setInteraction('STARTUP');
    agendas.register(RIONNE_AGENDA);
    agendas.register(BARMAID_AGENDA);
    entities.register(RIONNE);
    entities.register(BARMAID);
    const navigator = new Navigator({ world, entities });
    const simulation = new Simulation({ gear, entities, agendas, navigator });
    simulation.initialize();
    const travel = new TravelSystem({ world, player });
    const saves = new SaveSystem({ gear, entities, player, agendas });

    const autosave = new AutosaveCoordinator({
        gear, player, saves,
        onError(error) {
            console.error('Autosave failed:', error);
            say('Autosave failed · previous save preserved.');
        }
    });
    simulation.onSuccessfulAdvance(result => autosave.onAdvance(result));

    function refreshView() {
        renderPlayerScene(world, player, entities);
        renderLocations(world, player);
        devHud.render();
    }
    simulation.onSuccessfulAdvance(refreshView);

    const devHud = mountDevHud({ gear, entities, simulation, player, say });
    const menu = mountMenu({ player, saves, devHud, say, autosave });
    const saveMenu = mountSaveMenu({
        saves, world, player, devHud, say, closeMenu: menu.closeMenu, isTitleMode: menu.isTitleMode, autosave,
        onTitleLoad: () => leaveStartup(), refreshView
    });
    autosave.getPresentation = saveMenu.presentationState;
    menu.setRefreshSlots(saveMenu.refreshSlots);
    mountTravelView({ world, player, travel, say, refreshView });
    mountHoldInput({ app, player, openMenu: menu.openMenu, isBlocked: menu.isBlocked });

    refreshView();

    const continueButton = $('#continueBtn');
    try {
        continueButton.hidden = !saves.hasAutosave();
    } catch (error) {
        console.error('Autosave availability check failed:', error);
        continueButton.hidden = true;
    }

    let startupLeaving = false;
    function leaveStartup() {
        if (startupLeaving) return;
        startupLeaving = true;
        startupBlack.classList.remove('reveal');
        startupBlack.classList.add('on');
        setTimeout(() => welcome.classList.add('dismissed'), 80);
        setTimeout(() => {
            app.classList.remove('startup');
            startupBlack.classList.add('reveal');
            startupBlack.classList.remove('on');
            player.setInteraction('FREE');
            autosave.flush();
        }, 1250);
        setTimeout(() => startupBlack.classList.remove('reveal'), 2900);
    }

    // Continue restores a complete validated snapshot before the opening fade.
    // A corrupt latest snapshot is automatically retried against the older one.
    // Title choices are explicit; tapping the background never starts a game.
    const newGameConfirm = $('#newGameConfirm');
    $('#newGameBtn').addEventListener('click', () => {
        if (startupLeaving) return;
        try {
            if (saves.hasAutosave()) newGameConfirm.classList.add('open');
            else leaveStartup();
        } catch (error) {
            console.error('New Game safety check failed:', error);
            say('Could not check existing saves. Please try again.');
        }
    });
    $('#cancelNewGame').addEventListener('click', () => newGameConfirm.classList.remove('open'));
    $('#confirmNewGame').addEventListener('click', () => {
        newGameConfirm.classList.remove('open');
        leaveStartup();
    });
    $('#titleLoadBtn').addEventListener('click', () => menu.openTitlePage('loadPage'));
    $('#titleSettingsBtn').addEventListener('click', () => menu.openTitlePage('settingsPage'));
    $('#titleExtraBtn').addEventListener('click', () => menu.openTitlePage('extraPage'));

    continueButton.addEventListener('pointerup', event => event.stopPropagation());
    continueButton.addEventListener('click', event => {
        event.stopPropagation();
        if (startupLeaving) return;
        try {
            const presentation = saves.loadAutosave();
            if (presentation === null) throw new Error('No autosave is available.');
            autosave.discardPending();
            saveMenu.applyPresentation(presentation);
            refreshView();
            player.setInteraction('STARTUP');
            leaveStartup();
        } catch (error) {
            console.error('Continue failed:', error);
            say('Autosave unavailable · start normally or try again.');
        }
    });

    // Development-only inspection interface; not used by gameplay modules.
    window.OVAD = { world, gear, agendas, entities, player, navigator, simulation, travel, saves };
}

// Orientation belongs to the shell. It never changes Player or World state.
// One settle controller owns both orientation and viewport resize notifications.
let rotationSettleTimer = null;
let rotationStartedAt = 0;
let lastViewport = null;
const ROTATION_QUIET_MS = 220;
const ROTATION_MAX_MS = 1600;

function viewportSize() {
    const view = window.visualViewport;
    return [Math.round(view?.width ?? innerWidth), Math.round(view?.height ?? innerHeight)];
}
function finishRotationWhenStable() {
    const current = viewportSize();
    const stable = lastViewport && current.every((value, index) => Math.abs(value - lastViewport[index]) <= 1);
    lastViewport = current;
    if (stable || performance.now() - rotationStartedAt >= ROTATION_MAX_MS) {
        rotationMask.classList.remove('active');
        rotationSettleTimer = null;
        return;
    }
    rotationSettleTimer = setTimeout(finishRotationWhenStable, ROTATION_QUIET_MS);
}
function stabilizeOrientation() {
    if (!rotationMask.classList.contains('active')) rotationStartedAt = performance.now();
    rotationMask.classList.add('active');
    lastViewport = null;
    clearTimeout(rotationSettleTimer);
    rotationSettleTimer = setTimeout(finishRotationWhenStable, ROTATION_QUIET_MS);
}
window.addEventListener('orientationchange', stabilizeOrientation);
window.addEventListener('resize', stabilizeOrientation);
window.visualViewport?.addEventListener('resize', stabilizeOrientation);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
boot().catch(error => {
    console.error(error);
    welcome.classList.add('dismissed');
    say(`BOOT ERROR · ${error.message}`);
});
