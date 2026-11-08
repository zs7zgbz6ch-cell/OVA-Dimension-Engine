export const BUILD_INFO = Object.freeze({
    version: '0.4.2e.4',
    name: 'CHARACTER CARD POLISH'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
