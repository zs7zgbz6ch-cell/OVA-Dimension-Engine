const MINUTE_MS = 60_000;

export class DimensionGear {
    constructor() {
        this.date = new Date(Date.UTC(2000, 0, 1, 6, 55));
    }

    get epochMinute() {
        return Math.floor(this.date.getTime() / MINUTE_MS);
    }

    snapshot() {
        return {
            year: this.date.getUTCFullYear() - 1999,
            month: this.date.getUTCMonth() + 1,
            day: this.date.getUTCDate(),
            weekday: this.date.getUTCDay(),
            hour: this.date.getUTCHours(),
            minute: this.date.getUTCMinutes(),
            epochMinute: this.epochMinute
        };
    }

    setEpochMinute(epochMinute) {
        if (!Number.isInteger(epochMinute)) {
            throw new Error("Invalid Dimension Gear time.");
        }
        this.date = new Date(epochMinute * MINUTE_MS);
    }

    advance(minutes) {
        if (!Number.isInteger(minutes) || minutes < 0) {
            throw new Error("Invalid Dimension Gear advance.");
        }

        const old = this.snapshot();
        this.date = new Date(this.date.getTime() + minutes * MINUTE_MS);

        return { old, now: this.snapshot() };
    }

    format() {
        const t = this.snapshot();
        const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

        return [
            `Y${t.year}`,
            `M${String(t.month).padStart(2, "0")}`,
            `D${String(t.day).padStart(2, "0")}`,
            weekdays[t.weekday],
            `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`
        ].join(" · ");
    }
}
