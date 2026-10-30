import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';

/**
 * Snap index of the fully open game sheet, where the Unlock button is
 */
export const gameSheetExpandedIndex = 2;

const GameSheetContext = createContext<React.RefObject<BottomSheet | null> | null>(null);

export const GameSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const gameSheetRef = useRef<BottomSheet>(null);

    return (
        <GameSheetContext.Provider value={gameSheetRef} >
            <BottomSheetModalProvider>
                {props.children}
            </BottomSheetModalProvider>
        </GameSheetContext.Provider>
    );
};

export const useGameSheetContext = () => {
    return useContext(GameSheetContext);
};
