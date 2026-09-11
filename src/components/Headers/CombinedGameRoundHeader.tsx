import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import * as Haptics from 'expo-haptics';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';

const CombinedGameRoundHeader: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const game = useAppSelector(state => selectGameById(state, currentGameId ?? ''));

    if (currentGameId == null || game == null) return null;

    const currentRoundIndex = game.roundCurrent ?? 0;
    const roundCount = game.roundTotal ?? 0;
    const roundLabel = game.locked ? 'Final' : `Round ${currentRoundIndex + 1} of ${roundCount}`;
    const pickerEnabled = !game.locked && roundCount > 1;
    const actions: MenuAction[] = Array.from({ length: roundCount }, (_, round) => ({
        id: round.toString(),
        title: Platform.OS === 'android' && round === currentRoundIndex
            ? `✓ Round ${round + 1}`
            : `Round ${round + 1}`,
        state: round === currentRoundIndex ? 'on' : 'off',
    }));

    const selectRound = (event: string) => {
        const round = Number(event);
        if (!Number.isInteger(round) || round < 0 || round >= roundCount || round === currentRoundIndex) return;

        void Haptics.selectionAsync();
        dispatch(updateGame({ id: currentGameId, changes: { roundCurrent: round } }));
        void logEvent('round_change', {
            game_id: currentGameId,
            source: 'combined header menu',
            from_round: currentRoundIndex,
            to_round: round,
        });
    };

    const content = (
        <View
            accessibilityLabel={pickerEnabled ? `${game.title}. ${roundLabel}. Select round` : `${game.title}. ${roundLabel}`}
            accessibilityRole={pickerEnabled ? 'button' : 'header'}
            style={styles.container}
        >
            <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                style={[styles.gameTitle, { color: theme.headerText }]}
            >
                {game.title}
            </Text>
            <View style={styles.roundRow}>
                <Text maxFontSizeMultiplier={1.2} style={[styles.roundText, { color: theme.textSecondary }]}>
                    {roundLabel}
                </Text>
                {pickerEnabled && <Icon name="caret-down" type="font-awesome-5" size={8} color={theme.tint} />}
            </View>
        </View>
    );

    return pickerEnabled ? (
        <MenuView
            actions={actions}
            onPressAction={({ nativeEvent }) => selectRound(nativeEvent.event)}
            shouldOpenOnLongPress={false}
            testID="combined-round-picker-menu"
        >
            {content}
        </MenuView>
    ) : content;
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        height: 44,
        justifyContent: 'center',
        maxWidth: Platform.OS === 'android' ? 190 : 180,
    },
    gameTitle: {
        fontSize: Platform.OS === 'android' ? 18 : 16,
        fontWeight: '700',
        lineHeight: Platform.OS === 'android' ? 21 : 19,
        textAlign: 'center',
    },
    roundRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
    },
    roundText: {
        fontSize: Platform.OS === 'android' ? 12 : 11,
        fontWeight: '600',
        lineHeight: Platform.OS === 'android' ? 15 : 14,
        fontVariant: ['tabular-nums'],
    },
});

export default CombinedGameRoundHeader;
