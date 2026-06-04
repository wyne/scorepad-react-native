import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreSet, selectPlayerById, selectPlayerRoundStats } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import { useMenuOpen } from '../../MenuOpenContext';

import DialControl from './DialControl';

const SWIPE_DISMISS_DISTANCE = 50;
const SWIPE_DISMISS_VELOCITY = 400;
const MARGIN_BOTTOM = 12;
const MARGIN_H = 12;
const MIN_DISMISS_VELOCITY = 600; // px/s floor so slow releases still exit cleanly
const LS_ACCENT = '#3a86ff'; // matches DialControl's ACCENT for the landscape step pill

function resistedDrag(t: number): number {
    'worklet';
    if (t <= 0) return 0;
    return t / (1 + t / 400); // nearly 1:1 at small pulls, strong resistance beyond ~150 px
}

// TODO: see RowsBoard.tsx — consolidate inkFor/inkA into shared colorUtils module
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

// ─── PlayerDialPage ───────────────────────────────────────────────────────────

interface PlayerDialPageProps {
    playerId: string;
    pageWidth: number;
    pageHeight: number;
    boardHeight: number;
    addendOne: number;
    addendTwo: number;
    menuOpen: boolean;
    swipeDragY: SharedValue<number>;
    swipeDragX: SharedValue<number>;
    onDone: () => void;
    onDismiss: () => void;
}

