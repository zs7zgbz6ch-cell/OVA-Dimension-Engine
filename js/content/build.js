export const BUILD_INFO = Object.freeze({
    version: '0.4.2e.11',
    name: 'DIALOGUE REGRESSION FIX'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
