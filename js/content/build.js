export const BUILD_INFO = Object.freeze({
    version: '0.3.3',
    name: 'SHELL CLEANUP'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
