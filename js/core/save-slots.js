// Storage ownership only. The SaveSystem validates and applies snapshots.
export const MANUAL_SLOTS = Object.freeze([1, 2, 3]);
const PREFIX = 'ovad_clean_engine_v034b_';
const AUTO_KEYS = [`${PREFIX}auto_0`, `${PREFIX}auto_1`];
const HEAD_KEY = `${PREFIX}auto_head`;
const manualKey = slot => {
    if (!MANUAL_SLOTS.includes(slot)) throw new Error('Invalid manual save slot.');
    return `${PREFIX}manual_${slot}`;
};

export class SaveSlots {
    constructor(storage = globalThis.localStorage) { this.storage = storage; }
    readManual(slot) { return this.storage.getItem(manualKey(slot)); }
    writeManual(slot, serialized) { this.storage.setItem(manualKey(slot), serialized); }
    clearManual(slot) { this.storage.removeItem(manualKey(slot)); }
    readAutosaves() {
        const head = this.storage.getItem(HEAD_KEY);
        const order = head === '0' ? [0, 1] : head === '1' ? [1, 0] : [0, 1];
        return order.map(index => this.storage.getItem(AUTO_KEYS[index])).filter(raw => raw !== null);
    }
    writeAutosave(serialized) {
        const head = this.storage.getItem(HEAD_KEY);
        const next = head === '0' ? 1 : 0;
        // Only promote a successfully written snapshot to the latest slot.
        this.storage.setItem(AUTO_KEYS[next], serialized);
        this.storage.setItem(HEAD_KEY, String(next));
    }
    clearAutosaves() {
        for (const key of [...AUTO_KEYS, HEAD_KEY]) this.storage.removeItem(key);
    }
}
