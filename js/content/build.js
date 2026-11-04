export const BUILD_INFO = Object.freeze({
    version: '0.3.4g',
    name: 'SCHEDULED AUTOSAVES'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
