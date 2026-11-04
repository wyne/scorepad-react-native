import React from 'react';

import { Icon } from '@rneui/base';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '../theme';

import { useGestureNudge } from './GestureNudgeContext';

interface Props {
    top: number;
}

/** The one-line toast shown when a scoring gesture misses twice in a row. */
const GestureNudge: React.FunctionComponent<Props> = ({ top }) => {
    const theme = useTheme();
    const { nudgeMessage } = useGestureNudge();

    if (!nudgeMessage) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(200)}
            pointerEvents="none"
            style={[styles.toast, { top, backgroundColor: theme.backgroundSecondary, shadowColor: theme.sheetShadow }]}
            testID="gesture-nudge"
        >
            <Icon name="hand-left-outline" type="ionicon" size={16} color={theme.tint} />
            <Text style={[styles.text, { color: theme.text }]}>{nudgeMessage}</Text>
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
});

export default GestureNudge;
