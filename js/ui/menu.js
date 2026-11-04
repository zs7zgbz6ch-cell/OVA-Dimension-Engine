const $ = selector => document.querySelector(selector);

export function mountMenu({ player, saves, devHud, say, autosave }) {
    const overlay = $('#overlay');
    const slotConfirm = $('#slotConfirm');
    let refreshSlots = () => {};
    let titleMode = false;

    function page(id) {
        document.querySelectorAll('.page').forEach(node => node.classList.toggle('active', node.id === id));
    }
    function openTitlePage(id) {
        if (player.interaction !== 'STARTUP') return;
        titleMode = true;
        page(id);
        if (id === 'loadPage') refreshSlots();
        overlay.classList.add('open', 'title-mode');
    }
    function openMenu() {
        if (!player.isFree) return;
        titleMode = false;
        overlay.classList.remove('title-mode');
        page('mainPage');
        devHud.render();
        player.setInteraction('MENU');
        overlay.classList.add('open');
    }
    function closeMenu() {
        // Never override STARTUP or TRAVEL from an unrelated UI callback.
        const wasTitle = titleMode;
        overlay.classList.remove('open', 'title-mode');
        titleMode = false;
        if (player.interaction === 'MENU') player.setInteraction('FREE');
        if (!wasTitle) autosave.flush();
    }
    $('#closeBtn').addEventListener('click', closeMenu);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeMenu();
    });
    document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.page === 'savePage' || button.dataset.page === 'loadPage') refreshSlots();
        if (titleMode && button.dataset.page === 'mainPage') {
            closeMenu();
            return;
        }
        page(button.dataset.page);
    }));
    $('#resetBtn').addEventListener('click', () => $('#confirm').classList.add('open'));
    $('#cancelReset').addEventListener('click', () => $('#confirm').classList.remove('open'));
    $('#confirmReset').addEventListener('click', () => {
        try {
            // Development reset intentionally preserves manual and autosave slots.
            saves.clear();
            location.reload();
        } catch (error) {
            console.error(error);
            $('#confirm').classList.remove('open');
            say('Reset failed · storage unavailable.');
        }
    });
    return {
        openMenu,
        openTitlePage,
        closeMenu,
        isTitleMode: () => titleMode,
        setRefreshSlots(callback) { refreshSlots = callback; },
        isBlocked() {
            return overlay.classList.contains('open') ||
                $('#preview').classList.contains('open') ||
                $('#confirm').classList.contains('open') ||
                slotConfirm.classList.contains('open');
        }
    };
}
