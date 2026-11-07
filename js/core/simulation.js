import { clockFromEpochMinute } from './dimension-gear.js';

function committedMovement(navigation, entityId, minute, destination) {
    // Capture only committed navigation facts; callers cannot mutate the world
    // or another observer's event through the returned payload.
    const route = navigation.route.map(step => Object.freeze({
        scene: step.scene, spot: step.spot, type: step.type, movement: step.movement ?? null
    }));
    return Object.freeze({
        entityId,
        minute,
        from: Object.freeze({ ...navigation.from }),
        to: Object.freeze({ scene: destination.scene, spot: destination.spot }),
        route: Object.freeze(route)
    });
}

function sameLocation(a, b) {
    return a.scene === b.scene && a.spot === b.spot;
}

export class Simulation {
    constructor({ gear, entities, agendas, navigator }) {
        this.gear = gear;
        this.entities = entities;
        this.agendas = agendas;
        this.navigator = navigator;
        this.log = [];
        this.advanceListeners = new Set();
    }

    onSuccessfulAdvance(listener) {
        this.advanceListeners.add(listener);
        return () => this.advanceListeners.delete(listener);
    }

    initialize() {
        this.evaluate(this.gear.snapshot(), "INITIALIZE");
    }

    advance(minutes) {
        // Validate before touching any state. The gear owns time-range validation.
        if (!Number.isSafeInteger(minutes) || minutes < 0) {
            throw new Error('Invalid simulation advance.');
        }
        const startMinute = this.gear.epochMinute;
        const endMinute = startMinute + minutes;
        if (!Number.isSafeInteger(endMinute)) throw new Error('Invalid simulation advance.');
        // Fail before mutation if the target cannot be represented by Dimension Gear.
        clockFromEpochMinute(endMinute);

        const before = this.entities.snapshot();
        const logLength = this.log.length;
        const old = this.gear.snapshot();
        const moves = [];
        try {
            // Evaluate each minute before committing its clock. A failure anywhere
            // restores the entire advance, including entity state and log entries.
            for (let offset = 1; offset <= minutes; offset += 1) {
                const clock = clockFromEpochMinute(startMinute + offset);
                this.evaluate(clock, 'TIME', moves);
                this.gear.setEpochMinute(clock.epochMinute);
            }
            const result = { old, now: this.gear.snapshot(), moves: Object.freeze(moves) };
            // Post-commit observers cannot roll back an already successful world advance.
            for (const listener of this.advanceListeners) {
                try { listener(result); }
                catch (error) { console.error('Simulation post-commit observer failed:', error); }
            }
            return result;
        } catch (error) {
            // Registry snapshots were captured from authoritative live entities.
            // Restore directly to avoid applying new agenda defaults during rollback.
            for (const entity of this.entities.all()) {
                const state = before[entity.id];
                entity.state = { ...state, location: { ...state.location } };
            }
            this.gear.setEpochMinute(startMinute);
            this.log.length = logLength;
            throw error;
        }
    }

    evaluate(clock, reason, moves = null) {
        for (const entity of this.entities.all()) {
            const intent = this.agendas.resolve(entity.agendaId, clock);
            if (!intent) continue;

            const agendaChanged = this.entities.applyAgendaState(
                entity.id,
                intent,
                clock.epochMinute
            );

            const locationChanged = !sameLocation(
                entity.state.location,
                intent.destination
            );

            let navigation = null;

            if (locationChanged) {
                navigation = this.navigator.navigate(
                    entity.id,
                    intent.destination,
                    clock.epochMinute
                );
            }

            if (navigation?.moved && moves) {
                moves.push(committedMovement(
                    navigation, entity.id, clock.epochMinute, entity.state.location
                ));
            }

            if (agendaChanged || navigation?.moved) {
                this.log.push({
                    time: `${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`,
                    name: entity.name,
                    activity: entity.state.activity,
                    location: { ...entity.state.location },
                    route: navigation?.route || null,
                    reason
                });
            }
        }
    }
}
