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

// Presentation nodes are keyed by entity ID; world state remains authoritative.
function positionActor(node, spot) {
    node.style.left = `${spot.x}%`;
    node.style.top = `${spot.y}%`;
    if (node.className === 'scene-actor') node.style.height = `${spot.scale}%`;
}

function makeFallback(id, spot, sprite = '') {
    const node = document.createElement('span');
    node.className = 'scene-actor-fallback';
    node.dataset.entity = id;
    node.dataset.sprite = sprite;
    node.textContent = '✦';
    positionActor(node, spot);
    return node;
}

function makeActor(person, sprite) {
    if (!sprite) return makeFallback(person.id, person.spot);
    const img = document.createElement('img');
    img.className = 'scene-actor';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.dataset.entity = person.id;
    positionActor(img, person.spot);
    img.addEventListener('error', () => {
        // An image that has already left the stage must not be reinserted.
        if (img.parentNode) img.replaceWith(makeFallback(person.id, person.spot, sprite));
    }, { once: true });
    img.src = sprite;
    return img;
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
    const background = data.image ? `url('${data.image}')` : 'none';
    if (stage.style.backgroundImage !== background) stage.style.backgroundImage = background;
    const actors = stage.querySelector('.scene-actors');
    const presence = entities ? scenePresence(world, entities, player.sceneId) : [];
    const existing = new Map(Array.from(actors.children, node => [node.dataset.entity, node]));
    const ordered = [];
    for (const person of presence) {
        const sprite = ENTITY_SPRITES[person.assetFamily];
        let node = existing.get(person.id);
        // A changed asset requires a new image; an unchanged one keeps its DOM node.
        if (!node || (sprite && (node.className === 'scene-actor' ? node.getAttribute('src') !== sprite : node.dataset.sprite !== sprite)) ||
            (!sprite && node.className !== 'scene-actor-fallback')) {
            node = makeActor(person, sprite);
        } else {
            positionActor(node, person.spot);
        }
        ordered.push(node);
    }
    // append() moves existing nodes without recreating or re-requesting images.
    // Only update the child list when its identities/order actually change.
    if (ordered.length !== actors.children.length ||
        ordered.some((node, index) => actors.children[index] !== node)) {
        actors.replaceChildren(...ordered);
    }
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
