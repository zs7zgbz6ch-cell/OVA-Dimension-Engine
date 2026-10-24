import { loadWorld } from "./core/world.js";
import { DimensionGear } from "./core/dimension-gear.js";
import { AgendaBook } from "./core/agenda.js";
import { EntityRegistry } from "./core/entities.js";
import { Simulation } from "./core/simulation.js";
import {
    RIONNE,
    BARMAID,
    RIONNE_AGENDA,
    BARMAID_AGENDA
} from "./content/data.js";

const clock = document.querySelector("#clock");
const status = document.querySelector("#status");
const entitiesView = document.querySelector("#entities");
const logView = document.querySelector("#log");

function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    })[character]);
}

function setStatus(message, state = "normal") {
    status.textContent = message;
    status.dataset.state = state;
}

async function boot() {
    setStatus("Loading World Stage…");
    const world = await loadWorld();

    const gear = new DimensionGear();
    const agendas = new AgendaBook();
    const entities = new EntityRegistry(world);

    agendas.register(RIONNE_AGENDA);
    agendas.register(BARMAID_AGENDA);

    entities.register(RIONNE);
    entities.register(BARMAID);

    const simulation = new Simulation({ gear, entities, agendas });
    simulation.initialize();

    function render() {
        clock.textContent = gear.format();

        entitiesView.innerHTML = entities.all().map(entity => `
            <article>
                <small>${escapeHtml(entity.kind.toUpperCase())} · ${escapeHtml(entity.id)}</small>
                <h2>${escapeHtml(entity.name)}</h2>
                <p><b>Agenda</b> ${escapeHtml(entity.state.agendaBlockId)}</p>
                <p><b>Activity</b> ${escapeHtml(entity.state.activity)}</p>
                <p><b>Location</b> ${escapeHtml(entity.state.location.scene)} / ${escapeHtml(entity.state.location.spot)}</p>
            </article>
        `).join("");

        logView.innerHTML = simulation.log.slice(-40).reverse().map(entry => `
            <div>
                <b>${escapeHtml(entry.time)}</b> ·
                ${escapeHtml(entry.name)} →
                ${escapeHtml(entry.activity)} ·
                ${escapeHtml(entry.location.scene)}/${escapeHtml(entry.location.spot)}
            </div>
        `).join("");
    }

    for (const button of document.querySelectorAll("[data-min]")) {
        button.addEventListener("click", () => {
            simulation.advance(Number(button.dataset.min));
            render();
        });
    }

    document.querySelector("#reset").addEventListener("click", () => {
        location.reload();
    });

    render();

    setStatus(
        `ENGINE READY · ${world.nodes.size} WORLD SPOTS · ${entities.all().length} ENTITIES`,
        "ready"
    );

    window.OVAD = { world, gear, agendas, entities, simulation };
}

boot().catch(error => {
    console.error(error);
    clock.textContent = "BOOT FAILED";
    setStatus(error.stack || error.message || String(error), "error");
});
