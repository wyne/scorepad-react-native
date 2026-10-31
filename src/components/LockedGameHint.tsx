import React from 'react';

import { Icon } from '@rneui/base';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../theme';

import { useLockedHint } from './LockedHintContext';

interface Props {
    top: number;
}

/** The toast shown when someone taps a score in a locked game. */
const LockedGameHint: React.FunctionComponent<Props> = ({ top }) => {
    const theme = useTheme();
    const { lockedHintVisible } = useLockedHint();

    if (!lockedHintVisible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(200)}
            pointerEvents="none"
            style={[styles.toast, { top, backgroundColor: theme.backgroundSecondary, shadowColor: theme.sheetShadow }]}
            testID="locked-game-hint"
        >
            <Icon name="lock-closed" type="ionicon" size={16} color={theme.warning} />
            <Text style={[styles.text, { color: theme.text }]}>
                Game is locked. Tap <Text style={styles.bold}>Final</Text> to unlock.
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    text: {
        flex: 1,
        fontSize: 15,
    },
    bold: {
        fontWeight: '600',
    },
});

export default LockedGameHint;
