export const BUILD_INFO = Object.freeze({
    version: '0.4.1a',
    name: 'ENTITY PRESENCE'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
