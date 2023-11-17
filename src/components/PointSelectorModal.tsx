import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';

import { usePointSelectModalContext } from '../contexts/PointSelectModalContext';
import { Picker } from '@react-native-picker/picker';
import { setAddendOne, setAddendTwo, setMultiplier } from '../../redux/SettingsSlice';

interface Props {
}

const PointSelectorBottomSheet: React.FunctionComponent<Props> = ({ }) => {
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const addendOptions = [1, 5, 10, 20, 50];

    const dispatch = useAppDispatch();

    const onTapValueChange = useCallback((itemValue: number, itemIndex: number) => {
        dispatch(setMultiplier(addendOptions[itemIndex]));
        dispatch(setAddendOne(addendOptions[itemIndex]));
        // TODO: analytics
    }, []);

    const onLongTapValueChange = useCallback((itemValue: number) => {
        dispatch(setAddendTwo(itemValue));
        // TODO: analytics
    }, []);

    // ref
    const pointSelectorModalRef = usePointSelectModalContext();

    // variables
    const snapPoints = useMemo(() => [1, 320], []);

    const handleSheetChanges = useCallback((index: number) => {
        if (index === 0 && pointSelectorModalRef != null) {
            pointSelectorModalRef.current?.close();
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

    return (
        <BottomSheetModal
            ref={pointSelectorModalRef}
            index={1}
            enablePanDownToClose={true}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
            handleIndicatorStyle={{ backgroundColor: 'white' }}
        >
            <View style={styles.modalContainer}>
                <Text style={{ color: 'white', fontSize: 20 }}>Point Values</Text>

                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    padding: 10,
                }}>
                    <View>
                        <Text style={{ color: 'white', textAlign: 'center' }}>Single Tap</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={addendOne}
                                onValueChange={onTapValueChange}
                                style={styles.picker}
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
                        <Text style={{ color: 'white', textAlign: 'center' }}>Long Press</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={addendTwo}
                                onValueChange={onLongTapValueChange}
                                style={styles.picker}
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
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        alignItems: 'center',
    },
    picker: {
        width: 80,
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
});

export default PointSelectorBottomSheet;
