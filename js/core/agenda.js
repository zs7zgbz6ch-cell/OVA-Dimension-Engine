function minutesOfDay(value) {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
}

function dateMatches(block, clock) {
    if (block.recurrence === "daily") return true;

    if (block.recurrence === "weekly") {
        return (block.weekdays || []).includes(clock.weekday);
    }

    if (block.recurrence === "monthly") {
        return (block.days || []).includes(clock.day);
    }

    if (block.recurrence === "yearly") {
        return (block.dates || []).some(
            date => date.month === clock.month && date.day === clock.day
        );
    }

    if (block.recurrence === "once") {
        return (
            block.date?.year === clock.year &&
            block.date?.month === clock.month &&
            block.date?.day === clock.day
        );
    }

    return false;
}

function isActive(block, clock) {
    if (!dateMatches(block, clock)) return false;

    const now = clock.hour * 60 + clock.minute;
    const start = minutesOfDay(block.start);
    const end = minutesOfDay(block.end);

    if (start < end) return now >= start && now < end;
    if (start > end) return now >= start || now < end;

    return true;
}

export class AgendaBook {
    constructor() {
        this.agendas = new Map();
    }

    register(agenda) {
        if (this.agendas.has(agenda.id)) {
            throw new Error(`Duplicate agenda: ${agenda.id}`);
        }
        this.agendas.set(agenda.id, agenda);
    }

    resolve(agendaId, clock) {
        const agenda = this.agendas.get(agendaId);

        if (!agenda) {
            throw new Error(`Unknown agenda: ${agendaId}`);
        }

        return agenda.blocks
            .filter(block => isActive(block, clock))
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0]
            || agenda.fallback
            || null;
    }
}
