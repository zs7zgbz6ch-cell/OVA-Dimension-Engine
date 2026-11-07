export const BUILD_INFO = Object.freeze({
    version: '0.4.2c.1',
    name: 'MOVEMENT PRESENTATION'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
