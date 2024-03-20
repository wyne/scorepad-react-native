import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { setAddendOne, setAddendTwo, setMultiplier } from '../../../redux/SettingsSlice';
import InteractionSelector from '../Interactions/InteractionSelector';
import { InteractionType } from '../Interactions/InteractionType';

import { useAddendModalContext } from './AddendModalContext';

interface Props {
}

const AddendModal: React.FunctionComponent<Props> = ({ }) => {
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);
    const interactionType = useAppSelector(state => state.settings.interactionType);

    // Store the current orientation
    const [isLandscape, setIsLandscape] = useState<boolean>(false);

    useEffect(() => {
        const getOrientation = async () => {
            const orientation = await ScreenOrientation.getOrientationAsync();
            setIsLandscape(
                orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
            );
        };

        const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
            setIsLandscape(
                orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
            );
        });

        getOrientation();

        return () => {
            ScreenOrientation.removeOrientationChangeListener(subscription);
        };
    }, []);

    // Array of 1 to 100
    const addendOptions = Array.from({ length: 100 }, (_, i) => i + 1);

    const dispatch = useAppDispatch();

    const isAndroid = useMemo(() => Platform.OS === 'android', []);

    const onTapValueChange = useCallback((itemValue: number, itemIndex: number) => {
        dispatch(setMultiplier(addendOptions[itemIndex]));
        dispatch(setAddendOne(addendOptions[itemIndex]));
        // TODO: analytics
    }, [addendOne]);

    const onLongTapValueChange = useCallback((itemValue: number) => {
        dispatch(setAddendTwo(itemValue));
        // TODO: analytics
    }, [addendTwo]);

    // ref
    const addendModalRef = useAddendModalContext();

    // variables
    const snapPoints = useMemo(() => [1, 520], []);

    const handleSheetChanges = useCallback((index: number) => {
        if (index === 0) {
            addendModalRef?.current?.close();
        }
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={0}
                appearsOnIndex={1}
            />
        ),
        []
    );

    const addendOneLabel = (() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return 'Single Tap';
            case InteractionType.SwipeVertical:
                return 'Swipe';
        }
    })();

    const addendTwoLabel = (() => {
        switch (interactionType) {
            case InteractionType.HalfTap:
                return 'Long Press';
            case InteractionType.SwipeVertical:
                return 'Hold + Swipe';
        }
    })();

    return (
        <BottomSheetModal
            ref={addendModalRef}
            index={1}
            enablePanDownToClose={true}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
            handleIndicatorStyle={{ backgroundColor: 'white' }}
        >
            <BottomSheetScrollView style={[
                styles.modalContainer]}
                contentContainerStyle={{ alignItems: 'center' }}>

                <View style={{
                    flex: 1,
                    width: '100%',
                    justifyContent: 'space-around',
                    flexDirection: isLandscape ? 'row' : 'column',
                }}>

                    <InteractionSelector />

                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>

                        <Text style={{ color: 'white', fontSize: 20 }}>Point Values</Text>

                        <View style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'space-around',
                            padding: 10,
                        }}>
                            <View>
                                <Text style={{ color: 'white', textAlign: 'center' }}>{addendOneLabel}</Text>
                                <View style={isAndroid ? styles.pickerContainerAndroid : styles.pickerContainer}>
                                    <Picker
                                        selectedValue={addendOne}
                                        onValueChange={onTapValueChange}
                                        style={isAndroid ? styles.pickerAndroid : styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        {
                                            addendOptions.map((addend) => (
                                                <Picker.Item key={addend} label={addend.toString()} value={addend} />
                                            ))
                                        }
                                    </Picker>
                                </View>
                            </View>

                            <View>
                                <Text style={{ color: 'white', textAlign: 'center' }}>{addendTwoLabel}</Text>
                                <View style={isAndroid ? styles.pickerContainerAndroid : styles.pickerContainer}>
                                    <Picker
                                        selectedValue={addendTwo}
                                        onValueChange={onLongTapValueChange}
                                        style={isAndroid ? styles.pickerAndroid : styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        {
                                            addendOptions.map((addend) => (
                                                <Picker.Item key={addend} label={addend.toString()} value={addend} />
                                            ))
                                        }
                                    </Picker>
                                </View>
                            </View>
                        </View>

                    </View>
                </View>

            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    picker: {
        width: 90,
    },
    pickerAndroid: {
        width: 120,
    },
    pickerItem: {
        color: 'white',
        fontSize: 16,
    },
    pickerContainer: {
        backgroundColor: 'rgb(20,30,40)',
        borderRadius: 10,
        margin: 10,
    },
    pickerContainerAndroid: {
        backgroundColor: 'white',
        borderRadius: 10,
        margin: 10,
    },
});

export default AddendModal;
