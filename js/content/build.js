export const BUILD_INFO = Object.freeze({
    version: '0.4.2e.12',
    name: 'FOUNDATION CLEANUP'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
