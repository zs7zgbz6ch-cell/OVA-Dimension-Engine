export const BUILD_INFO = Object.freeze({
    version: '0.3.4f',
    name: 'SIMULATION SAFETY'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
