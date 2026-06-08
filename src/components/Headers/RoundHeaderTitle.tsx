import React from 'react';

import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { roundNext, roundPrevious, selectGameById } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';

const RoundHeaderTitle: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    if (currentGameId == null) return null;

    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = currentGame?.roundCurrent ?? 0;
    const roundCount = currentGame?.roundTotal ?? 0;

    const isFirstRound = roundCurrent === 0;
    const isLastRound = roundCurrent + 1 >= roundCount;

    const nextRoundHandler = async () => {
        if (isLastRound && currentGame?.locked) return;

        Haptics.impactAsync(
            isLastRound ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
        );

        dispatch(roundNext(currentGameId));
        logEvent('round_change', {
            game_id: currentGameId,
            source: 'next button',
            round: roundCurrent,
            next_round: roundCurrent + 1,
            new_round: isLastRound,
        });
    };

    const prevRoundHandler = async () => {
        if (isFirstRound) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dispatch(roundPrevious(currentGameId));
        logEvent('round_change', {
            game_id: currentGameId,
            source: 'previous button',
            round: roundCurrent,
            next_round: roundCurrent - 1,
        });
    };

    const isLocked = currentGame?.locked === true;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.chevron, { opacity: isLocked || isFirstRound ? 0 : 1 }]}
                onPress={prevRoundHandler}
                disabled={isLocked || isFirstRound}
                testID="previous-round-button"
            >
                <Icon name="arrow-left" type="font-awesome-5" size={18} color={theme.tint} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.headerText }]} allowFontScaling={false}>
                {isLocked ? 'Final' : `Round ${roundCurrent + 1}${isLastRound ? '' : `/${roundCount}`}`}
            </Text>
            <TouchableOpacity
                style={[styles.chevron, { opacity: isLocked || isLastRound && currentGame?.locked ? 0 : 1 }]}
                onPress={nextRoundHandler}
                disabled={isLocked || isLastRound && (currentGame?.locked ?? false)}
                testID="next-round-button"
            >
                <Icon name="arrow-right" type="font-awesome-5" size={18} color={theme.tint} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        minWidth: 110,
    },
    chevron: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
});

export default RoundHeaderTitle;
