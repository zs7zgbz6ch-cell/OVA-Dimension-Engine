// Resolve dialogue by agenda activity and scene, with authored fallbacks.
// No UI or simulation dependencies; every person uses the same lookup rules.
export function resolveInteraction(content, person, sceneId, action) {
    const definition = content[person.id];
    if (!definition) return null;
    const activity = person.state.activity;
    const choices = [
        definition.contexts?.[`${sceneId}:${activity}`],
        definition.contexts?.[activity],
        definition.scenes?.[sceneId],
        definition.default
    ];
    for (const context of choices) {
        const lines = context?.[action];
        if (Array.isArray(lines) && lines.length) {
            return { key: `${person.id}:${action}:${context === definition.default ? 'default' :
                context === definition.scenes?.[sceneId] ? `scene:${sceneId}` :
                context === definition.contexts?.[`${sceneId}:${activity}`] ? `activity:${sceneId}:${activity}` : `activity:${activity}`}`,
                options: lines, portrait: definition.portrait || null, subtitle: definition.subtitle || '' };
        }
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
