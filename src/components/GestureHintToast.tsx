import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppSelector } from '../../redux/hooks';
import { selectInteractionType } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import { useGestureHint } from '../hooks/useGestureHint';
import { useTheme } from '../theme';

import { useGestureHintDismissal } from './GestureHintContext';
import { useGestureNudge } from './GestureNudgeContext';
import { gestureDemoLabel, gestureToastCopy } from './Interactions/gestureCopy';
import GestureDemo from './Interactions/GestureDemo';
import { useLockedHint } from './LockedHintContext';
import { useGestureInfoSheetContext } from './Sheets/GestureInfoSheetContext';

const DEMO_COLOR = '#01497C';

interface Props {
    top: number;
}

/**
 * Teaches the active scoring gesture once, off the tiles: a toast with a
 * looping demo that shows until the gesture is first used (see useGestureHint)
 * or dismissed. "How it works" opens the How to Score sheet.
 */
const GestureHintToast: React.FunctionComponent<Props> = ({ top }) => {
    const theme = useTheme();
    const showHint = useGestureHint();
    const interactionType = useAppSelector(state => selectInteractionType(state, state.settings.currentGameId));
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);
    const gestureInfoSheetRef = useGestureInfoSheetContext();
    const { lockedHintVisible } = useLockedHint();
    const { nudgeMessage } = useGestureNudge();
    // Dismissing hides the toast for this gesture until the app restarts or
    // the gesture changes; using the gesture hides it for good.
    const { dismissedFor, dismissHint } = useGestureHintDismissal();

    if (!showHint || dismissedFor === interactionType || lockedHintVisible || nudgeMessage) return null;

    const { title, body } = gestureToastCopy(interactionType, addendOne, addendTwo);

    const dismiss = (action: 'got_it' | 'how_it_works') => {
        dismissHint(interactionType);
        logEvent('gesture_hint_action', { interaction_type: interactionType, action });
    };

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[styles.toast, { top, backgroundColor: theme.backgroundSecondary, shadowColor: theme.sheetShadow }]}
            testID="gesture-hint-toast"
        >
            <GestureDemo interactionType={interactionType} width={52} height={66} color={DEMO_COLOR} label={gestureDemoLabel(interactionType, addendOne)} />
            <View style={styles.body}>
                <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">{title}</Text>
                <Text style={[styles.text, { color: theme.textSecondary }]}>{body}</Text>
                <View style={styles.actions}>
                    <Pressable
                        testID="gesture-hint-got-it"
                        accessibilityRole="button"
                        onPress={() => dismiss('got_it')}
                        style={({ pressed }) => [styles.primary, { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 }]}
                        hitSlop={6}
                    >
                        <Text style={styles.primaryText}>Got it</Text>
                    </Pressable>
                    <Pressable
                        testID="gesture-hint-how"
                        accessibilityRole="button"
                        onPress={() => {
                            dismiss('how_it_works');
                            gestureInfoSheetRef?.current?.present();
                        }}
                        hitSlop={6}
                    >
                        {({ pressed }) => (
                            <Text style={[styles.link, { color: theme.tint, opacity: pressed ? 0.6 : 1 }]}>How it works ›</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 8,
    },
    body: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    text: {
        fontSize: 13.5,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    primary: {
        borderRadius: 9,
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    primaryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13.5,
    },
    link: {
        fontWeight: '600',
        fontSize: 13.5,
    },
});

export default GestureHintToast;
