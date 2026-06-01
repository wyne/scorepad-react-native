import React from 'react';

import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAppSelector } from '../../../../redux/hooks';
import { selectPlayerById } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';

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
}

const AdditionTile: React.FunctionComponent<Props> = ({
    fontColor,
    maxWidth,
    maxHeight,
    playerId,
}) => {
    const currentGame = useAppSelector(selectCurrentGame);
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;
    const isLocked = currentGame.locked === true;

    const player = useAppSelector(state => selectPlayerById(state, playerId));
    if (typeof player == 'undefined') return null;
    const playerName = player.playerName;
    const scoreTotal = player.scores.reduce(
        (sum, current, round) => {
            if (round > roundCurrent) { return sum; }
            return sum + (current || 0);
        },
        0
    );
    const finalScoreTotal = player.scores.reduce((sum, s) => sum + (s || 0), 0);
    const scoreRound = player.scores[roundCurrent] || 0;

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
                    {finalScoreTotal}
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
                <ScoreBefore containerWidth={containerShortEdge} roundScore={scoreRound} totalScore={scoreTotal}
                    fontColor={fontColor} />
                <ScoreRound containerWidth={containerShortEdge} roundScore={scoreRound}
                    fontColor={fontColor} />
            </Animated.View>

            <ScoreAfter containerWidth={containerShortEdge} roundScore={scoreRound} totalScore={scoreTotal}
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
