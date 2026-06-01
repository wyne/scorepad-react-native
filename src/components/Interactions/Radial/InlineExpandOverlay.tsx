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
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreSet, selectPlayerById } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import DialControl from './DialControl';

const EXPAND_DURATION = 380;
const COLLAPSE_DURATION = 300;
const SWIPE_DISMISS_DISTANCE = 50;
const SWIPE_DISMISS_VELOCITY = 400;
const MARGIN_BOTTOM = 12;
const MARGIN_H = 12;
const MIN_DISMISS_VELOCITY = 600; // px/s floor so slow releases still exit cleanly

function resistedDrag(t: number): number {
    'worklet';
    if (t <= 0) return 0;
    return t / (1 + t / 400); // nearly 1:1 at small pulls, strong resistance beyond ~150 px
}

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

// ─── PlayerDialPage ───────────────────────────────────────────────────────────

interface PlayerDialPageProps {
    playerId: string;
    pageWidth: number;
    pageHeight: number;
    boardHeight: number;
    addendOne: number;
    addendTwo: number;
    roundCurrent: number;
    swipeDragY: SharedValue<number>;
    swipeDragX: SharedValue<number>;
    onScoreChange: (score: number) => void;
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
    roundCurrent,
    swipeDragY,
    swipeDragX,
    onScoreChange,
    onDone,
    onDismiss,
}) => {
    const player = useAppSelector(state => selectPlayerById(state, playerId));

    const roundScore = player?.scores[roundCurrent] ?? 0;
    const prevTotal = (player?.scores ?? []).reduce(
        (sum, s, i) => i < roundCurrent ? sum + (s || 0) : sum,
        0,
    );

    const [localScore, setLocalScore] = useState(roundScore);
    const [isSecondary, setIsSecondary] = useState(false);

    // Keep callback ref to avoid stale closure issues
    const onScoreChangeRef = useRef(onScoreChange);
    onScoreChangeRef.current = onScoreChange;

    useEffect(() => {
        onScoreChangeRef.current(localScore);
    }, [localScore]);

    const isDismissing = useSharedValue(false);

    // Vertical-only dismiss gesture: fails on horizontal so FlatList keeps scroll
    const dismissGesture = Gesture.Pan()
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
    const newTotal = prevTotal + localScore;
    const dialSize = Math.min(Math.round(pageHeight * 0.38), Math.round(pageWidth * 0.9), 240);

    return (
        <View style={{ width: pageWidth, height: pageHeight, backgroundColor: playerColor, borderRadius: 26, overflow: 'hidden' }}>
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
                            <Text style={[styles.prevNumber, { color: ink }]}>{prevTotal}</Text>
                            <Text style={[styles.prevLabel, { color: inkA(ink, 0.6) }]}>PREVIOUS TOTAL</Text>
                        </View>
                    </View>
                </GestureDetector>

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

// ─── InlineExpandOverlay ──────────────────────────────────────────────────────

interface Props {
    playerIds: string[];
    initialIndex: number;
    rowRect: RowRect;
    boardWidth: number;
    boardHeight: number;
    safeAreaTop: number;
    onClose: () => void;
}

const InlineExpandOverlay: React.FC<Props> = ({
    playerIds,
    initialIndex,
    rowRect,
    boardWidth,
    boardHeight,
    safeAreaTop,
    onClose,
}) => {
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const roundCurrent = currentGame?.roundCurrent ?? 0;

    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const activeIndexRef = useRef(initialIndex);
    activeIndexRef.current = activeIndex;

    const flatListRef = useRef<FlatList>(null);
    // localScores[playerId] = current uncommitted local score for that player
    const localScores = useRef<Record<string, number>>({});
    const closing = useRef(false);

    const marginTop = Math.max(12, safeAreaTop);
    const targetTop = marginTop;
    const targetLeft = 0;
    const targetWidth = boardWidth;
    const targetHeight = boardHeight - marginTop - MARGIN_BOTTOM;
    const pageWidth = boardWidth - MARGIN_H * 2;

    const animTop = useSharedValue(rowRect.top);
    const animLeft = useSharedValue(rowRect.left);
    const animWidth = useSharedValue(rowRect.width);
    const animHeight = useSharedValue(rowRect.height);
    const contentOpacity = useSharedValue(0);
    const swipeDragY = useSharedValue(0);
    const swipeDragX = useSharedValue(0);

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
        transform: [{ translateY: swipeDragY.value }, { translateX: swipeDragX.value }],
    }));

    const contentStyle = useAnimatedStyle(() => ({
        flex: 1,
        opacity: contentOpacity.value,
    }));

    const collapseAndClose = useCallback(() => {
        contentOpacity.value = withTiming(0, { duration: 120 });
        animTop.value = withTiming(rowRect.top, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animLeft.value = withTiming(rowRect.left, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animWidth.value = withTiming(rowRect.width, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animHeight.value = withTiming(rowRect.height, {
            duration: COLLAPSE_DURATION,
            easing: Easing.in(Easing.cubic),
        }, () => runOnJS(onClose)());
    }, [onClose, rowRect]);

    // Commit a specific player's local score to Redux
    const commitPlayer = useCallback((pid: string) => {
        const score = localScores.current[pid];
        if (score !== undefined) {
            dispatch(playerRoundScoreSet(pid, roundCurrent, score));
        }
    }, [dispatch, roundCurrent]);

    // Done button: commit this player's score and close
    const handleDone = useCallback((pid: string) => {
        if (closing.current) return;
        closing.current = true;
        commitPlayer(pid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        collapseAndClose();
    }, [commitPlayer, collapseAndClose]);

    // Called by the worklet after withDecay completes — animation already done
    const handleDismiss = useCallback(() => {
        if (closing.current) return;
        closing.current = true;
        commitPlayer(playerIds[activeIndexRef.current]);
        onClose();
    }, [commitPlayer, playerIds, onClose]);

    // Backdrop tap: no gesture velocity, so drive a withTiming slide-out from JS
    const handleBackdropPress = useCallback(() => {
        if (closing.current) return;
        closing.current = true;
        commitPlayer(playerIds[activeIndexRef.current]);
        swipeDragY.value = withTiming(
            boardHeight,
            { duration: 320, easing: Easing.in(Easing.cubic) },
            () => runOnJS(onClose)(),
        );
    }, [commitPlayer, playerIds, boardHeight, onClose]);

    // FlatList paged scroll: auto-commit outgoing player, track active index
    const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        swipeDragY.value = 0;
        swipeDragX.value = 0;
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / targetWidth);
        if (newIndex === activeIndexRef.current) return;
        commitPlayer(playerIds[activeIndexRef.current]);
        setActiveIndex(newIndex);
    }, [commitPlayer, playerIds, targetWidth]);

    if (!currentGame) return null;

    return (
        <>
            {/* Backdrop — tap to dismiss */}
            <Pressable style={StyleSheet.absoluteFillObject} onPress={handleBackdropPress} />

            <Animated.View style={panelStyle}>
                <Animated.View style={contentStyle}>
                    <FlatList
                        ref={flatListRef}
                        data={playerIds}
                        keyExtractor={(id) => id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        initialScrollIndex={initialIndex}
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
                                    roundCurrent={roundCurrent}
                                    swipeDragY={swipeDragY}
                                    swipeDragX={swipeDragX}
                                    onScoreChange={(score) => { localScores.current[pid] = score; }}
                                    onDone={() => handleDone(pid)}
                                    onDismiss={handleDismiss}
                                />
                            </View>
                        )}
                        onMomentumScrollEnd={handleScrollEnd}
                    />
                </Animated.View>
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
});

export default InlineExpandOverlay;
