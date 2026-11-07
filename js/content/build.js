export const BUILD_INFO = Object.freeze({
    version: '0.4.2d.1',
    name: 'MOVEMENT CORRECTIONS'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
