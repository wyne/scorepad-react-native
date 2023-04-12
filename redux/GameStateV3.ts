interface GameStateV3 {
    entities: {
        games: {
            byId: {
                'game1': {
                    dateCreated: 123456789,
                    dateModified: 123456789,
                    scores: ['score1', 'score2'],
                    roundCurrent: 0,
                    roundTotal: 3,
                }
            },
            allIds: ['game1']
        },
        scores: {
            byId: {
                'score1': {
                    playerName: 'player1',
                    scores: [5, 11, 14],
                },
                'score2': {
                    playerNamd: 'player2',
                    scores: [5, 10, 15],
                }
            },
            allIds: ['score1', 'score2']
        },
    },
    ui: {
        gameFullscreen: false,
        multiplier: 1,
        currentGame: 'game1',
    }
}
