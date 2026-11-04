// Pure, read-only projection of authoritative entity locations into one scene.
export function scenePresence(world, entities, sceneId) {
    if (!world.hasScene(sceneId)) return [];
    return entities.all().flatMap(entity => {
        const location = entity.state.location;
        if (location.scene !== sceneId) return [];
        const spot = world.spot(location.scene, location.spot);
        if (!spot) return [];
        return [{ id: entity.id, name: entity.name,
            assetFamily: entity.content?.assetFamily ?? null,
            activity: entity.state.activity, spot }];
    });
}
