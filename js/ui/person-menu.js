// Position the small person-action menu inside the visible viewport.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function placePersonMenu(menu, rect, viewportWidth, viewportHeight, tuning) {
    const width = tuning.menuWidthPx;
    const margin = tuning.menuMarginPx;
    menu.style.left = `${clamp(rect.left + rect.width / 2 - width / 2, margin, viewportWidth - width - margin)}px`;
    menu.style.top = `${clamp(rect.bottom + tuning.menuGapPx, margin, viewportHeight - tuning.menuBottomReservePx)}px`;
}
