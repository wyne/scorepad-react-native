import React from 'react';

import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppSelector } from '../../../../redux/hooks';

import { calculateFontSize } from './Helpers';
import ScoreAfter from './ScoreAfter';
import ScoreBefore from './ScoreBefore';
import ScoreRound from './ScoreRound';
import { scoreStyles } from './scoreStyles';

interface Props {
    fontColor: string;
    maxWidth: number | null;
    maxHeight: number | null;
    playerId: string;
    index: number;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
}

const AdditionTile: React.FunctionComponent<Props> = ({
    fontColor,
    maxWidth,
    maxHeight,
    playerId,
    onRender,
}) => {
    onRender?.(playerId);

    const {
        currentRoundScore,
        currentRoundTotalScore,
        grandTotalScore,
        hasCurrentGame,
        isLocked,
        playerName,
    } = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        const currentGame = currentGameId ? selectGameById(state, currentGameId) : undefined;
        const player = state.players.entities[playerId];
        const scores = player?.scores ?? [];
        const currentRoundIndex = currentGame?.roundCurrent ?? 0;
        const currentRoundScore = scores[currentRoundIndex] ?? 0;
        const previousTotal = scores.reduce(
            (sum, s, i) => (i < currentRoundIndex ? sum + (s || 0) : sum), 0
        );

        return {
            currentRoundScore,
            currentRoundTotalScore: previousTotal + currentRoundScore,
            grandTotalScore: scores.reduce((sum, s) => sum + (s || 0), 0),
            hasCurrentGame: typeof currentGame !== 'undefined',
            isLocked: currentGame?.locked === true,
            playerName: player?.playerName,
        };
    }, shallowEqual);

    if (!hasCurrentGame) return null;
    if (typeof playerName == 'undefined') return null;

    if (maxWidth == null || maxHeight == null) return null;

    const containerShortEdge = Math.min(maxWidth, maxHeight);

    const playerNameFontSize = calculateFontSize(maxWidth);
    const finalScoreFontSize = calculateFontSize(maxWidth) * 1.2;

    const dynamicPlayerStyles = {
        fontSize: playerNameFontSize,
        color: fontColor,
    };

    if (isLocked) {
        return (
            <Animated.View style={[{ justifyContent: 'center' }]}>
                <Animated.Text style={[styles.name, dynamicPlayerStyles]} allowFontScaling={false} numberOfLines={1}>
                    {playerName}
                </Animated.Text>
                <Animated.Text
                    style={[scoreStyles.scoreText, { fontSize: finalScoreFontSize, color: fontColor }]}
                    allowFontScaling={false}
                >
                    {grandTotalScore}
                </Animated.Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[{ justifyContent: 'center' }]}>
            <Animated.Text style={[styles.name, dynamicPlayerStyles]} allowFontScaling={false} numberOfLines={1}>
                {playerName}
            </Animated.Text>

            <Animated.View style={styles.scoreLineOne}>
                <ScoreBefore containerWidth={containerShortEdge} currentRoundScore={currentRoundScore} currentRoundTotalScore={currentRoundTotalScore}
                    fontColor={fontColor} />
                <ScoreRound containerWidth={containerShortEdge} currentRoundScore={currentRoundScore}
                    fontColor={fontColor} />
            </Animated.View>

            <ScoreAfter containerWidth={containerShortEdge} currentRoundScore={currentRoundScore} currentRoundTotalScore={currentRoundTotalScore}
                fontColor={fontColor} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    name: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scoreLineOne: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AdditionTile;
