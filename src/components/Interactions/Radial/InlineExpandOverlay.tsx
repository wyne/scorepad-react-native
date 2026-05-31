import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreSet } from '../../../../redux/PlayersSlice';
import { selectPlayerById } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import DialControl from './DialControl';

const EXPAND_DURATION = 380;
const COLLAPSE_DURATION = 300;

function inkFor(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.42 ? '#000' : '#fff';
}

function inkA(ink: string, a: number): string {
    return ink === '#000' ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
}

interface RowRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface Props {
    playerId: string;
    rowRect: RowRect;
    boardWidth: number;
    boardHeight: number;
    onClose: () => void;
}

const InlineExpandOverlay: React.FC<Props> = ({
    playerId,
    rowRect,
    boardWidth,
    boardHeight,
    onClose,
}) => {
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    const player = useAppSelector(state => selectPlayerById(state, playerId));
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const roundCurrent = currentGame?.roundCurrent ?? 0;
    const roundScore = player?.scores[roundCurrent] ?? 0;
    const prevTotal = (player?.scores ?? []).reduce(
        (sum, s, i) => i < roundCurrent ? sum + (s || 0) : sum,
        0,
    );

    const [localScore, setLocalScore] = useState(roundScore);
    const [isSecondary, setIsSecondary] = useState(false);

    // Animated geometry
    const MARGIN = 16;
    const targetTop = MARGIN;
    const targetLeft = MARGIN;
    const targetWidth = boardWidth - MARGIN * 2;
    const targetHeight = boardHeight - MARGIN * 2;

    const animTop = useSharedValue(rowRect.top);
    const animLeft = useSharedValue(rowRect.left);
    const animWidth = useSharedValue(rowRect.width);
    const animHeight = useSharedValue(rowRect.height);
    const contentOpacity = useSharedValue(0);
    const closing = useRef(false);

    const easing = Easing.out(Easing.cubic);

    useEffect(() => {
        animTop.value = withTiming(targetTop, { duration: EXPAND_DURATION, easing });
        animLeft.value = withTiming(targetLeft, { duration: EXPAND_DURATION, easing });
        animWidth.value = withTiming(targetWidth, { duration: EXPAND_DURATION, easing });
        animHeight.value = withTiming(targetHeight, { duration: EXPAND_DURATION, easing });
        contentOpacity.value = withDelay(160, withTiming(1, { duration: 200 }));
    }, []);

    const panelStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: animTop.value,
        left: animLeft.value,
        width: animWidth.value,
        height: animHeight.value,
        borderRadius: 26,
        overflow: 'hidden',
    }));

    const contentStyle = useAnimatedStyle(() => ({
        flex: 1,
        opacity: contentOpacity.value,
    }));

    const handleClose = useCallback((save: boolean) => {
        if (closing.current) return;
        closing.current = true;

        if (save) {
            dispatch(playerRoundScoreSet(playerId, roundCurrent, localScore));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        contentOpacity.value = withTiming(0, { duration: 120 });
        animTop.value = withTiming(rowRect.top, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animLeft.value = withTiming(rowRect.left, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animWidth.value = withTiming(rowRect.width, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animHeight.value = withTiming(rowRect.height, {
            duration: COLLAPSE_DURATION,
            easing: Easing.in(Easing.cubic),
        }, () => runOnJS(onClose)());
    }, [localScore, onClose, playerId, roundCurrent, dispatch, rowRect]);

    if (!player || !currentGame) return null;
    const ink = inkFor(player.color ?? '#444');
    const playerColor = player.color ?? '#444';
    const newTotal = prevTotal + localScore;

    // Dial size: use 65% of the target height for the dial to leave room for name/total/done
    const dialSize = Math.min(Math.round(targetHeight * 0.52), Math.round(targetWidth * 0.9));

    return (
        <>
            {/* Backdrop — tap to discard */}
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => handleClose(false)} />

            <Animated.View style={[panelStyle, { backgroundColor: playerColor }]}>
                <Animated.View style={contentStyle}>
                    <View style={styles.inner}>
                        {/* Player name */}
                        <Text style={[styles.name, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit>
                            {player?.playerName}
                        </Text>

                        {/* Previous total */}
                        <View style={styles.prevBlock}>
                            <Text style={[styles.prevNumber, { color: ink }]}>{prevTotal}</Text>
                            <Text style={[styles.prevLabel, { color: inkA(ink, 0.6) }]}>PREVIOUS TOTAL</Text>
                        </View>

                        {/* Dial */}
                        <View style={styles.dialWrap}>
                            <DialControl
                                value={localScore}
                                onChange={setLocalScore}
                                onToggleMode={setIsSecondary}
                                isSecondary={isSecondary}
                                ink={ink}
                                newTotal={newTotal}
                                addendOne={addendOne}
                                addendTwo={addendTwo}
                                dialSize={dialSize}
                            />
                        </View>

                        {/* Done */}
                        <Pressable
                            onPress={() => handleClose(true)}
                            style={({ pressed }) => [
                                styles.doneBtn,
                                { backgroundColor: inkA(ink, pressed ? 0.28 : 0.16) },
                            ]}
                        >
                            <Text style={[styles.doneBtnText, { color: ink }]}>Done</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    inner: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 20,
        gap: 10,
    },
    name: {
        fontSize: 42,
        fontWeight: '800',
        lineHeight: 46,
    },
    prevBlock: {
        alignItems: 'center',
        gap: 2,
    },
    prevNumber: {
        fontSize: 26,
        fontWeight: '800',
        lineHeight: 30,
    },
    prevLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.4,
    },
    dialWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneBtn: {
        width: '74%',
        maxWidth: 300,
        height: 54,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneBtnText: {
        fontSize: 22,
        fontWeight: '700',
    },
});

export default InlineExpandOverlay;
