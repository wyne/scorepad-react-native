import playersReducer, {
    updatePlayer,
    removePlayer,
    playerAdd,
    playerRoundScoreIncrement,
    playerRoundScoreSet,
    selectAllPlayerNames,
    selectAllPlayers,
    selectPlayerGrandTotalScore,
    selectPlayerRoundStats,
    selectPlayerScoreByRound,
} from '../redux/PlayersSlice';
import { RootState } from '../redux/store';

const stateWithScores = (scores: number[]): RootState => {
    const state: Partial<RootState> = {
        players: {
            ids: ['1'],
            entities: {
                '1': { id: '1', playerName: 'Test', scores },
            },
        },
    };
    return state as RootState;
};

describe('players reducer', () => {
    const initialState = {
        ids: [],
        entities: {},
    };

    it('should handle initial state', () => {
        expect(playersReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle playerAdd', () => {
        const actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        expect(actual.ids.length).toEqual(1);
        expect(actual.entities['1']).toEqual({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        });
    });

    it('should handle updatePlayer', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        actual = playersReducer(actual, updatePlayer({
            id: '1',
            changes: { playerName: 'Updated' },
        }));
        if (actual.entities['1'] === undefined) {
            throw ('Player not found');
        }
        expect(actual.entities['1'].playerName).toEqual('Updated');
    });

    it('should handle removePlayer', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        actual = playersReducer(actual, removePlayer('1'));
        expect(actual.ids.length).toEqual(0);
    });

    it('should handle playerRoundScoreIncrement', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        actual = playersReducer(actual, playerRoundScoreIncrement('1', 0, 10));
        if (actual.entities['1'] === undefined) {
            throw ('Player not found');
        }
        expect(actual.entities['1'].scores[0]).toEqual(20);
    });

    it('should handle playerRoundScoreDecrement', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        actual = playersReducer(actual, playerRoundScoreIncrement('1', 0, -10));
        if (actual.entities['1'] === undefined) {
            throw ('Player not found');
        }
        expect(actual.entities['1'].scores[0]).toEqual(0);
    });

    it('should handle playerRoundScoreIncrement for a new round', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        actual = playersReducer(actual, playerRoundScoreIncrement('1', 3, 10));
        if (actual.entities['1'] === undefined) {
            throw ('Player not found');
        }
        expect(actual.entities['1'].scores[3]).toEqual(10);
        expect(actual.entities['1'].scores[0]).toEqual(10);
    });

    it('should not change state when setting a round score to the current value', () => {
        const actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        const next = playersReducer(actual, playerRoundScoreSet('1', 1, 20));
        expect(next).toBe(actual);
    });

    it('should coerce a null round entry to 0 before incrementing', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, null] as unknown as number[],
        }));
        actual = playersReducer(actual, playerRoundScoreIncrement('1', 1, 5));
        if (actual.entities['1'] === undefined) {
            throw ('Player not found');
        }
        expect(actual.entities['1'].scores).toEqual([10, 5]);
    });

    it('should not change player scores when incrementing an unknown player', () => {
        const actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        const next = playersReducer(actual, playerRoundScoreIncrement('missing', 0, 5));
        expect(next.ids).toEqual(['1']);
        expect(next.entities['missing']).toBeUndefined();
        expect(next.entities['1']?.scores).toEqual([10, 20, 30]);
    });

    it('should not change player scores when setting a score for an unknown player', () => {
        const actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        const next = playersReducer(actual, playerRoundScoreSet('missing', 0, 5));
        expect(next.ids).toEqual(['1']);
        expect(next.entities['missing']).toBeUndefined();
        expect(next.entities['1']?.scores).toEqual([10, 20, 30]);
    });

    it('should handle playerRoundScoreSet beyond the current scores length', () => {
        let actual = playersReducer(initialState, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10],
        }));
        actual = playersReducer(actual, playerRoundScoreSet('1', 2, 7));
        if (actual.entities['1'] === undefined) {
            throw ('Player not found');
        }
        expect(actual.entities['1'].scores[2]).toEqual(7);
        expect(actual.entities['1'].scores[0]).toEqual(10);
        expect(actual.entities['1'].scores.length).toEqual(3);
    });
});

describe('player sort order', () => {
    it('should order players by descending grand total on add', () => {
        let players = playersReducer(undefined, playerAdd({
            id: 'low',
            playerName: 'Low',
            scores: [5, 5],
        }));
        players = playersReducer(players, playerAdd({
            id: 'high',
            playerName: 'High',
            scores: [30, 30],
        }));
        players = playersReducer(players, playerAdd({
            id: 'spiky',
            playerName: 'Spiky',
            scores: [50, -10],
        }));
        const ordered = selectAllPlayers({ players }).map((p) => p.id);
        expect(ordered).toEqual(['high', 'spiky', 'low']);
    });

    it('does not re-sort when an increment changes the leader (sort applies on add/upsert only)', () => {
        let players = playersReducer(undefined, playerAdd({
            id: 'a',
            playerName: 'A',
            scores: [10],
        }));
        players = playersReducer(players, playerAdd({
            id: 'b',
            playerName: 'B',
            scores: [5],
        }));
        players = playersReducer(players, playerRoundScoreIncrement('b', 0, 100));
        const ordered = selectAllPlayers({ players }).map((p) => p.id);
        expect(ordered).toEqual(['a', 'b']);
    });

    it('should keep both players when grand totals are tied', () => {
        let players = playersReducer(undefined, playerAdd({
            id: 'a',
            playerName: 'A',
            scores: [10, 20],
        }));
        players = playersReducer(players, playerAdd({
            id: 'b',
            playerName: 'B',
            scores: [30],
        }));
        const ordered = selectAllPlayers({ players }).map((p) => p.id);
        expect(ordered).toEqual(['a', 'b']);
    });

    it('uses player id as a deterministic tie-breaker regardless of insertion order', () => {
        let players = playersReducer(undefined, playerAdd({
            id: 'z',
            playerName: 'Z',
            scores: [30],
        }));
        players = playersReducer(players, playerAdd({
            id: 'a',
            playerName: 'A',
            scores: [10, 20],
        }));

        expect(selectAllPlayers({ players }).map((player) => player.id)).toEqual(['a', 'z']);
    });
});

