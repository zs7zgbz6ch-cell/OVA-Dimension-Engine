export const BUILD_INFO = Object.freeze({
    version: '0.3.4c',
    name: 'RPG SAVE MENUS'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
