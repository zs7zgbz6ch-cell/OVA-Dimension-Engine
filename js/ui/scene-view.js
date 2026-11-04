import { SCENE_CONTENT, ENTITY_SPRITES } from '../content/game.js';
import { scenePresence } from '../core/presence.js';

export function sceneMeta(world, sceneId) {
    const worldScene = world.scene(sceneId);
    if (!worldScene) throw new Error(`Unknown World scene: ${sceneId}`);
    const presentation = SCENE_CONTENT[sceneId] || {};
    return {
        title: presentation.title || sceneId.replaceAll('_', ' '),
        subtitle: presentation.subtitle || '',
        image: worldScene.background ? `./${worldScene.background.replace(/^\.\//, '')}` : ''
    };
}

export function renderPlayerScene(world, player, entities) {
    const data = sceneMeta(world, player.sceneId);
    const scene = document.querySelector('#scene');
    scene.dataset.scene = player.sceneId;
    let stage = scene.querySelector('.scene-stage');
    if (!stage) {
        stage = document.createElement('div');
        stage.className = 'scene-stage';
        const actors = document.createElement('div');
        actors.className = 'scene-actors';
        stage.append(actors);
        scene.replaceChildren(stage);
    }
    stage.style.backgroundImage = data.image ? `url('${data.image}')` : 'none';
    const actors = stage.querySelector('.scene-actors');
    const presence = entities ? scenePresence(world, entities, player.sceneId) : [];
    const nodes = presence.map(person => {
        const img = document.createElement('img');
        img.className = 'scene-actor';
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.dataset.entity = person.id;
        img.style.left = `${person.spot.x}%`;
        img.style.top = `${person.spot.y}%`;
        img.style.height = `${person.spot.scale}%`;
        const sprite = ENTITY_SPRITES[person.assetFamily];
        if (sprite) img.src = sprite;
        else {
            const fallback = document.createElement('span');
            fallback.className = 'scene-actor-fallback';
            fallback.textContent = '✦';
            fallback.style.left = img.style.left;
            fallback.style.top = img.style.top;
            return fallback;
        }
        img.addEventListener('error', () => {
            const fallback = document.createElement('span');
            fallback.className = 'scene-actor-fallback';
            fallback.textContent = '✦';
            fallback.style.left = img.style.left;
            fallback.style.top = img.style.top;
            img.replaceWith(fallback);
        }, { once: true });
        return img;
    });
    actors.replaceChildren(...nodes);
}

export function renderLocations(world, player) {
    const list = document.querySelector('#locationList');
    list.replaceChildren();
    for (const sceneId of player.discoveredScenes) {
        if (!world.hasScene(sceneId)) continue;
        const data = sceneMeta(world, sceneId);
        const button = document.createElement('button');
        button.className = 'loc';
        button.type = 'button';
        button.dataset.scene = sceneId;
        const img = document.createElement('img');
        img.src = data.image;
        img.alt = '';
        const text = document.createElement('span');
        text.className = 'loctext';
        const name = document.createElement('span');
        name.className = 'locname';
        name.textContent = data.title;
        const meta = document.createElement('span');
        meta.className = 'locmeta';
        meta.textContent = data.subtitle;
        text.append(name, meta);
        button.append(img, text);
        list.append(button);
    }
}