describe('selectAllPlayerNames', () => {
    it('should return unique player names with a stable memoized reference', () => {
        const players = playersReducer(undefined, playerAdd({
            id: '1',
            playerName: 'Alice',
            scores: [],
        }));
        const withDuplicateName = playersReducer(players, playerAdd({
            id: '2',
            playerName: 'Alice',
            scores: [],
        }));
        const withOtherName = playersReducer(withDuplicateName, playerAdd({
            id: '3',
            playerName: 'Bob',
            scores: [],
        }));
        const state = { players: withOtherName } as RootState;

        const result = selectAllPlayerNames(state);

        expect(result).toEqual(['Alice', 'Bob']);
        expect(selectAllPlayerNames(state)).toBe(result);
    });
});

describe('selectPlayerScoreByRound', () => {
    it('should return the score for the requested round', () => {
        expect(selectPlayerScoreByRound(stateWithScores([10, 20, 30]), '1', 1)).toEqual(20);
    });

    it('should return 0 for a round beyond the scores length', () => {
        expect(selectPlayerScoreByRound(stateWithScores([10, 20]), '1', 5)).toEqual(0);
    });

    it('should return 0 for an unknown player id', () => {
        expect(selectPlayerScoreByRound(stateWithScores([10, 20]), 'missing', 0)).toEqual(0);
    });

    it('should return 0 for a round with a stored 0', () => {
        expect(selectPlayerScoreByRound(stateWithScores([10, 0, 30]), '1', 1)).toEqual(0);
    });
});

describe('selectPlayerRoundStats', () => {
    it('should break down scores for a mid-game round', () => {
        expect(selectPlayerRoundStats(stateWithScores([10, 20, 30]), '1', 1)).toEqual({
            currentRoundScore: 20,
            previousTotal: 10,
            currentRoundTotalScore: 30,
            grandTotalScore: 60,
        });
    });

    it('should have no previous total on the first round', () => {
        expect(selectPlayerRoundStats(stateWithScores([10, 20, 30]), '1', 0)).toEqual({
            currentRoundScore: 10,
            previousTotal: 0,
            currentRoundTotalScore: 10,
            grandTotalScore: 60,
        });
    });

    it('should treat a round beyond the scores length as 0 with full previous total', () => {
        expect(selectPlayerRoundStats(stateWithScores([10, 20]), '1', 5)).toEqual({
            currentRoundScore: 0,
            previousTotal: 30,
            currentRoundTotalScore: 30,
            grandTotalScore: 30,
        });
    });

    it('should handle negative scores in the running totals', () => {
        expect(selectPlayerRoundStats(stateWithScores([10, -25, 5]), '1', 1)).toEqual({
            currentRoundScore: -25,
            previousTotal: 10,
            currentRoundTotalScore: -15,
            grandTotalScore: -10,
        });
    });

    it('should treat null round entries as 0', () => {
        const scores = [10, null, 20] as unknown as number[];
        expect(selectPlayerRoundStats(stateWithScores(scores), '1', 2)).toEqual({
            currentRoundScore: 20,
            previousTotal: 10,
            currentRoundTotalScore: 30,
            grandTotalScore: 30,
        });
    });

    it('should return all zeros for an unknown player id', () => {
        expect(selectPlayerRoundStats(stateWithScores([10, 20]), 'missing', 0)).toEqual({
            currentRoundScore: 0,
            previousTotal: 0,
            currentRoundTotalScore: 0,
            grandTotalScore: 0,
        });
    });

    it('should return all zeros for a player with no scores', () => {
        expect(selectPlayerRoundStats(stateWithScores([]), '1', 0)).toEqual({
            currentRoundScore: 0,
            previousTotal: 0,
            currentRoundTotalScore: 0,
            grandTotalScore: 0,
        });
    });
});

describe('selectPlayerGrandTotalScore', () => {
    it('should sum scores across all rounds', () => {
        expect(selectPlayerGrandTotalScore(stateWithScores([10, 20, 30]), '1')).toEqual(60);
    });

    it('should sum negative and positive scores', () => {
        expect(selectPlayerGrandTotalScore(stateWithScores([10, -25, 5]), '1')).toEqual(-10);
    });

    it('should return 0 for a player with no scores', () => {
        expect(selectPlayerGrandTotalScore(stateWithScores([]), '1')).toEqual(0);
    });

    it('should return 0 for an unknown player id', () => {
        expect(selectPlayerGrandTotalScore(stateWithScores([10, 20]), 'missing')).toEqual(0);
    });

    it('should treat null round entries as 0', () => {
        const scores = [10, null, 20] as unknown as number[];
        expect(selectPlayerGrandTotalScore(stateWithScores(scores), '1')).toEqual(30);
    });

    it('should reflect score updates applied through the reducer', () => {
        let players = playersReducer(undefined, playerAdd({
            id: '1',
            playerName: 'Test',
            scores: [10, 20, 30],
        }));
        players = playersReducer(players, playerRoundScoreIncrement('1', 1, 5));
        expect(selectPlayerGrandTotalScore({ players } as RootState, '1')).toEqual(65);
    });
});
