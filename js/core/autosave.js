// Autosave policy lives outside Dimension Gear, Simulation and slot storage.
// A crossed six-hour checkpoint creates one pending save, coalescing multiple crossings.
const CHECKPOINT_MINUTES = 6 * 60;

export function crossedAutosaveCheckpoint(startMinute, endMinute) {
    if (!Number.isSafeInteger(startMinute) || !Number.isSafeInteger(endMinute) || endMinute < startMinute) {
        throw new Error('Invalid autosave interval.');
    }
    return Math.floor(endMinute / CHECKPOINT_MINUTES) > Math.floor(startMinute / CHECKPOINT_MINUTES);
}

export class AutosaveCoordinator {
    constructor({ gear, player, saves, onError = () => {} }) {
        this.gear = gear;
        this.player = player;
        this.saves = saves;
        this.onError = onError;
        this.pending = false;
    }

    // Called only after Simulation has successfully committed the entire advance.
    onAdvance({ old, now }) {
        if (crossedAutosaveCheckpoint(old.epochMinute, now.epochMinute)) this.pending = true;
        this.flush();
    }

    // Call at the end of any gameplay action that may have blocked saving.
    flush() {
        if (!this.pending || !this.player.isFree) return false;
        try {
            this.saves.saveAutosave();
            this.pending = false;
            return true;
        } catch (error) {
            // Preserve pending work and the previous valid autosave on storage failure.
            this.onError(error);
            return false;
        }
    }

    // Loading a different world invalidates any pending checkpoint from the old world.
    discardPending() { this.pending = false; }
}
