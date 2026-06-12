import React, { useCallback, useMemo, useState } from 'react';

import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import WheelPicker from '@quidone/react-native-wheel-picker';
import WheelPickerFeedback from '@quidone/react-native-wheel-picker-feedback';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { setAddendOne, setAddendTwo, setMultiplier } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';
import { InteractionType } from '../Interactions/InteractionType';

import { usePointValuesSheetContext } from './PointValuesSheetContext';

const ADDEND_OPTIONS = [...Array(100).keys()].map((index) => ({
    value: index + 1,
    label: (index + 1).toString()
}));

const PointValuesSheet: React.FunctionComponent = () => {
    const theme = useTheme();
    const reduxAddendOne = useAppSelector((state) => state.settings.addendOne);
    const reduxAddendTwo = useAppSelector((state) => state.settings.addendTwo);
    const interactionType = useAppSelector((state) => state.settings.interactionType);

    const dispatch = useAppDispatch();

    const isAndroid = useMemo(() => Platform.OS === 'android', []);
    const isDark = theme.background === '#000000';
    const overlayItemStyle = useMemo(
        () => ({
            borderRadius: 16,
            ...(isDark ? { backgroundColor: 'rgba(255,255,255,0.12)', opacity: 1 } : {})
        }),
        [isDark]
    );

    // 1. Local state handles the immediate UI change
    const [localAddendOne, setLocalAddendOne] = useState(reduxAddendOne);
    const [localAddendTwo, setLocalAddendTwo] = useState(reduxAddendTwo);

    // 3. Update local state instantly, defer Redux slightly to prevent UI stutter
    const onAddendOneChange: (value: { item: { value: number } }) => void = useCallback(
        ({ item: { value } }) => {
            setLocalAddendOne(value);

            requestAnimationFrame(() => {
                dispatch(setMultiplier(value));
                dispatch(setAddendOne(value));
                logEvent('addend_one_change', { addendOne: value });
            });
        },
        [dispatch]
    );

    const onAddendTwoChange: (value: { item: { value: number } }) => void = useCallback(
        ({ item: { value } }) => {
            setLocalAddendTwo(value);

            requestAnimationFrame(() => {
                dispatch(setMultiplier(value));
                dispatch(setAddendTwo(value));
                logEvent('addend_one_change', { addendTwo: value });
            });
        },
        [dispatch]
    );

    // ref
    const pointValuesSheetRef = usePointValuesSheetContext();

    const snapPoints = useMemo(() => [1, 520], []);

    const handleSheetChanges = useCallback((index: number) => {
        if (index === 0) {
            pointValuesSheetRef?.current?.close();
        }
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={0} appearsOnIndex={1} />
        ),
        []
    );

    const addendOneLabel = useMemo(() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return 'Single Tap';
            case InteractionType.SwipeVertical:
                return 'Swipe';
            case InteractionType.Dial:
                return 'Spin';
        }
    }, [interactionType]);

    const addendTwoLabel = useMemo(() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return 'Long Press';
            case InteractionType.SwipeVertical:
                return 'Hold + Swipe';
            case InteractionType.Dial:
                return 'Hold';
        }
    }, [interactionType]);

    return (
        <BottomSheetModal
            ref={pointValuesSheetRef}
            index={1}
            enablePanDownToClose={true}
            enableContentPanningGesture={false}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.sheetBackground }}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}>
            <BottomSheetScrollView style={styles.sheetContainer} contentContainerStyle={{ alignItems: 'center' }}>
                <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                    <Text style={{ color: theme.text, fontSize: 20 }}>Point Values</Text>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
                        <View>
                            <Text style={{ color: theme.text, textAlign: 'center' }}>{addendOneLabel}</Text>
                            <View
                                style={[
                                    isAndroid ? styles.pickerContainerAndroid : styles.pickerContainer,
                                    { backgroundColor: theme.background === '#000000' ? 'rgba(0,0,0,.2)' : '#FFFFFF' }
                                ]}>
                                <WheelPicker
                                    onValueChanging={() => {
                                        WheelPickerFeedback.triggerSoundAndImpact();
                                    }}
                                    data={ADDEND_OPTIONS}
                                    value={localAddendOne}
                                    onValueChanged={onAddendOneChange}
                                    enableScrollByTapOnItem={true}
                                    style={styles.wheelPicker}
                                    width={60}
                                    itemTextStyle={{ color: theme.text }}
                                    overlayItemStyle={overlayItemStyle}
                                />
                            </View>
                        </View>
                        <View>
                            <Text style={{ color: theme.text, textAlign: 'center' }}>{addendTwoLabel}</Text>
                            <View
                                style={[
                                    isAndroid ? styles.pickerContainerAndroid : styles.pickerContainer,
                                    { backgroundColor: theme.background === '#000000' ? 'rgba(0,0,0,.2)' : '#FFFFFF' }
                                ]}>
                                <WheelPicker
                                    onValueChanging={() => {
                                        WheelPickerFeedback.triggerSoundAndImpact();
                                    }}
                                    data={ADDEND_OPTIONS}
                                    value={localAddendTwo}
                                    onValueChanged={onAddendTwoChange}
                                    enableScrollByTapOnItem={true}
                                    style={styles.wheelPicker}
                                    width={60}
                                    itemTextStyle={{ color: theme.text }}
                                    overlayItemStyle={overlayItemStyle}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    sheetContainer: { flex: 1 },
    wheelPicker: { padding: 0, margin: 'auto' },
    wheelPickerAndroid: { width: 200 },
    pickerContainer: { borderRadius: 10, margin: 10, width: 80 },
    pickerContainerAndroid: { borderRadius: 10, margin: 10 }
});

export default PointValuesSheet;
