import { buildLabel } from '../content/build.js';

// Development presentation only: time and entity positions are read from the engine.
// All time changes go through the same Simulation.advance used by gameplay actions.
export function mountDevHud({ gear, entities, simulation, player, say }) {
    const panel = document.querySelector('#devHudPanel');
    const toggle = document.querySelector('#devHudToggle');
    const chevron = document.querySelector('#devHudChevron');
    const clock = document.querySelector('#devHudTime');
    const fullTime = document.querySelector('#devHudFullTime');
    const positions = document.querySelector('#devEntityReadout');
    document.querySelector('#buildPlaque').textContent = buildLabel();

    function render() {
        const time = gear.snapshot();
        const day = String(time.day).padStart(2, '0');
        const hour = String(time.hour).padStart(2, '0');
        const minute = String(time.minute).padStart(2, '0');
        clock.textContent = `D${day} · ${hour}:${minute}`;
        fullTime.textContent = gear.format();
        positions.replaceChildren();
        for (const entity of entities.all()) {
            const line = document.createElement('div');
            const { scene, spot } = entity.state.location;
            line.textContent = `${entity.name} · ${scene} / ${spot}`;
            positions.append(line);
        }
    }

    function closePanel() {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        chevron.textContent = '▴';
    }

    // Capture the outside tap before it reaches any underlying world control.
    document.addEventListener('pointerdown', event => {
        if (panel.hidden || panel.contains(event.target) || toggle.contains(event.target)) return;
        closePanel();
        event.preventDefault();
        event.stopPropagation();
    }, true);

    toggle.addEventListener('click', () => {
        const opening = panel.hidden;
        panel.hidden = !opening;
        toggle.setAttribute('aria-expanded', String(opening));
        chevron.textContent = opening ? '▾' : '▴';
        if (opening) render();
    });

    panel.addEventListener('click', event => {
        const button = event.target.closest('[data-dev-min]');
        if (!button || !player.isFree) return;
        const minutes = Number(button.dataset.devMin);
        try {
            simulation.advance(minutes);
            render();
        } catch (error) {
            console.error('Development time advance failed:', error);
            render();
            say('Time advance failed.');
        }
    });

    return { render };
}
