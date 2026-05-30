import React, { useCallback, useMemo } from 'react';

import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

import { useGestureInfoModalContext } from './GestureInfoModalContext';

const GestureInfoModal: React.FunctionComponent = () => {
    const theme = useTheme();
    const gestureInfoModalRef = useGestureInfoModalContext();

    const snapPoints = useMemo(() => ['90%'], []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    return (
        <BottomSheetModal
            ref={gestureInfoModalRef}
            index={0}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.sheetBackground }}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
        >
            <BottomSheetScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Tap Gesture</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Tap the top half of a player&apos;s tile to increase their score, or the bottom half
                    to decrease it. Each tap adds or subtracts the Single Tap value (set in Point Values).
                </Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Long-press the top or bottom half to use the Long Press value instead. This lets
                    you quickly add or subtract a larger amount.
                </Text>

                <View style={[styles.divider, { backgroundColor: theme.separator }]} />

                <Text style={[styles.title, { color: theme.text }]}>Swipe Gesture</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Swipe up on a player&apos;s tile to increase their score, or swipe down to decrease it.
                    Each notch adds or subtracts the Swipe value (set in Point Values).
                </Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    Hold your finger still for a moment before swiping to activate Hold + Swipe mode. The tile
                    will vibrate and wiggle to confirm. While in this mode, each notch uses the Hold + Swipe
                    value instead, letting you make larger adjustments.
                </Text>

                <View style={[styles.divider, { backgroundColor: theme.separator }]} />

                <Text style={[styles.title, { color: theme.text }]}>Point Values</Text>
                <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
                    You can customize the increment amounts in the Point Values sheet (tap the gesture icon again
                    then select Point Values). Two values are available:
                </Text>
                <View style={styles.bulletList}>
                    <Text style={[styles.bullet, { color: theme.textSecondary }]}>
                        {'\u2022  '}Single Tap / Swipe — the base amount added per tap or swipe notch
                    </Text>
                    <Text style={[styles.bullet, { color: theme.textSecondary }]}>
                        {'\u2022  '}Long Press / Hold + Swipe — the larger amount used when long-pressing first
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.separator }]} />
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        marginVertical: 20,
    },
    bulletList: {
        marginBottom: 12,
    },
    bullet: {
        fontSize: 16,
        lineHeight: 24,
        paddingLeft: 8,
        marginBottom: 6,
    },
});

export default GestureInfoModal;
