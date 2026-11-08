// Cached alpha-aware hit testing for any image element.
// Transparent pixels do not activate the image; tainted canvases degrade gracefully.
export function createAlphaHitTester(portrait, alphaThreshold = 24) {
    let pixels = null;
    let source = null;

    // Alpha-aware hit testing: transparent pixels of a portrait are not interactive.
    // The canvas is only a cached mask; it never changes or redraws the artwork.
    function portraitHit(event) {
        if (event.target !== portrait || !portrait.complete || !portrait.naturalWidth) return false;
        if (source !== portrait.currentSrc) {
            source = portrait.currentSrc;
            pixels = null;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = portrait.naturalWidth;
                canvas.height = portrait.naturalHeight;
                const context = canvas.getContext('2d', { willReadFrequently: true });
                context.drawImage(portrait, 0, 0);
                pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            } catch (error) {
                // If a browser denies pixel access, keep the image interactive.
                return true;
            }
        }
        if (!pixels) return true;
        const rect = portrait.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) * pixels.width / rect.width);
        const y = Math.floor((event.clientY - rect.top) * pixels.height / rect.height);
        if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) return false;
        return pixels.data[(y * pixels.width + x) * 4 + 3] > alphaThreshold;
    }


    return {
        hit: portraitHit,
        reset() { pixels = null; source = null; }
    };
}
