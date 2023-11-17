import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import BottomSheet, { BottomSheetModal, BottomSheetModalProvider, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { systemBlue } from '../constants';
import { usePointSelectModalContext } from './PointSelectModalContext';

interface Props {
}

const PointSelectorBottomSheet: React.FunctionComponent<Props> = ({ }) => {

    // ref
    const pointSelectorModalRef = usePointSelectModalContext();

    // variables
    const snapPoints = useMemo(() => ['25%', '50%'], []);

    // callbacks
    const handlePresentModalPress = useCallback(() => {
        if (pointSelectorModalRef == null) { return; };
        pointSelectorModalRef.current?.present();
    }, []);
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    return (
        <BottomSheetModal
            ref={pointSelectorModalRef}
            index={1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
        >
            <View style={styles.contentContainer}>
                <Text>Tap Actions</Text>
                <Text>Tap Top and Bottom of Tile</Text>
                <Text>Long Press</Text>
            </View>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: 'grey',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
    },
});

export default PointSelectorBottomSheet;
