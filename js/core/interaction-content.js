// Resolve dialogue by agenda activity and scene, with authored fallbacks.
// No UI or simulation dependencies; every person uses the same lookup rules.
export function resolveInteraction(content, person, sceneId, action) {
    const definition = content[person.id];
    if (!definition) return null;
    const activity = person.state.activity;
    // Preserve precedence and stable cursor keys without comparing object identity.
    const choices = [
        { key: `activity:${sceneId}:${activity}`, context: definition.contexts?.[`${sceneId}:${activity}`] },
        { key: `activity:${activity}`, context: definition.contexts?.[activity] },
        { key: `scene:${sceneId}`, context: definition.scenes?.[sceneId] },
        { key: 'default', context: definition.default }
    ];
    for (const { key, context } of choices) {
        const lines = context?.[action];
        if (!Array.isArray(lines) || !lines.length) continue;
        return {
            key: `${person.id}:${action}:${key}`,
            options: lines,
            portrait: definition.portrait || null,
            subtitle: definition.subtitle || ''
        };
    }
    return null;
}

// The selection is pure. The controller commits its cursor only on completion.
export function selectInteraction(set, cursors) {
    if (!set) return null;
    const index = (cursors.get(set.key) || 0) % set.options.length;
    const value = set.options[index];
    return { lines: Array.isArray(value) ? [...value] : [value], key: set.key,
        next: (index + 1) % set.options.length };
}
