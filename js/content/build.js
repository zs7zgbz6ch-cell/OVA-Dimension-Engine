export const BUILD_INFO = Object.freeze({
    version: '0.3.3b',
    name: 'GESTURE AUDIT'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
