import { SCENE_CONTENT } from '../content/game.js';

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

export function renderPlayerScene(world, player) {
    const data = sceneMeta(world, player.sceneId);
    const scene = document.querySelector('#scene');
    scene.style.backgroundImage = data.image ? `url('${data.image}')` : 'none';
    scene.dataset.scene = player.sceneId;
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
