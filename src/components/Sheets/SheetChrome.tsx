import React, { useCallback } from 'react';

import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useSheetTopInset(offset = 0): number {
    const insets = useSafeAreaInsets();
    return insets.top + offset;
}

export function useSheetBackdrop(disappearsOnIndex: number, appearsOnIndex: number) {
    return useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={disappearsOnIndex}
                appearsOnIndex={appearsOnIndex}
                pressBehavior={0}
            />
        ),
        [appearsOnIndex, disappearsOnIndex]
    );
}

export function getSheetShadowStyle(backgroundColor: string) {
    return backgroundColor === '#000000' ? undefined : styles.sheetShadow;
}

const styles = StyleSheet.create({
    sheetShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 8,
    },
});
