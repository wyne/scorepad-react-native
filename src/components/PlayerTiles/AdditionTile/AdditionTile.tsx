import React from 'react';

import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAppSelector } from '../../../../redux/hooks';
import { selectPlayerById, selectPlayerRoundStats } from '../../../../redux/PlayersSlice';
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

    const currentRoundIndex = currentGame.roundCurrent;
    const isLocked = currentGame.locked === true;

    const player = useAppSelector(state => selectPlayerById(state, playerId));
    if (typeof player == 'undefined') return null;
    const playerName = player.playerName;
    const { currentRoundScore, currentRoundTotalScore, grandTotalScore } = useAppSelector(
        state => selectPlayerRoundStats(state, playerId, currentRoundIndex)
    );

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
