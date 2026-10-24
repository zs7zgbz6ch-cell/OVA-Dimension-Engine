const MINUTE_MS = 60_000;

function clockFromEpochMinute(epochMinute) {
    const date = new Date(epochMinute * MINUTE_MS);

    return {
        year: date.getUTCFullYear() - 1999,
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        weekday: date.getUTCDay(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        epochMinute
    };
}

export class Simulation {
    constructor({ gear, entities, agendas }) {
        this.gear = gear;
        this.entities = entities;
        this.agendas = agendas;
        this.log = [];
    }

    initialize() {
        this.evaluate(this.gear.snapshot(), "INITIALIZE");
    }

    advance(minutes) {
        const change = this.gear.advance(minutes);

        for (let offset = 1; offset <= minutes; offset += 1) {
            this.evaluate(
                clockFromEpochMinute(change.old.epochMinute + offset),
                "TIME"
            );
        }

        return change;
    }

    evaluate(clock, reason) {
        for (const entity of this.entities.all()) {
            const intent = this.agendas.resolve(entity.agendaId, clock);
            if (!intent) continue;

            if (this.entities.applyAgendaIntent(
                entity.id,
                intent,
                clock.epochMinute
            )) {
                this.log.push({
                    time: `${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`,
                    name: entity.name,
                    activity: entity.state.activity,
                    location: entity.state.location,
                    reason
                });
            }
        }
    }
}
