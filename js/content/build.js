export const BUILD_INFO = Object.freeze({
    version: '0.4.1b',
    name: 'SPRITE ASSET ROUTING'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
