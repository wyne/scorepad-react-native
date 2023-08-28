import playersReducer, {
    updatePlayer,
    removePlayer,
    playerAdd,
    playerRoundScoreIncrement,
} from '../redux/PlayersSlice';

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
        expect(actual.entities['1'].scores[0]).toEqual(10);
    });
});
