import { sceneMeta, renderPlayerScene } from './scene-view.js';

const $ = selector => document.querySelector(selector);

export function mountTravelView({ world, player, travel, say }) {
    const preview = $('#preview');
    const fade = $('#fade');
    let targetScene = null;
    let travelling = false;

    function openLocationPreview(sceneId) {
        if (!travel.canTravelTo(sceneId)) return;
        targetScene = sceneId;
        const data = sceneMeta(world, sceneId);
        $('#previewImg').src = data.image;
        $('#previewTitle').textContent = data.title;
        $('#previewSub').textContent = data.subtitle;
        preview.classList.add('open');
    }
    function travelToTarget() {
        if (travelling || !targetScene || !travel.canTravelTo(targetScene)) return;
        travelling = true;
        player.setInteraction('TRAVEL');
        fade.classList.add('on');
        setTimeout(() => {
            try {
                travel.travelTo(targetScene);
                targetScene = null;
                renderPlayerScene(world, player);
                preview.classList.remove('open');
                $('#overlay').classList.remove('open');
            } catch (error) {
                console.error('Travel failed:', error);
                say('Travel failed. Please try again.');
            } finally {
                // Restore presentation and input even when the transition fails.
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    fade.classList.remove('on');
                    player.setInteraction('FREE');
                    travelling = false;
                }));
            }
        }, 720);
    }
    $('#locationList').addEventListener('click', event => {
        const button = event.target.closest('.loc');
        if (button) openLocationPreview(button.dataset.scene);
    });
    $('#previewBack').addEventListener('click', () => {
        if (travelling) return;
        preview.classList.remove('open');
        targetScene = null;
    });
    $('#goBtn').addEventListener('click', travelToTarget);
}
