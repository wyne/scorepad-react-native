import playersReducer, {
    updatePlayer,
    removePlayer,
    playerAdd,
    playerRoundScoreIncrement,
    playerRoundScoreSet,
    selectPlayerGrandTotalScore,
} from '../redux/PlayersSlice';
import { RootState } from '../redux/store';

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
});

describe('selectPlayerGrandTotalScore', () => {
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
