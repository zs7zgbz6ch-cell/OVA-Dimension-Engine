export const BUILD_INFO = Object.freeze({
    version: '0.3.3c',
    name: 'DEVELOPMENT HUD'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
