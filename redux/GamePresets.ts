import { ScoringRules } from './ScoringRules';

/**
 * Named games and the scoring rules they start with. Picking one copies its
 * rules into the game (see ScoringRules), so changing a preset here never
 * changes games that already used it.
 *
 * Bidding games (Oh Hell, Spades) join once bids are supported.
 */
export interface GamePreset {
    id: string;
    name: string;
    rules: ScoringRules;
}

const preset = (id: string, name: string, rules: Omit<ScoringRules, 'name'>): GamePreset => ({
    id,
    name,
    rules: { ...rules, name },
});

export const gamePresets: GamePreset[] = [
    preset('hearts', 'Hearts', { winner: 'low', end: { type: 'target', target: 100 } }),
    preset('golf', 'Golf', { winner: 'low', end: { type: 'rounds', rounds: 9 } }),
    preset('five-crowns', 'Five Crowns', { winner: 'low', end: { type: 'rounds', rounds: 11 } }),
    preset('farkle', 'Farkle', { winner: 'high', end: { type: 'target', target: 10000 } }),
    preset('rummy-500', 'Rummy 500', { winner: 'high', end: { type: 'target', target: 500 } }),
    preset('yahtzee', 'Yahtzee', { winner: 'high', end: { type: 'rounds', rounds: 13 } }),
];

/** Presets for a search, case-insensitive on the name. All of them when blank. */
export const searchPresets = (query: string, presets: GamePreset[] = gamePresets): GamePreset[] => {
    const needle = query.trim().toLowerCase();
    if (!needle) return presets;
    return presets.filter(({ name }) => name.toLowerCase().includes(needle));
};

/** The preset a game's rules still match, if any. */
export const matchingPreset = (rules: ScoringRules | undefined): GamePreset | undefined => {
    if (!rules?.name) return undefined;
    return gamePresets.find(({ name }) => name === rules.name);
};
