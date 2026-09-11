import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { roundNext, roundPrevious, selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { LIQUID_GLASS } from '../../platform';
import { useTheme } from '../../theme';

const RoundHeaderTitle: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId ?? ''));
    const currentRoundIndex = currentGame?.roundCurrent ?? 0;
    const roundCount = currentGame?.roundTotal ?? 0;

    if (currentGameId == null) return null;

    const isFirstRound = currentRoundIndex === 0;
    const isLastRound = currentRoundIndex + 1 >= roundCount;

    const nextRoundHandler = async () => {
        if (isLastRound && currentGame?.locked) return;

        Haptics.impactAsync(
            isLastRound ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
        );

        dispatch(roundNext(currentGameId));
        logEvent('round_change', {
            game_id: currentGameId,
            source: 'next button',
            from_round: currentRoundIndex,
            to_round: currentRoundIndex + 1,
            created_round: isLastRound,
        });
    };

    const prevRoundHandler = async () => {
        if (isFirstRound) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        dispatch(roundPrevious(currentGameId));
        logEvent('round_change', {
            game_id: currentGameId,
            source: 'previous button',
            from_round: currentRoundIndex,
            to_round: currentRoundIndex - 1,
        });
    };

    const isLocked = currentGame?.locked === true;
    const isEarlierRound = !isLocked && currentRoundIndex < roundCount - 1;
    const previousDisabled = isLocked || isFirstRound;
    const nextDisabled = isLocked || isLastRound && (currentGame?.locked ?? false);
    const roundPickerEnabled = !isLocked && roundCount > 1;
    const roundDescriptor = isEarlierRound ? 'Earlier round' : 'Round';
    const roundLabel = isLocked ? 'Final' : `${roundDescriptor} ${currentRoundIndex + 1} of ${roundCount}`;
    const roundPickerLabel = isLocked ? (
        <Text
            maxFontSizeMultiplier={1.3}
            style={[styles.finalLabel, { color: theme.headerText }]}
        >
            Final
        </Text>
    ) : (
        <View style={styles.roundLabel}>
            <Text
                maxFontSizeMultiplier={1.15}
                style={[styles.roundDescriptor, { color: isEarlierRound ? theme.warning : theme.headerText }]}
            >
                {roundDescriptor}
            </Text>
            <Text
                maxFontSizeMultiplier={1.3}
                style={[styles.roundValue, { color: theme.headerText }]}
            >
                {currentRoundIndex + 1} of {roundCount}
            </Text>
        </View>
    );
    const roundActions: MenuAction[] = Array.from({ length: roundCount }, (_, round) => ({
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
        dispatch(updateGame({
            id: currentGameId,
            changes: { roundCurrent: round },
        }));
        void logEvent('round_change', {
            game_id: currentGameId,
            source: 'header menu',
            from_round: currentRoundIndex,
            to_round: round,
        });
    };

    const roundPicker = roundPickerEnabled ? (
        <MenuView
            actions={roundActions}
            onPressAction={({ nativeEvent }) => selectRound(nativeEvent.event)}
            shouldOpenOnLongPress={false}
            testID="round-picker-menu"
        >
            <View
                accessibilityHint={isEarlierRound ? 'Score changes affect an earlier round' : undefined}
                accessibilityLabel={`${roundLabel}. Select round`}
                accessibilityRole="button"
                style={styles.roundPicker}
            >
                {roundPickerLabel}
                <View style={styles.menuIndicator}>
                    <Icon name="caret-down" type="font-awesome-5" size={9} color={theme.tint} />
                </View>
            </View>
        </MenuView>
    ) : (
        <View style={styles.roundPicker}>
            {roundPickerLabel}
        </View>
    );

    const controls = (
        <>
            <Pressable
                accessibilityLabel="Previous round"
                accessibilityRole="button"
                accessibilityState={{ disabled: previousDisabled }}
                android_ripple={{ color: theme.separator }}
                disabled={previousDisabled}
                hitSlop={4}
                onPress={prevRoundHandler}
                style={({ pressed }) => [
                    styles.chevron,
                    { opacity: previousDisabled ? 0 : 1 },
                    Platform.OS === 'ios' && pressed && styles.pressed,
                ]}
                testID="previous-round-button"
            >
                <Icon name="chevron-left" type="font-awesome-5" size={16} color={theme.tint} />
            </Pressable>
            {roundPicker}
            <Pressable
                accessibilityLabel="Next round"
                accessibilityRole="button"
                accessibilityState={{ disabled: nextDisabled }}
                android_ripple={{ color: theme.separator }}
                disabled={nextDisabled}
                hitSlop={4}
                onPress={nextRoundHandler}
                style={({ pressed }) => [
                    styles.chevron,
                    { opacity: nextDisabled ? 0 : 1 },
                    Platform.OS === 'ios' && pressed && styles.pressed,
                ]}
                testID="next-round-button"
            >
                <Icon name="chevron-right" type="font-awesome-5" size={16} color={theme.tint} />
            </Pressable>
        </>
    );

    if (LIQUID_GLASS) {
        return (
            <GlassView
                colorScheme={theme.headerText === '#FFFFFF' ? 'dark' : 'light'}
                glassEffectStyle="regular"
                isInteractive
                style={[
                    styles.container,
                    styles.outlinedContainer,
                    { borderColor: isEarlierRound ? theme.warning : 'transparent' },
                ]}
            >
                {controls}
            </GlassView>
        );
    }

    const backgroundColor = Platform.OS === 'android'
        ? theme.backgroundSecondary
        : theme.headerText === '#FFFFFF'
            ? 'rgba(255,255,255,0.14)'
            : 'rgba(118,118,128,0.12)';

    return (
        <View
            style={[
                styles.container,
                styles.outlinedContainer,
                styles.fallbackContainer,
                { backgroundColor, borderColor: isEarlierRound ? theme.warning : 'transparent' },
            ]}
        >
            {controls}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Platform.OS === 'android' ? 24 : 22,
        height: Platform.OS === 'android' ? 48 : 44,
        width: Platform.OS === 'android' ? 192 : undefined,
    },
    outlinedContainer: {
        borderWidth: Platform.OS === 'android' ? 2 : 1.5,
    },
    fallbackContainer: {
        overflow: 'hidden',
    },
    finalLabel: {
        fontSize: Platform.OS === 'android' ? 17 : 16,
        fontWeight: '600',
        lineHeight: Platform.OS === 'android' ? 21 : 20,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },
    roundDescriptor: {
        fontSize: Platform.OS === 'android' ? 11 : 10,
        fontWeight: '600',
        lineHeight: Platform.OS === 'android' ? 13 : 12,
        textAlign: 'center',
    },
    roundLabel: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundValue: {
        fontSize: Platform.OS === 'android' ? 15 : 14,
        fontWeight: '600',
        lineHeight: Platform.OS === 'android' ? 18 : 17,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },
    roundPicker: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: Platform.OS === 'android' ? 104 : 96,
    },
    menuIndicator: {
        position: 'absolute',
        right: 5,
    },
    chevron: {
        width: Platform.OS === 'android' ? 44 : 40,
        height: Platform.OS === 'android' ? 48 : 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.45,
    },
});

export default RoundHeaderTitle;