const PlayerDialPage: React.FC<PlayerDialPageProps> = ({
    playerId,
    pageWidth,
    pageHeight,
    boardHeight,
    addendOne,
    addendTwo,
    menuOpen,
    swipeDragY,
    swipeDragX,
    onDone,
    onDismiss,
}) => {
    const dispatch = useAppDispatch();
    const player = useAppSelector(state => selectPlayerById(state, playerId));
    const roundCurrent = useAppSelector(state => selectCurrentGame(state)?.roundCurrent ?? 0);
    const { roundScore, previousTotal, currentTotal: scoreTotal } = useAppSelector(
        state => selectPlayerRoundStats(state, playerId, roundCurrent)
    );

    const [isSecondary, setIsSecondary] = useState(false);

    // Reset dial mode when the active round changes
    useEffect(() => {
        setIsSecondary(false);
    }, [roundCurrent]);

    const handleChange = useCallback((v: number) => {
        dispatch(playerRoundScoreSet(playerId, roundCurrent, v));
    }, [dispatch, playerId, roundCurrent]);

    const isDismissing = useSharedValue(false);

    // Vertical-only dismiss gesture: fails on horizontal so FlatList keeps scroll
    const dismissGesture = Gesture.Pan()
        .enabled(!menuOpen)
        .activeOffsetY([-10, 10])
        .failOffsetX([-8, 8])
        .onUpdate((e) => {
            swipeDragY.value = resistedDrag(e.translationY);
            swipeDragX.value = e.translationX * 0.35;
        })
        .onEnd((e) => {
            if (e.translationY > SWIPE_DISMISS_DISTANCE || e.velocityY > SWIPE_DISMISS_VELOCITY) {
                isDismissing.value = true;
                // Duration scales with velocity: fast throw exits quickly, slow release still exits
                const exitVelocity = Math.max(e.velocityY, MIN_DISMISS_VELOCITY);
                const duration = Math.max(150, 400 - exitVelocity / 5);
                swipeDragY.value = withTiming(boardHeight, { duration, easing: Easing.in(Easing.cubic) },
                    () => runOnJS(onDismiss)(),
                );
                swipeDragX.value = withTiming(0, { duration, easing: Easing.out(Easing.quad) });
            } else {
                swipeDragY.value = withSpring(0, { velocity: e.velocityY, damping: 26, stiffness: 300 });
                swipeDragX.value = withSpring(0, { velocity: e.velocityX, damping: 26, stiffness: 300 });
            }
        })
        .onFinalize(() => {
            if (!isDismissing.value) {
                swipeDragY.value = withSpring(0, { velocity: 0, damping: 26, stiffness: 300 });
                swipeDragX.value = withSpring(0, { velocity: 0, damping: 26, stiffness: 300 });
            }
            isDismissing.value = false;
        });

    if (!player) return null;

    const ink = inkFor(player.color ?? '#444');
    const playerColor = player.color ?? '#444';
    const isLandscape = pageWidth > pageHeight;

    const cardStyle = { width: pageWidth, height: pageHeight, backgroundColor: playerColor, borderRadius: 26, overflow: 'hidden' as const };

    if (isLandscape) {
        const lsDialSize = Math.min(Math.round((pageHeight - 52) / 1.25), 200);
        const stepBg = isSecondary ? LS_ACCENT : inkA(ink, 0.12);
        const stepDotBg = isSecondary ? '#fff' : inkA(ink, 0.4);
        const stepTextColor = isSecondary ? '#fff' : ink;

        return (
            <View style={cardStyle}>
                {/* Header: drag handle + name — swipe-to-dismiss zone */}
                <GestureDetector gesture={dismissGesture}>
                    <View style={styles.lsHeader}>
                        <View style={[styles.dragHandle, { backgroundColor: inkA(ink, 0.3) }]} />
                        <Text style={[styles.name, { color: ink, fontSize: 22, lineHeight: 26 }]}
                            numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                            {player.playerName}
                        </Text>
                    </View>
                </GestureDetector>

                {/* Three-column body */}
                <View style={styles.lsBody}>
                    {/* Left: previous total + step pill */}
                    <View style={styles.lsCol}>
                        <View style={styles.prevBlock}>
                            <Text style={[styles.prevNumber, { color: ink }]}>{previousTotal}</Text>
                            <Text style={[styles.prevLabel, { color: inkA(ink, 0.6) }]}>PREVIOUS TOTAL</Text>
                        </View>
                        <View style={[styles.lsPill, { backgroundColor: stepBg }]}>
                            <View style={[styles.lsPillDot, { backgroundColor: stepDotBg }]} />
                            <Text style={[styles.lsPillText, { color: stepTextColor }]}>
                                STEP +{isSecondary ? addendTwo : addendOne}
                            </Text>
                        </View>
                    </View>

                    {/* Center: dial */}
                    <View style={styles.lsCenter}>
                        <DialControl
                            value={roundScore}
                            onChange={handleChange}
                            onToggleMode={setIsSecondary}
                            isSecondary={isSecondary}
                            ink={ink}
                            newTotal={scoreTotal}
                            addendOne={addendOne}
                            addendTwo={addendTwo}
                            dialSize={lsDialSize}
                            landscape
                            menuOpen={menuOpen}
                        />
                    </View>

                    {/* Right: new total + Done */}
                    <View style={styles.lsCol}>
                        <View style={styles.prevBlock}>
                            <Text style={[styles.prevNumber, { color: ink }]}>{scoreTotal}</Text>
                            <Text style={[styles.prevLabel, { color: inkA(ink, 0.6) }]}>NEW TOTAL</Text>
                        </View>
                        <Pressable
                            onPress={onDone}
                            style={({ pressed }) => [
                                styles.lsDoneBtn,
                                { backgroundColor: inkA(ink, pressed ? 0.28 : 0.16) },
                            ]}
                        >
                            <Text style={[styles.doneBtnText, { color: ink }]}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    const dialSize = Math.min(Math.round(pageHeight * 0.38), Math.round(pageWidth * 0.9), 240);

    return (
        <View style={cardStyle}>
            <View style={styles.inner}>
                {/* Top group: drag handle + name + prev total — also the swipe-to-dismiss zone */}
                <GestureDetector gesture={dismissGesture}>
                    <View style={styles.topGroup}>
                        <View style={[styles.dragHandle, { backgroundColor: inkA(ink, 0.3) }]} />
                        <Text
                            style={[styles.name, { color: ink }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                        >
                            {player.playerName}
                        </Text>
                        <View style={styles.prevBlock}>
                            <Text style={[styles.prevNumber, { color: ink }]}>{previousTotal}</Text>
                            <Text style={[styles.prevLabel, { color: inkA(ink, 0.6) }]}>PREVIOUS TOTAL</Text>
                        </View>
                    </View>
                </GestureDetector>

                {/* Dial */}
                <View style={styles.dialWrap}>
                    <DialControl
                        value={roundScore}
                        onChange={handleChange}
                        onToggleMode={setIsSecondary}
                        isSecondary={isSecondary}
                        ink={ink}
                        newTotal={scoreTotal}
                        addendOne={addendOne}
                        addendTwo={addendTwo}
                        dialSize={dialSize}
                        menuOpen={menuOpen}
                    />
                </View>

                {/* Done */}
                <Pressable
                    onPress={onDone}
                    style={({ pressed }) => [
                        styles.doneBtn,
                        { backgroundColor: inkA(ink, pressed ? 0.28 : 0.16) },
                    ]}
                >
                    <Text style={[styles.doneBtnText, { color: ink }]}>Done</Text>
                </Pressable>
            </View>
        </View>
    );
};

// ─── DialOverlay ──────────────────────────────────────────────────────────────

interface Props {
    playerIds: string[];
    initialIndex: number;
    boardWidth: number;
    boardHeight: number;
    safeAreaTop: number;
    onClose: () => void;
}

const DialOverlay: React.FC<Props> = ({
    playerIds,
    initialIndex,
    boardWidth,
    boardHeight,
    safeAreaTop,
    onClose,
}) => {
    const currentGame = useAppSelector(selectCurrentGame);
    const { menuOpen } = useMenuOpen();
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const activeIndexRef = useRef(initialIndex);
    activeIndexRef.current = activeIndex;

    const flatListRef = useRef<FlatList>(null);
    const closing = useRef(false);

    const marginTop = Math.max(12, safeAreaTop);
    const targetTop = marginTop;
    const targetWidth = boardWidth;
    const targetHeight = boardHeight - marginTop - MARGIN_BOTTOM;
    const pageWidth = boardWidth - MARGIN_H * 2;

    const opacity = useSharedValue(0);
    const slideY = useSharedValue(20);
    const swipeDragY = useSharedValue(0);
    const swipeDragX = useSharedValue(0);

    // Fade in + slide up on mount
    useEffect(() => {
        opacity.value = withTiming(1, { duration: 200 });
        slideY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    }, []);

    const panelStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: targetTop,
        left: 0,
        width: targetWidth,
        height: targetHeight,
        opacity: opacity.value,
        transform: [
            { translateY: swipeDragY.value + slideY.value },
            { translateX: swipeDragX.value },
        ],
    }));

    const slideOut = useCallback((then: () => void) => {
        opacity.value = withTiming(0, { duration: 150 });
        swipeDragY.value = withTiming(
            boardHeight,
            { duration: 250, easing: Easing.in(Easing.cubic) },
            () => runOnJS(then)(),
        );
    }, [boardHeight]);

    // Close if the game becomes locked while the overlay is open
    useEffect(() => {
        if (currentGame?.locked && !closing.current) {
            closing.current = true;
            onClose();
        }
    }, [currentGame?.locked]);

    // Done button: animate out then close
    const handleDone = useCallback(() => {
        if (closing.current) return;
        closing.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        slideOut(onClose);
    }, [slideOut, onClose]);

    // Called by the worklet after swipe-down animation completes
    const handleDismiss = useCallback(() => {
        if (closing.current) return;
        closing.current = true;
        onClose();
    }, [onClose]);

    // Backdrop tap: slide out
    const handleBackdropPress = useCallback(() => {
        if (closing.current) return;
        closing.current = true;
        slideOut(onClose);
    }, [slideOut, onClose]);

    // FlatList paged scroll: track active index
    const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        swipeDragY.value = 0;
        swipeDragX.value = 0;
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / targetWidth);
        if (newIndex === activeIndexRef.current) return;
        setActiveIndex(newIndex);
    }, [targetWidth]);

    if (!currentGame) return null;

    return (
        <>
            {/* Backdrop — tap to dismiss */}
            <Pressable testID="overlay-backdrop" style={StyleSheet.absoluteFillObject} onPress={handleBackdropPress} disabled={menuOpen} />

            <Animated.View style={panelStyle}>
                <FlatList
                    ref={flatListRef}
                    data={playerIds}
                    keyExtractor={(id) => id}
                    horizontal
                    pagingEnabled
                    scrollEnabled={!menuOpen}
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    onLayout={() => {
                        flatListRef.current?.scrollToOffset({
                            offset: targetWidth * activeIndexRef.current,
                            animated: false,
                        });
                    }}
                    getItemLayout={(_, index) => ({
                        length: targetWidth,
                        offset: targetWidth * index,
                        index,
                    })}
                    renderItem={({ item: pid }) => (
                        <View style={{ width: targetWidth, paddingHorizontal: MARGIN_H }}>
                            <PlayerDialPage
                                playerId={pid}
                                pageWidth={pageWidth}
                                pageHeight={targetHeight}
                                boardHeight={boardHeight}
                                addendOne={addendOne}
                                addendTwo={addendTwo}
                                menuOpen={menuOpen}
                                swipeDragY={swipeDragY}
                                swipeDragX={swipeDragX}
                                onDone={handleDone}
                                onDismiss={handleDismiss}
                            />
                        </View>
                    )}
                    onMomentumScrollEnd={handleScrollEnd}
                />
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 16,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 16,
    },
    topGroup: {
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    dragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    name: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 36,
    },
    prevBlock: {
        alignItems: 'center',
        gap: 2,
    },
    prevNumber: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
        fontVariant: ['tabular-nums'],
    },
    prevLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
    },
    dialWrap: {
        alignItems: 'center',
    },
    doneBtn: {
        width: '74%',
        maxWidth: 300,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
    },
    doneBtnText: {
        fontSize: 20,
        fontWeight: '700',
    },
    // ── Landscape layout ────────────────────────────────────────────────────────
    lsHeader: {
        alignItems: 'center',
        gap: 4,
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 6,
    },
    lsBody: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    lsCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    lsCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    lsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    lsPillDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    lsPillText: {
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.8,
    },
    lsDoneBtn: {
        width: '90%',
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DialOverlay;
