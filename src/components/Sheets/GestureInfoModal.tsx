import React, { useCallback, useMemo } from 'react';

import { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { StyleSheet, View, Text } from 'react-native';

import { useTheme } from '../../theme';

import { useGestureInfoModalContext } from './GestureInfoModalContext';

const GestureInfoModal: React.FunctionComponent = () => {
    const theme = useTheme();
    const gestureInfoModalRef = useGestureInfoModalContext();

    const snapPoints = useMemo(() => [520], []);

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
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.sheetBackground }}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
        >
            <BottomSheetView style={styles.container}>
                <View style={styles.content}>
                <Text>TBD</Text>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});

export default GestureInfoModal;
