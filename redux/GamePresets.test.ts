import { gamePresets, matchingPreset, searchPresets } from './GamePresets';
import { isScoringRules } from './ScoringRules';

describe('GamePresets', () => {
    it('gives every preset valid rules labelled with its name', () => {
        gamePresets.forEach(preset => {
            expect(isScoringRules(preset.rules)).toBe(true);
            expect(preset.rules.name).toBe(preset.name);
        });
    });

    it('uses unique ids and names', () => {
        expect(new Set(gamePresets.map(p => p.id)).size).toBe(gamePresets.length);
        expect(new Set(gamePresets.map(p => p.name)).size).toBe(gamePresets.length);
    });

    it('searches names without regard to case', () => {
        expect(searchPresets('').length).toBe(gamePresets.length);
        expect(searchPresets('  ').length).toBe(gamePresets.length);
        expect(searchPresets('HEART').map(p => p.id)).toEqual(['hearts']);
        expect(searchPresets('r').map(p => p.id)).toEqual(['hearts', 'five-crowns', 'farkle', 'rummy-500']);
        expect(searchPresets('poker')).toEqual([]);
    });

    it('matches a game to its preset by name only', () => {
        expect(matchingPreset(undefined)).toBeUndefined();
        expect(matchingPreset({ winner: 'low' })).toBeUndefined();
        expect(matchingPreset({ winner: 'low', name: 'Golf' })?.id).toBe('golf');
        expect(matchingPreset({ winner: 'low', name: 'Canasta' })).toBeUndefined();
    });
});
