const MINUTE_MS = 60_000;

export function clockFromEpochMinute(epochMinute) {
    if (!Number.isSafeInteger(epochMinute)) throw new Error('Invalid Dimension Gear time.');
    const date = new Date(epochMinute * MINUTE_MS);
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid Dimension Gear time.');
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

export function formatClock(clock) {
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return [
        `Y${clock.year}`,
        `M${String(clock.month).padStart(2, '0')}`,
        `D${String(clock.day).padStart(2, '0')}`,
        weekdays[clock.weekday],
        `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`
    ].join(' · ');
}

export class DimensionGear {
    constructor() {
        this.date = new Date(Date.UTC(2000, 0, 1, 6, 55));
    }

    get epochMinute() {
        return Math.floor(this.date.getTime() / MINUTE_MS);
    }

    snapshot() {
        return clockFromEpochMinute(this.epochMinute);
    }

    setEpochMinute(epochMinute) {
        if (!Number.isSafeInteger(epochMinute) || !Number.isFinite(epochMinute * MINUTE_MS) ||
            !Number.isFinite(new Date(epochMinute * MINUTE_MS).getTime())) {
            throw new Error("Invalid Dimension Gear time.");
        }
        this.date = new Date(epochMinute * MINUTE_MS);
    }

    advance(minutes) {
        if (!Number.isSafeInteger(minutes) || minutes < 0) {
            throw new Error('Invalid Dimension Gear advance.');
        }
        const old = this.snapshot();
        const target = old.epochMinute + minutes;
        if (!Number.isSafeInteger(target)) throw new Error('Invalid Dimension Gear advance.');
        this.setEpochMinute(target);
        return { old, now: this.snapshot() };
    }

    format() {
        return formatClock(this.snapshot());
    }
}
