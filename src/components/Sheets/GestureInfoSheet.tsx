import React, { useCallback, useMemo, useState } from 'react';

import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectInteractionType, selectIsDialOnly } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { MAX_TILE_PLAYERS } from '../../constants';
import { useApplyInteractionType } from '../../hooks/useApplyInteractionType';
import { useTheme } from '../../theme';
import { GESTURE_NAMES, GESTURE_ORDER, gestureDemoLabel, gestureSteps } from '../Interactions/gestureCopy';
import GestureDemo from '../Interactions/GestureDemo';
import { InteractionType } from '../Interactions/InteractionType';

import { useGestureInfoSheetContext } from './GestureInfoSheetContext';
import { usePointValuesSheetContext } from './PointValuesSheetContext';
import SheetBackground from './SheetBackground';

const DEMO_COLOR = '#01497C';
const DEMO_HEIGHT = 190;
const MAX_CONTENT_WIDTH = 520;

/**
 * How to Score: one tab per gesture, opening on the active one, with a looping
 * demo, three short steps that use the real point values, and a button to
 * switch to that gesture.
 */
const GestureInfoSheet: React.FunctionComponent = () => {
    const theme = useTheme();
    const gestureInfoSheetRef = useGestureInfoSheetContext();
    const pointValuesSheetRef = usePointValuesSheetContext();
    const applyGesture = useApplyInteractionType();
    const { width: windowWidth } = useWindowDimensions();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const interactionType = useAppSelector(state => selectInteractionType(state, currentGameId));
    const dialOnly = useAppSelector(state => selectIsDialOnly(state, currentGameId));
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const [tab, setTab] = useState<InteractionType>(interactionType);

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

    // Open on the active gesture each time the sheet is presented.
    const handleAnimate = useCallback((fromIndex: number, toIndex: number) => {
        if (fromIndex === -1 && toIndex >= 0) setTab(interactionType);
    }, [interactionType]);

    const demoWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH) - 48;
    const steps = gestureSteps(tab, addendOne, addendTwo);
    const isCurrent = tab === interactionType;
    const unavailable = dialOnly && tab !== InteractionType.Dial;

    const handleUse = () => {
        applyGesture(tab);
        gestureInfoSheetRef?.current?.dismiss();
    };

    const openPointValues = () => {
        gestureInfoSheetRef?.current?.dismiss();
        pointValuesSheetRef?.current?.present();
        logEvent('addend_sheet', {});
    };

    const buttonLabel = isCurrent
        ? 'Current gesture'
        : unavailable
            ? `Up to ${MAX_TILE_PLAYERS} players`
            : `Use ${GESTURE_NAMES[tab]}`;

    return (
        <BottomSheetModal
            ref={gestureInfoSheetRef}
            index={0}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundComponent={SheetBackground}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
            onAnimate={handleAnimate}
        >
            <BottomSheetScrollView contentContainerStyle={styles.content} overScrollMode="always" style={styles.container}>
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">How to Score</Text>
                        <Pressable onPress={() => gestureInfoSheetRef?.current?.dismiss()} hitSlop={10} accessibilityRole="button">
                            <Text style={[styles.done, { color: theme.tint }]}>Done</Text>
                        </Pressable>
                    </View>

                    <View style={[styles.segments, { backgroundColor: theme.backgroundTertiary }]} accessibilityRole="tablist">
                        {GESTURE_ORDER.map(type => {
                            const selected = type === tab;
                            return (
                                <Pressable
                                    key={type}
                                    testID={`gesture-tab-${type}`}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected }}
                                    onPress={() => setTab(type)}
                                    style={[styles.segment, selected && [styles.segmentSelected, { backgroundColor: theme.backgroundSecondary }]]}
                                >
                                    <Text style={[styles.segmentText, { color: selected ? theme.text : theme.textSecondary }]}>
                                        {GESTURE_NAMES[type]}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.demo}>
                        <GestureDemo
                            key={tab}
                            interactionType={tab}
                            width={demoWidth}
                            height={DEMO_HEIGHT}
                            color={DEMO_COLOR}
                            label={gestureDemoLabel(tab, addendOne)}
                            testID="gesture-info-demo"
                        />
                    </View>

                    <View style={styles.steps}>
                        {steps.map((step, i) => (
                            <View key={i} style={styles.step}>
                                <View style={[styles.stepNumber, { backgroundColor: theme.tint + '22' }]}>
                                    <Text style={[styles.stepNumberText, { color: theme.tint }]}>{i + 1}</Text>
                                </View>
                                <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    <Pressable
                        onPress={openPointValues}
                        accessibilityRole="button"
                        style={[styles.pointValues, { borderTopColor: theme.separator }]}
                    >
                        <Text style={[styles.pointValuesLabel, { color: theme.textSecondary }]}>Point values</Text>
                        <Text style={[styles.pointValuesValue, { color: theme.tint }]}>{addendOne} · hold {addendTwo} ›</Text>
                    </Pressable>

                    <Pressable
                        testID="gesture-info-use"
                        accessibilityRole="button"
                        disabled={isCurrent || unavailable}
                        onPress={handleUse}
                        style={({ pressed }) => [
                            styles.button,
                            {
                                backgroundColor: isCurrent || unavailable ? theme.backgroundTertiary : theme.tint,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                    >
                        <Text style={[styles.buttonText, { color: isCurrent || unavailable ? theme.textTertiary : '#fff' }]}>
                            {buttonLabel}
                        </Text>
                    </Pressable>
                </View>
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
        paddingTop: 8,
        paddingBottom: 40,
        alignItems: 'center',
    },
    inner: {
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH - 48,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    done: {
        fontSize: 16,
        fontWeight: '600',
    },
    segments: {
        flexDirection: 'row',
        borderRadius: 9,
        padding: 2,
    },
    segment: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 7,
        borderRadius: 7,
    },
    segmentSelected: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
    },
    demo: {
        alignItems: 'center',
    },
    steps: {
        gap: 12,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 13,
        fontWeight: '700',
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 21,
    },
    pointValues: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 12,
    },
    pointValuesLabel: {
        fontSize: 14,
    },
    pointValuesValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default GestureInfoSheet;
