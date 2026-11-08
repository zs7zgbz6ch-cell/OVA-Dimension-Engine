// Authored interaction content. The agenda owns activity; this module owns words.
// A future editor can add scene/activity-specific sets without changing UI code.
export const INTERACTION_CONTENT = Object.freeze({
    CHARACTER_01: {
        portrait: './assets/characters/rionne-card.png',
        subtitle: 'BERKLITH TAVERN',
        default: {
            talk: [[
                "Well, hello there. It's nice to see you.",
                "There's always something happening around this Tavern.",
                "Make yourself comfortable. I'll be around if you need anything."
            ]],
            check: ['You spent some time watching Rionne. She looks busy.']
        }
    },
    NPC_01: {
        default: {
            talk: [
                ['Hello, how are you?'],
                ['Oops, I just dropped a glass!'],
                ['I wish this night was over.']
            ],
            check: ['You spent some time watching the barmaid. She looks busy.']
        }
    }
});
