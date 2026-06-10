import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { useAppSelector } from '../../../../redux/hooks';
import { selectCurrentGame } from '../../../../redux/selectors';
import { useMenuOpen } from '../../MenuOpenContext';
import PlayerDialPage from './PlayerDialPage';

const MARGIN_BOTTOM = 12;
const MARGIN_H = 12;
const CARD_MIN_WIDE_WIDTH = 520;
const CARD_WIDTH_SCALE = 0.74;
const CARD_MAX_PORTRAIT_WIDTH = 560;
const CARD_MAX_LANDSCAPE_WIDTH = 760;
const CARD_MAX_HEIGHT = 720;

function getDialCardLayout(boardWidth: number, boardHeight: number) {
    const availableWidth = Math.max(0, boardWidth - MARGIN_H * 2);
    const maxWidth = boardWidth > boardHeight ? CARD_MAX_LANDSCAPE_WIDTH : CARD_MAX_PORTRAIT_WIDTH;
    const scaledWidth = Math.max(Math.round(availableWidth * CARD_WIDTH_SCALE), Math.min(availableWidth, CARD_MIN_WIDE_WIDTH));
    const width = Math.min(availableWidth, scaledWidth, maxWidth);
    const height = Math.min(Math.max(0, boardHeight), CARD_MAX_HEIGHT);

    return {
        width,
        height,
    };
}

// ─── DialOverlay ──────────────────────────────────────────────────────────────

interface Props {
    playerIds: string[];
    initialIndex: number;
    boardWidth: number;
    boardHeight: number;
    safeAreaTop: number;
    showHint: boolean;
    onClose: () => void;
    svOpacity: SharedValue<number>;
    svSlideY: SharedValue<number>;
}

const DialOverlay: React.FC<Props> = ({
    playerIds,
    initialIndex,
    boardWidth,
    boardHeight,
    safeAreaTop,
    showHint,
    onClose,
    svOpacity,
    svSlideY,
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
    const cardLayout = getDialCardLayout(boardWidth, targetHeight);

    const swipeDragY = useSharedValue(0);
    const swipeDragX = useSharedValue(0);

    const panelStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: targetTop,
        left: 0,
        width: targetWidth,
        height: targetHeight,
        opacity: svOpacity.value,
        transform: [
            { translateY: swipeDragY.value + svSlideY.value },
            { translateX: swipeDragX.value },
        ],
    }));

    const slideOut = useCallback((then: () => void) => {
        svOpacity.value = withTiming(0, { duration: 150 });
        swipeDragY.value = withTiming(
            boardHeight,
            { duration: 250, easing: Easing.in(Easing.cubic) },
            () => runOnJS(then)(),
        );
    }, [svOpacity, boardHeight]);

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

    const renderItem = useCallback(({ item: pid }: { item: string }) => (
        <View testID="dial-page-frame" style={{ width: targetWidth, alignItems: 'center', justifyContent: 'center' }}>
            <PlayerDialPage
                playerId={pid}
                pageWidth={cardLayout.width}
                pageHeight={cardLayout.height}
                boardHeight={boardHeight}
                addendOne={addendOne}
                addendTwo={addendTwo}
                menuOpen={menuOpen}
                swipeDragY={swipeDragY}
                swipeDragX={swipeDragX}
                onDone={handleDone}
                onDismiss={handleDismiss}
                showHint={showHint}
            />
        </View>
    ), [targetWidth, cardLayout.width, cardLayout.height, boardHeight, addendOne, addendTwo, menuOpen, swipeDragY, swipeDragX, handleDone, handleDismiss, showHint]);

    if (!currentGame) return null;

    return (
        <>
            {/* Backdrop — tap to dismiss */}
            <Pressable testID="overlay-backdrop" style={StyleSheet.absoluteFill} onPress={handleBackdropPress} disabled={menuOpen} />

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
                    windowSize={3}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    initialScrollIndex={initialIndex}
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
                    renderItem={renderItem}
                    onMomentumScrollEnd={handleScrollEnd}
                />
            </Animated.View>
        </>
    );
};

export default React.memo(DialOverlay);
