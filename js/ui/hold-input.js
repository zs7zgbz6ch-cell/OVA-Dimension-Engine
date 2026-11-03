const HOLD_DELAY_MS = 180;
const HOLD_FILL_MS = 500;
const MOVE_LIMIT = 18;

export function mountHoldInput({ app, player, openMenu, isBlocked }) {
    const holdRing = document.querySelector('#holdRing');
    const holdProgress = document.querySelector('#holdProgress');
    let holdDelayTimer = null;
    let holdTimer = null;
    let holdStart = 0;
    let holdX = 0;
    let holdY = 0;
    let holding = false;
    let ringActive = false;

    function blocked(target) {
        return !player.isFree || isBlocked() ||
            !!target.closest('button,.overlay,.preview,.confirm,.welcome-screen,.interactive,[data-interactive]') ||
            !document.querySelector('#welcomeScreen').classList.contains('dismissed');
    }
    function clearHold() {
        holding = false;
        ringActive = false;
        clearTimeout(holdDelayTimer);
        clearTimeout(holdTimer);
        holdDelayTimer = null;
        holdTimer = null;
        holdRing.classList.remove('visible', 'complete');
        holdProgress.style.strokeDashoffset = '100';
    }
    function updateRing() {
        if (!holding || !ringActive) return;
        const progress = Math.max(0, Math.min(1, (performance.now() - holdStart) / HOLD_FILL_MS));
        holdProgress.style.strokeDashoffset = String(100 - progress * 100);
        if (progress < 1) requestAnimationFrame(updateRing);
    }
    function beginRing() {
        if (!holding || blocked(app)) { clearHold(); return; }
        ringActive = true;
        holdStart = performance.now();
        holdRing.classList.add('visible');
        requestAnimationFrame(updateRing);
        holdTimer = setTimeout(() => {
            if (!holding || !ringActive || !player.isFree) { clearHold(); return; }
            holdRing.classList.add('complete');
            holding = false;
            ringActive = false;
            holdTimer = null;
            requestAnimationFrame(() => {
                holdRing.classList.remove('visible', 'complete');
                holdProgress.style.strokeDashoffset = '100';
                openMenu();
            });
        }, HOLD_FILL_MS);
    }
    app.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (blocked(event.target)) return;
        clearHold();
        holding = true;
        holdX = event.clientX;
        holdY = event.clientY;
        holdRing.style.left = `${event.clientX}px`;
        holdRing.style.top = `${event.clientY}px`;
        holdDelayTimer = setTimeout(beginRing, HOLD_DELAY_MS);
    });
    app.addEventListener('pointermove', event => {
        if (holding && Math.hypot(event.clientX - holdX, event.clientY - holdY) > MOVE_LIMIT) clearHold();
    });
    for (const name of ['pointerup', 'pointercancel', 'pointerleave']) {
        app.addEventListener(name, clearHold);
    }
}
