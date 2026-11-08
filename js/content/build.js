export const BUILD_INFO = Object.freeze({
    version: '0.4.2e.10',
    name: 'ENGINE CLEANUP 2'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
