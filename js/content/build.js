export const BUILD_INFO = Object.freeze({
    version: '0.4.2c.3',
    name: 'MOVEMENT LIFECYCLE & REFACTOR'
});

export function buildLabel(){
    return `${BUILD_INFO.version} · ${BUILD_INFO.name}`;
}
